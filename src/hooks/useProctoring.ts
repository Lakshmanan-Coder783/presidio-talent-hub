import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ExperienceSettings } from '../utils/experienceSettings';

export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

interface UseProctoringOptions {
  /** Assessment is actively in progress — fullscreen/tab-switch/copy-paste enforcement is live. */
  active: boolean;
  exp: ExperienceSettings;
  onTerminate: () => void;
}

export function useProctoring({ active, exp, onTerminate }: UseProctoringOptions) {
  // A plain ref object can't back two different <video> elements at once (the instructions
  // screen and the in-test floating thumbnail are different DOM nodes at different times), so
  // a callback ref is used instead — it reattaches `srcObject` whenever a new element mounts.
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [violationCount, setViolationCount] = useState(0);
  const [screenshotGuardActive, setScreenshotGuardActive] = useState(false);

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  }, []);

  const requestCameraAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported');
      return;
    }
    setCameraStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoElRef.current) videoElRef.current.srcObject = stream;
      setCameraStatus('granted');
    } catch {
      setCameraStatus('denied');
    }
  }, []);

  // Attempt camera/mic access as soon as the candidate reaches the portal (covers both a
  // fresh instructions screen and a resumed in-progress session that skips straight to it).
  useEffect(() => {
    requestCameraAccess();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraStatus('idle');
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen may be rejected (e.g. no user gesture, unsupported context) — non-fatal.
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const violationCountRef = useRef(0);

  // Side effects (toast, onTerminate — which itself updates candidate state in a different
  // component) must not live inside the setState updater passed to setViolationCount; React
  // invokes updaters during render/reconciliation, and triggering another component's setState
  // from there throws "Cannot update a component while rendering a different component." A ref
  // tracks the count synchronously so the side effects can run in the normal callback body,
  // which is only ever invoked from a real DOM event handler.
  const registerViolation = useCallback((reason: string) => {
    const next = violationCountRef.current + 1;
    violationCountRef.current = next;
    setViolationCount(next);
    if (exp.displayWindowViolationPopup) {
      toast.warning(
        `Policy violation detected (${reason}): ${next}/${exp.windowViolationTerminateAfter}`
      );
    }
    if (exp.terminateOnWindowViolation && next >= exp.windowViolationTerminateAfter) {
      onTerminate();
    }
  }, [exp.displayWindowViolationPopup, exp.terminateOnWindowViolation, exp.windowViolationTerminateAfter, onTerminate]);

  // Fullscreen-exit + tab/window-switch detection, live only while the assessment is active.
  useEffect(() => {
    if (!active) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) registerViolation('fullscreen exited');
    };
    const onVisibilityChange = () => {
      if (document.hidden) registerViolation('tab or window switch');
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, registerViolation]);

  // Copy/cut/paste/right-click blocking, live only while the assessment is active. The code
  // editor opts itself out via a `data-allow-copy-paste="true"` wrapper when the admin has
  // enabled `allowCopyPasteInDescriptiveCoding` for this drive.
  useEffect(() => {
    if (!active) return;

    const isExempt = (target: EventTarget | null) =>
      exp.allowCopyPasteInDescriptiveCoding &&
      target instanceof Element &&
      target.closest('[data-allow-copy-paste="true"]') !== null;

    const block = (e: Event) => {
      if (isExempt(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('copy', block, true);
    document.addEventListener('cut', block, true);
    document.addEventListener('paste', block, true);
    document.addEventListener('contextmenu', block, true);
    return () => {
      document.removeEventListener('copy', block, true);
      document.removeEventListener('cut', block, true);
      document.removeEventListener('paste', block, true);
      document.removeEventListener('contextmenu', block, true);
    };
  }, [active, exp.allowCopyPasteInDescriptiveCoding]);

  // Best-effort screenshot deterrence, live only while the assessment is active. Browsers have
  // no API to observe OS-level screenshots (macOS Cmd+Shift+3/4/5 never reaches page JS at all —
  // the OS intercepts it before any browser event fires), so this can only catch what's
  // technically observable: the Windows/Linux PrintScreen key and the Windows Snip & Sketch
  // shortcut (Win+Shift+S, unreliable across browsers). Treated as the same kind of violation as
  // fullscreen-exit/tab-switch above, sharing the same counter/threshold.
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen';
      const isWinSnip = e.shiftKey && e.metaKey && e.key.toLowerCase() === 's';
      if (!isPrintScreen && !isWinSnip) return;
      registerViolation('screenshot attempt');
      setScreenshotGuardActive(true);
      setTimeout(() => setScreenshotGuardActive(false), 1500);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, registerViolation]);

  return {
    videoRef,
    cameraStatus,
    retryCameraAccess: requestCameraAccess,
    stopCamera,
    enterFullscreen,
    exitFullscreen,
    violationCount,
    screenshotGuardActive,
  };
}
