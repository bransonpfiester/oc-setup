import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, fonts } from '../lib/theme';

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  sparkline?: number[];
  accent?: string;
}

function MiniSparkline({ data, color, width = 60, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  return (
    <View style={{ width, height, position: 'relative' }}>
      {data.map((val, i) => {
        if (i === 0) return null;
        const y1 = height - ((data[i - 1] - min) / range) * height;
        const y2 = height - ((val - min) / range) * height;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (i - 1) * stepX,
              top: Math.min(y1, y2),
              width: stepX + 1,
              height: Math.max(Math.abs(y2 - y1), 2),
              backgroundColor: color + '60',
              borderRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
}

export function StatCard({ label, value, change, trend, sparkline, accent }: StatCardProps) {
  const trendColor = trend === 'up'
    ? (change > 0 ? colors.green : colors.red)
    : (change < 0 ? colors.green : colors.red);
  const trendIcon = trend === 'up' ? 'trending-up' : 'trending-down';
  const accentColor = accent || colors.accent;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {sparkline && <MiniSparkline data={sparkline} color={accentColor} />}
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <View style={styles.trendRow}>
        <Ionicons name={trendIcon} size={14} color={trendColor} />
        <Text style={[styles.change, { color: trendColor }]}>
          {Math.abs(change)}%
        </Text>
        <Text style={styles.period}>vs last period</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minWidth: 160,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    fontFamily: fonts.mono,
    marginBottom: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  period: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
});
