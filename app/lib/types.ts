export interface StatCard {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  sparkline: number[];
}

export interface Session {
  id: string;
  userId: string;
  providerId: string;
  modelId: string;
  status: 'active' | 'completed' | 'failed' | 'expired';
  title: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  duration: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'degraded' | 'down' | 'maintenance';
  models: string[];
}

export interface Model {
  id: string;
  providerId: string;
  name: string;
  displayName: string;
  type: string;
  contextWindow: number;
  status: 'available' | 'deprecated' | 'preview' | 'disabled';
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'failed' | 'disabled';
  description: string;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'admin' | 'member' | 'viewer';
  organization: string | null;
}

export type TrendDirection = 'up' | 'down' | 'stable';
