# Proposal: v0.8.2 Security & Reliability Hardening

## Intent

LibreChat v0.8.2 delivers a comprehensive hardening pass across security, reliability, and UI/UX layers. The release addresses multiple classes of vulnerabilities (SSRF, CSRF, IDOR, DoS), eliminates race conditions in Redis-backed streaming infrastructure and MongoDB operations, and resolves frontend edge cases that degraded user experience.

## Motivation

- **Security audit findings**: TOCTOU-vulnerable SSRF checks, unprotected OAuth callbacks, and IDOR-prone API routes were identified as high-priority risks in the MCP/Actions integration surface.
- **Production reliability**: Redis pub/sub timing gaps caused truncated streaming responses; concurrent job operations led to ghost jobs in RedisJobStore; file deduplication was not atomic.
- **User-reported issues**: System theme preference was not preserved; deleted agent favorites crashed the UI; links opened in the same tab; image previews were obscured by overlapping z-index layers.

## Scope

### In Scope

| Domain | Changes |
|--------|---------|
| **Security** | SSRF connect-time validation, OAuth CSRF protection, IDOR/DoS route hardening, Azure Entra group overage handling, tool cache namespace isolation |
| **Reliability** | Atomic Redis job updates (Lua script), content aggregation ordering, Redis subscription readiness gating, atomic file deduplication, code session context propagation |
| **Data Integrity** | Legacy document inclusion in MeiliSearch sync |
| **UI/UX** | Theme picker system preference, deleted agent favorites handling, MCP dialog accessibility, image preview z-index, link target fix |

### Out of Scope

- New feature development
- Schema migrations
- Breaking API changes

## Approach

Each fix follows a pattern of **replacing check-then-act with atomic operations** where applicable (Lua scripts, MongoDB `findOneAndUpdate`, connect-time IP validation). Security fixes are layered (CSRF cookies + session validation). UI fixes preserve backward compatibility through discriminated union types and graceful degradation.

## Impact

- **16 meaningful commits** across 4 categories
- **~3,800 lines changed** (additions + deletions)
- **~1,500 lines of new tests** added
- Zero breaking changes to public API or database schema
