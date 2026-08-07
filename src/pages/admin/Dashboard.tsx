import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FunnelChart, LineChart, BarChart, DonutChart, HorizontalBarChart, GaugeChart } from '../../components/Charts';
import {
  Users, School, Award, TrendingUp, Clock, UsersRound, User as UserIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  computeKpiStats, computeFunnelData, computeRoundPassRates, computeOfferStats,
  computeTeamMembers, computeDrivePerformanceData, type TeamMemberRole,
  computeScoreDistributionData, computeSelectedCandidateDegrees, computeSelectedCandidateGenders,
} from '../../utils/dashboardAnalytics';

const TEAM_ROLE_FILTER_OPTIONS: TeamMemberRole[] = ['SPOC', 'Primary Panel', 'Secondary Panel', 'Evaluator'];

export const Dashboard: React.FC = () => {
  const { db, loadDashboardPage } = useApp();
  const navigate = useNavigate();

  useEffect(() => { loadDashboardPage(); }, [loadDashboardPage]);

  const activeDrives = useMemo(() => db.drives.filter(d => !d.deletedAt), [db.drives]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');

  const availableYears = useMemo(() =>
    Array.from(new Set(activeDrives.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [activeDrives]);

  const availableColleges = useMemo(() => {
    const base = selectedYear === 'all'
      ? activeDrives
      : activeDrives.filter(d => new Date(d.date).getFullYear().toString() === selectedYear);
    return Array.from(new Set(base.map(d => d.college))).sort();
  }, [activeDrives, selectedYear]);

  useEffect(() => {
    if (selectedCollege !== 'all' && !availableColleges.includes(selectedCollege))
      setSelectedCollege('all');
  }, [availableColleges]);

  const filteredDrives = useMemo(() =>
    activeDrives.filter(d => {
      if (selectedYear !== 'all' && new Date(d.date).getFullYear().toString() !== selectedYear) return false;
      if (selectedCollege !== 'all' && d.college !== selectedCollege) return false;
      return true;
    }), [activeDrives, selectedYear, selectedCollege]);

  const filteredDriveIds = useMemo(() => new Set(filteredDrives.map(d => d.id)), [filteredDrives]);

  const filteredCandidates = useMemo(() => {
    const collegeSet = new Set(filteredDrives.map(d => d.college));
    return db.candidates.filter(c => collegeSet.has(c.college));
  }, [db.candidates, filteredDrives]);

  const filteredCandidateIds = useMemo(() => new Set(filteredCandidates.map(c => c.id)), [filteredCandidates]);

  const filteredOffers = useMemo(() =>
    db.offers.filter(o => filteredCandidateIds.has(o.candidateId)),
    [db.offers, filteredCandidateIds]);

  const kpiStats = useMemo(
    () => computeKpiStats(filteredCandidates, filteredDrives),
    [filteredCandidates, filteredDrives]);

  const funnelData = useMemo(() => computeFunnelData(filteredCandidates), [filteredCandidates]);
  const roundPassRates = useMemo(() => computeRoundPassRates(filteredCandidates), [filteredCandidates]);
  const offerStats = useMemo(() => computeOfferStats(filteredOffers), [filteredOffers]);
  const teamMembers = useMemo(
    () => computeTeamMembers(db.driveMemberships, db.users, filteredDriveIds),
    [db.driveMemberships, db.users, filteredDriveIds]);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState<Set<TeamMemberRole>>(new Set(['SPOC']));
  const filteredTeamMembers = useMemo(() => {
    const search = teamSearch.trim().toLowerCase();
    return teamMembers.filter(m => {
      const matchesRole = teamRoleFilter.size === 0 || m.roles.some(r => teamRoleFilter.has(r));
      const matchesSearch = !search || m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search);
      return matchesRole && matchesSearch;
    });
  }, [teamMembers, teamSearch, teamRoleFilter]);
  const toggleTeamRoleFilter = (role: TeamMemberRole) => {
    setTeamRoleFilter(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };
  const drivePerformanceData = useMemo(() => computeDrivePerformanceData(filteredDrives), [filteredDrives]);
  const scoreDistributionData = useMemo(() => computeScoreDistributionData(filteredCandidates), [filteredCandidates]);
  const selectedCandidateDegrees = useMemo(() => computeSelectedCandidateDegrees(filteredCandidates), [filteredCandidates]);
  const selectedCandidateGenders = useMemo(() => computeSelectedCandidateGenders(filteredCandidates), [filteredCandidates]);

  const kpiCards = [
    { label: 'Total Candidates', value: kpiStats.totalCandidates.toLocaleString(), trend: '+12.4% vs last drive', icon: Users, colorClass: 'text-chart-1 bg-chart-1/10' },
    { label: 'Active Campus Drives', value: kpiStats.activeDrives, trend: '+4 this month', icon: School, colorClass: 'text-chart-2 bg-chart-2/10' },
    { label: 'Offers Released', value: kpiStats.offersReleased, trend: 'Across all rounds', icon: Award, colorClass: 'text-chart-3 bg-chart-3/10', noTrend: true },
    { label: 'Joining Rate', value: `${kpiStats.joiningRate}%`, trend: '+2.3% conversion', icon: TrendingUp, colorClass: 'text-chart-5 bg-chart-5/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-to-end recruitment analytics — from Online Test through Interview, Coding, Whiteboarding, Offer and Joining.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedCollege} onValueChange={setSelectedCollege}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Colleges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {availableColleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, trend, icon: Icon, colorClass, noTrend }) => (
          <Card key={label} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${noTrend ? 'text-muted-foreground' : 'text-primary'}`}>
                    {!noTrend && <TrendingUp className="h-3 w-3" />}
                    {noTrend && <Clock className="h-3 w-3" />}
                    {trend}
                  </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Hiring Funnel</CardTitle>
              <CardDescription>Conversion rates across cumulative placement stages</CardDescription>
            </div>
            <Badge variant="secondary">Funnel Analytics</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FunnelChart data={funnelData} />
        </CardContent>
      </Card>

      {/* Round-wise pass rate + Offer & Joining (left) / Team Profiles (right, spans both rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Round-wise Pass Rate</CardTitle>
              <CardDescription>Shortlist rate among candidates with a recorded decision, per round</CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart data={roundPassRates} unit="%" maxValue={100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Offer &amp; Joining</CardTitle>
              <CardDescription>Acceptance rate and average CTC across released offers</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-around gap-4">
              <GaugeChart percentage={offerStats.acceptanceRatePct} color="var(--chart-2)" label="Acceptance Rate" />
              <div className="text-center">
                <p className="text-2xl font-bold">{offerStats.avgCtc !== null ? `${offerStats.avgCtc} LPA` : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Average CTC Offered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Find Team Member</CardTitle>
                <CardDescription>Search by name or email, or filter by role</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="relative" title="Filter by role">
                    <UsersRound className="h-4 w-4 text-muted-foreground" />
                    {teamRoleFilter.size > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Filter by role</p>
                      {teamRoleFilter.size > 0 && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setTeamRoleFilter(new Set())}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {TEAM_ROLE_FILTER_OPTIONS.map(role => (
                      <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={teamRoleFilter.has(role)}
                          onCheckedChange={() => toggleTeamRoleFilter(role)}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 gap-3">
            <Input
              placeholder="Name or email address"
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
            />
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No team members recorded yet for this selection.</p>
            ) : filteredTeamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No people match your search or filter.</p>
            ) : (
              <div className="border rounded-lg divide-y flex-1 overflow-y-auto">
                {filteredTeamMembers.map(m => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => navigate(`/admin/team/${m.userId}`)}
                    className="w-full flex items-center gap-3 text-left px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campus Recruitment Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campus Recruitment Progress</CardTitle>
          <CardDescription>Registered vs Selected per college</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart data={drivePerformanceData} label2="Selected" />
        </CardContent>
      </Card>

      {/* Online Assessment detail (de-emphasized — one stage of the full pipeline above) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Online Assessment Scores</CardTitle>
            <CardDescription>Candidates per score range</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={scoreDistributionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gender Distribution</CardTitle>
            <CardDescription>Distribution among selected candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={selectedCandidateGenders} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Candidate Degrees</CardTitle>
            <CardDescription>Distribution among selected candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={selectedCandidateDegrees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
