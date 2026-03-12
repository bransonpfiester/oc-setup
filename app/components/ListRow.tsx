import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, fonts } from '../lib/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export function ListRow({ title, subtitle, right, icon, iconColor, onPress, showChevron = true, style }: ListRowProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.row, style]}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.accent) + '18' }]}>
          <Ionicons name={icon} size={18} color={iconColor || colors.accent} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
  },
  right: {
    marginLeft: spacing.sm,
  },
});
