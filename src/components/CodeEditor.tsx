import React, { useState, useEffect } from 'react';
import { Play, Send, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  languageTemplates?: {
    javascript?: string;
    python?: string;
    java?: string;
    csharp?: string;
  };
  onSubmitSuccess?: () => void;
}

type Lang = 'javascript' | 'python' | 'java' | 'csharp';

const LANG_LABELS: Record<Lang, string> = {
  javascript: 'JavaScript (Node.js)',
  python: 'Python 3.x',
  java: 'Java (JDK 17)',
  csharp: 'C# (.NET Core)',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  languageTemplates = {},
  onSubmitSuccess,
}) => {
  const [lang, setLang] = useState<Lang>('javascript');
  const [consoleOutput, setConsoleOutput] = useState(
    'Terminal initialized. Press "Run Code" to compile.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lineCount = value.split('\n').length || 1;

  useEffect(() => {
    const template = languageTemplates[lang];
    if (template) onChange(template);
  }, [lang]);

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput('Compiling code...\n');
    setTimeout(() => {
      setConsoleOutput(
        prev =>
          prev + 'Status: Compilation Successful.\n\nRunning sample test cases...\n'
      );
      setTimeout(() => {
        setConsoleOutput(
          prev =>
            prev +
            '✓ Test Case 1: Passed\n  Input: [1, 2, 3, 4, 5]\n  Output: 5\n\n✓ Test Case 2: Passed\n  Input: [100, 20, 5, 80]\n  Output: 100\n\nAll Sample Test Cases Passed (2/2).'
        );
        setIsRunning(false);
      }, 1000);
    }, 800);
  };

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setConsoleOutput('Compiling code for submission...\n');
    setTimeout(() => {
      setConsoleOutput(prev => prev + 'Running 5 automated test cases...\n');
      setTimeout(() => {
        setConsoleOutput(
          prev =>
            prev +
            '✓ Test Case 1: Passed\n✓ Test Case 2: Passed\n✓ Test Case 3: Passed (Secret)\n✓ Test Case 4: Passed (Secret)\n✓ Test Case 5: Passed (Secret)\n\nAll test cases successfully passed. Code submitted!'
        );
        setIsSubmitting(false);
        onSubmitSuccess?.();
      }, 1200);
    }, 800);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden bg-slate-900 border-slate-700 rounded-lg">
      {/* Editor header */}
      <CardHeader className="flex-row items-center justify-between py-2 px-3 bg-slate-800 border-b border-slate-700 space-y-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-100 font-semibold text-sm">Solution Editor</span>
          <Select value={lang} onValueChange={val => setLang(val as Lang)}>
            <SelectTrigger className="h-7 w-44 text-xs bg-slate-900 border-slate-600 text-sky-400 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 gap-1"
            disabled={isRunning || isSubmitting}
            onClick={handleRunCode}
          >
            <Play className="h-3 w-3 fill-current" />
            {isRunning ? 'Running…' : 'Run Code'}
          </Button>
          <Button
            size="sm"
            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            disabled={isRunning || isSubmitting}
            onClick={handleSubmitCode}
          >
            <Send className="h-3 w-3" />
            {isSubmitting ? 'Submitting…' : 'Submit Code'}
          </Button>
        </div>
      </CardHeader>

      {/* Editor body */}
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <div className="flex flex-1 min-h-0 bg-slate-950">
          {/* Line numbers */}
          <div
            className="select-none text-right text-slate-500 font-mono text-sm leading-relaxed py-4 px-2 bg-slate-950 border-r border-slate-800 min-w-[2.5rem]"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>

          <textarea
            className="ide-textarea flex-1"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="// Enter your solution here"
            spellCheck={false}
            data-allow-copy-paste="true"
          />
        </div>

        {/* Console */}
        <div className="h-40 border-t border-slate-800 bg-slate-950 flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold">
              <Terminal className="h-3.5 w-3.5" />
              Console Output
            </div>
          </div>
          <ScrollArea className="flex-1">
            <pre className="px-3 py-2 text-xs text-sky-400 font-mono leading-relaxed whitespace-pre-wrap">
              {consoleOutput}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
