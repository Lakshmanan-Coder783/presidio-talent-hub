import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Interview } from '../../types';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const stageBadge = (stage: Interview['stage']) => {
  if (stage === 'Interview') return <Badge variant="default">{stage}</Badge>;
  if (stage === 'Coding Exercise') return <Badge variant="outline">{stage}</Badge>;
  return <Badge variant="secondary">{stage}</Badge>;
};

const statusBadge = (status: string) =>
  status === 'Scheduled'
    ? <Badge variant="secondary">Scheduled</Badge>
    : <Badge variant="default">Completed</Badge>;

export const Interviews: React.FC = () => {
  const { db, createInterview } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [panelName, setPanelName] = useState('Panel Alpha');
  const [date, setDate] = useState('2026-06-15');
  const [time, setTime] = useState('10:00');
  const [stage, setStage] = useState<Interview['stage']>('Interview');

  const eligibleCandidates = useMemo(() =>
    db.candidates.filter(c =>
      c.assessmentStatus === 'Completed' &&
      c.interviewStatus !== 'Passed' &&
      c.interviewStatus !== 'Failed'
    ),
    [db]
  );

  const handleSchedule = () => {
    if (!candidateId) { alert('Please select a candidate.'); return; }
    const candidate = db.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    createInterview({ candidateId, candidateName: candidate.name, panelName, date, time, stage, status: 'Scheduled' });
    setCandidateId('');
    setModalOpen(false);
  };

  const calendarDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
      return { dayNum, events: db.interviews.filter(e => e.date === dateStr) };
    });
  }, [db]);

  const columns = [
    { header: 'ID', accessor: 'id' as const, sortable: true },
    { header: 'Candidate', accessor: 'candidateName' as const, sortable: true },
    { header: 'Stage', accessor: 'stage' as const, render: (row: Interview) => stageBadge(row.stage) },
    { header: 'Panel', accessor: 'panelName' as const, sortable: true },
    {
      header: 'Schedule',
      render: (row: Interview) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {row.date} @ {row.time}
        </span>
      ),
    },
    { header: 'Status', accessor: 'status' as const, render: (row: Interview) => statusBadge(row.status) },
  ];

  const dayColors: Record<string, string> = {
    'Interview': 'bg-primary/10 text-primary',
    'Coding Exercise': 'bg-cyan-100 text-cyan-700',
    'Whiteboard Interview': 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interviews Scheduler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Coordinate panels, schedule sessions, and track technical and coding rounds.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* Calendar view */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">June 2026</CardTitle>
              <span className="text-xs text-muted-foreground font-medium">Monthly Calendar</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-xs font-semibold uppercase text-muted-foreground py-1">
                  {day}
                </div>
              ))}
              {calendarDays.map((cell, idx) => {
                const isToday = cell.dayNum === 15;
                return (
                  <div
                    key={idx}
                    className={`min-h-[72px] rounded-md border p-1.5 text-xs flex flex-col gap-0.5
                      ${isToday ? 'border-primary bg-primary/5' : 'bg-card'}`}
                  >
                    <span className={`font-semibold text-xs ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {cell.dayNum}
                    </span>
                    {cell.events.slice(0, 2).map((evt, eIdx) => (
                      <div
                        key={eIdx}
                        className={`rounded px-1 py-0.5 text-[9px] font-semibold truncate ${dayColors[evt.stage] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {evt.candidateName.split(' ')[0]} {evt.time}
                      </div>
                    ))}
                    {cell.events.length > 2 && (
                      <span className="text-[9px] text-muted-foreground text-right">+{cell.events.length - 2}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming table */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              data={db.interviews}
              columns={columns}
              searchPlaceholder="Filter panels..."
              searchKey="candidateName"
              initialSort={{ key: 'id', direction: 'desc' }}
              exportFileName="Interviews_Export"
            />
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Interview Session"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={eligibleCandidates.length === 0}>Confirm Schedule</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Candidate *</Label>
            {eligibleCandidates.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  No eligible candidates. Ensure candidates have completed their assessments first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={candidateId} onValueChange={setCandidateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCandidates.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.college} · CGPA {c.cgpa}) — {c.assessmentScore} pts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Interview Stage *</Label>
            <Select value={stage} onValueChange={v => setStage(v as Interview['stage'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Interview">Technical Interview Round</SelectItem>
                <SelectItem value="Coding Exercise">Coding Evaluation Round</SelectItem>
                <SelectItem value="Whiteboard Interview">System Design / Whiteboard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Panelist *</Label>
            <Select value={panelName} onValueChange={setPanelName}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Panel Alpha">Panel Alpha (SDE-2 lead)</SelectItem>
                <SelectItem value="Panel Beta">Panel Beta (Architect lead)</SelectItem>
                <SelectItem value="Panel Gamma">Panel Gamma (Director TA)</SelectItem>
                <SelectItem value="Panel Delta">Panel Delta (QA lead)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time *</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
