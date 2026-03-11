import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts, radius, chartColors } from '../../lib/theme';
import { Card } from '../../components/Card';
import { composedData, browserData, revenueData } from '../../lib/mock-data';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 4;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const maxRequests = Math.max(...composedData.map((d) => d.requests));
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
  const totalProviderUsage = browserData.reduce((s, d) => s + d.value, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.timeRangeRow}>
        {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.timeBtn, timeRange === range && styles.timeBtnActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeBtnText, timeRange === range && styles.timeBtnTextActive]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Total Requests" value="274,600" change={18.7} icon="flash" color={colors.cyan} />
        <SummaryCard label="Avg Latency" value="112ms" change={-8.4} icon="speedometer" color={colors.green} />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard label="Error Rate" value="0.91%" change={-5.2} icon="alert-circle" color={colors.yellow} />
        <SummaryCard label="Total Cost" value="$2,480" change={14.2} icon="card" color={colors.purple} />
      </View>

      <Card title="Requests Over Time" subtitle="Monthly request volume">
        <View style={styles.chart}>
          {composedData.map((item, i) => (
            <View key={item.name} style={styles.barGroup}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (item.requests / maxRequests) * 140,
                    backgroundColor: colors.cyan,
                    opacity: 0.8,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.name.slice(0, 3)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card title="Revenue vs Expenses" subtitle="Monthly breakdown">
        <View style={styles.chart}>
          {revenueData.map((item) => (
            <View key={item.month} style={styles.barGroup}>
              <View style={styles.stackedBar}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (item.expenses / maxRevenue) * 120,
                      backgroundColor: colors.accent,
                      opacity: 0.5,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: ((item.revenue - item.expenses) / maxRevenue) * 120,
                      backgroundColor: colors.green,
                      opacity: 0.8,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          <LegendItem color={colors.green} label="Profit" />
          <LegendItem color={colors.accent + '80'} label="Expenses" />
        </View>
      </Card>

      <Card title="Usage by Provider" subtitle="Request distribution">
        {browserData.map((item, i) => {
          const pct = (item.value / totalProviderUsage) * 100;
          return (
            <View key={item.name} style={styles.providerRow}>
              <View style={[styles.providerDot, { backgroundColor: chartColors[i] }]} />
              <Text style={styles.providerName}>{item.name}</Text>
              <View style={styles.providerBarBg}>
                <View
                  style={[
                    styles.providerBarFill,
                    { width: `${pct}%`, backgroundColor: chartColors[i] },
                  ]}
                />
              </View>
              <Text style={styles.providerValue}>{pct.toFixed(1)}%</Text>
            </View>
          );
        })}
      </Card>

      <Card title="Token Usage Breakdown" subtitle="By model category">
        <View style={styles.tokenGrid}>
          <TokenStat label="Chat" value="1.8M" pct={75} color={colors.accent} />
          <TokenStat label="Completion" value="420K" pct={17.5} color={colors.cyan} />
          <TokenStat label="Embedding" value="150K" pct={6.25} color={colors.yellow} />
          <TokenStat label="Other" value="30K" pct={1.25} color={colors.purple} />
        </View>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  change,
  icon,
  color,
}: {
  label: string;
  value: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const isPositive = change > 0;
  const trendColor = label.includes('Error') || label.includes('Latency')
    ? (isPositive ? colors.red : colors.green)
    : (isPositive ? colors.green : colors.red);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={styles.summaryTrend}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={trendColor}
          />
          <Text style={[styles.summaryChange, { color: trendColor }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function TokenStat({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <View style={styles.tokenStat}>
      <View style={styles.tokenStatHeader}>
        <Text style={styles.tokenStatLabel}>{label}</Text>
        <Text style={[styles.tokenStatValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.tokenBarBg}>
        <View style={[styles.tokenBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.tokenPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  timeRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  timeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBtnActive: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent + '50',
  },
  timeBtnText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  timeBtnTextActive: {
    color: colors.accent,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryChange: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  summaryLabel: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: spacing.md,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  stackedBar: {
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: fonts.mono,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    width: 90,
  },
  providerBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  providerBarFill: {
    height: '100%',
    borderRadius: radius.full,
    opacity: 0.8,
  },
  providerValue: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.mono,
    width: 44,
    textAlign: 'right',
  },
  tokenGrid: {
    gap: spacing.lg,
  },
  tokenStat: {
    gap: spacing.xs,
  },
  tokenStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenStatLabel: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
  },
  tokenStatValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  tokenBarBg: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  tokenBarFill: {
    height: '100%',
    borderRadius: radius.full,
    opacity: 0.7,
  },
  tokenPct: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.mono,
  },
  bottomSpacer: { height: spacing.xxxl },
});
