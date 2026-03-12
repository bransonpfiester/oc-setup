import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts, radius } from '../../lib/theme';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { overviewStats, performanceData } from '../../lib/mock-data';

const ACCENT_CYCLE = [colors.accent, colors.cyan, colors.green, colors.purple, colors.blue, colors.teal];

export default function OverviewScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const agentStatus = 'healthy' as const;
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 768;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.heroSection}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroEmoji}>🦀</Text>
          <View>
            <Text style={styles.heroTitle}>OpenClaw Agent</Text>
            <Text style={styles.heroSubtitle}>Your AI agent is running smoothly</Text>
          </View>
        </View>
        <StatusBadge status={agentStatus} size="md" />
      </View>

      <View style={styles.quickActions}>
        <QuickAction icon="pulse" label="Health" color={colors.green} />
        <QuickAction icon="terminal" label="Commands" color={colors.cyan} />
        <QuickAction icon="globe-outline" label="Gateway" color={colors.purple} />
        <QuickAction icon="key-outline" label="API Keys" color={colors.orange} />
      </View>

      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <ScrollView
        horizontal={!isWide}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isWide ? styles.statsGrid : styles.statsRow}
      >
        {overviewStats.map((stat, i) => (
          <View key={stat.id} style={isWide ? styles.statGridItem : styles.statItem}>
            <StatCard
              label={stat.label}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              sparkline={stat.sparkline}
              accent={ACCENT_CYCLE[i % ACCENT_CYCLE.length]}
            />
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>System Performance</Text>
      <Card>
        {performanceData.map((item, i) => (
          <View key={item.metric} style={[styles.perfRow, i === 0 && { marginTop: 0 }]}>
            <Text style={styles.perfLabel}>{item.metric}</Text>
            <View style={styles.perfBarBg}>
              <View
                style={[
                  styles.perfBarFill,
                  {
                    width: `${item.current}%`,
                    backgroundColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
                  },
                ]}
              />
              <View
                style={[
                  styles.perfBarPrev,
                  { left: `${item.previous}%` },
                ]}
              />
            </View>
            <Text style={styles.perfValue}>{item.current}%</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Card>
        <ActivityRow
          icon="checkmark-circle"
          iconColor={colors.green}
          title="Session completed"
          subtitle="Code review assistance - 24 messages"
          time="2 min ago"
        />
        <ActivityRow
          icon="flash"
          iconColor={colors.cyan}
          title="API key validated"
          subtitle="Anthropic provider key refreshed"
          time="15 min ago"
        />
        <ActivityRow
          icon="git-commit"
          iconColor={colors.purple}
          title="Config updated"
          subtitle="Temperature adjusted to 0.7"
          time="1 hr ago"
        />
        <ActivityRow
          icon="alert-circle"
          iconColor={colors.yellow}
          title="Rate limit warning"
          subtitle="OpenAI approaching 80% quota"
          time="3 hrs ago"
        />
        <ActivityRow
          icon="cloud-done"
          iconColor={colors.green}
          title="Gateway restarted"
          subtitle="Automatic restart after update"
          time="6 hrs ago"
          isLast
        />
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function QuickAction({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={[styles.quickAction, { borderColor: color + '30' }]}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityRow({
  icon,
  iconColor,
  title,
  subtitle,
  time,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.activityRow, !isLast && styles.activityBorder]}>
      <View style={[styles.activityIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  heroSubtitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontFamily: fonts.sans,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  statsRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statItem: {
    width: 180,
  },
  statGridItem: {
    width: '31%',
    minWidth: 160,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  perfLabel: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
    width: 80,
  },
  perfBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    position: 'relative',
    overflow: 'hidden',
  },
  perfBarFill: {
    height: '100%',
    borderRadius: radius.full,
    opacity: 0.8,
  },
  perfBarPrev: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: colors.textDim,
    opacity: 0.4,
  },
  perfValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontFamily: fonts.mono,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  activitySubtitle: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    marginTop: 1,
  },
  activityTime: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
