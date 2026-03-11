export interface CommitFile {
  name: string;
  additions: number;
  deletions: number;
  status: 'modified' | 'added' | 'deleted';
}

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  files: CommitFile[];
  diff: string;
}

export const branches = ['main', 'develop', 'feature/auth', 'feature/api-v2', 'hotfix/session-fix'];

export const mockCommits: Commit[] = [
  {
    hash: 'a3f8c1d2e4b6a9f0c3d5e7f1a2b4c6d8e0f2a4b6',
    shortHash: 'a3f8c1d2',
    message: 'feat: add JWT refresh token rotation',
    author: 'Sarah Chen',
    date: '2025-03-10T09:15:00Z',
    branch: 'feature/auth',
    files: [
      { name: 'src/auth/jwt.ts', additions: 48, deletions: 12, status: 'modified' },
      { name: 'src/auth/refresh.ts', additions: 95, deletions: 0, status: 'added' },
      { name: 'src/middleware/auth.ts', additions: 15, deletions: 8, status: 'modified' },
    ],
    diff: `--- a/src/auth/jwt.ts
+++ b/src/auth/jwt.ts
@@ -14,12 +14,28 @@ import { SignOptions, verify, sign } from 'jsonwebtoken';
 
 export class JwtService {
   private readonly secret: string;
+  private readonly refreshSecret: string;
+  private readonly rotationInterval: number;
 
-  constructor(secret: string) {
+  constructor(secret: string, refreshSecret: string) {
     this.secret = secret;
+    this.refreshSecret = refreshSecret;
+    this.rotationInterval = 7 * 24 * 60 * 60 * 1000;
   }
 
-  generateToken(payload: TokenPayload): string {
+  generateAccessToken(payload: TokenPayload): string {
     return sign(payload, this.secret, { expiresIn: '15m' });
   }
+
+  generateRefreshToken(payload: TokenPayload): string {
+    return sign(payload, this.refreshSecret, { expiresIn: '7d' });
+  }
+
+  async rotateRefreshToken(oldToken: string): Promise<TokenPair> {
+    const decoded = verify(oldToken, this.refreshSecret) as TokenPayload;
+    await this.blacklistToken(oldToken);
+    const accessToken = this.generateAccessToken(decoded);
+    const refreshToken = this.generateRefreshToken(decoded);
+    return { accessToken, refreshToken };
+  }
 }`,
  },
  {
    hash: 'b7e2d4f6a8c0e2d4f6a8b0c2d4e6f8a0b2c4d6e8',
    shortHash: 'b7e2d4f6',
    message: 'fix: resolve race condition in session store',
    author: 'Marcus Johnson',
    date: '2025-03-10T08:42:00Z',
    branch: 'hotfix/session-fix',
    files: [
      { name: 'src/session/store.ts', additions: 22, deletions: 14, status: 'modified' },
      { name: 'src/session/lock.ts', additions: 67, deletions: 0, status: 'added' },
    ],
    diff: `--- a/src/session/store.ts
+++ b/src/session/store.ts
@@ -8,14 +8,22 @@ import { RedisClient } from '../redis';
 
 export class SessionStore {
   private redis: RedisClient;
+  private locks: Map<string, Promise<void>>;
 
   constructor(redis: RedisClient) {
     this.redis = redis;
+    this.locks = new Map();
   }
 
-  async set(sessionId: string, data: SessionData): Promise<void> {
-    const serialized = JSON.stringify(data);
-    await this.redis.set(\`session:\${sessionId}\`, serialized, 'EX', 3600);
+  async set(sessionId: string, data: SessionData): Promise<void> {
+    const lockKey = \`lock:session:\${sessionId}\`;
+    await this.acquireLock(lockKey);
+    try {
+      const serialized = JSON.stringify(data);
+      await this.redis.set(\`session:\${sessionId}\`, serialized, 'EX', 3600);
+    } finally {
+      await this.releaseLock(lockKey);
+    }
   }
 }`,
  },
  {
    hash: 'c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7',
    shortHash: 'c9d1e3f5',
    message: 'feat: implement rate limiting middleware',
    author: 'Aisha Patel',
    date: '2025-03-09T17:30:00Z',
    branch: 'feature/api-v2',
    files: [
      { name: 'src/middleware/rate-limit.ts', additions: 112, deletions: 0, status: 'added' },
      { name: 'src/middleware/index.ts', additions: 3, deletions: 1, status: 'modified' },
      { name: 'src/config/limits.ts', additions: 28, deletions: 0, status: 'added' },
      { name: 'tests/middleware/rate-limit.test.ts', additions: 85, deletions: 0, status: 'added' },
    ],
    diff: `--- /dev/null
+++ b/src/middleware/rate-limit.ts
@@ -0,0 +1,42 @@
+import { Request, Response, NextFunction } from 'express';
+import { RateLimiterRedis } from 'rate-limiter-flexible';
+import { redis } from '../redis';
+import { RateLimitConfig } from '../config/limits';
+
+export function createRateLimiter(config: RateLimitConfig) {
+  const limiter = new RateLimiterRedis({
+    storeClient: redis,
+    keyPrefix: config.keyPrefix,
+    points: config.maxRequests,
+    duration: config.windowSeconds,
+    blockDuration: config.blockDurationSeconds,
+  });
+
+  return async (req: Request, res: Response, next: NextFunction) => {
+    const key = config.keyExtractor(req);
+    try {
+      const result = await limiter.consume(key);
+      res.set('X-RateLimit-Remaining', String(result.remainingPoints));
+      res.set('X-RateLimit-Reset', String(result.msBeforeNext));
+      next();
+    } catch (rejRes) {
+      res.status(429).json({
+        error: 'Too many requests',
+        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
+      });
+    }
+  };
+}
--- a/src/middleware/index.ts
+++ b/src/middleware/index.ts
@@ -1,3 +1,5 @@
 export { authMiddleware } from './auth';
 export { corsMiddleware } from './cors';
-export { loggerMiddleware } from './logger';
+export { loggerMiddleware } from './logger';
+export { createRateLimiter } from './rate-limit';
+export { validateRequest } from './validation';`,
  },
  {
    hash: 'd2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0',
    shortHash: 'd2e4f6a8',
    message: 'refactor: extract database connection pool logic',
    author: 'David Kim',
    date: '2025-03-09T15:20:00Z',
    branch: 'develop',
    files: [
      { name: 'src/db/pool.ts', additions: 74, deletions: 0, status: 'added' },
      { name: 'src/db/connection.ts', additions: 8, deletions: 56, status: 'modified' },
      { name: 'src/db/index.ts', additions: 5, deletions: 2, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/src/db/pool.ts
@@ -0,0 +1,34 @@
+import { Pool, PoolConfig } from 'pg';
+import { logger } from '../logger';
+
+export class ConnectionPool {
+  private pool: Pool;
+  private healthCheckInterval: NodeJS.Timer | null = null;
+
+  constructor(config: PoolConfig) {
+    this.pool = new Pool({
+      ...config,
+      max: config.max || 20,
+      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
+      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
+    });
+
+    this.pool.on('error', (err) => {
+      logger.error('Unexpected pool error', { error: err.message });
+    });
+  }
+
+  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
+    const client = await this.pool.connect();
+    try {
+      const result = await client.query(sql, params);
+      return result.rows as T[];
+    } finally {
+      client.release();
+    }
+  }
+
+  async shutdown(): Promise<void> {
+    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
+    await this.pool.end();
+  }
+}`,
  },
  {
    hash: 'e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3',
    shortHash: 'e5f7a9b1',
    message: 'feat: add OpenAPI spec generation from routes',
    author: 'Elena Rodriguez',
    date: '2025-03-09T14:05:00Z',
    branch: 'feature/api-v2',
    files: [
      { name: 'src/docs/openapi.ts', additions: 138, deletions: 0, status: 'added' },
      { name: 'src/docs/schemas.ts', additions: 65, deletions: 0, status: 'added' },
      { name: 'src/routes/index.ts', additions: 12, deletions: 3, status: 'modified' },
      { name: 'package.json', additions: 2, deletions: 0, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/src/docs/openapi.ts
@@ -0,0 +1,38 @@
+import { OpenAPIV3 } from 'openapi-types';
+import { RouteDefinition } from '../routes/types';
+
+export function generateSpec(routes: RouteDefinition[]): OpenAPIV3.Document {
+  const paths: OpenAPIV3.PathsObject = {};
+
+  for (const route of routes) {
+    const pathItem: OpenAPIV3.PathItemObject = {};
+    const operation: OpenAPIV3.OperationObject = {
+      summary: route.summary,
+      tags: route.tags,
+      parameters: route.params?.map(p => ({
+        name: p.name,
+        in: p.location,
+        required: p.required,
+        schema: { type: p.type as OpenAPIV3.NonArraySchemaObjectType },
+      })),
+      responses: {
+        '200': {
+          description: 'Success',
+          content: {
+            'application/json': {
+              schema: { \$ref: \`#/components/schemas/\${route.responseSchema}\` },
+            },
+          },
+        },
+      },
+    };
+    pathItem[route.method] = operation;
+    paths[route.path] = pathItem;
+  }
+
+  return {
+    openapi: '3.0.3',
+    info: { title: 'OpenClaw API', version: '2.0.0' },
+    paths,
+  };
+}`,
  },
  {
    hash: 'f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9',
    shortHash: 'f1a3b5c7',
    message: 'fix: prevent XSS in user-generated content renderer',
    author: 'James O\'Brien',
    date: '2025-03-09T12:30:00Z',
    branch: 'main',
    files: [
      { name: 'src/utils/sanitize.ts', additions: 34, deletions: 5, status: 'modified' },
      { name: 'tests/utils/sanitize.test.ts', additions: 62, deletions: 8, status: 'modified' },
    ],
    diff: `--- a/src/utils/sanitize.ts
+++ b/src/utils/sanitize.ts
@@ -2,11 +2,30 @@ import DOMPurify from 'dompurify';
 
 const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'];
 const ALLOWED_ATTRS = ['href', 'target', 'rel'];
+const URL_PROTOCOLS = ['http:', 'https:', 'mailto:'];
 
-export function sanitizeHtml(input: string): string {
-  return DOMPurify.sanitize(input, {
-    ALLOWED_TAGS,
-    ALLOWED_ATTR: ALLOWED_ATTRS,
+export function sanitizeHtml(input: string): string {
+  const clean = DOMPurify.sanitize(input, {
+    ALLOWED_TAGS,
+    ALLOWED_ATTR: ALLOWED_ATTRS,
+    ALLOW_DATA_ATTR: false,
+    ADD_ATTR: ['rel'],
   });
+
+  const div = document.createElement('div');
+  div.innerHTML = clean;
+
+  div.querySelectorAll('a').forEach((anchor) => {
+    const href = anchor.getAttribute('href') || '';
+    try {
+      const url = new URL(href, window.location.origin);
+      if (!URL_PROTOCOLS.includes(url.protocol)) {
+        anchor.removeAttribute('href');
+      }
+    } catch {
+      anchor.removeAttribute('href');
+    }
+    anchor.setAttribute('rel', 'noopener noreferrer');
+  });
+
+  return div.innerHTML;
 }`,
  },
  {
    hash: 'a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0',
    shortHash: 'a2b4c6d8',
    message: 'chore: upgrade dependencies and fix audit warnings',
    author: 'Yuki Tanaka',
    date: '2025-03-09T10:15:00Z',
    branch: 'develop',
    files: [
      { name: 'package.json', additions: 14, deletions: 14, status: 'modified' },
      { name: 'package-lock.json', additions: 842, deletions: 780, status: 'modified' },
    ],
    diff: `--- a/package.json
+++ b/package.json
@@ -12,14 +12,14 @@
   "dependencies": {
-    "express": "^4.18.2",
-    "jsonwebtoken": "^9.0.1",
-    "pg": "^8.11.3",
-    "redis": "^4.6.8",
-    "zod": "^3.22.2",
-    "helmet": "^7.0.0",
-    "cors": "^2.8.5"
+    "express": "^4.21.1",
+    "jsonwebtoken": "^9.0.2",
+    "pg": "^8.13.1",
+    "redis": "^4.7.0",
+    "zod": "^3.24.1",
+    "helmet": "^8.0.0",
+    "cors": "^2.8.5"
   },
   "devDependencies": {
-    "typescript": "^5.2.2",
-    "@types/express": "^4.17.17",
-    "@types/node": "^20.5.0",
-    "vitest": "^0.34.6",
-    "eslint": "^8.47.0"
+    "typescript": "^5.7.2",
+    "@types/express": "^5.0.0",
+    "@types/node": "^22.10.2",
+    "vitest": "^2.1.8",
+    "eslint": "^9.16.0"
   }`,
  },
  {
    hash: 'b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7',
    shortHash: 'b9c1d3e5',
    message: 'feat: add webhook delivery with retry logic',
    author: 'Fatima Al-Hassan',
    date: '2025-03-09T07:45:00Z',
    branch: 'feature/api-v2',
    files: [
      { name: 'src/webhooks/delivery.ts', additions: 98, deletions: 0, status: 'added' },
      { name: 'src/webhooks/queue.ts', additions: 54, deletions: 0, status: 'added' },
      { name: 'src/webhooks/types.ts', additions: 22, deletions: 0, status: 'added' },
    ],
    diff: `--- /dev/null
+++ b/src/webhooks/delivery.ts
@@ -0,0 +1,45 @@
+import { createHmac } from 'crypto';
+import { WebhookEvent, DeliveryResult } from './types';
+import { logger } from '../logger';
+
+const MAX_RETRIES = 5;
+const BACKOFF_BASE = 1000;
+
+export async function deliverWebhook(
+  url: string,
+  event: WebhookEvent,
+  secret: string
+): Promise<DeliveryResult> {
+  const payload = JSON.stringify(event);
+  const signature = createHmac('sha256', secret)
+    .update(payload)
+    .digest('hex');
+
+  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
+    try {
+      const response = await fetch(url, {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json',
+          'X-Webhook-Signature': \`sha256=\${signature}\`,
+          'X-Webhook-Id': event.id,
+        },
+        body: payload,
+        signal: AbortSignal.timeout(10000),
+      });
+
+      if (response.ok) {
+        return { success: true, attempts: attempt + 1 };
+      }
+
+      if (response.status < 500) {
+        return { success: false, attempts: attempt + 1, error: response.statusText };
+      }
+    } catch (err) {
+      logger.warn('Webhook delivery failed', { attempt, error: err });
+    }
+
+    if (attempt < MAX_RETRIES) {
+      const delay = BACKOFF_BASE * Math.pow(2, attempt);
+      await new Promise(r => setTimeout(r, delay));
+    }
+  }
+
+  return { success: false, attempts: MAX_RETRIES + 1, error: 'Max retries exceeded' };
+}`,
  },
  {
    hash: 'c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2',
    shortHash: 'c4d6e8f0',
    message: 'test: add integration tests for user API endpoints',
    author: 'Lucas Martin',
    date: '2025-03-08T22:10:00Z',
    branch: 'develop',
    files: [
      { name: 'tests/integration/users.test.ts', additions: 142, deletions: 0, status: 'added' },
      { name: 'tests/fixtures/users.json', additions: 35, deletions: 0, status: 'added' },
      { name: 'tests/setup.ts', additions: 8, deletions: 2, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/tests/integration/users.test.ts
@@ -0,0 +1,48 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { createApp } from '../../src/app';
+import { setupTestDb, teardownTestDb } from '../setup';
+
+describe('User API', () => {
+  let app: Express.Application;
+
+  beforeAll(async () => {
+    await setupTestDb();
+    app = createApp({ testing: true });
+  });
+
+  afterAll(async () => {
+    await teardownTestDb();
+  });
+
+  describe('GET /api/users', () => {
+    it('returns paginated user list', async () => {
+      const res = await request(app).get('/api/users?page=1&limit=10');
+      expect(res.status).toBe(200);
+      expect(res.body.data).toHaveLength(10);
+      expect(res.body.meta.total).toBeGreaterThan(0);
+    });
+
+    it('filters users by status', async () => {
+      const res = await request(app).get('/api/users?status=active');
+      expect(res.status).toBe(200);
+      res.body.data.forEach((user: any) => {
+        expect(user.status).toBe('active');
+      });
+    });
+  });
+
+  describe('POST /api/users', () => {
+    it('creates a new user with valid data', async () => {
+      const res = await request(app)
+        .post('/api/users')
+        .send({ name: 'Test User', email: 'test@example.com', role: 'viewer' });
+      expect(res.status).toBe(201);
+      expect(res.body.id).toBeDefined();
+    });
+
+    it('rejects invalid email format', async () => {
+      const res = await request(app)
+        .post('/api/users')
+        .send({ name: 'Bad Email', email: 'not-an-email', role: 'viewer' });
+      expect(res.status).toBe(400);
+    });
+  });
+});`,
  },
  {
    hash: 'd8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6',
    shortHash: 'd8e0f2a4',
    message: 'feat: implement RBAC permission checking',
    author: 'Priya Sharma',
    date: '2025-03-08T18:50:00Z',
    branch: 'feature/auth',
    files: [
      { name: 'src/auth/rbac.ts', additions: 86, deletions: 0, status: 'added' },
      { name: 'src/auth/permissions.ts', additions: 42, deletions: 0, status: 'added' },
      { name: 'src/middleware/authorize.ts', additions: 38, deletions: 0, status: 'added' },
      { name: 'src/types/auth.ts', additions: 18, deletions: 4, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/src/auth/rbac.ts
@@ -0,0 +1,36 @@
+import { Role, Permission, ResourceAction } from '../types/auth';
+
+const rolePermissions: Record<Role, Permission[]> = {
+  admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'manage_settings'],
+  editor: ['read', 'write', 'view_analytics'],
+  viewer: ['read'],
+};
+
+export class RBACService {
+  hasPermission(role: Role, permission: Permission): boolean {
+    const permissions = rolePermissions[role];
+    return permissions?.includes(permission) ?? false;
+  }
+
+  canAccess(role: Role, resource: string, action: ResourceAction): boolean {
+    const permissionMap: Record<ResourceAction, Permission> = {
+      read: 'read',
+      create: 'write',
+      update: 'write',
+      delete: 'delete',
+    };
+    return this.hasPermission(role, permissionMap[action]);
+  }
+
+  getEffectivePermissions(role: Role): Permission[] {
+    return [...(rolePermissions[role] || [])];
+  }
+}
--- a/src/types/auth.ts
+++ b/src/types/auth.ts
@@ -4,8 +4,12 @@
 export type Role = 'admin' | 'editor' | 'viewer';
 
-export type Permission = 'read' | 'write' | 'delete';
+export type Permission =
+  | 'read'
+  | 'write'
+  | 'delete'
+  | 'manage_users'
+  | 'view_analytics'
+  | 'manage_settings';
 
-export interface AuthUser {
+export type ResourceAction = 'read' | 'create' | 'update' | 'delete';`,
  },
  {
    hash: 'e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9',
    shortHash: 'e1f3a5b7',
    message: 'perf: optimize database queries with connection pooling',
    author: 'Noah Williams',
    date: '2025-03-08T16:30:00Z',
    branch: 'develop',
    files: [
      { name: 'src/db/queries.ts', additions: 24, deletions: 38, status: 'modified' },
      { name: 'src/db/pool-config.ts', additions: 18, deletions: 0, status: 'added' },
    ],
    diff: `--- a/src/db/queries.ts
+++ b/src/db/queries.ts
@@ -1,22 +1,18 @@
-import { Client } from 'pg';
-import { dbConfig } from '../config';
+import { pool } from './pool';
 
-export async function getUsers(filters: UserFilters): Promise<User[]> {
-  const client = new Client(dbConfig);
-  await client.connect();
-  try {
-    const result = await client.query(
-      'SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC',
-      [filters.status]
-    );
-    return result.rows;
-  } finally {
-    await client.end();
-  }
+export async function getUsers(filters: UserFilters): Promise<User[]> {
+  return pool.query<User>(
+    'SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC',
+    [filters.status]
+  );
 }
 
-export async function getUserById(id: string): Promise<User | null> {
-  const client = new Client(dbConfig);
-  await client.connect();
-  try {
-    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
-    return result.rows[0] || null;
-  } finally {
-    await client.end();
-  }
+export async function getUserById(id: string): Promise<User | null> {
+  const rows = await pool.query<User>(
+    'SELECT * FROM users WHERE id = $1',
+    [id]
+  );
+  return rows[0] || null;
 }`,
  },
  {
    hash: 'f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2',
    shortHash: 'f4a6b8c0',
    message: 'docs: add API versioning migration guide',
    author: 'Sofia Costa',
    date: '2025-03-08T14:15:00Z',
    branch: 'feature/api-v2',
    files: [
      { name: 'docs/migration-v2.md', additions: 156, deletions: 0, status: 'added' },
      { name: 'docs/README.md', additions: 5, deletions: 1, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/docs/migration-v2.md
@@ -0,0 +1,28 @@
+# API v2 Migration Guide
+
+## Breaking Changes
+
+### Authentication
+- Bearer tokens now use JWT with RS256 signing
+- Refresh tokens are required for sessions > 15 minutes
+- API keys must be rotated to v2 format
+
+### Endpoints
+- \`GET /api/users\` now requires pagination parameters
+- \`POST /api/users\` response shape changed
+- \`DELETE /api/users/:id\` returns 204 instead of 200
+
+### Rate Limiting
+- Default rate limit reduced to 100 req/min
+- Rate limit headers now use standard format
+- IP-based limiting replaced with token-based
+
+## Migration Steps
+
+1. Update authentication tokens
+2. Update client SDK to v2.x
+3. Adjust pagination handling
+4. Update error handling for new error format
+5. Test webhook endpoints with new signatures
+
+## Timeline
+- v1 sunset date: 2025-06-01`,
  },
  {
    hash: 'a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5',
    shortHash: 'a7b9c1d3',
    message: 'fix: handle edge case in pagination cursor decoding',
    author: 'Viktor Petrov',
    date: '2025-03-08T11:45:00Z',
    branch: 'main',
    files: [
      { name: 'src/utils/pagination.ts', additions: 16, deletions: 4, status: 'modified' },
      { name: 'tests/utils/pagination.test.ts', additions: 28, deletions: 0, status: 'modified' },
    ],
    diff: `--- a/src/utils/pagination.ts
+++ b/src/utils/pagination.ts
@@ -8,10 +8,22 @@ export function encodeCursor(data: CursorData): string {
   return Buffer.from(JSON.stringify(data)).toString('base64url');
 }
 
-export function decodeCursor(cursor: string): CursorData {
-  const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
-  return JSON.parse(decoded);
+export function decodeCursor(cursor: string): CursorData | null {
+  try {
+    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
+    const data = JSON.parse(decoded);
+
+    if (typeof data.id !== 'string' || typeof data.timestamp !== 'number') {
+      return null;
+    }
+
+    if (data.timestamp > Date.now() || data.timestamp < 0) {
+      return null;
+    }
+
+    return data as CursorData;
+  } catch {
+    return null;
+  }
 }`,
  },
  {
    hash: 'b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1',
    shortHash: 'b3c5d7e9',
    message: 'feat: add health check endpoint with dependency status',
    author: 'Amara Okafor',
    date: '2025-03-08T09:20:00Z',
    branch: 'develop',
    files: [
      { name: 'src/routes/health.ts', additions: 52, deletions: 12, status: 'modified' },
      { name: 'src/health/checks.ts', additions: 68, deletions: 0, status: 'added' },
    ],
    diff: `--- a/src/routes/health.ts
+++ b/src/routes/health.ts
@@ -1,15 +1,35 @@
 import { Router } from 'express';
-
-const router = Router();
+import { checkDatabase, checkRedis, checkExternalApi } from '../health/checks';
 
-router.get('/health', (req, res) => {
-  res.json({ status: 'ok' });
-});
+const router = Router();
 
-export { router as healthRouter };
+router.get('/health', async (req, res) => {
+  const checks = await Promise.allSettled([
+    checkDatabase(),
+    checkRedis(),
+    checkExternalApi(),
+  ]);
+
+  const results = {
+    database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' },
+    redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' },
+    external: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error' },
+  };
+
+  const allHealthy = Object.values(results).every(r => r.status === 'healthy');
+
+  res.status(allHealthy ? 200 : 503).json({
+    status: allHealthy ? 'healthy' : 'degraded',
+    timestamp: new Date().toISOString(),
+    uptime: process.uptime(),
+    checks: results,
+  });
+});
+
+export { router as healthRouter };`,
  },
  {
    hash: 'c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5',
    shortHash: 'c7d9e1f3',
    message: 'ci: add GitHub Actions workflow for PR checks',
    author: 'Henrik Larsson',
    date: '2025-03-07T20:40:00Z',
    branch: 'develop',
    files: [
      { name: '.github/workflows/pr-checks.yml', additions: 78, deletions: 0, status: 'added' },
      { name: '.github/workflows/deploy.yml', additions: 4, deletions: 2, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/.github/workflows/pr-checks.yml
@@ -0,0 +1,32 @@
+name: PR Checks
+
+on:
+  pull_request:
+    branches: [main, develop]
+
+jobs:
+  test:
+    runs-on: ubuntu-latest
+    strategy:
+      matrix:
+        node-version: [20.x, 22.x]
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: \${{ matrix.node-version }}
+          cache: 'npm'
+      - run: npm ci
+      - run: npm run lint
+      - run: npm run type-check
+      - run: npm test -- --coverage
+      - uses: codecov/codecov-action@v4
+        with:
+          token: \${{ secrets.CODECOV_TOKEN }}
+
+  security:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - run: npm audit --audit-level=high
+      - uses: snyk/actions/node@master`,
  },
  {
    hash: 'd1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9',
    shortHash: 'd1e3f5a7',
    message: 'feat: add real-time event streaming via SSE',
    author: 'Chen Wei',
    date: '2025-03-07T16:20:00Z',
    branch: 'feature/api-v2',
    files: [
      { name: 'src/events/sse.ts', additions: 72, deletions: 0, status: 'added' },
      { name: 'src/events/emitter.ts', additions: 34, deletions: 0, status: 'added' },
      { name: 'src/routes/events.ts', additions: 28, deletions: 0, status: 'added' },
    ],
    diff: `--- /dev/null
+++ b/src/events/sse.ts
@@ -0,0 +1,38 @@
+import { Request, Response } from 'express';
+import { EventEmitter } from './emitter';
+
+export class SSEConnection {
+  private res: Response;
+  private heartbeatTimer: NodeJS.Timer;
+
+  constructor(req: Request, res: Response) {
+    this.res = res;
+
+    res.writeHead(200, {
+      'Content-Type': 'text/event-stream',
+      'Cache-Control': 'no-cache',
+      'Connection': 'keep-alive',
+      'X-Accel-Buffering': 'no',
+    });
+
+    this.heartbeatTimer = setInterval(() => {
+      this.send('heartbeat', { timestamp: Date.now() });
+    }, 30000);
+
+    req.on('close', () => {
+      clearInterval(this.heartbeatTimer);
+    });
+  }
+
+  send(event: string, data: unknown): void {
+    this.res.write(\`event: \${event}\\n\`);
+    this.res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
+  }
+
+  close(): void {
+    clearInterval(this.heartbeatTimer);
+    this.res.end();
+  }
+}`,
  },
  {
    hash: 'e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7',
    shortHash: 'e9f1a3b5',
    message: 'fix: memory leak in WebSocket connection handler',
    author: 'Rachel Thompson',
    date: '2025-03-07T13:55:00Z',
    branch: 'main',
    files: [
      { name: 'src/ws/handler.ts', additions: 18, deletions: 6, status: 'modified' },
    ],
    diff: `--- a/src/ws/handler.ts
+++ b/src/ws/handler.ts
@@ -12,12 +12,24 @@ export class WebSocketHandler {
   private connections: Map<string, WebSocket>;
+  private cleanupTimers: Map<string, NodeJS.Timer>;
 
   constructor() {
     this.connections = new Map();
+    this.cleanupTimers = new Map();
   }
 
   handleConnection(ws: WebSocket, userId: string): void {
+    const existing = this.connections.get(userId);
+    if (existing) {
+      existing.close(1000, 'Replaced by new connection');
+      this.connections.delete(userId);
+    }
+
     this.connections.set(userId, ws);
 
     ws.on('close', () => {
       this.connections.delete(userId);
+      const timer = this.cleanupTimers.get(userId);
+      if (timer) {
+        clearTimeout(timer);
+        this.cleanupTimers.delete(userId);
+      }
     });
   }
 }`,
  },
  {
    hash: 'f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6',
    shortHash: 'f8a0b2c4',
    message: 'refactor: migrate config to environment-based validation',
    author: 'Omar Farouk',
    date: '2025-03-07T10:30:00Z',
    branch: 'develop',
    files: [
      { name: 'src/config/env.ts', additions: 58, deletions: 0, status: 'added' },
      { name: 'src/config/index.ts', additions: 6, deletions: 42, status: 'modified' },
      { name: '.env.example', additions: 15, deletions: 8, status: 'modified' },
    ],
    diff: `--- /dev/null
+++ b/src/config/env.ts
@@ -0,0 +1,32 @@
+import { z } from 'zod';
+
+const envSchema = z.object({
+  NODE_ENV: z.enum(['development', 'staging', 'production']),
+  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
+  DATABASE_URL: z.string().url(),
+  REDIS_URL: z.string().url(),
+  JWT_SECRET: z.string().min(32),
+  JWT_REFRESH_SECRET: z.string().min(32),
+  CORS_ORIGINS: z.string().transform(s => s.split(',')),
+  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
+  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
+  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
+});
+
+export type EnvConfig = z.infer<typeof envSchema>;
+
+let config: EnvConfig | null = null;
+
+export function getConfig(): EnvConfig {
+  if (config) return config;
+
+  const result = envSchema.safeParse(process.env);
+  if (!result.success) {
+    const errors = result.error.issues
+      .map(i => \`  \${i.path.join('.')}: \${i.message}\`)
+      .join('\\n');
+    throw new Error(\`Invalid environment configuration:\\n\${errors}\`);
+  }
+
+  config = result.data;
+  return config;
+}`,
  },
  {
    hash: 'a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3',
    shortHash: 'a5b7c9d1',
    message: 'feat: add structured logging with correlation IDs',
    author: 'Tom Baker',
    date: '2025-03-07T08:00:00Z',
    branch: 'develop',
    files: [
      { name: 'src/logger/index.ts', additions: 64, deletions: 18, status: 'modified' },
      { name: 'src/logger/correlation.ts', additions: 28, deletions: 0, status: 'added' },
      { name: 'src/middleware/request-id.ts', additions: 22, deletions: 0, status: 'added' },
    ],
    diff: `--- a/src/logger/index.ts
+++ b/src/logger/index.ts
@@ -1,18 +1,42 @@
-import winston from 'winston';
+import pino from 'pino';
+import { getCorrelationId } from './correlation';
 
-export const logger = winston.createLogger({
-  level: 'info',
-  format: winston.format.json(),
-  transports: [
-    new winston.transports.Console(),
-  ],
+const baseLogger = pino({
+  level: process.env.LOG_LEVEL || 'info',
+  formatters: {
+    level: (label) => ({ level: label }),
+    bindings: () => ({}),
+  },
+  timestamp: pino.stdTimeFunctions.isoTime,
+  redact: {
+    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
+    censor: '[REDACTED]',
+  },
 });
 
-export function info(msg: string) {
-  logger.info(msg);
-}
-
-export function error(msg: string) {
-  logger.error(msg);
+export const logger = {
+  info(msg: string, meta?: Record<string, unknown>) {
+    baseLogger.info({ correlationId: getCorrelationId(), ...meta }, msg);
+  },
+  warn(msg: string, meta?: Record<string, unknown>) {
+    baseLogger.warn({ correlationId: getCorrelationId(), ...meta }, msg);
+  },
+  error(msg: string, meta?: Record<string, unknown>) {
+    baseLogger.error({ correlationId: getCorrelationId(), ...meta }, msg);
+  },
+  debug(msg: string, meta?: Record<string, unknown>) {
+    baseLogger.debug({ correlationId: getCorrelationId(), ...meta }, msg);
+  },
+};`,
  },
];
