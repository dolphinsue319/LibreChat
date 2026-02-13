# Design: v0.8.2 Security & Reliability Hardening

## Technical Decisions

### 1. TOCTOU Elimination Strategy

**Decision:** Replace all check-then-act patterns with atomic operations at the database/cache layer.

| Location | Before | After |
|----------|--------|-------|
| RedisJobStore `updateJob` | `EXISTS` + `HMSET` (2 round-trips) | Single Lua script: atomic check-and-set |
| File deduplication | `findExistingCodeFile` + `createFile` | `findOneAndUpdate` with `$setOnInsert` + `upsert: true` |
| SSRF hostname validation | DNS resolve at validation time | `lookup` callback at connect time in custom HTTP agents |

**Rationale:** Lua scripts execute atomically on the Redis server. MongoDB `findOneAndUpdate` is atomic by design. Connect-time validation eliminates the DNS rebinding window entirely.

### 2. SSRF Protection Architecture

```
Request Flow:
  Action/MCP URL
    → domain allowlist check (unchanged)
    → createSSRFSafeAgents() → custom http.Agent / https.Agent
        → lookup callback intercepts DNS resolution
        → resolveHostnameSSRF() validates resolved IP against RFC 1918/5737/loopback ranges
        → rejects private IPs at connect time (not at check time)

MCP WebSocket Flow:
  → createSSRFSafeUndiciConnect()
    → undici custom connect function
    → same IP validation at socket level
```

**Key files:**
- `packages/api/src/auth/agent.ts` — `createSSRFSafeAgents()`
- `packages/api/src/auth/domain.ts` — `resolveHostnameSSRF()`
- `packages/api/src/mcp/connection.ts` — undici integration

### 3. OAuth CSRF Protection

```
OAuth Initiation:
  1. Generate flowId = `userId:serverName`
  2. CSRF token = HMAC(flowId, JWT_SECRET)
  3. Set `oauth_csrf` cookie (HttpOnly, SameSite=Lax)
  4. Redirect to IdP with flowId in `state` param

OAuth Callback:
  1. Extract `state` param (contains flowId)
  2. Validate `oauth_csrf` cookie matches HMAC(state, JWT_SECRET)
  3. Verify userId in flowId matches authenticated user
  4. Proceed with token binding
```

**Key files:**
- `packages/api/src/oauth/csrf.ts` — `generateOAuthCsrfToken`, `setOAuthCsrfCookie`, `validateOAuthCsrf`
- `api/server/routes/mcp.js` — callback validation
- `api/server/routes/actions.js` — `/bind` endpoint

### 4. Redis Subscription Readiness Gating

**Problem:** Fire-and-forget `SUBSCRIBE` caused event drops during the subscription handshake window.

```
Before:
  subscribe() → returns immediately → hasSubscriber = true → earlyEventBuffer disabled
  [gap: Redis SUBSCRIBE not yet acknowledged]
  Events published here → LOST

After:
  subscribe() → returns { ready: Promise }
  await ready → Redis SUBSCRIBE acknowledged
  hasSubscriber = true → earlyEventBuffer disabled
  Events published here → received
```

**Key files:**
- `packages/api/src/stream/implementations/RedisEventTransport.ts` — `ready` promise from SUBSCRIBE ack
- `packages/api/src/stream/GenerationJobManager.ts` — awaits `ready` before flipping `hasSubscriber`

### 5. Tool Cache Namespace Separation

```
Before (shared namespace):
  CONFIG_STORE → YAML config + tool definitions
  FORCED_IN_MEMORY = CONFIG_STORE → both per-container

After (separated):
  CONFIG_STORE → YAML config only (per-container, in-memory)
  APP_CONFIG   → app config (per-container, in-memory)
  TOOL_CACHE   → tool definitions (shared via Redis)
```

**Key files:**
- `packages/data-provider/src/config.ts` — `CacheKeys.TOOL_CACHE`
- `packages/api/src/cache/cacheConfig.ts` — default `FORCED_IN_MEMORY_CACHE_NAMESPACES`
- `api/server/services/Config/getCachedTools.js` — all 4 functions migrated

### 6. Azure Entra Group Overage Resolution

**Decision:** Use Microsoft Graph `/me/getMemberObjects` endpoint (requires only `User.Read` delegated permission) instead of `/me/memberOf` (requires `Directory.Read.All`).

```
Token inspection:
  if (hasgroups === true) OR (_claim_names.groups + _claim_sources exist)
    → resolveGroupsFromOverage(accessToken)
    → POST /me/getMemberObjects { securityEnabledOnly: false }
    → returns group OIDs
    → match against allowed groups
```

**Bug fix:** Role comparison changed from `.includes()` (substring) to strict equality to prevent `"bread".includes("read") === true`.

### 7. Theme Preference Persistence

**Decision:** Replace Jotai atoms with React `useState` + `localStorage` to preserve the literal `"system"` value.

```
Before: ThemeSelector → resolves "system" to "dark"/"light" → stores resolved value
After:  ThemeSelector → stores "system" literally → ThemeProvider listens to matchMedia
```

**Key file:** `packages/client/src/theme/context/ThemeProvider.tsx`

### 8. Graceful Handling of Deleted Favorites

**Decision:** Discriminated union type (`AgentQueryResult = { found: true, agent } | { found: false }`) instead of throwing on 404.

**Key files:**
- `client/src/common/agents-types.ts` — type definition
- `client/src/components/Nav/Favorites/FavoritesList.tsx` — try/catch in queryFn
