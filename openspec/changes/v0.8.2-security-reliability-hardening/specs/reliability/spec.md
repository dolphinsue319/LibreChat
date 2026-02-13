# Spec: Reliability & Race Condition Fixes

## MODIFIED Requirements

### Requirement: Atomic Job Updates in RedisJobStore
Job updates in Redis must be atomic to prevent concurrent `deleteJob` and `updateJob` operations from creating ghost job entries.

#### Scenario: Concurrent delete and update on the same job
- **GIVEN** a job exists in Redis with key `job:123`
- **WHEN** `deleteJob("123")` and `updateJob("123", { status: "completed" })` execute concurrently
- **THEN** the update must fail silently (return 0) if the job was already deleted, and must never re-create the hash

#### Scenario: Normal job update
- **GIVEN** a job exists in Redis with key `job:123`
- **WHEN** `updateJob("123", { status: "running" })` executes
- **THEN** the Lua script must atomically verify existence and update, returning 1

### Requirement: Content Aggregation Before Event Emission
Agent event handlers must aggregate content data before emitting events to prevent downstream consumers from reading stale aggregated state.

#### Scenario: ON_RUN_STEP_COMPLETED handler
- **GIVEN** an agent run step completes with new content data
- **WHEN** the event handler fires
- **THEN** `aggregateContent()` must execute before `emitEvent()` and any conditional logic

### Requirement: Redis Subscription Readiness Gating
The streaming infrastructure must not disable the early event buffer until the Redis SUBSCRIBE command has been acknowledged by the server.

#### Scenario: Subscriber connects to resumable stream
- **GIVEN** a generation job is producing events via Redis pub/sub
- **WHEN** a new subscriber calls `subscribe()`
- **THEN** the `hasSubscriber` flag must not be set to `true` until the Redis SUBSCRIBE acknowledgment resolves
- **AND** events published during the handshake window must be buffered, not dropped

#### Scenario: Cross-replica subscriber transition
- **GIVEN** a subscriber on replica A disconnects and a new subscriber on replica B connects
- **WHEN** the transition occurs
- **THEN** `syncReorderBuffer()` must ensure no events are lost during the handover

## ADDED Requirements

### Requirement: Atomic File Deduplication
Code execution output files must be deduplicated atomically to prevent concurrent tool calls from creating duplicate file records in MongoDB.

#### Scenario: Two concurrent code executions produce same filename
- **GIVEN** two parallel tool calls generate a file named `output.csv` in the same conversation
- **WHEN** both attempt to register the file in MongoDB
- **THEN** `claimCodeFile` must use `findOneAndUpdate` with `$setOnInsert` so only one record is created

#### Scenario: Image file cache busting
- **GIVEN** a code execution overwrites an existing image file
- **WHEN** the UI renders the updated image
- **THEN** the URL must include a `?v=timestamp` query string to bypass browser cache

### Requirement: Code Session Context in Event-Driven Mode
When agents use event-driven tool execution, code execution tools must retain their session context (session ID and previously generated files) across multiple invocations within a conversation turn.

#### Scenario: Sequential code executions in event-driven mode
- **GIVEN** an agent executes code that generates `data.csv` in step 1
- **WHEN** the agent executes a second code block referencing `data.csv` in step 2
- **THEN** the `session_id` and `_injected_files` from step 1 must be propagated to step 2's tool call config

### Requirement: Bedrock Adaptive Model Token Defaults
Bedrock adaptive thinking models must not have a hardcoded `maxTokens` default that may conflict with the model's actual capabilities.

#### Scenario: Adaptive model without explicit maxOutputTokens
- **GIVEN** a Bedrock adaptive model (e.g., Claude Opus) is invoked without `maxOutputTokens`
- **WHEN** the request is constructed
- **THEN** the system must not inject a default `maxTokens` value

## MODIFIED Requirements

### Requirement: MeiliSearch Sync for Legacy Documents
Search sync must include documents created before the `_meiliIndex` field was introduced (where the field is `undefined`).

#### Scenario: Legacy document without _meiliIndex field
- **GIVEN** a conversation document was created before the `_meiliIndex` field existed
- **WHEN** the MeiliSearch sync job runs
- **THEN** the query `{ _meiliIndex: { $ne: false } }` must match the document (since `undefined !== false`)

### Requirement: Allowed MIME Types
The file upload system must accept Apache Parquet files.

#### Scenario: Parquet file upload
- **GIVEN** a user uploads a file with MIME type `application/x-parquet`
- **WHEN** the system validates the file type
- **THEN** the file must be accepted
