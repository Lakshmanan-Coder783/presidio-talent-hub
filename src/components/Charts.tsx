import React from 'react';
import { User } from 'lucide-react';
import {
  Bar,
  BarChart as ReBarChart,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBar,
  RadialBarChart as ReRadialBarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart as ReRadarChart,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ─── 1. Funnel Chart ─────────────────────────────────────────────────────────

interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export const FunnelChart: React.FC<{ data: FunnelStage[] }> = ({ data }) => {
  const chartData = data.map(d => ({ name: d.stage, count: d.count, pct: d.pct }));

  const chartConfig = {
    count: { label: 'Candidates', color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <ReBarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 48, left: 90, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={`var(--chart-${(idx % 5) + 1})`} />
          ))}
        </Bar>
      </ReBarChart>
    </ChartContainer>
  );
};

// ─── 1b. Horizontal Bar Chart (single-series metric comparison) ──────────────

interface HorizontalBarDatum {
  label: string;
  value: number;
}

export const HorizontalBarChart: React.FC<{
  data: HorizontalBarDatum[];
  unit?: string;
  maxValue?: number;
}> = ({ data, unit = '', maxValue }) => {
  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  const chartConfig = {
    value: { label: unit ? `Value (${unit})` : 'Value', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <ReBarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 48, left: 90, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <XAxis
          type="number"
          domain={maxValue != null ? [0, maxValue] : undefined}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}${unit}`}
            />
          }
        />
        <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
      </ReBarChart>
    </ChartContainer>
  );
};

// ─── 2. Line Chart ────────────────────────────────────────────────────────────

interface LineChartData {
  label: string;
  value: number;
}

export const LineChart: React.FC<{ data: LineChartData[] }> = ({ data }) => {
  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  const chartConfig = {
    value: { label: 'Value', color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <ReLineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ReLineChart>
    </ChartContainer>
  );
};

// ─── 3. Bar Chart (double column) ─────────────────────────────────────────────

interface BarChartData {
  label: string;
  val1: number;
  val2: number;
}

export const BarChart: React.FC<{
  data: BarChartData[];
  label1?: string;
  label2?: string;
}> = ({ data, label1 = 'Registered', label2 = 'Shortlisted' }) => {
  const chartData = data.map(d => ({ name: d.label, [label1]: d.val1, [label2]: d.val2 }));

  const chartConfig = {
    [label1]: { label: label1, color: 'var(--chart-1)' },
    [label2]: { label: label2, color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <ReBarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey={label1} fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
        <Bar dataKey={label2} fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
      </ReBarChart>
    </ChartContainer>
  );
};

// ─── 4. Donut Chart ───────────────────────────────────────────────────────────

interface DonutChartData {
  label: string;
  value: number;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = (props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const DonutChart: React.FC<{ data: DonutChartData[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  const chartConfig = Object.fromEntries(
    data.map((d, idx) => [d.label, { label: d.label, color: `var(--chart-${(idx % 5) + 1})` }])
  ) satisfies ChartConfig;

  const chartData = data.map((d, idx) => ({
    ...d,
    fill: `var(--chart-${(idx % 5) + 1})`,
  }));

  return (
    <div className="flex items-center gap-4 w-full">
      <ChartContainer config={chartConfig} className="h-[240px] w-[240px] shrink-0">
        <RePieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={66}
            outerRadius={108}
            paddingAngle={2}
            labelLine={false}
            label={renderCustomLabel}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        </RePieChart>
      </ChartContainer>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-muted-foreground mb-1">
          Total: <span className="text-foreground font-bold">{total.toLocaleString()}</span>
        </p>
        {data.map((d, idx) => (
          <div key={idx} className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: `var(--chart-${(idx % 5) + 1})` }}
              />
              <span className="text-muted-foreground font-medium">{d.label}</span>
            </div>
            <span className="font-semibold text-foreground">
              {d.value} ({((d.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 5. Gauge Chart ───────────────────────────────────────────────────────────

export const GaugeChart: React.FC<{ percentage: number; color?: string; label?: string }> = ({
  percentage, color = 'var(--chart-1)', label,
}) => {
  const pct = Math.max(0, Math.min(100, percentage));
  const chartConfig = {
    score: { label: 'Score', color },
  } satisfies ChartConfig;

  return (
    <div className="relative flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[150px] w-[220px] aspect-auto">
        <ReRadialBarChart
          data={[{ name: 'score', value: pct, fill: color }]}
          startAngle={180}
          endAngle={0}
          innerRadius="70%"
          outerRadius="100%"
          cx="50%"
          cy="95%"
          barSize={18}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" cornerRadius={9} background={{ fill: 'var(--muted)' }} />
        </ReRadialBarChart>
      </ChartContainer>
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{pct}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
};

// ─── 6. Skill Radar Chart ──────────────────────────────────────────────────────

export interface SkillRadarPoint {
  skill: string;
  candidate: number;
  average: number;
}

export const SkillRadarChart: React.FC<{ data: SkillRadarPoint[] }> = ({ data }) => {
  const chartConfig = {
    candidate: { label: 'Candidate', color: 'var(--chart-1)' },
    average: { label: 'Average', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[320px] w-full">
      <ReRadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} />
        <Radar name="Average" dataKey="average" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} />
        <Radar name="Candidate" dataKey="candidate" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </ReRadarChart>
    </ChartContainer>
  );
};

// ─── 7. Percentile Dots ─────────────────────────────────────────────────────────

export const PercentileDots: React.FC<{ rank: number; total: number; dotCount?: number }> = ({
  rank, total, dotCount = 10,
}) => {
  const safeTotal = Math.max(total, 1);
  const highlightIndex = Math.min(
    dotCount - 1,
    Math.max(0, Math.round(((rank - 1) / Math.max(safeTotal - 1, 1)) * (dotCount - 1)))
  );
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: dotCount }).map((_, idx) => (
        <User
          key={idx}
          className={idx === highlightIndex ? 'h-5 w-5 text-primary fill-primary/20' : 'h-5 w-5 text-muted-foreground/40'}
        />
      ))}
    </div>
  );
};
