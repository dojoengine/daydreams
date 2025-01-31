# Processors

## Classes

### MessageProcessor

Defined in: [packages/core/src/core/processors/message-processor.ts:12](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L12)

Base abstract class for content processors that handle different types of input
and generate appropriate responses using LLM.

#### Extends

- [`BaseProcessor`](../globals.md#baseprocessor)

#### Constructors

##### new MessageProcessor()

> **new MessageProcessor**(`llmClient`, `character`, `logLevel`): [`MessageProcessor`](Processors.md#messageprocessor)

Defined in: [packages/core/src/core/processors/message-processor.ts:13](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L13)

###### Parameters

###### llmClient

[`LLMClient`](../globals.md#llmclient-1)

###### character

[`Character`](Types.md#character)

###### logLevel

[`LogLevel`](Types.md#loglevel) = `LogLevel.ERROR`

###### Returns

[`MessageProcessor`](Processors.md#messageprocessor)

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`constructor`](../globals.md#constructors)

#### Properties

##### character

> `protected` **character**: [`Character`](Types.md#character)

Defined in: [packages/core/src/core/processors/message-processor.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L15)

The character personality to use for responses

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`character`](../globals.md#character)

##### contentLimit

> `protected` **contentLimit**: `number` = `1000`

Defined in: [packages/core/src/core/processor.ts:29](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L29)

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`contentLimit`](../globals.md#contentlimit)

##### llmClient

> `protected` **llmClient**: [`LLMClient`](../globals.md#llmclient-1)

Defined in: [packages/core/src/core/processors/message-processor.ts:14](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L14)

The LLM client instance to use for processing

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`llmClient`](../globals.md#llmclient)

##### logger

> `protected` **logger**: [`Logger`](../globals.md#logger-1)

Defined in: [packages/core/src/core/processor.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L15)

Logger instance for this processor

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`logger`](../globals.md#logger)

##### loggerLevel

> `protected` **loggerLevel**: [`LogLevel`](Types.md#loglevel) = `LogLevel.ERROR`

Defined in: [packages/core/src/core/processor.ts:26](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L26)

The logging level to use

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`loggerLevel`](../globals.md#loggerlevel)

##### metadata

> `protected` **metadata**: `object`

Defined in: [packages/core/src/core/processor.ts:25](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L25)

Metadata about this processor including name and description

###### description

> **description**: `string`

###### name

> **name**: `string`

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`metadata`](../globals.md#metadata)

#### Methods

##### canHandle()

> **canHandle**(`content`): `boolean`

Defined in: [packages/core/src/core/processors/message-processor.ts:34](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L34)

Logic to decide if this processor can handle the given content.
This processor is designed to handle shorter messages and text content.

###### Parameters

###### content

`any`

###### Returns

`boolean`

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`canHandle`](../globals.md#canhandle)

##### getName()

> **getName**(): `string`

Defined in: [packages/core/src/core/processor.ts:42](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L42)

Gets the name of this processor

###### Returns

`string`

The processor name from metadata

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`getName`](../globals.md#getname)

##### process()

> **process**(`content`, `otherContext`, `ioContext`?): `Promise`\<[`ProcessedResult`](Types.md#processedresult)\>

Defined in: [packages/core/src/core/processors/message-processor.ts:43](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/message-processor.ts#L43)

Processes the given content and returns a result.

###### Parameters

###### content

`any`

The content to process

###### otherContext

`string`

Additional context string to consider during processing

###### ioContext?

Optional context containing available outputs and actions

###### availableActions

[`IOHandler`](Types.md#iohandler)[]

Array of available action handlers

###### availableOutputs

[`IOHandler`](Types.md#iohandler)[]

Array of available output handlers

###### Returns

`Promise`\<[`ProcessedResult`](Types.md#processedresult)\>

Promise resolving to the processed result

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`process`](../globals.md#process)

***

### ResearchQuantProcessor

Defined in: [packages/core/src/core/processors/research-processor.ts:20](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L20)

Example Research/Quant Processor

Responsibilities:
1. Scrape or read inbound content and attempt to extract relevant data for research
2. Summarize and rank key insights
3. (Optionally) produce embeddings or structured data suitable for a vector DB
4. Suggest next steps or tasks (e.g., writing to a vector store, scheduling a scrape, etc.)

#### Extends

- [`BaseProcessor`](../globals.md#baseprocessor)

#### Constructors

##### new ResearchQuantProcessor()

> **new ResearchQuantProcessor**(`llmClient`, `character`, `logLevel`, `contentLimit`, `tokenLimit`): [`ResearchQuantProcessor`](Processors.md#researchquantprocessor)

Defined in: [packages/core/src/core/processors/research-processor.ts:21](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L21)

###### Parameters

###### llmClient

[`LLMClient`](../globals.md#llmclient-1)

###### character

[`Character`](Types.md#character)

###### logLevel

[`LogLevel`](Types.md#loglevel) = `LogLevel.ERROR`

###### contentLimit

`number` = `1000`

###### tokenLimit

`number` = `100000`

###### Returns

[`ResearchQuantProcessor`](Processors.md#researchquantprocessor)

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`constructor`](../globals.md#constructors)

#### Properties

##### character

> `protected` **character**: [`Character`](Types.md#character)

Defined in: [packages/core/src/core/processors/research-processor.ts:23](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L23)

The character personality to use for responses

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`character`](../globals.md#character)

##### contentLimit

> `protected` **contentLimit**: `number` = `1000`

Defined in: [packages/core/src/core/processors/research-processor.ts:25](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L25)

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`contentLimit`](../globals.md#contentlimit)

##### llmClient

> `protected` **llmClient**: [`LLMClient`](../globals.md#llmclient-1)

Defined in: [packages/core/src/core/processors/research-processor.ts:22](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L22)

The LLM client instance to use for processing

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`llmClient`](../globals.md#llmclient)

##### logger

> `protected` **logger**: [`Logger`](../globals.md#logger-1)

Defined in: [packages/core/src/core/processor.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L15)

Logger instance for this processor

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`logger`](../globals.md#logger)

##### loggerLevel

> `protected` **loggerLevel**: [`LogLevel`](Types.md#loglevel) = `LogLevel.ERROR`

Defined in: [packages/core/src/core/processor.ts:26](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L26)

The logging level to use

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`loggerLevel`](../globals.md#loggerlevel)

##### metadata

> `protected` **metadata**: `object`

Defined in: [packages/core/src/core/processor.ts:25](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L25)

Metadata about this processor including name and description

###### description

> **description**: `string`

###### name

> **name**: `string`

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`metadata`](../globals.md#metadata)

##### tokenLimit

> `protected` **tokenLimit**: `number` = `100000`

Defined in: [packages/core/src/core/processors/research-processor.ts:26](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L26)

#### Methods

##### canHandle()

> **canHandle**(`content`): `boolean`

Defined in: [packages/core/src/core/processors/research-processor.ts:44](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L44)

Logic to decide if this processor can handle the given content.
This processor is designed to handle longer-form content like datasets and scraped data.

###### Parameters

###### content

`any`

###### Returns

`boolean`

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`canHandle`](../globals.md#canhandle)

##### getName()

> **getName**(): `string`

Defined in: [packages/core/src/core/processor.ts:42](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L42)

Gets the name of this processor

###### Returns

`string`

The processor name from metadata

###### Inherited from

[`BaseProcessor`](../globals.md#baseprocessor).[`getName`](../globals.md#getname)

##### process()

> **process**(`content`, `otherContext`, `ioContext`?): `Promise`\<`any`\>

Defined in: [packages/core/src/core/processors/research-processor.ts:319](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processors/research-processor.ts#L319)

Processes the given content and returns a result.

###### Parameters

###### content

`any`

The content to process

###### otherContext

`string`

Additional context string to consider during processing

###### ioContext?

Optional context containing available outputs and actions

###### availableActions

[`IOHandler`](Types.md#iohandler)[]

Array of available action handlers

###### availableOutputs

[`IOHandler`](Types.md#iohandler)[]

Array of available output handlers

###### Returns

`Promise`\<`any`\>

Promise resolving to the processed result

###### Overrides

[`BaseProcessor`](../globals.md#baseprocessor).[`process`](../globals.md#process)
