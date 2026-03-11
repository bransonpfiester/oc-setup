import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { colors, chartColors, fonts } from '../theme';

const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 28000 },
  { month: 'Feb', revenue: 48000, expenses: 30500 },
  { month: 'Mar', revenue: 52000, expenses: 31000 },
  { month: 'Apr', revenue: 47000, expenses: 29500 },
  { month: 'May', revenue: 55000, expenses: 33000 },
  { month: 'Jun', revenue: 61000, expenses: 35000 },
  { month: 'Jul', revenue: 58000, expenses: 34000 },
  { month: 'Aug', revenue: 65000, expenses: 36500 },
  { month: 'Sep', revenue: 72000, expenses: 38000 },
  { month: 'Oct', revenue: 69000, expenses: 37000 },
  { month: 'Nov', revenue: 76000, expenses: 40000 },
  { month: 'Dec', revenue: 82000, expenses: 42000 },
];

const regionData = [
  { region: 'N. America', users: 45200 },
  { region: 'Europe', users: 38100 },
  { region: 'Asia Pacific', users: 32800 },
  { region: 'Latin America', users: 18500 },
  { region: 'Middle East', users: 12300 },
  { region: 'Africa', users: 8900 },
  { region: 'Oceania', users: 6200 },
  { region: 'Central Asia', users: 4100 },
];

const trafficData = [
  { hour: '00:00', visitors: 120, pageViews: 340 },
  { hour: '01:00', visitors: 98, pageViews: 280 },
  { hour: '02:00', visitors: 75, pageViews: 210 },
  { hour: '03:00', visitors: 62, pageViews: 175 },
  { hour: '04:00', visitors: 55, pageViews: 155 },
  { hour: '05:00', visitors: 70, pageViews: 195 },
  { hour: '06:00', visitors: 140, pageViews: 390 },
  { hour: '07:00', visitors: 280, pageViews: 780 },
  { hour: '08:00', visitors: 450, pageViews: 1250 },
  { hour: '09:00', visitors: 620, pageViews: 1720 },
  { hour: '10:00', visitors: 780, pageViews: 2160 },
  { hour: '11:00', visitors: 850, pageViews: 2350 },
  { hour: '12:00', visitors: 720, pageViews: 2000 },
  { hour: '13:00', visitors: 680, pageViews: 1890 },
  { hour: '14:00', visitors: 820, pageViews: 2280 },
  { hour: '15:00', visitors: 890, pageViews: 2470 },
  { hour: '16:00', visitors: 840, pageViews: 2330 },
  { hour: '17:00', visitors: 750, pageViews: 2080 },
  { hour: '18:00', visitors: 620, pageViews: 1720 },
  { hour: '19:00', visitors: 540, pageViews: 1500 },
  { hour: '20:00', visitors: 480, pageViews: 1330 },
  { hour: '21:00', visitors: 380, pageViews: 1050 },
  { hour: '22:00', visitors: 270, pageViews: 750 },
  { hour: '23:00', visitors: 180, pageViews: 500 },
];

const browserData = [
  { name: 'Chrome', value: 62.5 },
  { name: 'Firefox', value: 14.2 },
  { name: 'Safari', value: 12.8 },
  { name: 'Edge', value: 7.3 },
  { name: 'Other', value: 3.2 },
];

const performanceData = [
  { metric: 'Speed', current: 85, previous: 72 },
  { metric: 'Reliability', current: 92, previous: 88 },
  { metric: 'Uptime', current: 98, previous: 95 },
  { metric: 'Latency', current: 78, previous: 82 },
  { metric: 'Throughput', current: 88, previous: 75 },
  { metric: 'Availability', current: 96, previous: 91 },
];

const scatterData = [
  { throughput: 120, latency: 180, size: 80 },
  { throughput: 145, latency: 165, size: 120 },
  { throughput: 170, latency: 150, size: 60 },
  { throughput: 190, latency: 142, size: 100 },
  { throughput: 210, latency: 138, size: 90 },
  { throughput: 230, latency: 125, size: 140 },
  { throughput: 250, latency: 118, size: 70 },
  { throughput: 265, latency: 110, size: 160 },
  { throughput: 280, latency: 105, size: 85 },
  { throughput: 300, latency: 98, size: 110 },
  { throughput: 315, latency: 95, size: 130 },
  { throughput: 330, latency: 88, size: 75 },
  { throughput: 345, latency: 82, size: 95 },
  { throughput: 360, latency: 78, size: 150 },
  { throughput: 375, latency: 72, size: 65 },
  { throughput: 390, latency: 68, size: 105 },
  { throughput: 405, latency: 62, size: 125 },
  { throughput: 420, latency: 58, size: 80 },
  { throughput: 435, latency: 55, size: 145 },
  { throughput: 450, latency: 50, size: 90 },
  { throughput: 155, latency: 172, size: 100 },
  { throughput: 200, latency: 148, size: 115 },
  { throughput: 240, latency: 130, size: 85 },
  { throughput: 285, latency: 108, size: 135 },
  { throughput: 320, latency: 92, size: 70 },
  { throughput: 355, latency: 75, size: 110 },
  { throughput: 395, latency: 65, size: 95 },
  { throughput: 425, latency: 56, size: 140 },
  { throughput: 460, latency: 48, size: 75 },
  { throughput: 180, latency: 155, size: 120 },
];

const systemData = [
  { month: 'Jan', requests: 4200, errors: 42, latency: 120 },
  { month: 'Feb', requests: 4800, errors: 38, latency: 115 },
  { month: 'Mar', requests: 5200, errors: 35, latency: 108 },
  { month: 'Apr', requests: 4900, errors: 48, latency: 125 },
  { month: 'May', requests: 5600, errors: 32, latency: 102 },
  { month: 'Jun', requests: 6100, errors: 28, latency: 98 },
  { month: 'Jul', requests: 5800, errors: 45, latency: 112 },
  { month: 'Aug', requests: 6500, errors: 25, latency: 95 },
  { month: 'Sep', requests: 7200, errors: 22, latency: 88 },
  { month: 'Oct', requests: 6800, errors: 30, latency: 92 },
  { month: 'Nov', requests: 7500, errors: 18, latency: 85 },
  { month: 'Dec', requests: 8200, errors: 15, latency: 80 },
];

const treemapData = [
  { name: 'Dashboard', size: 4500 },
  { name: 'API Calls', size: 3800 },
  { name: 'Auth', size: 3200 },
  { name: 'Search', size: 2800 },
  { name: 'Reports', size: 2400 },
  { name: 'Settings', size: 1900 },
  { name: 'Billing', size: 1600 },
  { name: 'Webhooks', size: 1200 },
  { name: 'Logs', size: 1000 },
  { name: 'Alerts', size: 850 },
  { name: 'Users', size: 720 },
  { name: 'Integrations', size: 580 },
  { name: 'Analytics', size: 450 },
  { name: 'Storage', size: 380 },
];

const funnelData = [
  { name: 'Visitors', value: 100000, fill: chartColors[0] },
  { name: 'Signups', value: 28000, fill: chartColors[1] },
  { name: 'Trials', value: 12000, fill: chartColors[2] },
  { name: 'Subscriptions', value: 5200, fill: chartColors[3] },
  { name: 'Enterprise', value: 1800, fill: chartColors[4] },
];

const radialData = [
  { name: 'Response', value: 82, fill: chartColors[5] },
  { name: 'Availability', value: 88, fill: chartColors[4] },
  { name: 'Security', value: 92, fill: chartColors[3] },
  { name: 'Reliability', value: 95, fill: chartColors[2] },
  { name: 'Performance', value: 88, fill: chartColors[1] },
  { name: 'Uptime', value: 99, fill: chartColors[0] },
];

const RADIAN = Math.PI / 180;

const tooltipContentStyle: React.CSSProperties = {
  background: colors.bgElevated,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  color: colors.text,
};

const cardBase: React.CSSProperties = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: 24,
};

const titleStyle: React.CSSProperties = {
  color: colors.text,
  fontSize: 18,
  fontWeight: 600,
  margin: '0 0 4px 0',
  fontFamily: fonts.sans,
};

const descStyle: React.CSSProperties = {
  color: colors.textDim,
  fontSize: 13,
  margin: '0 0 20px 0',
  fontFamily: fonts.sans,
};

function cardStyle(delay: string): React.CSSProperties {
  return {
    ...cardBase,
    animation: 'fadeIn 0.5s ease forwards',
    animationDelay: delay,
    opacity: 0,
  };
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  name: string;
  percent: number;
}) {
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={colors.text}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontFamily={fonts.sans}
    >
      {`${name} ${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

function CustomTreemapContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
}) {
  const { x, y, width, height, index, name } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={chartColors[index % chartColors.length]}
        stroke={colors.border}
        strokeWidth={2}
        rx={4}
      />
      {width > 50 && height > 25 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.text}
          fontSize={12}
          fontFamily={fonts.sans}
        >
          {name}
        </text>
      )}
    </g>
  );
}

export function Analytics() {
  return (
    <div style={{ padding: 32, fontFamily: fonts.sans, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <h1
        style={{
          color: colors.text,
          fontSize: 32,
          fontWeight: 700,
          margin: '0 0 8px 0',
          fontFamily: fonts.sans,
        }}
      >
        Analytics
      </h1>
      <p
        style={{
          color: colors.textDim,
          fontSize: 15,
          margin: '0 0 32px 0',
          fontFamily: fonts.sans,
        }}
      >
        Comprehensive data visualization across all metrics
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}
      >
        {/* 1. Revenue Trend - Line Chart */}
        <div style={cardStyle('0s')}>
          <h3 style={titleStyle}>Revenue Trend</h3>
          <p style={descStyle}>
            Monthly revenue and expense tracking over the past year
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: colors.textDim, fontSize: 12 }}
              />
              <YAxis tick={{ fill: colors.textDim, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f87171"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#67e8f9"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Users by Region - Bar Chart */}
        <div style={cardStyle('0.08s')}>
          <h3 style={titleStyle}>Users by Region</h3>
          <p style={descStyle}>
            Geographic distribution of active users across regions
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
              />
              <XAxis
                dataKey="region"
                tick={{ fill: colors.textDim, fontSize: 11 }}
              />
              <YAxis tick={{ fill: colors.textDim, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Bar
                dataKey="users"
                fill="#67e8f9"
                radius={[4, 4, 0, 0]}
                name="Users"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Traffic Over Time - Area Chart */}
        <div style={cardStyle('0.16s')}>
          <h3 style={titleStyle}>Traffic Over Time</h3>
          <p style={descStyle}>
            24-hour visitor and page view patterns
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient
                  id="gradientVisitors"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#f87171"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="#f87171"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="gradientPageViews"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#67e8f9"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="#67e8f9"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
              />
              <XAxis
                dataKey="hour"
                tick={{ fill: colors.textDim, fontSize: 11 }}
                interval={2}
              />
              <YAxis tick={{ fill: colors.textDim, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#f87171"
                fill="url(#gradientVisitors)"
                strokeWidth={2}
                name="Visitors"
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                stroke="#67e8f9"
                fill="url(#gradientPageViews)"
                strokeWidth={2}
                name="Page Views"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Browser Share - Pie Chart */}
        <div style={cardStyle('0.24s')}>
          <h3 style={titleStyle}>Browser Share</h3>
          <p style={descStyle}>
            Market share distribution across major browsers
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Pie
                data={browserData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={renderPieLabel}
                labelLine={{ stroke: colors.textDim }}
              >
                {browserData.map((_, index) => (
                  <Cell
                    key={`browser-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Performance Metrics - Radar Chart */}
        <div style={cardStyle('0.32s')}>
          <h3 style={titleStyle}>Performance Metrics</h3>
          <p style={descStyle}>
            Current vs previous period performance comparison
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart
              data={performanceData}
              cx="50%"
              cy="50%"
              outerRadius="80%"
            >
              <PolarGrid stroke={colors.border} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: colors.textDim, fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: colors.textDim, fontSize: 10 }}
              />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#f87171"
                fill="#f87171"
                fillOpacity={0.2}
              />
              <Radar
                name="Previous"
                dataKey="previous"
                stroke="#67e8f9"
                fill="#67e8f9"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. API Latency vs Throughput - Scatter Chart */}
        <div style={cardStyle('0.4s')}>
          <h3 style={titleStyle}>API Latency vs Throughput</h3>
          <p style={descStyle}>
            Correlation between API throughput and response latency
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
              />
              <XAxis
                dataKey="throughput"
                name="Throughput"
                tick={{ fill: colors.textDim, fontSize: 12 }}
              />
              <YAxis
                dataKey="latency"
                name="Latency"
                tick={{ fill: colors.textDim, fontSize: 12 }}
              />
              <ZAxis dataKey="size" range={[40, 400]} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                cursor={{
                  strokeDasharray: '3 3',
                  stroke: colors.textDim,
                }}
              />
              <Legend />
              <Scatter
                name="API Calls"
                data={scatterData}
                fill="#c084fc"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 7. System Metrics - Composed Chart */}
        <div style={cardStyle('0.48s')}>
          <h3 style={titleStyle}>System Metrics</h3>
          <p style={descStyle}>
            Monthly system requests, errors, and latency overview
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={systemData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: colors.textDim, fontSize: 12 }}
              />
              <YAxis tick={{ fill: colors.textDim, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Bar
                dataKey="requests"
                fill="#67e8f9"
                radius={[4, 4, 0, 0]}
                name="Requests"
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                name="Errors"
              />
              <Area
                type="monotone"
                dataKey="latency"
                fill="#fde68a"
                stroke="#fde68a"
                fillOpacity={0.3}
                name="Latency"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 8. Feature Usage - Treemap */}
        <div style={cardStyle('0.56s')}>
          <h3 style={titleStyle}>Feature Usage</h3>
          <p style={descStyle}>
            Relative usage distribution across platform features
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke={colors.border}
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} index={0} name="" />}
            >
              <Tooltip contentStyle={tooltipContentStyle} />
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* 9. Conversion Funnel - Funnel Chart */}
        <div style={cardStyle('0.64s')}>
          <h3 style={titleStyle}>Conversion Funnel</h3>
          <p style={descStyle}>
            User journey from visit to enterprise conversion
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList
                  position="right"
                  fill={colors.text}
                  stroke="none"
                  dataKey="name"
                  fontSize={12}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* 10. Service Health - Radial Bar Chart */}
        <div style={cardStyle('0.72s')}>
          <h3 style={titleStyle}>Service Health</h3>
          <p style={descStyle}>
            Real-time health metrics across system services
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              innerRadius="15%"
              outerRadius="90%"
              data={radialData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                background={{ fill: colors.bgElevated }}
                dataKey="value"
                label={{
                  position: 'insideStart',
                  fill: colors.text,
                  fontSize: 12,
                }}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ color: colors.text, fontSize: 12 }}
              />
              <Tooltip contentStyle={tooltipContentStyle} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
