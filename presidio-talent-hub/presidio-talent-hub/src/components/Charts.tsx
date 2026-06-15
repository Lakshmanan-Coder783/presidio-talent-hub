import React from 'react';

// 1. Funnel Chart component
interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
  color: string;
}

export const FunnelChart: React.FC<{ data: FunnelStage[] }> = ({ data }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {data.map((item, idx) => {
        // Calculate dynamic width based on percentage to create the funnel visual effect
        const widthPercent = Math.max(100 - idx * 12, 25);
        return (
          <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '150px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {item.stage}
            </div>
            <div style={{ flexGrow: 1, position: 'relative', height: '36px', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: `${widthPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${item.color}ee, ${item.color}aa)`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'width 0.4s ease'
                }}
              >
                {item.count.toLocaleString()}
              </div>
            </div>
            <div style={{ width: '60px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 2. Line Chart Component
interface LineChartData {
  label: string;
  value: number;
}

export const LineChart: React.FC<{ data: LineChartData[]; color?: string }> = ({ data, color = '#2563eb' }) => {
  const width = 500;
  const height = 250;
  const padding = 40;

  const maxVal = Math.max(...data.map(d => d.value)) || 100;
  const minVal = 0;

  // Compute points
  const points = data.map((d, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minVal) / (maxVal - minVal)) * (height - padding * 2);
    return { x, y };
  });

  // Create path description
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Draw smooth Bezier curves
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
  }

  // Create area path
  let areaD = '';
  if (points.length > 0) {
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Y Axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const yVal = height - padding - ratio * (height - padding * 2);
          const labelVal = Math.round(minVal + ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line x1={padding} y1={yVal} x2={width - padding} y2={yVal} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding - 10} y={yVal + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {data.map((d, idx) => {
          const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
          return (
            <text key={idx} x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="500">
              {d.label}
            </text>
          );
        })}

        {/* Gradient Fill */}
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Areas & Lines */}
        {areaD && <path d={areaD} fill="url(#line-grad)" />}
        {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}

        {/* Data points */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
    </div>
  );
};

// 3. Double-Column Bar Chart
interface BarChartData {
  label: string;
  val1: number; // e.g. Registered
  val2: number; // e.g. Shortlisted
}

export const BarChart: React.FC<{ data: BarChartData[]; color1?: string; color2?: string; label1?: string; label2?: string }> = ({
  data,
  color1 = '#2563eb',
  color2 = '#22c55e',
  label1 = 'Registered',
  label2 = 'Shortlisted'
}) => {
  const width = 500;
  const height = 250;
  const padding = 40;

  const maxVal = Math.max(...data.flatMap(d => [d.val1, d.val2])) || 100;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const numGroups = data.length;
  const groupWidth = chartWidth / numGroups;
  const barWidth = groupWidth * 0.3;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Y Axis Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - padding - ratio * chartHeight;
          const labelVal = Math.round(ratio * maxVal);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Columns */}
        {data.map((d, idx) => {
          const groupX = padding + idx * groupWidth;
          const centerX = groupX + groupWidth / 2;

          const h1 = (d.val1 / maxVal) * chartHeight;
          const h2 = (d.val2 / maxVal) * chartHeight;

          const y1 = height - padding - h1;
          const y2 = height - padding - h2;

          const x1 = centerX - barWidth - 2;
          const x2 = centerX + 2;

          return (
            <g key={idx}>
              {/* Bar 1 */}
              <rect x={x1} y={y1} width={barWidth} height={h1} fill={color1} rx="3" />
              {/* Bar 2 */}
              <rect x={x2} y={y2} width={barWidth} height={h2} fill={color2} rx="3" />
              {/* X Label */}
              <text x={centerX} y={height - 12} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="500">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color1 }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>{label1}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color2 }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>{label2}</span>
        </div>
      </div>
    </div>
  );
};

// 4. Donut Chart (Degree breakdown)
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{ data: DonutChartData[] }> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let accumulatedAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
      <div style={{ width: '150px', height: '150px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
          {data.map((d, idx) => {
            const percentage = d.value / total;
            const strokeDash = percentage * 2 * Math.PI * 36; // radius is 36
            const strokeOffset = (accumulatedAngle / 360) * 2 * Math.PI * 36;
            accumulatedAngle += percentage * 360;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="36"
                fill="transparent"
                stroke={d.color}
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${2 * Math.PI * 36}`}
                strokeDashoffset={-strokeOffset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
          <circle cx="50" cy="50" r="26" fill="#ffffff" />
          <text x="50" y="48" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-secondary)">TOTAL</text>
          <text x="50" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--text-primary)">
            {total.toLocaleString()}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {data.map((d, idx) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }}></span>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{d.label}</span>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {d.value} ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
