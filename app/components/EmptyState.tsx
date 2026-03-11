import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts } from '../lib/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textDim} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontFamily: fonts.sans,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    textAlign: 'center',
    maxWidth: 280,
  },
});
