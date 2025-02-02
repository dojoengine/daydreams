# Twitter

## Classes

### TwitterClient

Defined in: [packages/core/src/core/io/twitter.ts:31](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L31)

#### Constructors

##### new TwitterClient()

> **new TwitterClient**(`credentials`, `logLevel`): [`TwitterClient`](Twitter.md#twitterclient)

Defined in: [packages/core/src/core/io/twitter.ts:37](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L37)

###### Parameters

###### credentials

[`TwitterCredentials`](Twitter.md#twittercredentials)

###### logLevel

[`LogLevel`](../../Types.md#loglevel) = `LogLevel.INFO`

###### Returns

[`TwitterClient`](Twitter.md#twitterclient)

#### Methods

##### createMentionsInput()

> **createMentionsInput**(`interval`): `object`

Defined in: [packages/core/src/core/io/twitter.ts:71](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L71)

Create an input that monitors mentions

###### Parameters

###### interval

`number` = `60000`

###### Returns

`object`

###### handler()

> **handler**: () => `Promise`\<`null` \| `object`[]\>

###### Returns

`Promise`\<`null` \| `object`[]\>

###### interval

> **interval**: `number`

###### name

> **name**: `string` = `"twitter_mentions"`

###### response

> **response**: `object`

###### response.content

> **content**: `string` = `"string"`

###### response.metadata

> **metadata**: `string` = `"object"`

###### response.type

> **type**: `string` = `"string"`

##### createTimelineInput()

> **createTimelineInput**(`username`, `interval`): `object`

Defined in: [packages/core/src/core/io/twitter.ts:90](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L90)

Create an input that monitors a user's timeline

###### Parameters

###### username

`string`

###### interval

`number` = `60000`

###### Returns

`object`

###### handler()

> **handler**: () => `Promise`\<`object`[]\>

###### Returns

`Promise`\<`object`[]\>

###### interval

> **interval**: `number`

###### name

> **name**: `string`

###### response

> **response**: `object`

###### response.content

> **content**: `string` = `"string"`

###### response.metadata

> **metadata**: `string` = `"object"`

###### response.type

> **type**: `string` = `"string"`

##### createTweetOutput()

> **createTweetOutput**(): `object`

Defined in: [packages/core/src/core/io/twitter.ts:110](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L110)

Create an output for sending tweets

###### Returns

`object`

###### handler()

> **handler**: (`data`) => `Promise`\<\{ `success`: `boolean`; `tweetId`: `string`; \} \| \{ `success`: `boolean`; `tweetId`: `Response`; \}\>

###### Parameters

###### data

[`TweetData`](Twitter.md#tweetdata)

###### Returns

`Promise`\<\{ `success`: `boolean`; `tweetId`: `string`; \} \| \{ `success`: `boolean`; `tweetId`: `Response`; \}\>

###### name

> **name**: `string` = `"twitter_tweet"`

###### response

> **response**: `object`

###### response.success

> **success**: `string` = `"boolean"`

###### response.tweetId

> **tweetId**: `string` = `"string"`

###### schema

> **schema**: `JSONSchemaType`\<[`TweetData`](Twitter.md#tweetdata)\> = `tweetSchema`

## Interfaces

### TweetData

Defined in: [packages/core/src/core/io/twitter.ts:13](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L13)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:14](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L14)

##### conversationId?

> `optional` **conversationId**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:16](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L16)

##### inReplyTo?

> `optional` **inReplyTo**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L15)

***

### TwitterCredentials

Defined in: [packages/core/src/core/io/twitter.ts:7](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L7)

#### Properties

##### email

> **email**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:10](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L10)

##### password

> **password**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:9](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L9)

##### username

> **username**: `string`

Defined in: [packages/core/src/core/io/twitter.ts:8](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L8)

## Variables

### tweetSchema

> `const` **tweetSchema**: `JSONSchemaType`\<[`TweetData`](Twitter.md#tweetdata)\>

Defined in: [packages/core/src/core/io/twitter.ts:20](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/io/twitter.ts#L20)
