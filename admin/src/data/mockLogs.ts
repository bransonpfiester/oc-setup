export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
}

const templates: { level: LogEntry['level']; service: string; message: string }[] = [
  { level: 'info', service: 'api-gateway', message: 'Request processed successfully in 142ms' },
  { level: 'info', service: 'api-gateway', message: 'Route /api/v2/users registered' },
  { level: 'info', service: 'api-gateway', message: 'Health check passed - all services operational' },
  { level: 'warn', service: 'api-gateway', message: 'Rate limit approaching: 450/500 requests per minute' },
  { level: 'error', service: 'api-gateway', message: 'Upstream timeout after 30000ms on /api/v2/reports' },
  { level: 'debug', service: 'api-gateway', message: 'Request payload size: 2.4KB, Content-Type: application/json' },
  { level: 'info', service: 'auth-service', message: 'User session created for user_8472' },
  { level: 'info', service: 'auth-service', message: 'Token refreshed successfully for client_id=app_prod' },
  { level: 'warn', service: 'auth-service', message: 'Failed login attempt #3 for user admin@openclaw.io' },
  { level: 'error', service: 'auth-service', message: 'JWT signature verification failed - token possibly tampered' },
  { level: 'debug', service: 'auth-service', message: 'RBAC check: user_8472 requesting scope=read:analytics' },
  { level: 'info', service: 'database', message: 'Query executed in 23ms: SELECT users WHERE active=true' },
  { level: 'info', service: 'database', message: 'Connection pool status: 12/50 connections active' },
  { level: 'warn', service: 'database', message: 'Slow query detected: 2340ms on analytics_events table' },
  { level: 'error', service: 'database', message: 'Connection refused: max_connections limit reached (50/50)' },
  { level: 'debug', service: 'database', message: 'Query plan: Index scan on users_email_idx, cost=0.42..8.44' },
  { level: 'info', service: 'cache-layer', message: 'Cache hit for key: user_preferences_8472' },
  { level: 'info', service: 'cache-layer', message: 'Cache invalidated: 24 keys matching pattern user_*' },
  { level: 'warn', service: 'cache-layer', message: 'Cache memory usage at 85% - consider increasing allocation' },
  { level: 'error', service: 'cache-layer', message: 'Redis connection lost - attempting reconnect in 5s' },
  { level: 'debug', service: 'cache-layer', message: 'TTL set for key session_token_8472: 3600s' },
  { level: 'info', service: 'scheduler', message: 'Cron job daily_report_generation completed in 4.2s' },
  { level: 'info', service: 'scheduler', message: 'Scheduled task cleanup_temp_files queued' },
  { level: 'warn', service: 'scheduler', message: 'Job queue depth exceeding threshold: 150 pending tasks' },
  { level: 'error', service: 'scheduler', message: 'Task export_analytics failed after 3 retries' },
  { level: 'debug', service: 'scheduler', message: 'Next run for metrics_aggregation: 2024-03-10T09:00:00Z' },
  { level: 'info', service: 'webhook-handler', message: 'Webhook delivered to https://hooks.slack.com (200 OK)' },
  { level: 'info', service: 'webhook-handler', message: 'Event user.created dispatched to 3 subscribers' },
  { level: 'warn', service: 'webhook-handler', message: 'Webhook retry #2 for endpoint https://api.partner.com/hook' },
  { level: 'error', service: 'webhook-handler', message: 'Webhook delivery failed: connection reset by peer' },
  { level: 'debug', service: 'webhook-handler', message: 'Payload signature generated using HMAC-SHA256' },
  { level: 'info', service: 'notification-svc', message: 'Email sent to admin@openclaw.io: Weekly Report' },
  { level: 'info', service: 'notification-svc', message: 'Push notification delivered to 1,284 devices' },
  { level: 'warn', service: 'notification-svc', message: 'Email bounce detected for user_3891@example.com' },
  { level: 'error', service: 'notification-svc', message: 'SMTP connection failed: smtp.provider.com:587' },
  { level: 'debug', service: 'notification-svc', message: 'Template rendered: deployment_success (locale=en-US)' },
  { level: 'info', service: 'file-storage', message: 'File uploaded: report_2024_q1.pdf (2.4MB)' },
  { level: 'info', service: 'file-storage', message: 'CDN cache purged for /assets/v2/*' },
  { level: 'warn', service: 'file-storage', message: 'Storage utilization at 78% - 220GB of 280GB used' },
  { level: 'error', service: 'file-storage', message: 'Upload failed: file exceeds maximum 50MB limit' },
  { level: 'debug', service: 'file-storage', message: 'Presigned URL generated: bucket=uploads, expires=900s' },
  { level: 'info', service: 'analytics-engine', message: 'Daily aggregation complete: 2.4M events processed' },
  { level: 'info', service: 'analytics-engine', message: 'Real-time dashboard data refreshed successfully' },
  { level: 'warn', service: 'analytics-engine', message: 'Event ingestion lag detected: 45s behind real-time' },
  { level: 'error', service: 'analytics-engine', message: 'Aggregation pipeline failed at stage: user_segmentation' },
  { level: 'debug', service: 'analytics-engine', message: 'Batch processing: 10,000 events queued in buffer' },
  { level: 'info', service: 'search-indexer', message: 'Index rebuild completed: 48,294 documents in 12.3s' },
  { level: 'info', service: 'search-indexer', message: 'Search query processed in 8ms: "deploy config"' },
  { level: 'warn', service: 'search-indexer', message: 'Index fragmentation at 35% - reindex recommended' },
  { level: 'error', service: 'search-indexer', message: 'Elasticsearch cluster health: RED - 2 nodes unreachable' },
  { level: 'debug', service: 'search-indexer', message: 'Mapping updated for index: logs-2024.03.10' },
];

function generateLogs(count: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const baseTime = new Date('2024-03-10T08:00:00.000Z').getTime();
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    logs.push({
      id: i + 1,
      timestamp: new Date(baseTime + i * 1200).toISOString(),
      level: template.level,
      service: template.service,
      message: template.message,
    });
  }
  return logs;
}

export const mockLogs: LogEntry[] = generateLogs(500);
