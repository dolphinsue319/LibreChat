# Tasks: v0.8.2 Security & Reliability Hardening

## Security

- [x] 1.1 Implement connect-time SSRF validation via custom HTTP/HTTPS agents (`createSSRFSafeAgents`)
- [x] 1.2 Add `resolveHostnameSSRF` to validate resolved IPs against private/reserved ranges
- [x] 1.3 Create `createSSRFSafeUndiciConnect` for MCP WebSocket transport SSRF protection
- [x] 1.4 Thread `useSSRFProtection` flag through MCPConnection → MCPManager → UserConnectionManager
- [x] 1.5 Make WebSocket transport construction async for pre-connect SSRF checks
- [x] 2.1 Implement `generateOAuthCsrfToken` using HMAC of flowId with JWT_SECRET
- [x] 2.2 Add `setOAuthCsrfCookie` (HttpOnly, SameSite=Lax) on OAuth initiation
- [x] 2.3 Add `validateOAuthCsrf` on OAuth callback routes (MCP + Actions)
- [x] 2.4 Structure flowId as `userId:serverName` for ownership verification
- [x] 2.5 Add `validateOAuthSession` fallback for backward compatibility
- [x] 2.6 Invalidate tool cache on MCP server disconnect
- [x] 3.1 Destructure `req.body` in `PUT /api/keys` to prevent IDOR via userId injection
- [x] 3.2 Add null/empty body guard on `DELETE /api/convos` to prevent DoS crash
- [x] 3.3 Add test suite for keys route hardening (174 lines)
- [x] 4.1 Implement `resolveGroupsFromOverage` using Graph `/me/getMemberObjects`
- [x] 4.2 Detect group overage via `hasgroups` flag and `_claim_names`/`_claim_sources`
- [x] 4.3 Fix role comparison from `.includes()` to strict equality
- [x] 4.4 Add Azure Entra overage test suite (310 lines)
- [x] 5.1 Introduce `CacheKeys.TOOL_CACHE` namespace
- [x] 5.2 Migrate `getCachedTools`, `setCachedTools`, `invalidateCachedTools`, `getMCPServerTools` to `TOOL_CACHE`
- [x] 5.3 Default `FORCED_IN_MEMORY_CACHE_NAMESPACES` to `CONFIG_STORE,APP_CONFIG`

## Reliability

- [x] 6.1 Replace `EXISTS` + `HMSET` with atomic Lua script in `RedisJobStore.updateJob`
- [x] 6.2 Replace deprecated `hmset` with `hset` throughout RedisJobStore
- [x] 6.3 Add integration tests for concurrent delete/update race condition
- [x] 7.1 Move `aggregateContent()` calls to top of all agent event handlers (before `emitEvent`)
- [x] 7.2 Bump default agent recursion limit from 25 to 50
- [x] 8.1 Add `ready` promise return to `IEventTransport.subscribe()`
- [x] 8.2 Implement `ready` in `RedisEventTransport` using SUBSCRIBE acknowledgment
- [x] 8.3 Await `ready` in `GenerationJobManager.subscribe()` before setting `hasSubscriber`
- [x] 8.4 Add `syncReorderBuffer()` for cross-replica subscriber transitions
- [x] 8.5 Add early-return in `emitChunk()` when no subscriber connected
- [x] 9.1 Replace `findExistingCodeFile` + `createFile` with atomic `claimCodeFile` (`findOneAndUpdate` + `$setOnInsert`)
- [x] 9.2 Add cache-busting query strings for image file URLs
- [x] 9.3 Remove hardcoded `DEFAULT_ADAPTIVE_MAX_TOKENS` for Bedrock adaptive models
- [x] 9.4 Add `application/x-parquet` and `vnd.apache.parquet` to allowed MIME types
- [x] 10.1 Inject `session_id` into tool call config for `EXECUTE_CODE` in event-driven mode
- [x] 10.2 Inject `_injected_files` from `codeSessionContext` into tool call config
- [x] 10.3 Harden `parseTextParts` to handle `undefined` elements via optional chaining

## Data Integrity

- [x] 11.1 Change MeiliSearch sync query from `{ _meiliIndex: true }` to `{ _meiliIndex: { $ne: false } }`
- [x] 11.2 Apply same pattern in `mongoMeili.ts` plugin and `batchResetMeiliFlags`
- [x] 11.3 Add test suite for legacy document inclusion (235 lines)

## UI/UX

- [x] 12.1 Replace Jotai atom theme state with React `useState` + `localStorage` in ThemeProvider
- [x] 12.2 Preserve literal `"system"` value in state and localStorage
- [x] 12.3 Register `matchMedia` listener only when `theme === 'system'`
- [x] 12.4 Add `isValidThemeColors` and `getInitialTheme` validation helpers
- [x] 13.1 Wrap agent fetch in try/catch, return `{ found: false }` on 404
- [x] 13.2 Create `AgentQueryResult` discriminated union type
- [x] 13.3 Add FavoritesList test suite (191 lines)
- [x] 14.1 Add `fieldset`/`legend` with `aria-labelledby` for MCP radio groups
- [x] 14.2 Add `aria-invalid` and `aria-describedby` to form inputs
- [x] 14.3 Add `role="alert"` to error messages
- [x] 14.4 Add copy-to-clipboard with icon toggle for redirect URI dialog
- [x] 14.5 Add `border-destructive` and `text-destructive` CSS variables
- [x] 15.1 Change ImagePreview z-index from `z-[100]` to `z-[250]`
- [x] 16.1 Change link target from `_new` to `_blank` in MarkdownComponents
