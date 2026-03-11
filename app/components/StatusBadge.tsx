import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fonts } from '../lib/theme';

type Status = 'active' | 'healthy' | 'completed' | 'up' | 'available' |
  'degraded' | 'warning' | 'paused' | 'preview' |
  'down' | 'failed' | 'unhealthy' | 'error' | 'disabled' |
  'expired' | 'maintenance';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (['active', 'healthy', 'completed', 'up', 'available'].includes(s)) return colors.green;
  if (['degraded', 'warning', 'paused', 'preview'].includes(s)) return colors.yellow;
  if (['down', 'failed', 'unhealthy', 'error', 'disabled'].includes(s)) return colors.red;
  if (['expired', 'maintenance'].includes(s)) return colors.textDim;
  return colors.textDim;
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { borderColor: color + '40' , backgroundColor: color + '15' }]}>
      <View style={[styles.dot, { backgroundColor: color }, isSmall && styles.dotSmall]} />
      <Text style={[styles.label, { color }, isSmall && styles.labelSmall]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSmall: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  labelSmall: {
    fontSize: fontSize.xs,
  },
});
