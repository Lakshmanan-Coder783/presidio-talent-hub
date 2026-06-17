import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-semibold text-foreground"
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Hard: 'text-red-600 bg-red-50 border-red-200',
};

interface CodingQuestionPanelProps {
  question: Question;
}

export const CodingQuestionPanel: React.FC<CodingQuestionPanelProps> = ({ question }) => {
  const displayTitle = question.title || question.text.split('.')[0];

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-4">
        {/* Title */}
        <h2 className="text-lg font-bold leading-snug">{displayTitle}</h2>

        {/* Type + Skill badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground">Type:</span> Coding
          </span>
          {question.skill && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground">Skill:</span> {question.skill}
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {question.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs font-medium text-primary border-primary/40 bg-primary/5">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Difficulty + Time */}
        <div className="flex items-center gap-3">
          <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border', DIFFICULTY_COLORS[question.difficulty])}>
            <Zap className="h-3 w-3" />
            {question.difficulty}
          </span>
          {question.estimatedTime && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {question.estimatedTime} min
            </span>
          )}
        </div>

        <hr />

        {/* Problem description */}
        <p className="text-sm leading-relaxed text-foreground">{question.text}</p>

        {/* Function description */}
        {question.functionName && (
          <CollapsibleSection title="Function description" defaultOpen>
            <p className="text-sm mb-3">
              Complete the <strong>{question.functionName}</strong> function in the editor below.
              {question.functionParams && question.functionParams.length > 0 && (
                <> It has the following parameter(s):</>
              )}
            </p>

            {question.functionParams && question.functionParams.length > 0 && (
              <div className="overflow-x-auto rounded border text-xs mb-3">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {question.functionParams.map((param, i) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                        <td className="px-3 py-2 font-mono font-medium">{param.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{param.type}</td>
                        <td className="px-3 py-2 text-muted-foreground">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {question.returnType && (
              <div className="flex gap-3 text-xs">
                <span className="font-semibold text-foreground shrink-0">Return</span>
                <span className="text-muted-foreground">
                  The function must return a <span className="font-mono font-medium text-foreground">{question.returnType}</span>
                  {question.returnDescription && <> denoting {question.returnDescription}</>}.
                </span>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Constraints */}
        {question.constraints && question.constraints.length > 0 && (
          <CollapsibleSection title="Constraints" defaultOpen={false}>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {question.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 mt-1.5" />
                  <span className="font-mono">{c}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Test cases preview (visible ones only) */}
        {question.testCases && question.testCases.some(tc => !tc.isSecret) && (
          <CollapsibleSection title="Sample Test Cases" defaultOpen={false}>
            <div className="space-y-3">
              {question.testCases
                .filter(tc => !tc.isSecret)
                .map((tc, i) => (
                  <div key={i} className="text-xs rounded border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1 font-semibold border-b">Sample {i + 1}</div>
                    <div className="grid grid-cols-2 divide-x">
                      <div className="px-3 py-2">
                        <p className="text-muted-foreground mb-1">Input</p>
                        <pre className="font-mono">{tc.input}</pre>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-muted-foreground mb-1">Output</p>
                        <pre className="font-mono">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </ScrollArea>
  );
};
