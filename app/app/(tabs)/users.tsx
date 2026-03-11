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
import { mockUsers } from '../../lib/mock-data';

type SortField = 'name' | 'sessions' | 'role';
type SortDir = 'asc' | 'desc';

export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('sessions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [refreshing, setRefreshing] = useState(false);

  const filteredUsers = useMemo(() => {
    let users = [...mockUsers];

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      );
    }

    users.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'sessions') cmp = a.sessions - b.sessions;
      else if (sortField === 'role') cmp = a.role.localeCompare(b.role);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return users;
  }, [search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.accent;
      case 'member': return colors.cyan;
      case 'viewer': return colors.textDim;
      default: return colors.textDim;
    }
  };

  const renderUser = ({ item }: { item: typeof mockUsers[0] }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userInitial}>
          {item.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={styles.userMetaItem}>
            <View style={[styles.roleDot, { backgroundColor: roleColor(item.role) }]} />
            <Text style={[styles.userRole, { color: roleColor(item.role) }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          <Text style={styles.userMetaDivider}>·</Text>
          <Text style={styles.userMetaText}>{item.sessions} sessions</Text>
          <Text style={styles.userMetaDivider}>·</Text>
          <Text style={styles.userMetaText}>{item.lastActive}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {(['name', 'sessions', 'role'] as SortField[]).map((field) => (
            <TouchableOpacity
              key={field}
              style={[styles.sortBtn, sortField === field && styles.sortBtnActive]}
              onPress={() => toggleSort(field)}
            >
              <Text style={[styles.sortBtnText, sortField === field && styles.sortBtnTextActive]}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Text>
              {sortField === field && (
                <Ionicons
                  name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={colors.accent}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.resultCount}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortLabel: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnActive: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent + '50',
  },
  sortBtnText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    fontWeight: '500',
  },
  sortBtnTextActive: {
    color: colors.accent,
  },
  resultCount: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  list: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontFamily: fonts.sans,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.sans,
    flex: 1,
  },
  userEmail: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: fonts.sans,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userRole: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  userMetaDivider: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    opacity: 0.4,
  },
  userMetaText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
});
