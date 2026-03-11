import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fonts, radius } from '../../lib/theme';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { ListRow } from '../../components/ListRow';
import { mockProviders, mockWebhooks } from '../../lib/mock-data';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Card title="AI Providers" subtitle="Manage your model providers">
        {mockProviders.map((provider, i) => (
          <View key={provider.id} style={[styles.providerRow, i < mockProviders.length - 1 && styles.providerBorder]}>
            <View style={styles.providerLeft}>
              <View style={[styles.providerIcon, { backgroundColor: providerColor(provider.slug) + '18' }]}>
                <Text style={styles.providerEmoji}>{providerEmoji(provider.slug)}</Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerDesc}>{provider.description}</Text>
                <Text style={styles.providerModels}>
                  {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <StatusBadge status={provider.status} />
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => showAlert('Add Provider', 'Provider configuration coming soon')}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.addBtnText}>Add Provider</Text>
        </TouchableOpacity>
      </Card>

      <Card title="Webhooks" subtitle="Event notification endpoints">
        {mockWebhooks.map((webhook, i) => (
          <View key={webhook.id} style={[styles.webhookRow, i < mockWebhooks.length - 1 && styles.providerBorder]}>
            <View style={styles.webhookLeft}>
              <Ionicons name="link" size={16} color={colors.cyan} />
              <View style={styles.webhookInfo}>
                <Text style={styles.webhookDesc} numberOfLines={1}>{webhook.description}</Text>
                <Text style={styles.webhookUrl} numberOfLines={1}>{webhook.url}</Text>
                <View style={styles.webhookEvents}>
                  {webhook.events.slice(0, 2).map((event) => (
                    <View key={event} style={styles.eventTag}>
                      <Text style={styles.eventTagText}>{event}</Text>
                    </View>
                  ))}
                  {webhook.events.length > 2 && (
                    <Text style={styles.moreEvents}>+{webhook.events.length - 2}</Text>
                  )}
                </View>
              </View>
            </View>
            <StatusBadge status={webhook.status} />
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => showAlert('Add Webhook', 'Webhook configuration coming soon')}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.addBtnText}>Add Webhook</Text>
        </TouchableOpacity>
      </Card>

      <Card title="Notifications">
        <SettingToggle
          label="Push Notifications"
          subtitle="Get notified about important events"
          value={notifications}
          onValueChange={setNotifications}
        />
        <SettingToggle
          label="Email Alerts"
          subtitle="Critical errors and health changes"
          value={emailAlerts}
          onValueChange={setEmailAlerts}
        />
        <SettingToggle
          label="Daily Digest"
          subtitle="Summary of daily activity"
          value={dailyDigest}
          onValueChange={setDailyDigest}
        />
      </Card>

      <Card title="Appearance">
        <SettingToggle
          label="Dark Mode"
          subtitle="Use dark theme throughout the app"
          value={darkMode}
          onValueChange={setDarkMode}
        />
      </Card>

      <Card title="Agent Configuration">
        <ListRow
          title="Gateway"
          subtitle="localhost:3000"
          icon="server-outline"
          iconColor={colors.green}
          onPress={() => showAlert('Gateway', 'Gateway configuration')}
        />
        <ListRow
          title="Personality"
          subtitle="SOUL.md, USER.md, HEARTBEAT.md"
          icon="sparkles-outline"
          iconColor={colors.purple}
          onPress={() => showAlert('Personality', 'Edit agent personality files')}
        />
        <ListRow
          title="Channels"
          subtitle="Telegram (active)"
          icon="chatbox-outline"
          iconColor={colors.cyan}
          onPress={() => showAlert('Channels', 'Channel configuration')}
        />
        <ListRow
          title="Auth Profiles"
          subtitle="2 profiles configured"
          icon="key-outline"
          iconColor={colors.orange}
          onPress={() => showAlert('Auth', 'Auth profile management')}
          showChevron
          style={{ borderBottomWidth: 0 }}
        />
      </Card>

      <Card title="About">
        <ListRow
          title="Version"
          subtitle="1.0.0"
          icon="information-circle-outline"
          iconColor={colors.textDim}
          showChevron={false}
        />
        <ListRow
          title="Run Diagnostics"
          subtitle="Check system health"
          icon="medkit-outline"
          iconColor={colors.green}
          onPress={() => showAlert('Doctor', 'Running oc-setup doctor...')}
        />
        <ListRow
          title="Reset Setup"
          subtitle="Re-run the setup wizard"
          icon="refresh-outline"
          iconColor={colors.red}
          onPress={() => showAlert('Reset', 'This will backup and re-run setup. Continue?')}
          style={{ borderBottomWidth: 0 }}
        />
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function SettingToggle({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.bgElevated, true: colors.accent + '60' }}
        thumbColor={value ? colors.accent : colors.textDim}
        ios_backgroundColor={colors.bgElevated}
      />
    </View>
  );
}

function providerColor(slug: string): string {
  switch (slug) {
    case 'anthropic': return colors.accent;
    case 'openai': return colors.green;
    case 'openrouter': return colors.purple;
    case 'google': return colors.blue;
    default: return colors.textDim;
  }
}

function providerEmoji(slug: string): string {
  switch (slug) {
    case 'anthropic': return 'A';
    case 'openai': return 'O';
    case 'openrouter': return 'R';
    case 'google': return 'G';
    default: return '?';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  providerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerEmoji: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.text,
  },
  providerInfo: {
    flex: 1,
    gap: 1,
  },
  providerName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
  providerDesc: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  providerModels: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.mono,
    opacity: 0.7,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    borderStyle: 'dashed',
  },
  addBtnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  webhookRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  webhookLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  webhookInfo: {
    flex: 1,
    gap: 2,
  },
  webhookDesc: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  webhookUrl: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.mono,
  },
  webhookEvents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  eventTag: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  eventTagText: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: fonts.mono,
  },
  moreEvents: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: fonts.mono,
    alignSelf: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  toggleSubtitle: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
  },
  bottomSpacer: { height: spacing.xxxl },
});
