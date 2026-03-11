import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { colors, chartColors, fonts } from '../theme';

const reportTypes = [
  { id: 'monthly', label: 'Monthly Summary' },
  { id: 'users', label: 'User Growth' },
  { id: 'performance', label: 'System Performance' },
  { id: 'financial', label: 'Financial Overview' },
];

const userGrowthData = [
  { month: 'Oct', users: 32400 },
  { month: 'Nov', users: 36800 },
  { month: 'Dec', users: 39200 },
  { month: 'Jan', users: 42100 },
  { month: 'Feb', users: 45600 },
  { month: 'Mar', users: 48294 },
];

const topFeatures = [
  { name: 'API Gateway', users: 12480, sessions: 45200, growth: 18.4 },
  { name: 'Authentication', users: 11200, sessions: 38900, growth: 12.7 },
  { name: 'Real-time Analytics', users: 9840, sessions: 32100, growth: 24.5 },
  { name: 'Model Training', users: 8920, sessions: 28400, growth: 31.2 },
  { name: 'Data Pipeline', users: 7650, sessions: 24800, growth: 15.8 },
  { name: 'Search Engine', users: 6890, sessions: 21200, growth: 9.3 },
  { name: 'File Storage', users: 5420, sessions: 18600, growth: 7.1 },
  { name: 'Notifications', users: 4780, sessions: 15400, growth: 22.6 },
  { name: 'Webhooks', users: 3210, sessions: 10800, growth: 14.9 },
  { name: 'Scheduler', users: 2890, sessions: 8900, growth: 11.3 },
];

const newUsersPerMonth = [
  { month: 'Apr', users: 1820 },
  { month: 'May', users: 2100 },
  { month: 'Jun', users: 2340 },
  { month: 'Jul', users: 2580 },
  { month: 'Aug', users: 2210 },
  { month: 'Sep', users: 2680 },
  { month: 'Oct', users: 2890 },
  { month: 'Nov', users: 3120 },
  { month: 'Dec', users: 2950 },
  { month: 'Jan', users: 3340 },
  { month: 'Feb', users: 3580 },
  { month: 'Mar', users: 3840 },
];

const userDistribution = [
  { name: 'Free', value: 28400 },
  { name: 'Pro', value: 14200 },
  { name: 'Enterprise', value: 5694 },
];

const acquisitionChannels = [
  { channel: 'Organic Search', users: 18240, conversion: '4.2%', cost: '$0' },
  { channel: 'Paid Ads', users: 12480, conversion: '2.8%', cost: '$34,200' },
  { channel: 'Referrals', users: 8920, conversion: '6.1%', cost: '$8,400' },
  { channel: 'Social Media', users: 5210, conversion: '1.9%', cost: '$12,100' },
  { channel: 'Direct', users: 3444, conversion: '5.3%', cost: '$0' },
];

const responseTimeData = [
  { day: '1', avgMs: 145, p99Ms: 320 },
  { day: '2', avgMs: 138, p99Ms: 295 },
  { day: '3', avgMs: 152, p99Ms: 340 },
  { day: '4', avgMs: 128, p99Ms: 280 },
  { day: '5', avgMs: 135, p99Ms: 310 },
  { day: '6', avgMs: 142, p99Ms: 325 },
  { day: '7', avgMs: 148, p99Ms: 335 },
  { day: '8', avgMs: 131, p99Ms: 290 },
  { day: '9', avgMs: 139, p99Ms: 305 },
  { day: '10', avgMs: 155, p99Ms: 350 },
  { day: '11', avgMs: 126, p99Ms: 275 },
  { day: '12', avgMs: 143, p99Ms: 315 },
  { day: '13', avgMs: 137, p99Ms: 300 },
  { day: '14', avgMs: 149, p99Ms: 330 },
  { day: '15', avgMs: 133, p99Ms: 295 },
  { day: '16', avgMs: 141, p99Ms: 312 },
  { day: '17', avgMs: 146, p99Ms: 328 },
  { day: '18', avgMs: 130, p99Ms: 285 },
  { day: '19', avgMs: 138, p99Ms: 302 },
  { day: '20', avgMs: 152, p99Ms: 342 },
  { day: '21', avgMs: 158, p99Ms: 355 },
  { day: '22', avgMs: 163, p99Ms: 370 },
  { day: '23', avgMs: 155, p99Ms: 348 },
  { day: '24', avgMs: 148, p99Ms: 332 },
  { day: '25', avgMs: 142, p99Ms: 318 },
  { day: '26', avgMs: 168, p99Ms: 382 },
  { day: '27', avgMs: 175, p99Ms: 395 },
  { day: '28', avgMs: 162, p99Ms: 365 },
  { day: '29', avgMs: 150, p99Ms: 338 },
  { day: '30', avgMs: 142, p99Ms: 320 },
];

const serviceHealth = [
  { service: 'API Gateway', uptime: 99.99, avgLatency: 42, p99Latency: 128, errorRate: 0.02 },
  { service: 'Auth Service', uptime: 99.98, avgLatency: 38, p99Latency: 95, errorRate: 0.01 },
  { service: 'Database', uptime: 99.97, avgLatency: 12, p99Latency: 45, errorRate: 0.03 },
  { service: 'Cache Layer', uptime: 99.99, avgLatency: 3, p99Latency: 8, errorRate: 0.0 },
  { service: 'Search Indexer', uptime: 99.92, avgLatency: 85, p99Latency: 240, errorRate: 0.08 },
  { service: 'File Storage', uptime: 99.95, avgLatency: 120, p99Latency: 380, errorRate: 0.05 },
  { service: 'Notification Service', uptime: 99.94, avgLatency: 65, p99Latency: 180, errorRate: 0.06 },
];

const incidents = [
  { date: '2024-03-08', severity: 'High', description: 'Database connection pool exhaustion - 5min downtime', resolved: true },
  { date: '2024-03-05', severity: 'Medium', description: 'Elevated error rates on search service during peak load', resolved: true },
  { date: '2024-03-02', severity: 'Low', description: 'Scheduled maintenance - cache cluster migration completed', resolved: true },
  { date: '2024-02-28', severity: 'High', description: 'CDN provider outage affecting static asset delivery', resolved: true },
  { date: '2024-02-25', severity: 'Medium', description: 'Authentication latency spike during peak traffic hours', resolved: true },
];

const revenueBreakdown = [
  { month: 'Apr', subscriptions: 38000, oneTime: 4200 },
  { month: 'May', subscriptions: 41200, oneTime: 3800 },
  { month: 'Jun', subscriptions: 44100, oneTime: 5200 },
  { month: 'Jul', subscriptions: 47800, oneTime: 4600 },
  { month: 'Aug', subscriptions: 45900, oneTime: 3900 },
  { month: 'Sep', subscriptions: 49300, oneTime: 5100 },
  { month: 'Oct', subscriptions: 53200, oneTime: 4800 },
  { month: 'Nov', subscriptions: 56800, oneTime: 5400 },
  { month: 'Dec', subscriptions: 59100, oneTime: 6200 },
  { month: 'Jan', subscriptions: 62400, oneTime: 5800 },
  { month: 'Feb', subscriptions: 65800, oneTime: 6100 },
  { month: 'Mar', subscriptions: 69200, oneTime: 7400 },
];

const revenueByPlan = [
  { plan: 'Free', users: 28400, mrr: '$0', growth: '+12.4%' },
  { plan: 'Pro ($29/mo)', users: 14200, mrr: '$411,800', growth: '+18.2%' },
  { plan: 'Enterprise ($199/mo)', users: 5694, mrr: '$1,133,106', growth: '+24.8%' },
];

const expenseBreakdown = [
  { category: 'Infrastructure (AWS)', amount: '$28,400', percent: 37.1 },
  { category: 'Engineering Salaries', amount: '$24,200', percent: 31.6 },
  { category: 'Marketing & Sales', amount: '$12,100', percent: 15.8 },
  { category: 'Support & Operations', amount: '$6,800', percent: 8.9 },
  { category: 'Legal & Compliance', amount: '$3,200', percent: 4.2 },
  { category: 'Miscellaneous', amount: '$1,900', percent: 2.4 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: colors.bgElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: '0.8rem',
        fontFamily: fonts.sans,
      }}
    >
      <p style={{ color: colors.textDim, margin: '0 0 4px 0' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          style={{
            color: p.color,
            margin: '2px 0',
            fontWeight: 500,
          }}
        >
          {p.name}:{' '}
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export function Reports() {
  const [selectedReport, setSelectedReport] = useState('monthly');

  const paperStyle: React.CSSProperties = {
    background: '#1a1a24',
    maxWidth: 800,
    margin: '0 auto',
    padding: 48,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    fontFamily: fonts.sans,
  };

  const reportTitle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    margin: '0 0 4px 0',
  };

  const reportSubtitle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: colors.textDim,
    margin: '0 0 4px 0',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: colors.text,
    margin: '32px 0 16px 0',
    paddingBottom: 8,
    borderBottom: `1px solid ${colors.border}`,
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    color: colors.textDim,
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: `1px solid ${colors.border}`,
    textAlign: 'left',
  };

  const thRight: React.CSSProperties = {
    ...thStyle,
    textAlign: 'right',
  };

  const td = (row: number): React.CSSProperties => ({
    padding: '10px 12px',
    color: colors.text,
    fontSize: '0.85rem',
    borderBottom: `1px solid ${colors.border}22`,
    background: row % 2 === 0 ? 'transparent' : `${colors.bgElevated}50`,
  });

  const tdRight = (row: number): React.CSSProperties => ({
    ...td(row),
    textAlign: 'right',
  });

  const kpiCard: React.CSSProperties = {
    background: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: '16px 20px',
    textAlign: 'center',
  };

  const pageFooter = (page: number) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        paddingTop: 16,
        borderTop: `1px solid ${colors.border}`,
        fontSize: '0.75rem',
        color: colors.textDim,
      }}
    >
      <span>CONFIDENTIAL - OpenClaw Internal</span>
      <span>Page {page}</span>
    </div>
  );

  const severityColor = (sev: string) =>
    sev === 'High' ? colors.red : sev === 'Medium' ? colors.yellow : colors.blue;

  return (
    <div style={{ padding: 0, fontFamily: fonts.sans }}>
      <style>{`
        @media print {
          nav, .sidebar, button, [data-no-print] {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          * {
            border-color: #ddd !important;
          }
          .report-paper {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 24px !important;
          }
        }
      `}</style>

      <div style={{ marginBottom: 20 }} data-no-print>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: colors.text,
                margin: 0,
                marginBottom: 6,
              }}
            >
              Reports
            </h1>
            <p
              style={{ color: colors.textDim, fontSize: '0.9rem', margin: 0 }}
            >
              Generate and export detailed reports
            </p>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: colors.accent,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            Export as PDF
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
        }}
        data-no-print
      >
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReport(r.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: `1px solid ${
                selectedReport === r.id ? colors.accent : colors.border
              }`,
              background:
                selectedReport === r.id
                  ? colors.accentGlow
                  : colors.bgElevated,
              color:
                selectedReport === r.id ? colors.accent : colors.textDim,
              fontWeight: selectedReport === r.id ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: fonts.sans,
              transition: 'all 0.15s',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {selectedReport === 'monthly' && (
        <div style={paperStyle} className="report-paper">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={reportTitle}>OpenClaw Monthly Report</h1>
            <p style={reportSubtitle}>
              Report Period: March 1 - March 31, 2024
            </p>
            <p style={{ ...reportSubtitle, fontSize: '0.78rem' }}>
              Generated: March 10, 2024 at 14:32 UTC
            </p>
          </div>

          <h3 style={sectionTitle}>Executive Summary</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div style={kpiCard}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.textDim,
                  marginBottom: 4,
                }}
              >
                Total Users
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: colors.accent,
                }}
              >
                48,294
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.green,
                  marginTop: 2,
                }}
              >
                +12.5%
              </div>
            </div>
            <div style={kpiCard}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.textDim,
                  marginBottom: 4,
                }}
              >
                Revenue
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: colors.cyan,
                }}
              >
                $78.2K
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.green,
                  marginTop: 2,
                }}
              >
                +22.1%
              </div>
            </div>
            <div style={kpiCard}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.textDim,
                  marginBottom: 4,
                }}
              >
                API Calls
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: colors.yellow,
                }}
              >
                2.4M
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.green,
                  marginTop: 2,
                }}
              >
                +18.7%
              </div>
            </div>
            <div style={kpiCard}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.textDim,
                  marginBottom: 4,
                }}
              >
                Uptime
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: colors.green,
                }}
              >
                99.98%
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: colors.green,
                  marginTop: 2,
                }}
              >
                +0.2%
              </div>
            </div>
          </div>

          <h3 style={sectionTitle}>User Growth Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.textDim} fontSize={12} />
              <YAxis stroke={colors.textDim} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                name="Total Users"
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ fill: chartColors[0], r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <h3 style={sectionTitle}>Top Features by Usage</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Feature</th>
                <th style={thRight}>Users</th>
                <th style={thRight}>Sessions</th>
                <th style={thRight}>Growth %</th>
              </tr>
            </thead>
            <tbody>
              {topFeatures.map((f, i) => (
                <tr key={f.name}>
                  <td style={td(i)}>{f.name}</td>
                  <td style={tdRight(i)}>{f.users.toLocaleString()}</td>
                  <td style={tdRight(i)}>{f.sessions.toLocaleString()}</td>
                  <td style={{ ...tdRight(i), color: colors.green }}>
                    +{f.growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={sectionTitle}>Key Findings</h3>
          <ul
            style={{
              color: colors.text,
              fontSize: '0.9rem',
              lineHeight: 1.8,
              paddingLeft: 20,
            }}
          >
            <li>
              User growth accelerated by 12.5% month-over-month, driven
              primarily by organic search and referral channels.
            </li>
            <li>
              API call volume increased 18.7% with response times remaining
              stable at 142ms average.
            </li>
            <li>
              Real-time Analytics and Model Training features saw the highest
              adoption growth at 24.5% and 31.2% respectively.
            </li>
            <li>
              System uptime maintained at 99.98% with only one significant
              incident during the reporting period.
            </li>
          </ul>

          {pageFooter(1)}
        </div>
      )}

      {selectedReport === 'users' && (
        <div style={paperStyle} className="report-paper">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={reportTitle}>User Growth Report</h1>
            <p style={reportSubtitle}>
              12-Month Analysis: April 2023 - March 2024
            </p>
          </div>

          <h3 style={sectionTitle}>New Users per Month</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={newUsersPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.textDim} fontSize={12} />
              <YAxis stroke={colors.textDim} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="users"
                name="New Users"
                fill={chartColors[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={sectionTitle}>User Distribution by Plan</h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: any) =>
                    `${name} (${(percent * 100).toFixed(1)}%)`
                  }
                  labelLine={{ stroke: colors.textDim }}
                >
                  {userDistribution.map((_, index) => (
                    <Cell
                      key={index}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h3 style={sectionTitle}>User Acquisition Channels</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Channel</th>
                <th style={thRight}>Users</th>
                <th style={thRight}>Conversion Rate</th>
                <th style={thRight}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {acquisitionChannels.map((ch, i) => (
                <tr key={ch.channel}>
                  <td style={td(i)}>{ch.channel}</td>
                  <td style={tdRight(i)}>{ch.users.toLocaleString()}</td>
                  <td style={tdRight(i)}>{ch.conversion}</td>
                  <td style={tdRight(i)}>{ch.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={sectionTitle}>Retention Metrics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 12,
            }}
          >
            {[
              { label: 'Day 1', value: '82.4%' },
              { label: 'Day 7', value: '64.1%' },
              { label: 'Day 30', value: '41.8%' },
              { label: 'Day 90', value: '28.3%' },
            ].map((r) => (
              <div key={r.label} style={kpiCard}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: colors.textDim,
                    marginBottom: 4,
                  }}
                >
                  {r.label} Retention
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: colors.cyan,
                  }}
                >
                  {r.value}
                </div>
              </div>
            ))}
          </div>

          {pageFooter(1)}
        </div>
      )}

      {selectedReport === 'performance' && (
        <div style={paperStyle} className="report-paper">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={reportTitle}>System Performance Report</h1>
            <p style={reportSubtitle}>
              30-Day Analysis: February 9 - March 10, 2024
            </p>
          </div>

          <h3 style={sectionTitle}>Response Time (30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="day"
                stroke={colors.textDim}
                fontSize={12}
                label={{
                  value: 'Day',
                  position: 'insideBottom',
                  offset: -5,
                  fill: colors.textDim,
                }}
              />
              <YAxis
                stroke={colors.textDim}
                fontSize={12}
                label={{
                  value: 'ms',
                  angle: -90,
                  position: 'insideLeft',
                  fill: colors.textDim,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgMs"
                name="Avg Response (ms)"
                stroke={chartColors[1]}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p99Ms"
                name="P99 Response (ms)"
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>

          <h3 style={sectionTitle}>Service Health</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Service</th>
                <th style={thRight}>Uptime %</th>
                <th style={thRight}>Avg Latency</th>
                <th style={thRight}>P99 Latency</th>
                <th style={thRight}>Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {serviceHealth.map((s, i) => (
                <tr key={s.service}>
                  <td style={td(i)}>{s.service}</td>
                  <td
                    style={{
                      ...tdRight(i),
                      color:
                        s.uptime >= 99.95 ? colors.green : colors.yellow,
                    }}
                  >
                    {s.uptime.toFixed(2)}%
                  </td>
                  <td style={tdRight(i)}>{s.avgLatency}ms</td>
                  <td style={tdRight(i)}>{s.p99Latency}ms</td>
                  <td
                    style={{
                      ...tdRight(i),
                      color:
                        s.errorRate <= 0.03 ? colors.green : colors.yellow,
                    }}
                  >
                    {s.errorRate.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={sectionTitle}>Recent Incidents</h3>
          {incidents.map((inc, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderLeft: `3px solid ${severityColor(inc.severity)}`,
                background:
                  i % 2 === 0 ? 'transparent' : `${colors.bgElevated}50`,
                marginBottom: 8,
                borderRadius: '0 8px 8px 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: fonts.mono,
                    color: colors.textDim,
                  }}
                >
                  {inc.date}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: `${severityColor(inc.severity)}20`,
                    color: severityColor(inc.severity),
                  }}
                >
                  {inc.severity}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: colors.text }}>
                {inc.description}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: inc.resolved ? colors.green : colors.yellow,
                  marginTop: 4,
                }}
              >
                {inc.resolved ? 'Resolved' : 'Ongoing'}
              </div>
            </div>
          ))}

          {pageFooter(1)}
        </div>
      )}

      {selectedReport === 'financial' && (
        <div style={paperStyle} className="report-paper">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={reportTitle}>Financial Overview</h1>
            <p style={reportSubtitle}>
              Fiscal Year 2024: April 2023 - March 2024
            </p>
          </div>

          <h3 style={sectionTitle}>Monthly Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.textDim} fontSize={12} />
              <YAxis stroke={colors.textDim} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="subscriptions"
                name="Subscriptions"
                fill={chartColors[0]}
                stackId="revenue"
              />
              <Bar
                dataKey="oneTime"
                name="One-Time"
                fill={chartColors[1]}
                stackId="revenue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={sectionTitle}>Revenue by Plan</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Plan</th>
                <th style={thRight}>Users</th>
                <th style={thRight}>MRR</th>
                <th style={thRight}>Growth</th>
              </tr>
            </thead>
            <tbody>
              {revenueByPlan.map((r, i) => (
                <tr key={r.plan}>
                  <td style={td(i)}>{r.plan}</td>
                  <td style={tdRight(i)}>{r.users.toLocaleString()}</td>
                  <td style={{ ...tdRight(i), fontWeight: 600 }}>{r.mrr}</td>
                  <td style={{ ...tdRight(i), color: colors.green }}>
                    {r.growth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={sectionTitle}>Expense Breakdown</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Category</th>
                <th style={thRight}>Amount</th>
                <th style={thRight}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {expenseBreakdown.map((e, i) => (
                <tr key={e.category}>
                  <td style={td(i)}>{e.category}</td>
                  <td style={{ ...tdRight(i), fontWeight: 600 }}>
                    {e.amount}
                  </td>
                  <td style={tdRight(i)}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          background: colors.bgCard,
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${e.percent}%`,
                            height: '100%',
                            background: colors.accent,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      {e.percent}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageFooter(1)}
        </div>
      )}
    </div>
  );
}
