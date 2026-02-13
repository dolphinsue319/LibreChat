# Spec: Security Hardening

## ADDED Requirements

### Requirement: TOCTOU-Safe SSRF Protection
External HTTP requests from Actions and MCP integrations must validate the resolved IP address at connect time, not at DNS resolution time, to prevent DNS rebinding attacks.

#### Scenario: Action requests to external API with DNS rebinding attempt
- **GIVEN** an Action is configured with an external URL that initially resolves to a public IP
- **WHEN** the DNS record changes to a private IP between validation and connection
- **THEN** the connection must be rejected at socket connect time with an SSRF error

#### Scenario: MCP WebSocket connection to private IP
- **GIVEN** an MCP server URL resolves to an RFC 1918 private address
- **WHEN** the system attempts to establish a WebSocket connection
- **THEN** the undici connect function must reject the connection before the TCP handshake completes

### Requirement: OAuth CSRF Protection for MCP and Actions
OAuth callback endpoints must validate a CSRF token to prevent cross-site request forgery that could bind attacker-controlled tokens to a victim's account.

#### Scenario: Valid OAuth callback with matching CSRF token
- **GIVEN** a user initiates an OAuth flow and receives an `oauth_csrf` cookie
- **WHEN** the IdP redirects back with a `state` parameter matching the flowId
- **THEN** the system must validate the cookie HMAC matches the state and proceed with token binding

#### Scenario: OAuth callback with missing or invalid CSRF token
- **GIVEN** an attacker crafts a callback URL without the `oauth_csrf` cookie
- **WHEN** the browser follows the callback URL
- **THEN** the system must reject the request and not bind any tokens

#### Scenario: Tool cache invalidation on disconnect
- **GIVEN** a user disconnects from an MCP server
- **WHEN** the disconnect completes
- **THEN** the system must invalidate cached tool definitions for that server

### Requirement: IDOR Prevention on API Key Routes
The `PUT /api/keys` endpoint must not allow callers to specify an arbitrary `userId` to modify another user's API keys.

#### Scenario: Request body contains injected userId
- **GIVEN** an authenticated user sends a PUT request with `{ userId: "other-user-id", name: "openai", value: "sk-..." }`
- **WHEN** the server processes the request
- **THEN** the system must use `req.user.id` and ignore the body's `userId` field

### Requirement: DoS Prevention on Conversation Deletion
The `DELETE /api/convos` endpoint must not crash when receiving a null or empty request body.

#### Scenario: Empty body on DELETE convos
- **GIVEN** an authenticated user sends a DELETE request with no body
- **WHEN** the server processes the request
- **THEN** the system must return HTTP 400 instead of crashing with an unhandled exception

### Requirement: Azure Entra Group Overage Handling
Users in Azure AD/Entra ID organizations with more than ~200 groups must still be able to authenticate, even when the `groups` claim is omitted from the ID token.

#### Scenario: User with group overage indicator
- **GIVEN** a user's ID token contains `_claim_names.groups` and `_claim_sources` instead of a `groups` claim
- **WHEN** the system processes the OpenID callback
- **THEN** the system must call Microsoft Graph `/me/getMemberObjects` to resolve group memberships and match against allowed groups

#### Scenario: Role comparison with substring collision
- **GIVEN** an allowed role is `"read"` and a user's role is `"bread"`
- **WHEN** the system checks role membership
- **THEN** the system must use strict equality (not `.includes()`) and reject the user

## ADDED Requirements

### Requirement: Tool Cache Namespace Isolation
Tool definitions must use a separate cache namespace from YAML application configuration to support blue/green deployments where config is per-container but tools are shared.

#### Scenario: Blue/green deployment with shared Redis
- **GIVEN** two deployment replicas share a Redis instance with `FORCED_IN_MEMORY_CACHE_NAMESPACES=CONFIG_STORE,APP_CONFIG`
- **WHEN** a user installs a plugin on replica A
- **THEN** the tool definition must be visible on replica B via the shared `TOOL_CACHE` namespace
