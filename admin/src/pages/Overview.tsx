import { useState, useEffect, type CSSProperties } from 'react';
import { colors, fonts } from '../theme';
import { overviewStats } from '../data/mockCharts';

const fadeInKeyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const width = 120;
  const height = 40;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const strokeColor = positive ? colors.green : colors.red;
  const fillColor = positive
    ? 'rgba(74, 222, 128, 0.15)'
    : 'rgba(252, 165, 165, 0.15)';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={fillPoints} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  stat,
  index,
}: {
  stat: (typeof overviewStats)[number];
  index: number;
}) {
  const isPositiveTrend =
    (stat.trend === 'up' && stat.change > 0) ||
    (stat.trend === 'down' && stat.id === 'avg-response-time') ||
    (stat.trend === 'down' && stat.id === 'error-rate') ||
    (stat.trend === 'down' && stat.id === 'open-issues') ||
    (stat.trend === 'down' && stat.id === 'build-time') ||
    (stat.trend === 'down' && stat.id === 'disk-io');

  const changeColor = isPositiveTrend ? colors.green : colors.red;
  const arrow = stat.trend === 'up' ? '\u2191' : '\u2193';

  const [hovered, setHovered] = useState(false);

  const cardStyle: CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${hovered ? colors.accent : colors.border}`,
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    opacity: 0,
    animation: 'fadeIn 0.4s ease-out forwards',
    animationDelay: `${index * 0.05}s`,
    transition: 'border-color 0.2s ease',
    cursor: 'default',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          color: colors.textDim,
          letterSpacing: '0.02em',
        }}
      >
        {stat.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1,
          }}
        >
          {stat.value}
        </span>
        <Sparkline data={stat.sparkline} positive={isPositiveTrend} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 13,
            fontWeight: 600,
            color: changeColor,
          }}
        >
          {arrow} {Math.abs(stat.change)}%
        </span>
        <span
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            color: colors.textDim,
          }}
        >
          vs last period
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${hovered ? colors.accent : colors.border}`,
        borderRadius: 14,
        padding: 24,
        flex: 1,
        opacity: 0,
        animation: 'fadeIn 0.4s ease-out forwards',
        animationDelay: `${delay}s`,
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

export function Overview() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const alertCount = 3;
  const lastDeployHoursAgo = 2;

  const summaryDelay = overviewStats.length * 0.05 + 0.2;

  return (
    <div style={{ fontFamily: fonts.sans }}>
      <style>{fadeInKeyframes}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Dashboard Overview
        </h1>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 20,
            fontWeight: 600,
            color: colors.accent,
            background: colors.accentGlow,
            padding: '8px 16px',
            borderRadius: 10,
            letterSpacing: '0.05em',
          }}
        >
          {formattedTime}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {overviewStats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 32,
        }}
      >
        <SummaryCard delay={summaryDelay}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: colors.green,
                boxShadow: `0 0 8px ${colors.green}`,
              }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: colors.text,
              }}
            >
              System Health
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              color: colors.green,
              fontWeight: 500,
            }}
          >
            All Systems Operational
          </span>
        </SummaryCard>

        <SummaryCard delay={summaryDelay + 0.1}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: colors.text,
              }}
            >
              Active Alerts
            </span>
          </div>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 32,
              fontWeight: 700,
              color: colors.yellow,
            }}
          >
            {alertCount}
          </span>
        </SummaryCard>

        <SummaryCard delay={summaryDelay + 0.2}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: colors.text,
              }}
            >
              Last Deploy
            </span>
          </div>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 18,
              fontWeight: 600,
              color: colors.cyan,
            }}
          >
            {lastDeployHoursAgo} hours ago
          </span>
        </SummaryCard>
      </div>
    </div>
  );
}
