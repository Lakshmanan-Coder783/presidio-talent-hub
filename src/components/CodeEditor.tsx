import React, { useState, useEffect } from 'react';
import { Play, Send, Terminal, Settings } from 'lucide-react';

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

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  languageTemplates = {},
  onSubmitSuccess
}) => {
  const [lang, setLang] = useState<'javascript' | 'python' | 'java' | 'csharp'>('javascript');
  const [consoleOutput, setConsoleOutput] = useState<string>('Terminal initialized. Press "Run Code" to compile.');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lines, setLines] = useState<number[]>([]);

  // Calculate line numbers
  useEffect(() => {
    const linesCount = value.split('\n').length || 1;
    const linesArr = Array.from({ length: linesCount }, (_, i) => i + 1);
    setLines(linesArr);
  }, [value]);

  // Set default templates when language changes
  useEffect(() => {
    const template = languageTemplates[lang] || '';
    if (template) {
      onChange(template);
    }
  }, [lang]);

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput('Compiling code...\n');

    setTimeout(() => {
      setConsoleOutput(prev => prev + `Status: Compilation Successful.\n\nRunning sample test cases...\n`);
      setTimeout(() => {
        setConsoleOutput(prev => prev + `✓ Test Case 1: Passed\n  Input: [1, 2, 3, 4, 5]\n  Output: 5\n\n✓ Test Case 2: Passed\n  Input: [100, 20, 5, 80]\n  Output: 100\n\nAll Sample Test Cases Passed (2/2).`);
        setIsRunning(false);
      }, 1000);
    }, 800);
  };

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setConsoleOutput('Compiling code for submission...\n');

    setTimeout(() => {
      setConsoleOutput(prev => prev + `Running 5 automated test cases...\n`);
      setTimeout(() => {
        setConsoleOutput(prev => prev + `✓ Test Case 1: Passed\n✓ Test Case 2: Passed\n✓ Test Case 3: Passed (Secret)\n✓ Test Case 4: Passed (Secret)\n✓ Test Case 5: Passed (Secret)\n\nAll test cases successfully passed. Code submitted!`);
        setIsSubmitting(false);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }, 1200);
    }, 800);
  };

  return (
    <div className="editor-panel">
      {/* Editor Header */}
      <div className="panel-header" style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>Solution Editor</span>
          <select
            className="select-filter"
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              borderColor: '#334155',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            value={lang}
            onChange={e => setLang(e.target.value as any)}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3.x</option>
            <option value="java">Java (JDK 17)</option>
            <option value="csharp">C# (.NET Core)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              backgroundColor: '#334155',
              borderColor: '#475569',
              color: '#e2e8f0',
              gap: '4px'
            }}
            disabled={isRunning || isSubmitting}
            onClick={handleRunCode}
          >
            <Play size={12} fill="#e2e8f0" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button
            className="btn btn-primary"
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              gap: '4px'
            }}
            disabled={isRunning || isSubmitting}
            onClick={handleSubmitCode}
          >
            <Send size={12} />
            {isSubmitting ? 'Submitting...' : 'Submit Code'}
          </button>
        </div>
      </div>

      {/* Editor Textarea with line numbers */}
      <div className="ide-wrapper" style={{ flexGrow: 1, display: 'flex', minHeight: 0 }}>
        <div className="line-numbers">
          {lines.map(num => (
            <div key={num}>{num}</div>
          ))}
        </div>
        <textarea
          className="ide-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="// Enter your solution here"
          spellCheck={false}
        />
      </div>

      {/* Console panel */}
      <div className="console-panel">
        <div className="console-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Terminal size={14} />
            Console Output
          </div>
          <Settings size={12} style={{ cursor: 'pointer' }} />
        </div>
        <div className="console-body" style={{ whiteSpace: 'pre-wrap' }}>
          {consoleOutput}
        </div>
      </div>
    </div>
  );
};
