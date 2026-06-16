import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Candidate } from '../../types';
import {
  User, Mail, Phone, School, GraduationCap, Award,
  Calendar, MessageSquare, FileSpreadsheet, UploadCloud, CheckCircle2, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const assessmentBadge = (status: string) => {
  if (status === 'Completed') return <Badge variant="default">Completed</Badge>;
  if (status === 'InProgress') return <Badge variant="secondary">In Progress</Badge>;
  if (status === 'Pending') return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="destructive">{status}</Badge>;
};

const interviewBadge = (status: string) => {
  if (status === 'Passed') return <Badge variant="default">Passed</Badge>;
  if (status === 'Failed') return <Badge variant="destructive">Failed</Badge>;
  if (status === 'Scheduled') return <Badge variant="outline">Scheduled</Badge>;
  if (status === 'Ongoing') return <Badge variant="secondary">Ongoing</Badge>;
  return <span className="text-muted-foreground text-sm">—</span>;
};

const offerBadge = (status: string) => {
  if (status === 'Joined' || status === 'Accepted') return <Badge variant="default">{status}</Badge>;
  if (status === 'Declined') return <Badge variant="destructive">Declined</Badge>;
  if (status === 'Offered') return <Badge variant="outline">Offered</Badge>;
  return <span className="text-muted-foreground text-sm">—</span>;
};

export const Candidates: React.FC = () => {
  const navigate = useNavigate();
  const { db } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const columns = useMemo(() => [
    {
      header: 'Candidate ID',
      accessor: 'id' as const,
      sortable: true,
      render: (row: Candidate) => (
        <button
          className="text-primary font-semibold underline-offset-2 hover:underline text-sm"
          onClick={() => setSelectedCandidate(row)}
        >
          {row.id}
        </button>
      ),
    },
    {
      header: 'Name',
      accessor: 'name' as const,
      sortable: true,
      render: (row: Candidate) => (
        <button
          className="font-semibold text-sm hover:text-primary"
          onClick={() => setSelectedCandidate(row)}
        >
          {row.name}
        </button>
      ),
    },
    { header: 'College', accessor: 'college' as const, sortable: true },
    { header: 'Degree', accessor: 'degree' as const, sortable: true },
    { header: 'CGPA', accessor: 'cgpa' as const, sortable: true },
    {
      header: 'Assessment',
      accessor: 'assessmentStatus' as const,
      sortable: true,
      render: (row: Candidate) => assessmentBadge(row.assessmentStatus),
    },
    {
      header: 'Interview',
      accessor: 'interviewStatus' as const,
      sortable: true,
      render: (row: Candidate) => interviewBadge(row.interviewStatus),
    },
    {
      header: 'Offer',
      accessor: 'offerStatus' as const,
      sortable: true,
      render: (row: Candidate) => offerBadge(row.offerStatus),
    },
  ], []);

  const tableFilters = useMemo(() => [
    {
      key: 'assessmentStatus',
      label: 'Assessment',
      options: [
        { label: 'Not Invited', value: 'Not Invited' },
        { label: 'Pending', value: 'Pending' },
        { label: 'InProgress', value: 'InProgress' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
    {
      key: 'offerStatus',
      label: 'Offer',
      options: [
        { label: 'None', value: 'None' },
        { label: 'Offered', value: 'Offered' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Joined', value: 'Joined' },
      ],
    },
    {
      key: 'college',
      label: 'College',
      options: Array.from(new Set(db.candidates.slice(0, 100).map(c => c.college))).map(col => ({
        label: col,
        value: col,
      })),
    },
  ], [db]);

  const handleBulkUploadSimulate = () => {
    setUploading(true);
    setUploadSuccess(false);
    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => { setUploadModalOpen(false); setUploadSuccess(false); }, 1500);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage profiles, scorecards, interview feedback and funnel for {db.candidates.length} candidates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setUploadModalOpen(true)} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => navigate('/admin/invite-candidates')} className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Candidates
          </Button>
        </div>
      </div>

      <Table
        data={db.candidates}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search by ID, name, or college..."
        searchKey={c => `${c.id} ${c.name} ${c.college}`}
        initialSort={{ key: 'id', direction: 'asc' }}
        exportFileName="Candidates_Export"
      />

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <Modal
          isOpen
          onClose={() => setSelectedCandidate(null)}
          title={`Profile: ${selectedCandidate.name}`}
          size="lg"
          footer={<Button variant="outline" onClick={() => setSelectedCandidate(null)}>Close</Button>}
        >
          <Tabs defaultValue="personal">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="personal" className="flex-1 gap-1.5"><User className="h-3.5 w-3.5" />Personal</TabsTrigger>
              <TabsTrigger value="education" className="flex-1 gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Education</TabsTrigger>
              <TabsTrigger value="assessment" className="flex-1 gap-1.5"><Award className="h-3.5 w-3.5" />Assessment</TabsTrigger>
              <TabsTrigger value="interview" className="flex-1 gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Interview</TabsTrigger>
              <TabsTrigger value="offer" className="flex-1 gap-1.5"><Calendar className="h-3.5 w-3.5" />Offer</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { icon: User, label: 'Full Name', value: selectedCandidate.name },
                    { icon: Mail, label: 'Email', value: selectedCandidate.email },
                    { icon: Phone, label: 'Phone', value: selectedCandidate.phone },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-semibold text-sm">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pl-4 border-l">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Funnel Stage</p>
                    <Badge variant="outline">{selectedCandidate.funnelStage}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Candidate ID</p>
                    <p className="font-mono font-semibold text-sm">{selectedCandidate.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Portal Password</p>
                    <p className="font-mono font-semibold text-sm">{selectedCandidate.assessmentPassword || 'Not Generated'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="education" className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <School className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">College</p>
                    <p className="font-semibold text-sm">{selectedCandidate.college}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Degree</p>
                    <p className="font-semibold text-sm">{selectedCandidate.degree}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center pl-4 border-l">
                <p className="text-xs text-muted-foreground">CGPA</p>
                <p className="text-4xl font-black text-primary">
                  {selectedCandidate.cgpa}
                  <span className="text-base font-medium text-muted-foreground"> / 10.0</span>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="assessment">
              {selectedCandidate.assessmentStatus === 'Completed' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Exam ID', value: selectedCandidate.assessmentId },
                      { label: 'Total Score', value: `${selectedCandidate.assessmentScore} marks` },
                      { label: 'Percentile', value: `${selectedCandidate.assessmentPercentile}%` },
                      { label: 'Rank', value: `#${selectedCandidate.assessmentRank}` },
                      { label: 'Time Taken', value: `${Math.round((selectedCandidate.assessmentDurationUsed || 0) / 60)} mins` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pl-4 border-l space-y-3">
                    <p className="text-sm font-semibold mb-2">Topic Breakdown</p>
                    {selectedCandidate.sectionScores &&
                      Object.entries(selectedCandidate.sectionScores).map(([sec, val]) => (
                        <div key={sec}>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span className="capitalize">{sec}</span>
                            <span>{val} marks</span>
                          </div>
                          <Progress value={Math.min((val as number) * 4, 100)} className="h-1.5" />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">
                  Assessment status is <strong>{selectedCandidate.assessmentStatus}</strong>. No scorecard yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="interview">
              {selectedCandidate.interviewStatus !== 'Not Scheduled' ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Technical Interview Panel</span>
                    {interviewBadge(selectedCandidate.interviewStatus)}
                  </div>
                  <Separator />
                  <p className="text-muted-foreground leading-relaxed">
                    Candidate demonstrated good problem-solving logic. Strong knowledge in database concepts and OS concurrency.
                    Satisfactorily resolved coding exercise. Recommended for next steps.
                  </p>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">No interview logs found. Candidate not yet scheduled.</p>
              )}
            </TabsContent>

            <TabsContent value="offer">
              {selectedCandidate.offerStatus !== 'None' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Offer CTC</p>
                      <p className="text-3xl font-black text-emerald-600">12.5 LPA</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Release Date</p>
                      <p className="font-semibold text-sm">10th June 2026</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center pl-4 border-l">
                    <p className="text-xs text-muted-foreground mb-2">Hiring Status</p>
                    {offerBadge(selectedCandidate.offerStatus)}
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">
                  No offer released. Funnel stage: <strong>{selectedCandidate.funnelStage}</strong>.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </Modal>
      )}

      {/* Bulk Import Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Import Candidates via Spreadsheet"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleBulkUploadSimulate} disabled={uploading}>
              {uploading ? 'Processing…' : 'Import Spreadsheet'}
            </Button>
          </div>
        }
      >
        <div className="rounded-lg border-2 border-dashed bg-muted/30 p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
          {uploading ? (
            <>
              <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-semibold text-sm">Analyzing sheet layout and rows…</p>
            </>
          ) : uploadSuccess ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold text-emerald-600 text-sm">Import complete — 50 candidates created.</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-primary" />
              <div>
                <h4 className="font-semibold">Drag & Drop your spreadsheet here</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, XLS, XLSX. Required columns: Name, Email, Phone, College, Degree, CGPA.
                </p>
              </div>
              <input type="file" id="xls-file" className="hidden" />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('xls-file')?.click()}>
                Browse Files
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
