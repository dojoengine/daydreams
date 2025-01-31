# Types

## Enumerations

### HandlerRole

Defined in: [packages/core/src/core/types/index.ts:505](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L505)

#### Enumeration Members

##### ACTION

> **ACTION**: `"action"`

Defined in: [packages/core/src/core/types/index.ts:508](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L508)

##### INPUT

> **INPUT**: `"input"`

Defined in: [packages/core/src/core/types/index.ts:506](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L506)

##### OUTPUT

> **OUTPUT**: `"output"`

Defined in: [packages/core/src/core/types/index.ts:507](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L507)

***

### LogLevel

Defined in: [packages/core/src/core/types/index.ts:51](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L51)

#### Enumeration Members

##### DEBUG

> **DEBUG**: `3`

Defined in: [packages/core/src/core/types/index.ts:55](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L55)

##### ERROR

> **ERROR**: `0`

Defined in: [packages/core/src/core/types/index.ts:52](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L52)

##### INFO

> **INFO**: `2`

Defined in: [packages/core/src/core/types/index.ts:54](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L54)

##### TRACE

> **TRACE**: `4`

Defined in: [packages/core/src/core/types/index.ts:56](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L56)

##### WARN

> **WARN**: `1`

Defined in: [packages/core/src/core/types/index.ts:53](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L53)

## Interfaces

### ActionStep

Defined in: [packages/core/src/core/types/index.ts:86](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L86)

#### Extends

- [`BaseStep`](Types.md#basestep)

#### Properties

##### actionOutput?

> `optional` **actionOutput**: `any`

Defined in: [packages/core/src/core/types/index.ts:96](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L96)

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:88](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L88)

###### Overrides

[`BaseStep`](Types.md#basestep).[`content`](Types.md#content-1)

##### duration?

> `optional` **duration**: `number`

Defined in: [packages/core/src/core/types/index.ts:97](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L97)

##### error?

> `optional` **error**: `Error`

Defined in: [packages/core/src/core/types/index.ts:94](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L94)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L78)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`id`](Types.md#id-1)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L83)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`meta`](Types.md#meta-1)

##### observations?

> `optional` **observations**: `string`

Defined in: [packages/core/src/core/types/index.ts:95](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L95)

##### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L82)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`tags`](Types.md#tags-1)

##### timestamp

> **timestamp**: `number`

Defined in: [packages/core/src/core/types/index.ts:81](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L81)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`timestamp`](Types.md#timestamp-1)

##### toolCall?

> `optional` **toolCall**: `object`

Defined in: [packages/core/src/core/types/index.ts:89](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L89)

###### arguments

> **arguments**: `any`

###### id

> **id**: `string`

###### name

> **name**: `string`

##### type

> **type**: `"action"`

Defined in: [packages/core/src/core/types/index.ts:87](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L87)

###### Overrides

[`BaseStep`](Types.md#basestep).[`type`](Types.md#type-1)

***

### AnalysisOptions

Defined in: [packages/core/src/core/types/index.ts:180](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L180)

#### Properties

##### formatResponse?

> `optional` **formatResponse**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:185](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L185)

##### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [packages/core/src/core/types/index.ts:184](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L184)

##### role?

> `optional` **role**: `string`

Defined in: [packages/core/src/core/types/index.ts:182](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L182)

##### system?

> `optional` **system**: `string`

Defined in: [packages/core/src/core/types/index.ts:181](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L181)

##### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/core/src/core/types/index.ts:183](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L183)

***

### BaseStep

Defined in: [packages/core/src/core/types/index.ts:77](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L77)

#### Extended by

- [`ActionStep`](Types.md#actionstep)
- [`PlanningStep`](Types.md#planningstep)
- [`SystemStep`](Types.md#systemstep)
- [`TaskStep`](Types.md#taskstep)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:80](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L80)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L78)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L83)

##### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L82)

##### timestamp

> **timestamp**: `number`

Defined in: [packages/core/src/core/types/index.ts:81](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L81)

##### type

> **type**: [`StepType`](Types.md#steptype)

Defined in: [packages/core/src/core/types/index.ts:79](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L79)

***

### ChainOfThoughtContext

Defined in: [packages/core/src/core/types/index.ts:9](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L9)

ChainOfThoughtContext can hold any relevant data
the LLM or game might need to keep track of during reasoning.

#### Properties

##### actionHistory?

> `optional` **actionHistory**: `Record`\<`number`, \{ `action`: [`CoTAction`](Types.md#cotaction); `result`: `string`; \}\>

Defined in: [packages/core/src/core/types/index.ts:12](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L12)

##### pastExperiences?

> `optional` **pastExperiences**: [`EpisodicMemory`](Types.md#episodicmemory)[]

Defined in: [packages/core/src/core/types/index.ts:19](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L19)

##### relevantKnowledge?

> `optional` **relevantKnowledge**: [`Documentation`](Types.md#documentation)[]

Defined in: [packages/core/src/core/types/index.ts:20](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L20)

##### worldState

> **worldState**: `string`

Defined in: [packages/core/src/core/types/index.ts:11](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L11)

***

### ChainOfThoughtEvents

Defined in: [packages/core/src/core/types/index.ts:197](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L197)

#### Properties

##### action:complete()

> **action:complete**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:200](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L200)

###### Parameters

###### data

###### action

[`CoTAction`](Types.md#cotaction)

###### result

`string`

###### Returns

`void`

##### action:error()

> **action:error**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:201](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L201)

###### Parameters

###### data

###### action

[`CoTAction`](Types.md#cotaction)

###### error

`unknown`

###### Returns

`void`

##### action:start()

> **action:start**: (`action`) => `void`

Defined in: [packages/core/src/core/types/index.ts:199](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L199)

###### Parameters

###### action

[`CoTAction`](Types.md#cotaction)

###### Returns

`void`

##### goal:blocked()

> **goal:blocked**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:214](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L214)

###### Parameters

###### goal

###### id

`string`

###### reason

`string`

###### Returns

`void`

##### goal:completed()

> **goal:completed**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:211](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L211)

###### Parameters

###### goal

###### id

`string`

###### result

`any`

###### Returns

`void`

##### goal:created()

> **goal:created**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:209](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L209)

###### Parameters

###### goal

###### description

`string`

###### id

`string`

###### Returns

`void`

##### goal:failed()

> **goal:failed**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:212](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L212)

###### Parameters

###### goal

###### error

`unknown`

###### id

`string`

###### Returns

`void`

##### goal:started()

> **goal:started**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:213](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L213)

###### Parameters

###### goal

###### description

`string`

###### id

`string`

###### Returns

`void`

##### goal:updated()

> **goal:updated**: (`goal`) => `void`

Defined in: [packages/core/src/core/types/index.ts:210](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L210)

###### Parameters

###### goal

###### id

`string`

###### status

[`GoalStatus`](Types.md#goalstatus)

###### Returns

`void`

##### memory:experience\_retrieved()

> **memory:experience\_retrieved**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:217](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L217)

###### Parameters

###### data

###### experiences

[`EpisodicMemory`](Types.md#episodicmemory)[]

###### Returns

`void`

##### memory:experience\_stored()

> **memory:experience\_stored**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:215](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L215)

###### Parameters

###### data

###### experience

[`EpisodicMemory`](Types.md#episodicmemory)

###### Returns

`void`

##### memory:knowledge\_retrieved()

> **memory:knowledge\_retrieved**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:220](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L220)

###### Parameters

###### data

###### documents

[`Documentation`](Types.md#documentation)[]

###### Returns

`void`

##### memory:knowledge\_stored()

> **memory:knowledge\_stored**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:216](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L216)

###### Parameters

###### data

###### document

[`Documentation`](Types.md#documentation)

###### Returns

`void`

##### step()

> **step**: (`step`) => `void`

Defined in: [packages/core/src/core/types/index.ts:198](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L198)

###### Parameters

###### step

[`Step`](Types.md#step-1)

###### Returns

`void`

##### think:complete()

> **think:complete**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:206](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L206)

###### Parameters

###### data

###### query

`string`

###### Returns

`void`

##### think:error()

> **think:error**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:208](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L208)

###### Parameters

###### data

###### error

`unknown`

###### query

`string`

###### Returns

`void`

##### think:start()

> **think:start**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:205](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L205)

###### Parameters

###### data

###### query

`string`

###### Returns

`void`

##### think:timeout()

> **think:timeout**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:207](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L207)

###### Parameters

###### data

###### query

`string`

###### Returns

`void`

##### trace:tokens()

> **trace:tokens**: (`data`) => `void`

Defined in: [packages/core/src/core/types/index.ts:223](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L223)

###### Parameters

###### data

###### input

`number`

###### output

`number`

###### Returns

`void`

***

### Character

Defined in: [packages/core/src/core/types/index.ts:267](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L267)

#### Properties

##### bio

> **bio**: `string`

Defined in: [packages/core/src/core/types/index.ts:269](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L269)

##### instructions

> **instructions**: [`CharacterInstructions`](Types.md#characterinstructions)

Defined in: [packages/core/src/core/types/index.ts:272](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L272)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:268](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L268)

##### templates?

> `optional` **templates**: `object`

Defined in: [packages/core/src/core/types/index.ts:274](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L274)

###### replyTemplate?

> `optional` **replyTemplate**: `string`

###### thoughtTemplate?

> `optional` **thoughtTemplate**: `string`

###### tweetTemplate?

> `optional` **tweetTemplate**: `string`

##### traits

> **traits**: [`CharacterTrait`](Types.md#charactertrait)[]

Defined in: [packages/core/src/core/types/index.ts:270](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L270)

##### voice

> **voice**: [`CharacterVoice`](Types.md#charactervoice)

Defined in: [packages/core/src/core/types/index.ts:271](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L271)

***

### CharacterInstructions

Defined in: [packages/core/src/core/types/index.ts:259](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L259)

#### Properties

##### constraints

> **constraints**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:261](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L261)

##### contextRules

> **contextRules**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:264](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L264)

##### goals

> **goals**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:260](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L260)

##### responseStyle

> **responseStyle**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:263](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L263)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:262](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L262)

***

### CharacterTrait

Defined in: [packages/core/src/core/types/index.ts:244](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L244)

#### Properties

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:246](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L246)

##### examples

> **examples**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:248](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L248)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:245](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L245)

##### strength

> **strength**: `number`

Defined in: [packages/core/src/core/types/index.ts:247](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L247)

***

### CharacterVoice

Defined in: [packages/core/src/core/types/index.ts:251](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L251)

#### Properties

##### commonPhrases

> **commonPhrases**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:255](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L255)

##### emojis

> **emojis**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:256](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L256)

##### style

> **style**: `string`

Defined in: [packages/core/src/core/types/index.ts:253](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L253)

##### tone

> **tone**: `string`

Defined in: [packages/core/src/core/types/index.ts:252](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L252)

##### vocabulary

> **vocabulary**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:254](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L254)

***

### Cluster

Defined in: [packages/core/src/core/types/index.ts:434](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L434)

#### Extended by

- [`HierarchicalCluster`](Types.md#hierarchicalcluster)

#### Properties

##### centroid?

> `optional` **centroid**: `number`[]

Defined in: [packages/core/src/core/types/index.ts:438](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L438)

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:437](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L437)

##### documentCount

> **documentCount**: `number`

Defined in: [packages/core/src/core/types/index.ts:440](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L440)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:435](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L435)

##### lastUpdated

> **lastUpdated**: `Date`

Defined in: [packages/core/src/core/types/index.ts:441](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L441)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:436](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L436)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:439](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L439)

***

### ClusterMetadata

Defined in: [packages/core/src/core/types/index.ts:444](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L444)

#### Extended by

- [`DocumentClusterMetadata`](Types.md#documentclustermetadata)
- [`EpisodeClusterMetadata`](Types.md#episodeclustermetadata)

#### Properties

##### clusterId

> **clusterId**: `string`

Defined in: [packages/core/src/core/types/index.ts:445](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L445)

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:446](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L446)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:447](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L447)

***

### ClusterStats

Defined in: [packages/core/src/core/types/index.ts:450](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L450)

#### Properties

##### averageDistance

> **averageDistance**: `number`

Defined in: [packages/core/src/core/types/index.ts:453](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L453)

##### memberCount

> **memberCount**: `number`

Defined in: [packages/core/src/core/types/index.ts:452](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L452)

##### variance

> **variance**: `number`

Defined in: [packages/core/src/core/types/index.ts:451](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L451)

***

### ClusterUpdate

Defined in: [packages/core/src/core/types/index.ts:456](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L456)

#### Properties

##### documentCount

> **documentCount**: `number`

Defined in: [packages/core/src/core/types/index.ts:458](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L458)

##### newCentroid?

> `optional` **newCentroid**: `number`[]

Defined in: [packages/core/src/core/types/index.ts:457](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L457)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:459](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L459)

##### variance?

> `optional` **variance**: `number`

Defined in: [packages/core/src/core/types/index.ts:460](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L460)

***

### CoTAction

Defined in: [packages/core/src/core/types/index.ts:27](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L27)

Data necessary for a particular action type.
Extend this to fit your actual logic.

#### Properties

##### context

> **context**: `string`

Defined in: [packages/core/src/core/types/index.ts:29](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L29)

##### payload

> **payload**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:30](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L30)

##### type

> **type**: `string`

Defined in: [packages/core/src/core/types/index.ts:28](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L28)

***

### Documentation

Defined in: [packages/core/src/core/types/index.ts:423](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L423)

#### Properties

##### category

> **category**: `string`

Defined in: [packages/core/src/core/types/index.ts:427](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L427)

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:426](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L426)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:424](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L424)

##### lastUpdated

> **lastUpdated**: `Date`

Defined in: [packages/core/src/core/types/index.ts:429](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L429)

##### relatedIds?

> `optional` **relatedIds**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:431](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L431)

##### source?

> `optional` **source**: `string`

Defined in: [packages/core/src/core/types/index.ts:430](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L430)

##### tags

> **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:428](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L428)

##### title

> **title**: `string`

Defined in: [packages/core/src/core/types/index.ts:425](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L425)

***

### DocumentClusterMetadata

Defined in: [packages/core/src/core/types/index.ts:463](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L463)

#### Extends

- [`ClusterMetadata`](Types.md#clustermetadata)

#### Properties

##### category

> **category**: `string`

Defined in: [packages/core/src/core/types/index.ts:464](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L464)

##### clusterId

> **clusterId**: `string`

Defined in: [packages/core/src/core/types/index.ts:445](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L445)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`clusterId`](Types.md#clusterid)

##### commonTags

> **commonTags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:465](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L465)

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:446](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L446)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`confidence`](Types.md#confidence)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:447](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L447)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`topics`](Types.md#topics-2)

***

### DomainMetadata

Defined in: [packages/core/src/core/types/index.ts:481](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L481)

#### Properties

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:484](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L484)

##### domain

> **domain**: `string`

Defined in: [packages/core/src/core/types/index.ts:482](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L482)

##### subDomain?

> `optional` **subDomain**: `string`

Defined in: [packages/core/src/core/types/index.ts:483](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L483)

***

### EnrichedContent

Defined in: [packages/core/src/core/types/index.ts:316](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L316)

#### Properties

##### context

> **context**: [`EnrichedContext`](Types.md#enrichedcontext)

Defined in: [packages/core/src/core/types/index.ts:319](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L319)

##### originalContent

> **originalContent**: `string`

Defined in: [packages/core/src/core/types/index.ts:317](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L317)

##### timestamp

> **timestamp**: `Date`

Defined in: [packages/core/src/core/types/index.ts:318](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L318)

***

### EnrichedContext

Defined in: [packages/core/src/core/types/index.ts:303](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L303)

#### Properties

##### availableOutputs?

> `optional` **availableOutputs**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:313](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L313)

##### entities?

> `optional` **entities**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:309](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L309)

##### intent?

> `optional` **intent**: `string`

Defined in: [packages/core/src/core/types/index.ts:310](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L310)

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:312](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L312)

##### relatedMemories

> **relatedMemories**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:307](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L307)

##### sentiment?

> `optional` **sentiment**: `string`

Defined in: [packages/core/src/core/types/index.ts:308](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L308)

##### similarMessages?

> `optional` **similarMessages**: `any`[]

Defined in: [packages/core/src/core/types/index.ts:311](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L311)

##### summary

> **summary**: `string`

Defined in: [packages/core/src/core/types/index.ts:305](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L305)

##### timeContext

> **timeContext**: `string`

Defined in: [packages/core/src/core/types/index.ts:304](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L304)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:306](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L306)

***

### EpisodeClusterMetadata

Defined in: [packages/core/src/core/types/index.ts:468](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L468)

#### Extends

- [`ClusterMetadata`](Types.md#clustermetadata)

#### Properties

##### averageImportance

> **averageImportance**: `number`

Defined in: [packages/core/src/core/types/index.ts:470](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L470)

##### clusterId

> **clusterId**: `string`

Defined in: [packages/core/src/core/types/index.ts:445](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L445)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`clusterId`](Types.md#clusterid)

##### commonEmotions

> **commonEmotions**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:469](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L469)

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:446](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L446)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`confidence`](Types.md#confidence)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:447](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L447)

###### Inherited from

[`ClusterMetadata`](Types.md#clustermetadata).[`topics`](Types.md#topics-2)

***

### EpisodicMemory

Defined in: [packages/core/src/core/types/index.ts:413](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L413)

#### Properties

##### action

> **action**: `string`

Defined in: [packages/core/src/core/types/index.ts:416](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L416)

##### context?

> `optional` **context**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:418](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L418)

##### emotions?

> `optional` **emotions**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:419](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L419)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:414](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L414)

##### importance?

> `optional` **importance**: `number`

Defined in: [packages/core/src/core/types/index.ts:420](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L420)

##### outcome

> **outcome**: `string`

Defined in: [packages/core/src/core/types/index.ts:417](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L417)

##### timestamp

> **timestamp**: `Date`

Defined in: [packages/core/src/core/types/index.ts:415](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L415)

***

### Goal

Defined in: [packages/core/src/core/types/index.ts:128](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L128)

#### Properties

##### completed\_at?

> `optional` **completed\_at**: `number`

Defined in: [packages/core/src/core/types/index.ts:139](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L139)

##### created\_at

> **created\_at**: `number`

Defined in: [packages/core/src/core/types/index.ts:138](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L138)

##### dependencies?

> `optional` **dependencies**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:134](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L134)

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:131](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L131)

##### horizon

> **horizon**: [`HorizonType`](Types.md#horizontype)

Defined in: [packages/core/src/core/types/index.ts:130](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L130)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:129](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L129)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:141](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L141)

##### outcomeScore?

> `optional` **outcomeScore**: `number`

Defined in: [packages/core/src/core/types/index.ts:147](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L147)

A numeric measure of how successful this goal was completed.
You can define any scale you like: e.g. 0-1, or 0-100, or a positive/negative integer.

##### parentGoal?

> `optional` **parentGoal**: `string`

Defined in: [packages/core/src/core/types/index.ts:136](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L136)

##### priority

> **priority**: `number`

Defined in: [packages/core/src/core/types/index.ts:133](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L133)

##### progress?

> `optional` **progress**: `number`

Defined in: [packages/core/src/core/types/index.ts:140](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L140)

##### scoreHistory?

> `optional` **scoreHistory**: `object`[]

Defined in: [packages/core/src/core/types/index.ts:152](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L152)

Optional history of scores over time, if you want to track multiple attempts or partial runs.

###### comment?

> `optional` **comment**: `string`

###### score

> **score**: `number`

###### timestamp

> **timestamp**: `number`

##### status

> **status**: [`GoalStatus`](Types.md#goalstatus)

Defined in: [packages/core/src/core/types/index.ts:132](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L132)

##### subgoals?

> `optional` **subgoals**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:135](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L135)

##### success\_criteria

> **success\_criteria**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:137](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L137)

***

### HierarchicalCluster

Defined in: [packages/core/src/core/types/index.ts:473](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L473)

#### Extends

- [`Cluster`](Types.md#cluster)

#### Properties

##### centroid?

> `optional` **centroid**: `number`[]

Defined in: [packages/core/src/core/types/index.ts:438](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L438)

###### Inherited from

[`Cluster`](Types.md#cluster).[`centroid`](Types.md#centroid)

##### childIds

> **childIds**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:475](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L475)

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:437](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L437)

###### Inherited from

[`Cluster`](Types.md#cluster).[`description`](Types.md#description-1)

##### documentCount

> **documentCount**: `number`

Defined in: [packages/core/src/core/types/index.ts:440](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L440)

###### Inherited from

[`Cluster`](Types.md#cluster).[`documentCount`](Types.md#documentcount)

##### domain

> **domain**: `string`

Defined in: [packages/core/src/core/types/index.ts:477](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L477)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:435](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L435)

###### Inherited from

[`Cluster`](Types.md#cluster).[`id`](Types.md#id-2)

##### lastUpdated

> **lastUpdated**: `Date`

Defined in: [packages/core/src/core/types/index.ts:441](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L441)

###### Inherited from

[`Cluster`](Types.md#cluster).[`lastUpdated`](Types.md#lastupdated)

##### level

> **level**: `number`

Defined in: [packages/core/src/core/types/index.ts:476](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L476)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:436](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L436)

###### Inherited from

[`Cluster`](Types.md#cluster).[`name`](Types.md#name-2)

##### parentId?

> `optional` **parentId**: `string`

Defined in: [packages/core/src/core/types/index.ts:474](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L474)

##### subDomain?

> `optional` **subDomain**: `string`

Defined in: [packages/core/src/core/types/index.ts:478](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L478)

##### topics

> **topics**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:439](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L439)

###### Inherited from

[`Cluster`](Types.md#cluster).[`topics`](Types.md#topics-1)

***

### IChain

Defined in: [packages/core/src/core/types/index.ts:487](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L487)

#### Properties

##### chainId

> **chainId**: `string`

Defined in: [packages/core/src/core/types/index.ts:491](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L491)

A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)

#### Methods

##### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/types/index.ts:497](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L497)

Read (call) a contract or perform a query on this chain.
The `call` parameter can be chain-specific data.

###### Parameters

###### call

`unknown`

###### Returns

`Promise`\<`any`\>

##### write()

> **write**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/types/index.ts:502](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L502)

Write (execute a transaction) on this chain, typically requiring signatures, etc.

###### Parameters

###### call

`unknown`

###### Returns

`Promise`\<`any`\>

***

### IOHandler

Defined in: [packages/core/src/core/types/index.ts:514](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L514)

A single interface for all Inputs, Outputs.

#### Properties

##### handler()

> **handler**: (`payload`?) => `Promise`\<`unknown`\>

Defined in: [packages/core/src/core/types/index.ts:525](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L525)

The main function. For inputs, no payload is typically passed. For outputs, pass the data.

###### Parameters

###### payload?

`unknown`

###### Returns

`Promise`\<`unknown`\>

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:516](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L516)

Unique name for this handler

##### role

> **role**: [`HandlerRole`](Types.md#handlerrole)

Defined in: [packages/core/src/core/types/index.ts:519](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L519)

"input" | "output" | (optionally "action") if you want more roles

##### schema

> **schema**: `ZodType`

Defined in: [packages/core/src/core/types/index.ts:522](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L522)

The schema for the input handler

***

### LLMClientConfig

Defined in: [packages/core/src/core/types/index.ts:170](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L170)

#### Properties

##### baseDelay?

> `optional` **baseDelay**: `number`

Defined in: [packages/core/src/core/types/index.ts:176](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L176)

##### maxDelay?

> `optional` **maxDelay**: `number`

Defined in: [packages/core/src/core/types/index.ts:177](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L177)

##### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [packages/core/src/core/types/index.ts:172](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L172)

##### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [packages/core/src/core/types/index.ts:175](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L175)

##### model?

> `optional` **model**: `string`

Defined in: [packages/core/src/core/types/index.ts:171](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L171)

##### temperature?

> `optional` **temperature**: `number`

Defined in: [packages/core/src/core/types/index.ts:174](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L174)

##### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/core/src/core/types/index.ts:173](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L173)

***

### LLMResponse

Defined in: [packages/core/src/core/types/index.ts:159](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L159)

#### Properties

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/core/types/index.ts:167](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L167)

##### model

> **model**: `string`

Defined in: [packages/core/src/core/types/index.ts:161](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L161)

##### text

> **text**: `string`

Defined in: [packages/core/src/core/types/index.ts:160](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L160)

##### usage?

> `optional` **usage**: `object`

Defined in: [packages/core/src/core/types/index.ts:162](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L162)

###### completion\_tokens

> **completion\_tokens**: `number`

###### prompt\_tokens

> **prompt\_tokens**: `number`

###### total\_tokens

> **total\_tokens**: `number`

***

### LLMStructuredResponse

Defined in: [packages/core/src/core/types/index.ts:33](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L33)

#### Properties

##### actions

> **actions**: [`CoTAction`](Types.md#cotaction)[]

Defined in: [packages/core/src/core/types/index.ts:41](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L41)

##### meta?

> `optional` **meta**: `object`

Defined in: [packages/core/src/core/types/index.ts:35](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L35)

###### requirements?

> `optional` **requirements**: `object`

###### requirements.population?

> `optional` **population**: `number`

###### requirements.resources?

> `optional` **resources**: `Record`\<`string`, `number`\>

##### plan?

> `optional` **plan**: `string`

Defined in: [packages/core/src/core/types/index.ts:34](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L34)

***

### LLMValidationOptions\<T\>

Defined in: [packages/core/src/core/types/index.ts:234](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L234)

#### Type Parameters

• **T**

#### Properties

##### llmClient

> **llmClient**: [`LLMClient`](../globals.md#llmclient-1)

Defined in: [packages/core/src/core/types/index.ts:240](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L240)

##### logger

> **logger**: [`Logger`](../globals.md#logger-1)

Defined in: [packages/core/src/core/types/index.ts:241](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L241)

##### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [packages/core/src/core/types/index.ts:238](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L238)

##### onRetry()?

> `optional` **onRetry**: (`error`, `attempt`) => `void`

Defined in: [packages/core/src/core/types/index.ts:239](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L239)

###### Parameters

###### error

`Error`

###### attempt

`number`

###### Returns

`void`

##### prompt

> **prompt**: `string`

Defined in: [packages/core/src/core/types/index.ts:235](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L235)

##### schema

> **schema**: `ZodType`\<`T`, `T`\>

Defined in: [packages/core/src/core/types/index.ts:237](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L237)

##### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/core/src/core/types/index.ts:236](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L236)

***

### LogEntry

Defined in: [packages/core/src/core/types/index.ts:67](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L67)

#### Properties

##### context

> **context**: `string`

Defined in: [packages/core/src/core/types/index.ts:70](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L70)

##### data?

> `optional` **data**: `any`

Defined in: [packages/core/src/core/types/index.ts:72](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L72)

##### level

> **level**: [`LogLevel`](Types.md#loglevel)

Defined in: [packages/core/src/core/types/index.ts:68](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L68)

##### message

> **message**: `string`

Defined in: [packages/core/src/core/types/index.ts:71](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L71)

##### timestamp

> **timestamp**: `Date`

Defined in: [packages/core/src/core/types/index.ts:69](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L69)

***

### LoggerConfig

Defined in: [packages/core/src/core/types/index.ts:59](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L59)

#### Properties

##### enableColors?

> `optional` **enableColors**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:62](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L62)

##### enableTimestamp?

> `optional` **enableTimestamp**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:61](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L61)

##### level

> **level**: [`LogLevel`](Types.md#loglevel)

Defined in: [packages/core/src/core/types/index.ts:60](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L60)

##### logPath?

> `optional` **logPath**: `string`

Defined in: [packages/core/src/core/types/index.ts:64](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L64)

##### logToFile?

> `optional` **logToFile**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:63](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L63)

***

### Memory

Defined in: [packages/core/src/core/types/index.ts:356](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L356)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:359](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L359)

##### embedding?

> `optional` **embedding**: `number`[]

Defined in: [packages/core/src/core/types/index.ts:362](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L362)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:357](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L357)

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:361](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L361)

##### roomId

> **roomId**: `string`

Defined in: [packages/core/src/core/types/index.ts:358](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L358)

##### timestamp

> **timestamp**: `Date`

Defined in: [packages/core/src/core/types/index.ts:360](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L360)

***

### PlanningStep

Defined in: [packages/core/src/core/types/index.ts:100](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L100)

#### Extends

- [`BaseStep`](Types.md#basestep)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:80](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L80)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`content`](Types.md#content-1)

##### facts

> **facts**: `string`

Defined in: [packages/core/src/core/types/index.ts:103](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L103)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L78)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`id`](Types.md#id-1)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L83)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`meta`](Types.md#meta-1)

##### plan

> **plan**: `string`

Defined in: [packages/core/src/core/types/index.ts:102](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L102)

##### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L82)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`tags`](Types.md#tags-1)

##### timestamp

> **timestamp**: `number`

Defined in: [packages/core/src/core/types/index.ts:81](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L81)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`timestamp`](Types.md#timestamp-1)

##### type

> **type**: `"planning"`

Defined in: [packages/core/src/core/types/index.ts:101](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L101)

###### Overrides

[`BaseStep`](Types.md#basestep).[`type`](Types.md#type-1)

***

### ProcessedResult

Defined in: [packages/core/src/core/types/index.ts:281](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L281)

#### Properties

##### alreadyProcessed?

> `optional` **alreadyProcessed**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:287](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L287)

##### content

> **content**: `any`

Defined in: [packages/core/src/core/types/index.ts:282](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L282)

##### enrichedContext

> **enrichedContext**: [`EnrichedContext`](Types.md#enrichedcontext)

Defined in: [packages/core/src/core/types/index.ts:284](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L284)

##### isOutputSuccess?

> `optional` **isOutputSuccess**: `boolean`

Defined in: [packages/core/src/core/types/index.ts:286](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L286)

##### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:283](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L283)

##### suggestedOutputs

> **suggestedOutputs**: [`SuggestedOutput`](Types.md#suggestedoutputt)\<`any`\>[]

Defined in: [packages/core/src/core/types/index.ts:285](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L285)

##### updateTasks?

> `optional` **updateTasks**: `object`[]

Defined in: [packages/core/src/core/types/index.ts:288](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L288)

###### confidence

> **confidence**: `number`

###### data?

> `optional` **data**: `any`

###### intervalMs

> **intervalMs**: `number`

###### name

> **name**: `string`

***

### RefinedGoal

Defined in: [packages/core/src/core/types/index.ts:226](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L226)

#### Properties

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:227](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L227)

##### horizon

> **horizon**: `"short"`

Defined in: [packages/core/src/core/types/index.ts:230](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L230)

##### priority

> **priority**: `number`

Defined in: [packages/core/src/core/types/index.ts:229](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L229)

##### requirements

> **requirements**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:231](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L231)

##### success\_criteria

> **success\_criteria**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:228](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L228)

***

### RoomMetadata

Defined in: [packages/core/src/core/types/index.ts:347](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L347)

#### Properties

##### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/core/types/index.ts:351](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L351)

##### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:349](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L349)

##### lastActive

> **lastActive**: `Date`

Defined in: [packages/core/src/core/types/index.ts:352](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L352)

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:353](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L353)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:348](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L348)

##### participants

> **participants**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:350](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L350)

***

### SearchResult

Defined in: [packages/core/src/core/types/index.ts:44](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L44)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:46](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L46)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:45](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L45)

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:48](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L48)

##### similarity

> **similarity**: `number`

Defined in: [packages/core/src/core/types/index.ts:47](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L47)

***

### StructuredAnalysis

Defined in: [packages/core/src/core/types/index.ts:188](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L188)

#### Properties

##### caveats

> **caveats**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:193](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L193)

##### conclusion

> **conclusion**: `string`

Defined in: [packages/core/src/core/types/index.ts:191](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L191)

##### confidenceLevel

> **confidenceLevel**: `number`

Defined in: [packages/core/src/core/types/index.ts:192](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L192)

##### reasoning

> **reasoning**: `string`

Defined in: [packages/core/src/core/types/index.ts:190](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L190)

##### summary

> **summary**: `string`

Defined in: [packages/core/src/core/types/index.ts:189](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L189)

***

### SuggestedOutput\<T\>

Defined in: [packages/core/src/core/types/index.ts:296](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L296)

#### Type Parameters

• **T**

#### Properties

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:299](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L299)

##### data

> **data**: `T`

Defined in: [packages/core/src/core/types/index.ts:298](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L298)

##### name

> **name**: `string`

Defined in: [packages/core/src/core/types/index.ts:297](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L297)

##### reasoning

> **reasoning**: `string`

Defined in: [packages/core/src/core/types/index.ts:300](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L300)

***

### SystemStep

Defined in: [packages/core/src/core/types/index.ts:106](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L106)

#### Extends

- [`BaseStep`](Types.md#basestep)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:80](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L80)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`content`](Types.md#content-1)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L78)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`id`](Types.md#id-1)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L83)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`meta`](Types.md#meta-1)

##### systemPrompt

> **systemPrompt**: `string`

Defined in: [packages/core/src/core/types/index.ts:108](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L108)

##### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L82)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`tags`](Types.md#tags-1)

##### timestamp

> **timestamp**: `number`

Defined in: [packages/core/src/core/types/index.ts:81](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L81)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`timestamp`](Types.md#timestamp-1)

##### type

> **type**: `"system"`

Defined in: [packages/core/src/core/types/index.ts:107](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L107)

###### Overrides

[`BaseStep`](Types.md#basestep).[`type`](Types.md#type-1)

***

### TaskStep

Defined in: [packages/core/src/core/types/index.ts:111](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L111)

#### Extends

- [`BaseStep`](Types.md#basestep)

#### Properties

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:80](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L80)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`content`](Types.md#content-1)

##### id

> **id**: `string`

Defined in: [packages/core/src/core/types/index.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L78)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`id`](Types.md#id-1)

##### meta?

> `optional` **meta**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L83)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`meta`](Types.md#meta-1)

##### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/core/types/index.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L82)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`tags`](Types.md#tags-1)

##### task

> **task**: `string`

Defined in: [packages/core/src/core/types/index.ts:113](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L113)

##### timestamp

> **timestamp**: `number`

Defined in: [packages/core/src/core/types/index.ts:81](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L81)

###### Inherited from

[`BaseStep`](Types.md#basestep).[`timestamp`](Types.md#timestamp-1)

##### type

> **type**: `"task"`

Defined in: [packages/core/src/core/types/index.ts:112](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L112)

###### Overrides

[`BaseStep`](Types.md#basestep).[`type`](Types.md#type-1)

***

### Thought

Defined in: [packages/core/src/core/types/index.ts:322](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L322)

#### Properties

##### confidence

> **confidence**: `number`

Defined in: [packages/core/src/core/types/index.ts:324](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L324)

##### content

> **content**: `string`

Defined in: [packages/core/src/core/types/index.ts:323](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L323)

##### context?

> `optional` **context**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:325](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L325)

##### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/core/types/index.ts:329](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L329)

##### roomId?

> `optional` **roomId**: `string`

Defined in: [packages/core/src/core/types/index.ts:330](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L330)

##### source

> **source**: `string`

Defined in: [packages/core/src/core/types/index.ts:328](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L328)

##### timestamp

> **timestamp**: `Date`

Defined in: [packages/core/src/core/types/index.ts:326](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L326)

##### type

> **type**: `string`

Defined in: [packages/core/src/core/types/index.ts:327](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L327)

***

### ThoughtTemplate

Defined in: [packages/core/src/core/types/index.ts:340](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L340)

#### Properties

##### description

> **description**: `string`

Defined in: [packages/core/src/core/types/index.ts:342](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L342)

##### prompt

> **prompt**: `string`

Defined in: [packages/core/src/core/types/index.ts:343](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L343)

##### temperature

> **temperature**: `number`

Defined in: [packages/core/src/core/types/index.ts:344](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L344)

##### type

> **type**: [`ThoughtType`](Types.md#thoughttype)

Defined in: [packages/core/src/core/types/index.ts:341](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L341)

***

### VectorDB

Defined in: [packages/core/src/core/types/index.ts:365](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L365)

#### Methods

##### delete()

> **delete**(`id`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:374](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L374)

###### Parameters

###### id

`string`

###### Returns

`Promise`\<`void`\>

##### findSimilar()

> **findSimilar**(`content`, `limit`?, `metadata`?): `Promise`\<[`SearchResult`](Types.md#searchresult)[]\>

Defined in: [packages/core/src/core/types/index.ts:366](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L366)

###### Parameters

###### content

`string`

###### limit?

`number`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<[`SearchResult`](Types.md#searchresult)[]\>

##### findSimilarDocuments()

> **findSimilarDocuments**(`query`, `limit`?): `Promise`\<[`Documentation`](Types.md#documentation)[]\>

Defined in: [packages/core/src/core/types/index.ts:400](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L400)

###### Parameters

###### query

`string`

###### limit?

`number`

###### Returns

`Promise`\<[`Documentation`](Types.md#documentation)[]\>

##### findSimilarEpisodes()

> **findSimilarEpisodes**(`action`, `limit`?): `Promise`\<[`EpisodicMemory`](Types.md#episodicmemory)[]\>

Defined in: [packages/core/src/core/types/index.ts:393](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L393)

###### Parameters

###### action

`string`

###### limit?

`number`

###### Returns

`Promise`\<[`EpisodicMemory`](Types.md#episodicmemory)[]\>

##### findSimilarInRoom()

> **findSimilarInRoom**(`content`, `roomId`, `limit`?, `metadata`?): `Promise`\<[`SearchResult`](Types.md#searchresult)[]\>

Defined in: [packages/core/src/core/types/index.ts:382](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L382)

###### Parameters

###### content

`string`

###### roomId

`string`

###### limit?

`number`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<[`SearchResult`](Types.md#searchresult)[]\>

##### getRecentEpisodes()

> **getRecentEpisodes**(`limit`?): `Promise`\<[`EpisodicMemory`](Types.md#episodicmemory)[]\>

Defined in: [packages/core/src/core/types/index.ts:397](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L397)

###### Parameters

###### limit?

`number`

###### Returns

`Promise`\<[`EpisodicMemory`](Types.md#episodicmemory)[]\>

##### getSystemMetadata()

> **getSystemMetadata**(`key`): `Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Defined in: [packages/core/src/core/types/index.ts:390](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L390)

###### Parameters

###### key

`string`

###### Returns

`Promise`\<`null` \| `Record`\<`string`, `any`\>\>

##### purge()

> **purge**(): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:410](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L410)

###### Returns

`Promise`\<`void`\>

##### searchDocumentsByTag()

> **searchDocumentsByTag**(`tags`, `limit`?): `Promise`\<[`Documentation`](Types.md#documentation)[]\>

Defined in: [packages/core/src/core/types/index.ts:404](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L404)

###### Parameters

###### tags

`string`[]

###### limit?

`number`

###### Returns

`Promise`\<[`Documentation`](Types.md#documentation)[]\>

##### store()

> **store**(`content`, `metadata`?): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:372](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L372)

###### Parameters

###### content

`string`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<`void`\>

##### storeDocument()

> **storeDocument**(`doc`): `Promise`\<`string`\>

Defined in: [packages/core/src/core/types/index.ts:399](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L399)

###### Parameters

###### doc

`Omit`\<[`Documentation`](Types.md#documentation), `"id"`\>

###### Returns

`Promise`\<`string`\>

##### storeEpisode()

> **storeEpisode**(`memory`): `Promise`\<`string`\>

Defined in: [packages/core/src/core/types/index.ts:392](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L392)

###### Parameters

###### memory

`Omit`\<[`EpisodicMemory`](Types.md#episodicmemory), `"id"`\>

###### Returns

`Promise`\<`string`\>

##### storeInRoom()

> **storeInRoom**(`content`, `roomId`, `metadata`?): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:376](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L376)

###### Parameters

###### content

`string`

###### roomId

`string`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<`void`\>

##### storeSystemMetadata()

> **storeSystemMetadata**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:389](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L389)

###### Parameters

###### key

`string`

###### value

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<`void`\>

##### updateDocument()

> **updateDocument**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/types/index.ts:408](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L408)

###### Parameters

###### id

`string`

###### updates

`Partial`\<[`Documentation`](Types.md#documentation)\>

###### Returns

`Promise`\<`void`\>

## Type Aliases

### GoalStatus

> **GoalStatus**: `"pending"` \| `"active"` \| `"completed"` \| `"failed"` \| `"ready"` \| `"blocked"`

Defined in: [packages/core/src/core/types/index.ts:119](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L119)

***

### HorizonType

> **HorizonType**: `"long"` \| `"medium"` \| `"short"`

Defined in: [packages/core/src/core/types/index.ts:118](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L118)

***

### Step

> **Step**: [`ActionStep`](Types.md#actionstep) \| [`PlanningStep`](Types.md#planningstep) \| [`SystemStep`](Types.md#systemstep) \| [`TaskStep`](Types.md#taskstep)

Defined in: [packages/core/src/core/types/index.ts:116](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L116)

***

### StepType

> **StepType**: `"action"` \| `"planning"` \| `"system"` \| `"task"`

Defined in: [packages/core/src/core/types/index.ts:75](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L75)

***

### ThoughtType

> **ThoughtType**: `"social_share"` \| `"research"` \| `"analysis"` \| `"alert"` \| `"inquiry"`

Defined in: [packages/core/src/core/types/index.ts:333](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/types/index.ts#L333)
