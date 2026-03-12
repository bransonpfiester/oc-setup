import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts, radius } from '../../lib/theme';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { mockSessions } from '../../lib/mock-data';
import type { Session } from '../../lib/types';

type FilterStatus = 'all' | 'active' | 'completed' | 'failed';

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export default function SessionsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let sessions = [...mockSessions];

    if (filter !== 'all') {
      sessions = sessions.filter((s) => s.status === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      sessions = sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.modelId.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return sessions;
  }, [search, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const statusCount = (status: FilterStatus) =>
    status === 'all'
      ? mockSessions.length
      : mockSessions.filter((s) => s.status === status).length;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const modelColor = (modelId: string) => {
    if (modelId.includes('opus')) return colors.accent;
    if (modelId.includes('sonnet')) return colors.cyan;
    if (modelId.includes('haiku')) return colors.green;
    if (modelId.includes('4o-mini')) return colors.yellow;
    if (modelId.includes('4o')) return colors.purple;
    return colors.textDim;
  };

  const renderSession = ({ item }: { item: Session }) => {
    const expanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => setExpandedId(expanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.sessionMeta}>
            <View style={[styles.modelBadge, { backgroundColor: modelColor(item.modelId) + '18', borderColor: modelColor(item.modelId) + '30' }]}>
              <Text style={[styles.modelText, { color: modelColor(item.modelId) }]}>{item.modelId}</Text>
            </View>
            <Text style={styles.sessionTime}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.sessionStats}>
          <SessionStat icon="chatbubble" value={String(item.messageCount)} label="msgs" />
          <SessionStat icon="document-text" value={(item.totalTokens / 1000).toFixed(1) + 'k'} label="tokens" />
          <SessionStat icon="card" value={`$${item.totalCost.toFixed(2)}`} label="cost" />
          <SessionStat icon="time" value={formatDuration(item.duration)} label="duration" />
        </View>

        {expanded && (
          <View style={styles.sessionExpanded}>
            <View style={styles.tagRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.replayBtn}>
              <Ionicons name="play-circle" size={16} color={colors.accent} />
              <Text style={styles.replayText}>Replay Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search sessions..." />
        <View style={styles.filterRow}>
          {(['all', 'active', 'completed', 'failed'] as FilterStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterBtn, filter === status && styles.filterBtnActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <View style={[styles.filterCount, filter === status && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === status && styles.filterCountTextActive]}>
                  {statusCount(status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No sessions found"
            subtitle="Try adjusting your search or filters"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function SessionStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={12} color={colors.textDim} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent + '50',
  },
  filterText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  filterTextActive: {
    color: colors.accent,
  },
  filterCount: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: {
    backgroundColor: colors.accent + '25',
  },
  filterCountText: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  filterCountTextActive: {
    color: colors.accent,
  },
  list: {
    padding: spacing.lg,
  },
  separator: { height: spacing.sm },
  sessionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sessionHeader: {
    gap: spacing.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.sans,
    flex: 1,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  modelText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontFamily: fonts.mono,
  },
  sessionTime: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: fonts.sans,
  },
  sessionExpanded: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.mono,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentGlow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  replayText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
});
