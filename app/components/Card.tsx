import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize, fonts } from '../lib/theme';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, style, noPadding }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={noPadding ? undefined : styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
});
