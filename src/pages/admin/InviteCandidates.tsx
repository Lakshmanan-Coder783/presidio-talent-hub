import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Send, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export const InviteCandidates: React.FC = () => {
  const { db, bulkInvite } = useApp();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  const collegesWithOptions = useMemo(() => {
    const colleges = Array.from(new Set(db.candidates.map(c => c.college)));
    return colleges
      .map(col => ({
        college: col,
        count: db.candidates.filter(c => c.college === col && c.assessmentStatus === 'Not Invited').length,
      }))
      .filter(c => c.count > 0);
  }, [db]);

  const activeAssessments = useMemo(() => db.assessments.filter(a => a.status === 'Active'), [db]);

  const handleBulkInvite = () => {
    if (!selectedCollege || !selectedAssessment || !scheduleDate || !scheduleTime) {
      alert('Please select all required fields.');
      return;
    }
    bulkInvite(selectedAssessment, scheduleDate, selectedCollege);
    setInvitedSuccess(true);
  };

  const invitedCandidates = useMemo(
    () => db.candidates.filter(c => c.college === selectedCollege && c.assessmentStatus === 'Pending'),
    [db, selectedCollege, invitedSuccess]
  );

  const columns = [
    { header: 'Candidate ID', accessor: 'id' as const, sortable: true },
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Email', accessor: 'email' as const },
    {
      header: 'Assigned Exam',
      accessor: 'assessmentId' as const,
      render: (row: { assessmentId?: string }) => {
        const test = db.assessments.find(a => a.id === row.assessmentId);
        return test ? test.name : row.assessmentId;
      },
    },
    {
      header: 'Password',
      accessor: 'assessmentPassword' as const,
      render: (row: { assessmentPassword?: string }) => (
        <span className="font-mono font-semibold text-primary text-sm">{row.assessmentPassword}</span>
      ),
    },
    {
      header: 'Status',
      render: () => <Badge variant="default">Generated</Badge>,
    },
  ];

  const canInvite = selectedCollege && selectedAssessment && scheduleDate && scheduleTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidate Invitations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate unique IDs and passwords, assign exam schedules, and bulk invite students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Invite configurator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invite Configurator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select College Drive *</Label>
              <Select
                value={selectedCollege}
                onValueChange={v => { setSelectedCollege(v); setInvitedSuccess(false); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose college..." />
                </SelectTrigger>
                <SelectContent>
                  {collegesWithOptions.map(opt => (
                    <SelectItem key={opt.college} value={opt.college}>
                      {opt.college} ({opt.count} pending)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Select Assessment *</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose assessment..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAssessments.map(asm => (
                    <SelectItem key={asm.id} value={asm.id}>
                      {asm.name} ({asm.duration} mins)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Exam Date *</Label>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>

            {invitedSuccess ? (
              <Alert className="border-emerald-500 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  Invitations dispatched successfully!
                </AlertDescription>
              </Alert>
            ) : (
              <Button className="w-full gap-2" disabled={!canInvite} onClick={handleBulkInvite}>
                <Send className="h-4 w-4" />
                Generate & Invite Candidates
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right: Preview panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Credentials Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {invitedCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                <Users className="h-10 w-10" />
                <div>
                  <p className="font-semibold text-sm">No active batch selected</p>
                  <p className="text-xs mt-1 max-w-[280px] mx-auto">
                    Configure the invitation settings and dispatch invites. Generated credentials will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert className="border-primary/20 bg-primary/5 text-primary">
                  <AlertDescription className="text-sm">
                    Generated <strong>{invitedCandidates.length}</strong> credentials for <strong>{selectedCollege}</strong>.
                    Candidates can now access the portal.
                  </AlertDescription>
                </Alert>
                <Table
                  data={invitedCandidates}
                  columns={columns}
                  searchPlaceholder="Filter preview list..."
                  searchKey="name"
                  initialSort={{ key: 'id', direction: 'asc' }}
                  exportFileName="Credentials_Batch"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
