# Discord

## Classes

### DiscordClient

Defined in:
[discord.ts](https://github.com/daydreamsai/daydreams/blob/main/packages/core/src/core/io/discord.ts)

A Discord.js client wrapper handling message streaming and interactions.

#### Constructors

##### new DiscordClient()

```typescript
constructor(credentials: DiscordCredentials, logLevel: LogLevel = LogLevel.INFO)
```

**Parameters**:

- `credentials`: Bot authentication credentials
- `logLevel`: Logging verbosity (default: INFO)

Initializes the client with:

- Guild and DM message intents
- Channel partials for DM support
- Automatic login using provided token
- Ready event logging

#### Methods

##### startMessageStream()

```typescript
public startMessageStream(onData: (data: ProcessableContent | ProcessableContent[]) => void): void
```

**Parameters**:

- `onData`: Callback receiving message data

Starts listening to MessageCreate events:

- Skips messages from the bot account (using author.displayName match)
- Formats messages into ProcessableContent structure
- Includes metadata: user ID (displayName), channel ID, message ID

##### stopMessageStream()

```typescript
public stopMessageStream(): void
```

Removes message listener and stops message streaming.

##### destroy()

```typescript
public destroy(): void
```

Cleans up resources:

1. Stops message stream
2. Destroys Discord client
3. Logs shutdown

##### createMessageOutput()

```typescript
public createMessageOutput<T>(): IOHandler
```

**Returns**: Preconfigured output handler for Discord messages

Handler features:

- Role: `HandlerRole.OUTPUT`
- Name: `discord_message`
- Validation: Uses Zod messageSchema
- Execution: Sends messages via private sendMessage method

## Interfaces

### DiscordCredentials

```typescript
interface DiscordCredentials {
  discord_token: string;
  discord_bot_name: string;
}
```

### MessageData

```typescript
interface MessageData {
  content: string;
  channelId: string;
  conversationId?: string;
  sendBy?: string;
}
```

## Schema

### messageSchema

Zod validation schema for message sending:

```typescript
z.object({
  content: z.string().describe("Message content"),
  channelId: z.string().describe("Target channel ID"),
  sendBy: z.string().optional().describe("Sender ID"),
  conversationId: z.string().optional().describe("Conversation ID"),
});
```

## Implementation Notes

1. **Security**:

   - Uses displayName comparison for bot message filtering
   - Requires MessageContent intent for message access
   - Validates text channels before sending

2. **Error Handling**:

   - Comprehensive error logging
   - Dry-run mode support
   - Channel type validation

3. **Limitations**:
   - Only supports TextChannel messages (no threads/forums)
   - Uses displayName instead of user ID for bot detection
   - Asynchronous login (no ready promise)

## Example Usage

```typescript
// Initialization
const discord = new DiscordClient({
  discord_token: process.env.DISCORD_TOKEN,
  discord_bot_name: "MyBot",
});

// Message streaming
discord.startMessageStream((message) => {
  console.log(`New message in ${message.threadId}: ${message.data.content}`);
});

// Message sending via handler
const handler = discord.createMessageOutput();
await handler.execute({
  channelId: "1234567890",
  content: "Hello from Daydream!",
});

// Clean shutdown
discord.destroy();
```
