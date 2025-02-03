# @daydreamsai/core

## Classes

### `abstract` BaseProcessor

Defined in: [packages/core/src/core/processor.ts:13](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L13)

Base abstract class for content processors that handle different types of input
and generate appropriate responses using LLM.

#### Extended by

- [`MessageProcessor`](namespaces/Processors.md#messageprocessor)
- [`ResearchQuantProcessor`](namespaces/Processors.md#researchquantprocessor)

#### Constructors

##### new BaseProcessor()

> **new BaseProcessor**(`metadata`, `loggerLevel`, `character`, `llmClient`, `contentLimit`): [`BaseProcessor`](globals.md#baseprocessor)

Defined in: [packages/core/src/core/processor.ts:24](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L24)

Creates a new BaseProcessor instance

###### Parameters

###### metadata

Metadata about this processor including name and description

###### description

`string`

###### name

`string`

###### loggerLevel

[`LogLevel`](namespaces/Types.md#loglevel) = `LogLevel.ERROR`

The logging level to use

###### character

[`Character`](namespaces/Types.md#character)

The character personality to use for responses

###### llmClient

[`LLMClient`](globals.md#llmclient-1)

The LLM client instance to use for processing

###### contentLimit

`number` = `1000`

###### Returns

[`BaseProcessor`](globals.md#baseprocessor)

#### Properties

##### character

> `protected` **character**: [`Character`](namespaces/Types.md#character)

Defined in: [packages/core/src/core/processor.ts:27](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L27)

The character personality to use for responses

##### contentLimit

> `protected` **contentLimit**: `number` = `1000`

Defined in: [packages/core/src/core/processor.ts:29](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L29)

##### llmClient

> `protected` **llmClient**: [`LLMClient`](globals.md#llmclient-1)

Defined in: [packages/core/src/core/processor.ts:28](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L28)

The LLM client instance to use for processing

##### logger

> `protected` **logger**: [`Logger`](globals.md#logger-1)

Defined in: [packages/core/src/core/processor.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L15)

Logger instance for this processor

##### loggerLevel

> `protected` **loggerLevel**: [`LogLevel`](namespaces/Types.md#loglevel) = `LogLevel.ERROR`

Defined in: [packages/core/src/core/processor.ts:26](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L26)

The logging level to use

##### metadata

> `protected` **metadata**: `object`

Defined in: [packages/core/src/core/processor.ts:25](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L25)

Metadata about this processor including name and description

###### description

> **description**: `string`

###### name

> **name**: `string`

#### Methods

##### canHandle()

> `abstract` **canHandle**(`content`): `boolean`

Defined in: [packages/core/src/core/processor.ts:51](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L51)

Determines if this processor can handle the given content.

###### Parameters

###### content

`any`

The content to check

###### Returns

`boolean`

True if this processor can handle the content, false otherwise

##### getName()

> **getName**(): `string`

Defined in: [packages/core/src/core/processor.ts:42](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L42)

Gets the name of this processor

###### Returns

`string`

The processor name from metadata

##### process()

> `abstract` **process**(`content`, `otherContext`, `ioContext`?): `Promise`\<[`ProcessedResult`](namespaces/Types.md#processedresult)\>

Defined in: [packages/core/src/core/processor.ts:62](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/processor.ts#L62)

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

[`IOHandler`](namespaces/Types.md#iohandler)[]

Array of available action handlers

###### availableOutputs

[`IOHandler`](namespaces/Types.md#iohandler)[]

Array of available output handlers

###### Returns

`Promise`\<[`ProcessedResult`](namespaces/Types.md#processedresult)\>

Promise resolving to the processed result

***

### ChainOfThought

Defined in: [packages/core/src/core/chain-of-thought.ts:29](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L29)

#### Extends

- `EventEmitter`

#### Constructors

##### new ChainOfThought()

> **new ChainOfThought**(`llmClient`, `memory`, `initialContext`?, `config`?): [`ChainOfThought`](globals.md#chainofthought)

Defined in: [packages/core/src/core/chain-of-thought.ts:39](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L39)

###### Parameters

###### llmClient

[`LLMClient`](globals.md#llmclient-1)

###### memory

[`VectorDB`](namespaces/Types.md#vectordb)

###### initialContext?

[`ChainOfThoughtContext`](namespaces/Types.md#chainofthoughtcontext)

###### config?

###### logLevel

[`LogLevel`](namespaces/Types.md#loglevel)

###### Returns

[`ChainOfThought`](globals.md#chainofthought)

###### Overrides

`EventEmitter.constructor`

#### Properties

##### goalManager

> **goalManager**: [`GoalManager`](globals.md#goalmanager-1)

Defined in: [packages/core/src/core/chain-of-thought.ts:34](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L34)

##### memory

> **memory**: [`VectorDB`](namespaces/Types.md#vectordb)

Defined in: [packages/core/src/core/chain-of-thought.ts:35](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L35)

##### captureRejections

> `static` **captureRejections**: `boolean`

Defined in: docs/node\_modules/@types/node/events.d.ts:459

Value: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

Change the default `captureRejections` option on all new `EventEmitter` objects.

###### Since

v13.4.0, v12.16.0

###### Inherited from

`EventEmitter.captureRejections`

##### captureRejectionSymbol

> `readonly` `static` **captureRejectionSymbol**: *typeof* [`captureRejectionSymbol`](globals.md#capturerejectionsymbol)

Defined in: docs/node\_modules/@types/node/events.d.ts:452

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom `rejection handler`.

###### Since

v13.4.0, v12.16.0

###### Inherited from

`EventEmitter.captureRejectionSymbol`

##### defaultMaxListeners

> `static` **defaultMaxListeners**: `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:498

By default, a maximum of `10` listeners can be registered for any single
event. This limit can be changed for individual `EventEmitter` instances
using the `emitter.setMaxListeners(n)` method. To change the default
for _all_`EventEmitter` instances, the `events.defaultMaxListeners` property
can be used. If this value is not a positive number, a `RangeError` is thrown.

Take caution when setting the `events.defaultMaxListeners` because the
change affects _all_ `EventEmitter` instances, including those created before
the change is made. However, calling `emitter.setMaxListeners(n)` still has
precedence over `events.defaultMaxListeners`.

This is not a hard limit. The `EventEmitter` instance will allow
more listeners to be added but will output a trace warning to stderr indicating
that a "possible EventEmitter memory leak" has been detected. For any single
`EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to
temporarily avoid this warning:

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The `--trace-warnings` command-line flag can be used to display the
stack trace for such warnings.

The emitted warning can be inspected with `process.on('warning')` and will
have the additional `emitter`, `type`, and `count` properties, referring to
the event emitter instance, the event's name and the number of attached
listeners, respectively.
Its `name` property is set to `'MaxListenersExceededWarning'`.

###### Since

v0.11.2

###### Inherited from

`EventEmitter.defaultMaxListeners`

##### errorMonitor

> `readonly` `static` **errorMonitor**: *typeof* [`errorMonitor`](globals.md#errormonitor)

Defined in: docs/node\_modules/@types/node/events.d.ts:445

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted. Therefore, the process will still crash if no
regular `'error'` listener is installed.

###### Since

v13.6.0, v12.17.0

###### Inherited from

`EventEmitter.errorMonitor`

#### Methods

##### \[captureRejectionSymbol\]()?

> `optional` **\[captureRejectionSymbol\]**\<`K`\>(`error`, `event`, ...`args`): `void`

Defined in: docs/node\_modules/@types/node/events.d.ts:136

###### Type Parameters

• **K**

###### Parameters

###### error

`Error`

###### event

`string` | `symbol`

###### args

...`AnyRest`

###### Returns

`void`

###### Inherited from

`EventEmitter.[captureRejectionSymbol]`

##### addListener()

> **addListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:597

Alias for `emitter.on(eventName, listener)`.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.addListener`

##### decomposeObjectiveIntoGoals()

> **decomposeObjectiveIntoGoals**(`objective`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/chain-of-thought.ts:78](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L78)

Plans a strategic approach to achieve a given objective by breaking it down into hierarchical goals.

This method:
1. Retrieves relevant documents and past experiences from memory
2. Generates a hierarchical goal structure with long-term, medium-term, and short-term goals
3. Creates goals in the goal manager and emits goal creation events
4. Records the planning step

###### Parameters

###### objective

`string`

The high-level objective to plan for

###### Returns

`Promise`\<`void`\>

###### Throws

Will throw an error if strategy planning fails

###### Emits

goal:created - When each new goal is created

##### emit()

> **emit**\<`K`\>(`eventName`, ...`args`): `boolean`

Defined in: docs/node\_modules/@types/node/events.d.ts:859

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### args

...`AnyRest`

###### Returns

`boolean`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.emit`

##### eventNames()

> **eventNames**(): (`string` \| `symbol`)[]

Defined in: docs/node\_modules/@types/node/events.d.ts:922

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

###### Returns

(`string` \| `symbol`)[]

###### Since

v6.0.0

###### Inherited from

`EventEmitter.eventNames`

##### executeAction()

> **executeAction**(`action`): `Promise`\<`string`\>

Defined in: [packages/core/src/core/chain-of-thought.ts:1072](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1072)

Executes a Chain of Thought action triggered by the LLM.

###### Parameters

###### action

[`CoTAction`](namespaces/Types.md#cotaction)

The Chain of Thought action to execute

###### Returns

`Promise`\<`string`\>

A string describing the result of the action execution

###### Throws

If the action handler throws an error during execution

###### Remarks

This method handles the execution of actions triggered by the LLM during the Chain of Thought process.
It validates the action payload against the registered output handler's schema and executes the
corresponding handler function.

###### Example

```ts
const result = await chain.executeAction({
  type: "sendMessage",
  context: "Sending a message to user"
  payload: {
    message: "Hello world"
  }
});
```

##### getBlackboardHistory()

> **getBlackboardHistory**(`type`?, `key`?, `limit`?): `Promise`\<`any`[]\>

Defined in: [packages/core/src/core/chain-of-thought.ts:1690](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1690)

Retrieves the history of blackboard updates, optionally filtered by type and key.
Returns updates in reverse chronological order (newest first).

###### Parameters

###### type?

`string`

Optional type to filter updates by (e.g. 'resource', 'state', 'event')

###### key?

`string`

Optional key within the type to filter updates by

###### limit?

`number` = `10`

Maximum number of history entries to return (defaults to 10)

###### Returns

`Promise`\<`any`[]\>

Array of blackboard updates, each containing the update details and metadata

###### Example

```ts
// Returns something like:
[
  { type: 'resource', key: 'gold', value: 100, timestamp: 1234567890, id: 'doc1', lastUpdated: '2023-01-01' },
  { type: 'resource', key: 'gold', value: 50, timestamp: 1234567880, id: 'doc2', lastUpdated: '2023-01-01' }
]
```

##### getBlackboardState()

> **getBlackboardState**(): `Promise`\<`Record`\<`string`, `any`\>\>

Defined in: [packages/core/src/core/chain-of-thought.ts:1634](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1634)

Retrieves the current state of the blackboard by aggregating all stored updates.
The blackboard state is built by applying updates in chronological order, organized by type and key.

###### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

A nested object containing the current blackboard state, where the first level keys are update types
and second level keys are the specific keys within each type, with their corresponding values.

###### Example

```ts
// Returns something like:
{
  resource: { gold: 100, wood: 50 },
  state: { isGameStarted: true },
  event: { lastBattle: "won" }
}
```

##### getContextHistory()

> **getContextHistory**(): [`ChainOfThoughtContext`](namespaces/Types.md#chainofthoughtcontext)[]

Defined in: [packages/core/src/core/chain-of-thought.ts:1000](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1000)

Retrieves all context snapshots that have been captured.

###### Returns

[`ChainOfThoughtContext`](namespaces/Types.md#chainofthoughtcontext)[]

An array of [ChainOfThoughtContext](namespaces/Types.md#chainofthoughtcontext) objects representing the historical snapshots

###### Remarks

Returns an array containing all historical snapshots of the context state,
in chronological order. Each snapshot represents the complete context state
at the time it was captured using [saveContextSnapshot](globals.md#savecontextsnapshot).

###### Example

```ts
const snapshots = chain.getContextHistory();
console.log(`Number of snapshots: ${snapshots.length}`);
```

##### getMaxListeners()

> **getMaxListeners**(): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:774

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](globals.md#defaultmaxlisteners).

###### Returns

`number`

###### Since

v1.0.0

###### Inherited from

`EventEmitter.getMaxListeners`

##### listenerCount()

> **listenerCount**\<`K`\>(`eventName`, `listener`?): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:868

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event being listened for

`string` | `symbol`

###### listener?

`Function`

The event handler function

###### Returns

`number`

###### Since

v3.2.0

###### Inherited from

`EventEmitter.listenerCount`

##### listeners()

> **listeners**\<`K`\>(`eventName`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:787

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v0.1.26

###### Inherited from

`EventEmitter.listeners`

##### off()

> **off**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:747

Alias for `emitter.removeListener()`.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v10.0.0

###### Inherited from

`EventEmitter.off`

##### on()

> **on**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:629

Adds the `listener` function to the end of the listeners array for the event
named `eventName`. No checks are made to see if the `listener` has already
been added. Multiple calls passing the same combination of `eventName` and
`listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v0.1.101

###### Inherited from

`EventEmitter.on`

##### once()

> **once**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:659

Adds a **one-time** `listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v0.3.0

###### Inherited from

`EventEmitter.once`

##### prependListener()

> **prependListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:886

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`
and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v6.0.0

###### Inherited from

`EventEmitter.prependListener`

##### prependOnceListener()

> **prependOnceListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:902

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v6.0.0

###### Inherited from

`EventEmitter.prependOnceListener`

##### processHighestPriorityGoal()

> **processHighestPriorityGoal**(): `Promise`\<`void`\>

Defined in: [packages/core/src/core/chain-of-thought.ts:556](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L556)

Executes the next highest priority goal that is ready for execution.

This method:
1. Gets prioritized list of ready goals
2. For each goal, checks if it can be executed
3. If executable, attempts execution
4. If not executable:
   - For short-term goals with incomplete state, attempts anyway
   - For non-short-term goals with incomplete state, refines the goal
   - Otherwise blocks the goal hierarchy

###### Returns

`Promise`\<`void`\>

Promise that resolves when execution is complete

###### Emits

goal:started - When goal execution begins

###### Emits

goal:blocked - When a goal cannot be executed

##### rawListeners()

> **rawListeners**\<`K`\>(`eventName`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:818

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v9.4.0

###### Inherited from

`EventEmitter.rawListeners`

##### recordReasoningStep()

> **recordReasoningStep**(`content`, `type`, `tags`?, `meta`?): [`Step`](namespaces/Types.md#step-1)

Defined in: [packages/core/src/core/chain-of-thought.ts:912](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L912)

Adds a new step to the chain of thought sequence.

###### Parameters

###### content

`string`

The main content/description of the step

###### type

[`StepType`](namespaces/Types.md#steptype) = `"action"`

The type of step (e.g. "action", "reasoning", "system", etc)

###### tags?

`string`[]

Optional array of string tags to categorize the step

###### meta?

`Record`\<`string`, `any`\>

Optional metadata object to store additional step information

###### Returns

[`Step`](namespaces/Types.md#step-1)

The newly created Step object

###### Remarks

Each step represents a discrete action, reasoning, or decision point in the chain.
Steps are stored in chronological order and can be tagged for categorization.

###### Example

```ts
chain.recordReasoningStep("Analyzing user request", "reasoning", ["analysis"]);
```

##### registerOutput()

> **registerOutput**(`output`): `void`

Defined in: [packages/core/src/core/chain-of-thought.ts:1023](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1023)

Registers an output handler for a specific action type.

###### Parameters

###### output

[`IOHandler`](namespaces/Types.md#iohandler)

The output handler configuration containing the name and schema

###### Returns

`void`

###### Remarks

Output handlers define how different action types should be processed and validated.
Each output handler is associated with a specific action type and includes a schema
for validating action payloads.

###### Example

```ts
chain.registerOutput({
  name: "sendMessage",
  schema: z.object({
    message: z.string()
  })
});
```

##### removeAllListeners()

> **removeAllListeners**(`eventName`?): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:758

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Parameters

###### eventName?

`string` | `symbol`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.removeAllListeners`

##### removeListener()

> **removeListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:742

Removes the specified `listener` from the listener array for the event named `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any `removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')` listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.removeListener`

##### removeOutput()

> **removeOutput**(`name`): `void`

Defined in: [packages/core/src/core/chain-of-thought.ts:1043](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1043)

Removes a registered output handler.

###### Parameters

###### name

`string`

The name of the output handler to remove

###### Returns

`void`

###### Remarks

This method removes a previously registered output handler from the chain.
If no handler exists with the given name, this method will do nothing.

###### Example

```ts
chain.removeOutput("sendMessage");
```

##### saveContextSnapshot()

> **saveContextSnapshot**(): `void`

Defined in: [packages/core/src/core/chain-of-thought.ts:977](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L977)

Creates and stores a snapshot of the current context state.

###### Returns

`void`

###### Remarks

This method creates a deep copy of the current context and adds it to the snapshots array.
Snapshots provide a historical record of how the context has changed over time.
Each snapshot is a complete copy of the context at that point in time.

###### Example

```ts
chain.saveContextSnapshot(); // Creates a snapshot of current context state
```

##### setMaxListeners()

> **setMaxListeners**(`n`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:768

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Parameters

###### n

`number`

###### Returns

`this`

###### Since

v0.3.5

###### Inherited from

`EventEmitter.setMaxListeners`

##### think()

> **think**(`userQuery`, `maxIterations`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/chain-of-thought.ts:1230](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L1230)

###### Parameters

###### userQuery

`string`

###### maxIterations

`number` = `10`

###### Returns

`Promise`\<`void`\>

##### updateContextState()

> **updateContextState**(`newContext`): `void`

Defined in: [packages/core/src/core/chain-of-thought.ts:951](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chain-of-thought.ts#L951)

Merges new data into the current chain of thought context.

###### Parameters

###### newContext

`Partial`\<[`ChainOfThoughtContext`](namespaces/Types.md#chainofthoughtcontext)\>

Partial context object containing properties to merge into the existing context

###### Returns

`void`

###### Remarks

This method performs a shallow merge of the provided partial context into the existing context.
Any properties in the new context will overwrite matching properties in the current context.
Properties not included in the new context will remain unchanged.

###### Throws

Will not throw errors, but invalid context properties will be ignored

###### Example

```ts
chain.updateContextState({
  worldState: "Updated world state",
  newProperty: "New value"
});
```

##### addAbortListener()

> `static` **addAbortListener**(`signal`, `resource`): `Disposable`

Defined in: docs/node\_modules/@types/node/events.d.ts:437

**`Experimental`**

Listens once to the `abort` event on the provided `signal`.

Listening to the `abort` event on abort signals is unsafe and may
lead to resource leaks since another third party with the signal can
call `e.stopImmediatePropagation()`. Unfortunately Node.js cannot change
this since it would violate the web standard. Additionally, the original
API makes it easy to forget to remove listeners.

This API allows safely using `AbortSignal`s in Node.js APIs by solving these
two issues by listening to the event such that `stopImmediatePropagation` does
not prevent the listener from running.

Returns a disposable so that it may be unsubscribed from more easily.

```js
import { addAbortListener } from 'node:events';

function example(signal) {
  let disposable;
  try {
    signal.addEventListener('abort', (e) => e.stopImmediatePropagation());
    disposable = addAbortListener(signal, (e) => {
      // Do something when signal is aborted.
    });
  } finally {
    disposable?.[Symbol.dispose]();
  }
}
```

###### Parameters

###### signal

`AbortSignal`

###### resource

(`event`) => `void`

###### Returns

`Disposable`

Disposable that removes the `abort` listener.

###### Since

v20.5.0

###### Inherited from

`EventEmitter.addAbortListener`

##### getEventListeners()

> `static` **getEventListeners**(`emitter`, `name`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:358

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
import { getEventListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  console.log(getEventListeners(ee, 'foo')); // [ [Function: listener] ]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  console.log(getEventListeners(et, 'foo')); // [ [Function: listener] ]
}
```

###### Parameters

###### emitter

`EventEmitter` | `EventTarget`

###### name

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v15.2.0, v14.17.0

###### Inherited from

`EventEmitter.getEventListeners`

##### getMaxListeners()

> `static` **getMaxListeners**(`emitter`): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:387

Returns the currently set max amount of listeners.

For `EventEmitter`s this behaves exactly the same as calling `.getMaxListeners` on
the emitter.

For `EventTarget`s this is the only way to get the max event listeners for the
event target. If the number of event handlers on a single EventTarget exceeds
the max set, the EventTarget will print a warning.

```js
import { getMaxListeners, setMaxListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  console.log(getMaxListeners(ee)); // 10
  setMaxListeners(11, ee);
  console.log(getMaxListeners(ee)); // 11
}
{
  const et = new EventTarget();
  console.log(getMaxListeners(et)); // 10
  setMaxListeners(11, et);
  console.log(getMaxListeners(et)); // 11
}
```

###### Parameters

###### emitter

`EventEmitter` | `EventTarget`

###### Returns

`number`

###### Since

v19.9.0

###### Inherited from

`EventEmitter.getMaxListeners`

##### ~~listenerCount()~~

> `static` **listenerCount**(`emitter`, `eventName`): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:330

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
import { EventEmitter, listenerCount } from 'node:events';

const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

###### Parameters

###### emitter

`EventEmitter`

The emitter to query

###### eventName

The event name

`string` | `symbol`

###### Returns

`number`

###### Since

v0.9.12

###### Deprecated

Since v3.2.0 - Use `listenerCount` instead.

###### Inherited from

`EventEmitter.listenerCount`

##### on()

###### Call Signature

> `static` **on**(`emitter`, `eventName`, `options`?): `AsyncIterableIterator`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:303

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

###### Parameters

###### emitter

`EventEmitter`

###### eventName

`string` | `symbol`

###### options?

`StaticEventEmitterIteratorOptions`

###### Returns

`AsyncIterableIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

###### Since

v13.6.0, v12.16.0

###### Inherited from

`EventEmitter.on`

###### Call Signature

> `static` **on**(`emitter`, `eventName`, `options`?): `AsyncIterableIterator`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:308

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

###### Parameters

###### emitter

`EventTarget`

###### eventName

`string`

###### options?

`StaticEventEmitterIteratorOptions`

###### Returns

`AsyncIterableIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

###### Since

v13.6.0, v12.16.0

###### Inherited from

`EventEmitter.on`

##### once()

###### Call Signature

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:217

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

###### Parameters

###### emitter

`EventEmitter`

###### eventName

`string` | `symbol`

###### options?

`StaticEventEmitterOptions`

###### Returns

`Promise`\<`any`[]\>

###### Since

v11.13.0, v10.16.0

###### Inherited from

`EventEmitter.once`

###### Call Signature

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:222

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

###### Parameters

###### emitter

`EventTarget`

###### eventName

`string`

###### options?

`StaticEventEmitterOptions`

###### Returns

`Promise`\<`any`[]\>

###### Since

v11.13.0, v10.16.0

###### Inherited from

`EventEmitter.once`

##### setMaxListeners()

> `static` **setMaxListeners**(`n`?, ...`eventTargets`?): `void`

Defined in: docs/node\_modules/@types/node/events.d.ts:402

```js
import { setMaxListeners, EventEmitter } from 'node:events';

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

###### Parameters

###### n?

`number`

A non-negative number. The maximum number of listeners per `EventTarget` event.

###### eventTargets?

...(`EventEmitter` \| `EventTarget`)[]

Zero or more {EventTarget} or {EventEmitter} instances. If none are specified, `n` is set as the default max for all newly created {EventTarget} and {EventEmitter}
objects.

###### Returns

`void`

###### Since

v15.4.0

###### Inherited from

`EventEmitter.setMaxListeners`

***

### ChromaVectorDB

Defined in: [packages/core/src/core/vector-db.ts:23](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L23)

#### Implements

- [`VectorDB`](namespaces/Types.md#vectordb)

#### Constructors

##### new ChromaVectorDB()

> **new ChromaVectorDB**(`collectionName`, `config`): [`ChromaVectorDB`](globals.md#chromavectordb)

Defined in: [packages/core/src/core/vector-db.ts:35](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L35)

###### Parameters

###### collectionName

`string` = `"memories"`

###### config

###### chromaUrl

`string`

###### logLevel

[`LogLevel`](namespaces/Types.md#loglevel)

###### Returns

[`ChromaVectorDB`](globals.md#chromavectordb)

#### Properties

##### CLUSTER\_COLLECTION

> `readonly` `static` **CLUSTER\_COLLECTION**: `"clusters"` = `"clusters"`

Defined in: [packages/core/src/core/vector-db.ts:25](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L25)

##### DOCUMENTATION\_COLLECTION

> `readonly` `static` **DOCUMENTATION\_COLLECTION**: `"documentation"` = `"documentation"`

Defined in: [packages/core/src/core/vector-db.ts:28](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L28)

##### EPISODIC\_COLLECTION

> `readonly` `static` **EPISODIC\_COLLECTION**: `"episodic_memory"` = `"episodic_memory"`

Defined in: [packages/core/src/core/vector-db.ts:27](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L27)

##### SYSTEM\_COLLECTION

> `readonly` `static` **SYSTEM\_COLLECTION**: `"system_metadata"` = `"system_metadata"`

Defined in: [packages/core/src/core/vector-db.ts:26](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L26)

#### Methods

##### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:1479](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1479)

Clears all items from the main collection.

###### Returns

`Promise`\<`void`\>

##### count()

> **count**(): `Promise`\<`number`\>

Defined in: [packages/core/src/core/vector-db.ts:1471](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1471)

Returns the total count of items in the main collection.

###### Returns

`Promise`\<`number`\>

##### delete()

> **delete**(`id`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:223](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L223)

Deletes an item by ID from the main "memories" collection.

###### Parameters

###### id

`string`

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`delete`](namespaces/Types.md#delete)

##### deleteRoom()

> **deleteRoom**(`roomId`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:489](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L489)

Deletes an entire room's collection.

###### Parameters

###### roomId

`string`

###### Returns

`Promise`\<`void`\>

##### findSimilar()

> **findSimilar**(`content`, `limit`, `metadata`?): `Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

Defined in: [packages/core/src/core/vector-db.ts:142](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L142)

Finds similar items in the main "memories" collection.

###### Parameters

###### content

`string`

###### limit

`number` = `5`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`findSimilar`](namespaces/Types.md#findsimilar)

##### findSimilarDocuments()

> **findSimilarDocuments**(`query`, `limit`): `Promise`\<[`Documentation`](namespaces/Types.md#documentation)[]\>

Defined in: [packages/core/src/core/vector-db.ts:1351](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1351)

Finds similar documentation records by matching the user query text.

###### Parameters

###### query

`string`

###### limit

`number` = `5`

###### Returns

`Promise`\<[`Documentation`](namespaces/Types.md#documentation)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`findSimilarDocuments`](namespaces/Types.md#findsimilardocuments)

##### findSimilarEpisodes()

> **findSimilarEpisodes**(`action`, `limit`): `Promise`\<[`EpisodicMemory`](namespaces/Types.md#episodicmemory)[]\>

Defined in: [packages/core/src/core/vector-db.ts:1048](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1048)

Finds similar episodes by matching the "action" field.

###### Parameters

###### action

`string`

###### limit

`number` = `5`

###### Returns

`Promise`\<[`EpisodicMemory`](namespaces/Types.md#episodicmemory)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`findSimilarEpisodes`](namespaces/Types.md#findsimilarepisodes)

##### findSimilarInRoom()

> **findSimilarInRoom**(`content`, `roomId`, `limit`, `metadata`?): `Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

Defined in: [packages/core/src/core/vector-db.ts:343](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L343)

Finds similar items in a given room's collection. If no cluster match,
falls back to "global" search in that room's collection.

###### Parameters

###### content

`string`

###### roomId

`string`

###### limit

`number` = `5`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`findSimilarInRoom`](namespaces/Types.md#findsimilarinroom)

##### getCollectionForRoom()

> **getCollectionForRoom**(`roomId`): `Promise`\<`Collection`\>

Defined in: [packages/core/src/core/vector-db.ts:249](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L249)

Returns (and creates if necessary) a separate collection for a given room.
Rooms are typically namespaced as `room_<roomId>`.

###### Parameters

###### roomId

`string`

###### Returns

`Promise`\<`Collection`\>

##### getMemoriesFromRoom()

> **getMemoriesFromRoom**(`roomId`, `limit`?): `Promise`\<`object`[]\>

Defined in: [packages/core/src/core/vector-db.ts:1675](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1675)

Gets all memories from a specific room's collection, optionally limited to a certain number

###### Parameters

###### roomId

`string`

###### limit?

`number`

###### Returns

`Promise`\<`object`[]\>

##### getRecentEpisodes()

> **getRecentEpisodes**(`limit`): `Promise`\<[`EpisodicMemory`](namespaces/Types.md#episodicmemory)[]\>

Defined in: [packages/core/src/core/vector-db.ts:1079](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1079)

Retrieves the most recent episodic memories (peeking at the underlying collection).

###### Parameters

###### limit

`number` = `10`

###### Returns

`Promise`\<[`EpisodicMemory`](namespaces/Types.md#episodicmemory)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`getRecentEpisodes`](namespaces/Types.md#getrecentepisodes)

##### getRoomMemoryCount()

> **getRoomMemoryCount**(`roomId`): `Promise`\<`number`\>

Defined in: [packages/core/src/core/vector-db.ts:481](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L481)

Gets the memory count for a specific room.

###### Parameters

###### roomId

`string`

###### Returns

`Promise`\<`number`\>

##### getSystemMetadata()

> **getSystemMetadata**(`key`): `Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Defined in: [packages/core/src/core/vector-db.ts:983](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L983)

Retrieves system metadata by key.

###### Parameters

###### key

`string`

###### Returns

`Promise`\<`null` \| `Record`\<`string`, `any`\>\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`getSystemMetadata`](namespaces/Types.md#getsystemmetadata)

##### hasProcessedContent()

> **hasProcessedContent**(`contentId`, `room`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/core/vector-db.ts:1594](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1594)

###### Parameters

###### contentId

`string`

###### room

[`Room`](globals.md#room)

###### Returns

`Promise`\<`boolean`\>

##### listRooms()

> **listRooms**(): `Promise`\<`string`[]\>

Defined in: [packages/core/src/core/vector-db.ts:467](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L467)

Lists the known "room_..." collections.

###### Returns

`Promise`\<`string`[]\>

##### markContentAsProcessed()

> **markContentAsProcessed**(`contentId`, `room`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:1628](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1628)

###### Parameters

###### contentId

`string`

###### room

[`Room`](globals.md#room)

###### Returns

`Promise`\<`void`\>

##### peek()

> **peek**(`limit`): `Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

Defined in: [packages/core/src/core/vector-db.ts:1487](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1487)

Retrieves the first N items from the main collection (for debugging).

###### Parameters

###### limit

`number` = `5`

###### Returns

`Promise`\<[`SearchResult`](namespaces/Types.md#searchresult)[]\>

##### purge()

> **purge**(): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:1554](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1554)

Purges all collections and data from the database.
Use with caution - this is irreversible!

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`purge`](namespaces/Types.md#purge)

##### searchDocumentsByTag()

> **searchDocumentsByTag**(`tags`, `limit`): `Promise`\<[`Documentation`](namespaces/Types.md#documentation)[]\>

Defined in: [packages/core/src/core/vector-db.ts:1385](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1385)

Searches documents by exact match on tags (joined by commas).

###### Parameters

###### tags

`string`[]

###### limit

`number` = `5`

###### Returns

`Promise`\<[`Documentation`](namespaces/Types.md#documentation)[]\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`searchDocumentsByTag`](namespaces/Types.md#searchdocumentsbytag)

##### store()

> **store**(`content`, `metadata`?): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:187](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L187)

Stores a piece of content in the main "memories" collection.

###### Parameters

###### content

`string`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`store`](namespaces/Types.md#store)

##### storeDocument()

> **storeDocument**(`doc`): `Promise`\<`string`\>

Defined in: [packages/core/src/core/vector-db.ts:1315](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1315)

Stores a documentation record (knowledge resource).

###### Parameters

###### doc

`Omit`\<[`Documentation`](namespaces/Types.md#documentation), `"id"`\>

###### Returns

`Promise`\<`string`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`storeDocument`](namespaces/Types.md#storedocument)

##### storeEpisode()

> **storeEpisode**(`memory`): `Promise`\<`string`\>

Defined in: [packages/core/src/core/vector-db.ts:1011](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1011)

Stores an episodic memory (action + outcome + context).

###### Parameters

###### memory

`Omit`\<[`EpisodicMemory`](namespaces/Types.md#episodicmemory), `"id"`\>

###### Returns

`Promise`\<`string`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`storeEpisode`](namespaces/Types.md#storeepisode)

##### storeInRoom()

> **storeInRoom**(`content`, `roomId`, `metadata`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:268](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L268)

Stores content in a specific room's memory, also associating it with a cluster ID.

###### Parameters

###### content

`string`

###### roomId

`string`

###### metadata

`Record`\<`string`, `any`\> = `{}`

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`storeInRoom`](namespaces/Types.md#storeinroom)

##### storeSystemMetadata()

> **storeSystemMetadata**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:960](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L960)

Stores arbitrary metadata in the "system_metadata" collection.

###### Parameters

###### key

`string`

###### value

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`storeSystemMetadata`](namespaces/Types.md#storesystemmetadata)

##### updateDocument()

> **updateDocument**(`id`, `updates`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/vector-db.ts:1434](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/vector-db.ts#L1434)

Updates an existing documentation record by ID.

###### Parameters

###### id

`string`

###### updates

`Partial`\<[`Documentation`](namespaces/Types.md#documentation)\>

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`VectorDB`](namespaces/Types.md#vectordb).[`updateDocument`](namespaces/Types.md#updatedocument)

***

### Consciousness

Defined in: [packages/core/src/core/consciousness.ts:9](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/consciousness.ts#L9)

#### Constructors

##### new Consciousness()

> **new Consciousness**(`llmClient`, `roomManager`, `config`): [`Consciousness`](globals.md#consciousness)

Defined in: [packages/core/src/core/consciousness.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/consciousness.ts#L15)

###### Parameters

###### llmClient

[`LLMClient`](globals.md#llmclient-1)

###### roomManager

[`RoomManager`](globals.md#roommanager)

###### config

###### intervalMs

`number`

###### logLevel

[`LogLevel`](namespaces/Types.md#loglevel)

###### minConfidence

`number`

###### Returns

[`Consciousness`](globals.md#consciousness)

#### Methods

##### start()

> **start**(): `Promise`\<[`Thought`](namespaces/Types.md#thought)\>

Defined in: [packages/core/src/core/consciousness.ts:31](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/consciousness.ts#L31)

###### Returns

`Promise`\<[`Thought`](namespaces/Types.md#thought)\>

##### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/core/src/core/consciousness.ts:35](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/consciousness.ts#L35)

###### Returns

`Promise`\<`void`\>

***

### GoalManager

Defined in: [packages/core/src/core/goal-manager.ts:6](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L6)

Manages a collection of goals, their relationships, and their lifecycle states.
Provides methods for creating, updating, and querying goals and their hierarchies.

#### Constructors

##### new GoalManager()

> **new GoalManager**(): [`GoalManager`](globals.md#goalmanager-1)

###### Returns

[`GoalManager`](globals.md#goalmanager-1)

#### Properties

##### goals

> **goals**: `Map`\<`string`, [`Goal`](namespaces/Types.md#goal)\>

Defined in: [packages/core/src/core/goal-manager.ts:8](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L8)

Internal map storing all goals indexed by their IDs

#### Methods

##### addGoal()

> **addGoal**(`goal`): [`Goal`](namespaces/Types.md#goal)

Defined in: [packages/core/src/core/goal-manager.ts:16](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L16)

Creates a new goal and adds it to the goal collection.
If the goal is a subgoal, updates the parent goal's subgoals array.

###### Parameters

###### goal

`Omit`\<[`Goal`](namespaces/Types.md#goal), `"id"`\>

The goal to add (without an ID)

###### Returns

[`Goal`](namespaces/Types.md#goal)

The newly created goal with generated ID

##### arePrerequisitesMet()

> **arePrerequisitesMet**(`goalId`): `boolean`

Defined in: [packages/core/src/core/goal-manager.ts:270](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L270)

Checks if all prerequisites for a goal are met.

###### Parameters

###### goalId

`string`

ID of the goal to check

###### Returns

`boolean`

True if all dependencies are completed

##### blockGoalHierarchy()

> **blockGoalHierarchy**(`goalId`, `reason`): `void`

Defined in: [packages/core/src/core/goal-manager.ts:332](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L332)

Blocks a goal and all its subgoals recursively.

###### Parameters

###### goalId

`string`

ID of the root goal to block

###### reason

`string`

Reason for blocking

###### Returns

`void`

##### canBeRefined()

> **canBeRefined**(`goalId`): `boolean`

Defined in: [packages/core/src/core/goal-manager.ts:316](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L316)

Checks if a goal can be refined into subgoals.

###### Parameters

###### goalId

`string`

ID of the goal to check

###### Returns

`boolean`

True if the goal can be refined

##### estimateCompletionTime()

> **estimateCompletionTime**(`goalId`): `number`

Defined in: [packages/core/src/core/goal-manager.ts:371](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L371)

Estimates completion time based on horizon and dependencies.

###### Parameters

###### goalId

`string`

ID of the goal

###### Returns

`number`

Estimated time units to complete

##### getBlockingGoals()

> **getBlockingGoals**(`goalId`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:219](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L219)

Gets all incomplete goals that are blocking a given goal.

###### Parameters

###### goalId

`string`

ID of the goal to check

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of blocking goals

##### getChildGoals()

> **getChildGoals**(`parentId`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:245](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L245)

Gets all direct child goals of a parent goal.

###### Parameters

###### parentId

`string`

ID of the parent goal

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of child goals

##### getDependentGoals()

> **getDependentGoals**(`goalId`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:259](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L259)

Gets all goals that depend on a given goal.

###### Parameters

###### goalId

`string`

ID of the dependency goal

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of dependent goals

##### getGoalById()

> **getGoalById**(`id`): `undefined` \| [`Goal`](namespaces/Types.md#goal)

Defined in: [packages/core/src/core/goal-manager.ts:236](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L236)

Retrieves a goal by its ID.

###### Parameters

###### id

`string`

The goal ID

###### Returns

`undefined` \| [`Goal`](namespaces/Types.md#goal)

The goal or undefined if not found

##### getGoalHierarchy()

> **getGoalHierarchy**(`goalId`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:199](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L199)

Gets a goal and all its subgoals as a flattened array.

###### Parameters

###### goalId

`string`

ID of the root goal

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array containing the goal and all its subgoals

##### getGoalPath()

> **getGoalPath**(`goalId`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:354](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L354)

Gets the full path from root goal to specified goal.

###### Parameters

###### goalId

`string`

ID of the goal

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of goals representing the path

##### getGoalsByHorizon()

> **getGoalsByHorizon**(`horizon`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:165](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L165)

Retrieves all goals for a specific time horizon, sorted by priority.

###### Parameters

###### horizon

[`HorizonType`](namespaces/Types.md#horizontype)

The time horizon to filter by

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of matching goals

##### getGoalsByScore()

> **getGoalsByScore**(): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:461](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L461)

Gets all goals sorted by their outcome scores.

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of goals with outcome scores, sorted highest to lowest

##### getGoalsByStatus()

> **getGoalsByStatus**(`status`): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:305](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L305)

Gets all goals with a specific status.

###### Parameters

###### status

[`GoalStatus`](namespaces/Types.md#goalstatus)

Status to filter by

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of matching goals, sorted by priority

##### getReadyGoals()

> **getReadyGoals**(`horizon`?): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:177](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L177)

Returns goals that are ready to be worked on.
A goal is ready if its status is "ready" or all its dependencies are completed.

###### Parameters

###### horizon?

[`HorizonType`](namespaces/Types.md#horizontype)

Optional horizon to filter by

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

Array of ready goals, sorted by priority

##### getReadyGoalsByPriority()

> **getReadyGoalsByPriority**(): [`Goal`](namespaces/Types.md#goal)[]

Defined in: [packages/core/src/core/goal-manager.ts:62](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L62)

**`Internal`**

Gets a prioritized list of goals that are ready to be worked on.
Goals are sorted first by horizon (short-term > medium-term > long-term)
and then by their individual priority values.

###### Returns

[`Goal`](namespaces/Types.md#goal)[]

An array of Goal objects sorted by priority

##### processGoalFailure()

> **processGoalFailure**(`goal`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/goal-manager.ts:45](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L45)

**`Internal`**

Handles the failure of a goal by updating its status and notifying relevant systems.

This method:
1. Updates the failed goal's status
2. If the goal has a parent, marks the parent as blocked
3. Emits a goal:failed event

###### Parameters

###### goal

[`Goal`](namespaces/Types.md#goal)

The goal that failed

###### Returns

`Promise`\<`void`\>

##### recordGoalFailure()

> **recordGoalFailure**(`goalId`, `reason`, `outcomeScore`): `void`

Defined in: [packages/core/src/core/goal-manager.ts:436](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L436)

Records a goal failure with reason and score.

###### Parameters

###### goalId

`string`

ID of the failed goal

###### reason

`string`

Reason for failure

###### outcomeScore

`number` = `0`

Optional failure score (defaults to 0)

###### Returns

`void`

##### recordGoalOutcome()

> **recordGoalOutcome**(`goalId`, `outcomeScore`, `comment`?): `void`

Defined in: [packages/core/src/core/goal-manager.ts:409](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L409)

Records an outcome score and optional comment for a completed goal.

###### Parameters

###### goalId

`string`

ID of the goal

###### outcomeScore

`number`

Numeric score indicating success/failure

###### comment?

`string`

Optional comment about the outcome

###### Returns

`void`

##### updateGoalDependencies()

> **updateGoalDependencies**(`goalId`, `dependencies`): `void`

Defined in: [packages/core/src/core/goal-manager.ts:86](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L86)

Updates an existing goal with new dependencies.
Used to map generated thought IDs to goal IDs.

###### Parameters

###### goalId

`string`

The ID of the goal to update

###### dependencies

`string`[]

The new array of dependency IDs

###### Returns

`void`

##### updateGoalProgress()

> **updateGoalProgress**(`id`, `progress`): `void`

Defined in: [packages/core/src/core/goal-manager.ts:285](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L285)

Updates the progress percentage of a goal.

###### Parameters

###### id

`string`

ID of the goal

###### progress

`number`

New progress value (0-100)

###### Returns

`void`

##### updateGoalStatus()

> **updateGoalStatus**(`id`, `status`): `void`

Defined in: [packages/core/src/core/goal-manager.ts:102](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/goal-manager.ts#L102)

Updates the status of a goal. When marking as "completed",
sets completed_at timestamp, progress to 100%, and updates related goals.

###### Parameters

###### id

`string`

The ID of the goal to update

###### status

[`GoalStatus`](namespaces/Types.md#goalstatus)

The new status to set

###### Returns

`void`

***

### LLMClient

Defined in: [packages/core/src/core/llm-client.ts:79](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L79)

Main client class for interacting with LLM providers

#### Extends

- `EventEmitter`

#### Constructors

##### new LLMClient()

> **new LLMClient**(`config`): [`LLMClient`](globals.md#llmclient-1)

Defined in: [packages/core/src/core/llm-client.ts:108](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L108)

Creates a new LLM client instance - supports all major LLM providers

###### Parameters

###### config

[`LLMClientConfig`](namespaces/Types.md#llmclientconfig)

Configuration options for the client

###### Returns

[`LLMClient`](globals.md#llmclient-1)

###### Example

```typescript
const llm = new LLMClient({
  model: "openai/gpt-4-turbo-preview",
  temperature: 0.7,
  maxTokens: 2000,
  maxRetries: 5
});

// Or using OpenRouter:
const llmOpenRouter = new LLMClient({
  model: "openrouter:anthropic/claude-2"
});
```

###### Overrides

`EventEmitter.constructor`

#### Properties

##### captureRejections

> `static` **captureRejections**: `boolean`

Defined in: docs/node\_modules/@types/node/events.d.ts:459

Value: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

Change the default `captureRejections` option on all new `EventEmitter` objects.

###### Since

v13.4.0, v12.16.0

###### Inherited from

`EventEmitter.captureRejections`

##### captureRejectionSymbol

> `readonly` `static` **captureRejectionSymbol**: *typeof* [`captureRejectionSymbol`](globals.md#capturerejectionsymbol)

Defined in: docs/node\_modules/@types/node/events.d.ts:452

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom `rejection handler`.

###### Since

v13.4.0, v12.16.0

###### Inherited from

`EventEmitter.captureRejectionSymbol`

##### defaultMaxListeners

> `static` **defaultMaxListeners**: `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:498

By default, a maximum of `10` listeners can be registered for any single
event. This limit can be changed for individual `EventEmitter` instances
using the `emitter.setMaxListeners(n)` method. To change the default
for _all_`EventEmitter` instances, the `events.defaultMaxListeners` property
can be used. If this value is not a positive number, a `RangeError` is thrown.

Take caution when setting the `events.defaultMaxListeners` because the
change affects _all_ `EventEmitter` instances, including those created before
the change is made. However, calling `emitter.setMaxListeners(n)` still has
precedence over `events.defaultMaxListeners`.

This is not a hard limit. The `EventEmitter` instance will allow
more listeners to be added but will output a trace warning to stderr indicating
that a "possible EventEmitter memory leak" has been detected. For any single
`EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to
temporarily avoid this warning:

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The `--trace-warnings` command-line flag can be used to display the
stack trace for such warnings.

The emitted warning can be inspected with `process.on('warning')` and will
have the additional `emitter`, `type`, and `count` properties, referring to
the event emitter instance, the event's name and the number of attached
listeners, respectively.
Its `name` property is set to `'MaxListenersExceededWarning'`.

###### Since

v0.11.2

###### Inherited from

`EventEmitter.defaultMaxListeners`

##### errorMonitor

> `readonly` `static` **errorMonitor**: *typeof* [`errorMonitor`](globals.md#errormonitor)

Defined in: docs/node\_modules/@types/node/events.d.ts:445

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted. Therefore, the process will still crash if no
regular `'error'` listener is installed.

###### Since

v13.6.0, v12.17.0

###### Inherited from

`EventEmitter.errorMonitor`

#### Methods

##### \[captureRejectionSymbol\]()?

> `optional` **\[captureRejectionSymbol\]**\<`K`\>(`error`, `event`, ...`args`): `void`

Defined in: docs/node\_modules/@types/node/events.d.ts:136

###### Type Parameters

• **K**

###### Parameters

###### error

`Error`

###### event

`string` | `symbol`

###### args

...`AnyRest`

###### Returns

`void`

###### Inherited from

`EventEmitter.[captureRejectionSymbol]`

##### addListener()

> **addListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:597

Alias for `emitter.on(eventName, listener)`.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.addListener`

##### analyze()

> **analyze**(`prompt`, `options`): `Promise`\<`string` \| [`StructuredAnalysis`](namespaces/Types.md#structuredanalysis)\>

Defined in: [packages/core/src/core/llm-client.ts:342](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L342)

Analyzes text using the LLM with optional structured output

###### Parameters

###### prompt

`string`

Input text to analyze

###### options

[`AnalysisOptions`](namespaces/Types.md#analysisoptions) = `{}`

Analysis configuration options

###### Returns

`Promise`\<`string` \| [`StructuredAnalysis`](namespaces/Types.md#structuredanalysis)\>

Promise resolving to analysis result

##### complete()

> **complete**(`prompt`): `Promise`\<[`LLMResponse`](namespaces/Types.md#llmresponse)\>

Defined in: [packages/core/src/core/llm-client.ts:206](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L206)

Completes a prompt using the configured LLM

###### Parameters

###### prompt

`string`

Input prompt text

###### Returns

`Promise`\<[`LLMResponse`](namespaces/Types.md#llmresponse)\>

Promise resolving to the completion response

##### emit()

> **emit**\<`K`\>(`eventName`, ...`args`): `boolean`

Defined in: docs/node\_modules/@types/node/events.d.ts:859

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### args

...`AnyRest`

###### Returns

`boolean`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.emit`

##### eventNames()

> **eventNames**(): (`string` \| `symbol`)[]

Defined in: docs/node\_modules/@types/node/events.d.ts:922

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

###### Returns

(`string` \| `symbol`)[]

###### Since

v6.0.0

###### Inherited from

`EventEmitter.eventNames`

##### getMaxListeners()

> **getMaxListeners**(): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:774

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](globals.md#defaultmaxlisteners-1).

###### Returns

`number`

###### Since

v1.0.0

###### Inherited from

`EventEmitter.getMaxListeners`

##### getModelName()

> **getModelName**(): `string`

Defined in: [packages/core/src/core/llm-client.ts:231](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L231)

Gets the full model name

###### Returns

`string`

##### getModelVersion()

> **getModelVersion**(): `string`

Defined in: [packages/core/src/core/llm-client.ts:238](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/llm-client.ts#L238)

Extracts the version number from the model name

###### Returns

`string`

##### listenerCount()

> **listenerCount**\<`K`\>(`eventName`, `listener`?): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:868

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event being listened for

`string` | `symbol`

###### listener?

`Function`

The event handler function

###### Returns

`number`

###### Since

v3.2.0

###### Inherited from

`EventEmitter.listenerCount`

##### listeners()

> **listeners**\<`K`\>(`eventName`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:787

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v0.1.26

###### Inherited from

`EventEmitter.listeners`

##### off()

> **off**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:747

Alias for `emitter.removeListener()`.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v10.0.0

###### Inherited from

`EventEmitter.off`

##### on()

> **on**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:629

Adds the `listener` function to the end of the listeners array for the event
named `eventName`. No checks are made to see if the `listener` has already
been added. Multiple calls passing the same combination of `eventName` and
`listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v0.1.101

###### Inherited from

`EventEmitter.on`

##### once()

> **once**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:659

Adds a **one-time** `listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v0.3.0

###### Inherited from

`EventEmitter.once`

##### prependListener()

> **prependListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:886

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`
and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v6.0.0

###### Inherited from

`EventEmitter.prependListener`

##### prependOnceListener()

> **prependOnceListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:902

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

The name of the event.

`string` | `symbol`

###### listener

(...`args`) => `void`

The callback function

###### Returns

`this`

###### Since

v6.0.0

###### Inherited from

`EventEmitter.prependOnceListener`

##### rawListeners()

> **rawListeners**\<`K`\>(`eventName`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:818

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v9.4.0

###### Inherited from

`EventEmitter.rawListeners`

##### removeAllListeners()

> **removeAllListeners**(`eventName`?): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:758

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Parameters

###### eventName?

`string` | `symbol`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.removeAllListeners`

##### removeListener()

> **removeListener**\<`K`\>(`eventName`, `listener`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:742

Removes the specified `listener` from the listener array for the event named `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any `removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')` listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Type Parameters

• **K**

###### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

###### Returns

`this`

###### Since

v0.1.26

###### Inherited from

`EventEmitter.removeListener`

##### setMaxListeners()

> **setMaxListeners**(`n`): `this`

Defined in: docs/node\_modules/@types/node/events.d.ts:768

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

###### Parameters

###### n

`number`

###### Returns

`this`

###### Since

v0.3.5

###### Inherited from

`EventEmitter.setMaxListeners`

##### addAbortListener()

> `static` **addAbortListener**(`signal`, `resource`): `Disposable`

Defined in: docs/node\_modules/@types/node/events.d.ts:437

**`Experimental`**

Listens once to the `abort` event on the provided `signal`.

Listening to the `abort` event on abort signals is unsafe and may
lead to resource leaks since another third party with the signal can
call `e.stopImmediatePropagation()`. Unfortunately Node.js cannot change
this since it would violate the web standard. Additionally, the original
API makes it easy to forget to remove listeners.

This API allows safely using `AbortSignal`s in Node.js APIs by solving these
two issues by listening to the event such that `stopImmediatePropagation` does
not prevent the listener from running.

Returns a disposable so that it may be unsubscribed from more easily.

```js
import { addAbortListener } from 'node:events';

function example(signal) {
  let disposable;
  try {
    signal.addEventListener('abort', (e) => e.stopImmediatePropagation());
    disposable = addAbortListener(signal, (e) => {
      // Do something when signal is aborted.
    });
  } finally {
    disposable?.[Symbol.dispose]();
  }
}
```

###### Parameters

###### signal

`AbortSignal`

###### resource

(`event`) => `void`

###### Returns

`Disposable`

Disposable that removes the `abort` listener.

###### Since

v20.5.0

###### Inherited from

`EventEmitter.addAbortListener`

##### getEventListeners()

> `static` **getEventListeners**(`emitter`, `name`): `Function`[]

Defined in: docs/node\_modules/@types/node/events.d.ts:358

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
import { getEventListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  console.log(getEventListeners(ee, 'foo')); // [ [Function: listener] ]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  console.log(getEventListeners(et, 'foo')); // [ [Function: listener] ]
}
```

###### Parameters

###### emitter

`EventEmitter` | `EventTarget`

###### name

`string` | `symbol`

###### Returns

`Function`[]

###### Since

v15.2.0, v14.17.0

###### Inherited from

`EventEmitter.getEventListeners`

##### getMaxListeners()

> `static` **getMaxListeners**(`emitter`): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:387

Returns the currently set max amount of listeners.

For `EventEmitter`s this behaves exactly the same as calling `.getMaxListeners` on
the emitter.

For `EventTarget`s this is the only way to get the max event listeners for the
event target. If the number of event handlers on a single EventTarget exceeds
the max set, the EventTarget will print a warning.

```js
import { getMaxListeners, setMaxListeners, EventEmitter } from 'node:events';

{
  const ee = new EventEmitter();
  console.log(getMaxListeners(ee)); // 10
  setMaxListeners(11, ee);
  console.log(getMaxListeners(ee)); // 11
}
{
  const et = new EventTarget();
  console.log(getMaxListeners(et)); // 10
  setMaxListeners(11, et);
  console.log(getMaxListeners(et)); // 11
}
```

###### Parameters

###### emitter

`EventEmitter` | `EventTarget`

###### Returns

`number`

###### Since

v19.9.0

###### Inherited from

`EventEmitter.getMaxListeners`

##### ~~listenerCount()~~

> `static` **listenerCount**(`emitter`, `eventName`): `number`

Defined in: docs/node\_modules/@types/node/events.d.ts:330

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
import { EventEmitter, listenerCount } from 'node:events';

const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

###### Parameters

###### emitter

`EventEmitter`

The emitter to query

###### eventName

The event name

`string` | `symbol`

###### Returns

`number`

###### Since

v0.9.12

###### Deprecated

Since v3.2.0 - Use `listenerCount` instead.

###### Inherited from

`EventEmitter.listenerCount`

##### on()

###### Call Signature

> `static` **on**(`emitter`, `eventName`, `options`?): `AsyncIterableIterator`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:303

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

###### Parameters

###### emitter

`EventEmitter`

###### eventName

`string` | `symbol`

###### options?

`StaticEventEmitterIteratorOptions`

###### Returns

`AsyncIterableIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

###### Since

v13.6.0, v12.16.0

###### Inherited from

`EventEmitter.on`

###### Call Signature

> `static` **on**(`emitter`, `eventName`, `options`?): `AsyncIterableIterator`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:308

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
});

for await (const event of on(ee, 'foo')) {
  // The execution of this inner block is synchronous and it
  // processes one event at a time (even with await). Do not use
  // if concurrent execution is required.
  console.log(event); // prints ['bar'] [42]
}
// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```js
import { on, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

// Emit later on
process.nextTick(() => {
  ee.emit('foo', 'bar');
  ee.emit('foo', 42);
  ee.emit('close');
});

for await (const event of on(ee, 'foo', { close: ['close'] })) {
  console.log(event); // prints ['bar'] [42]
}
// the loop will exit after 'close' is emitted
console.log('done'); // prints 'done'
```

###### Parameters

###### emitter

`EventTarget`

###### eventName

`string`

###### options?

`StaticEventEmitterIteratorOptions`

###### Returns

`AsyncIterableIterator`\<`any`[]\>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

###### Since

v13.6.0, v12.16.0

###### Inherited from

`EventEmitter.on`

##### once()

###### Call Signature

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:217

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

###### Parameters

###### emitter

`EventEmitter`

###### eventName

`string` | `symbol`

###### options?

`StaticEventEmitterOptions`

###### Returns

`Promise`\<`any`[]\>

###### Since

v11.13.0, v10.16.0

###### Inherited from

`EventEmitter.once`

###### Call Signature

> `static` **once**(`emitter`, `eventName`, `options`?): `Promise`\<`any`[]\>

Defined in: docs/node\_modules/@types/node/events.d.ts:222

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
import { once, EventEmitter } from 'node:events';
import process from 'node:process';

const ee = new EventEmitter();

process.nextTick(() => {
  ee.emit('myevent', 42);
});

const [value] = await once(ee, 'myevent');
console.log(value);

const err = new Error('kaboom');
process.nextTick(() => {
  ee.emit('error', err);
});

try {
  await once(ee, 'myevent');
} catch (err) {
  console.error('error happened', err);
}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.error('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
import { EventEmitter, once } from 'node:events';

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

###### Parameters

###### emitter

`EventTarget`

###### eventName

`string`

###### options?

`StaticEventEmitterOptions`

###### Returns

`Promise`\<`any`[]\>

###### Since

v11.13.0, v10.16.0

###### Inherited from

`EventEmitter.once`

##### setMaxListeners()

> `static` **setMaxListeners**(`n`?, ...`eventTargets`?): `void`

Defined in: docs/node\_modules/@types/node/events.d.ts:402

```js
import { setMaxListeners, EventEmitter } from 'node:events';

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

###### Parameters

###### n?

`number`

A non-negative number. The maximum number of listeners per `EventTarget` event.

###### eventTargets?

...(`EventEmitter` \| `EventTarget`)[]

Zero or more {EventTarget} or {EventEmitter} instances. If none are specified, `n` is set as the default max for all newly created {EventTarget} and {EventEmitter}
objects.

###### Returns

`void`

###### Since

v15.4.0

###### Inherited from

`EventEmitter.setMaxListeners`

***

### Logger

Defined in: [packages/core/src/core/logger.ts:5](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L5)

#### Constructors

##### new Logger()

> **new Logger**(`config`): [`Logger`](globals.md#logger-1)

Defined in: [packages/core/src/core/logger.ts:9](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L9)

###### Parameters

###### config

[`LoggerConfig`](namespaces/Types.md#loggerconfig)

###### Returns

[`Logger`](globals.md#logger-1)

#### Methods

##### debug()

> **debug**(`context`, `message`, `data`?): `void`

Defined in: [packages/core/src/core/logger.ts:35](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L35)

###### Parameters

###### context

`string`

###### message

`string`

###### data?

`any`

###### Returns

`void`

##### error()

> **error**(`context`, `message`, `data`?): `void`

Defined in: [packages/core/src/core/logger.ts:23](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L23)

###### Parameters

###### context

`string`

###### message

`string`

###### data?

`any`

###### Returns

`void`

##### info()

> **info**(`context`, `message`, `data`?): `void`

Defined in: [packages/core/src/core/logger.ts:31](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L31)

###### Parameters

###### context

`string`

###### message

`string`

###### data?

`any`

###### Returns

`void`

##### trace()

> **trace**(`context`, `message`, `data`?): `void`

Defined in: [packages/core/src/core/logger.ts:39](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L39)

###### Parameters

###### context

`string`

###### message

`string`

###### data?

`any`

###### Returns

`void`

##### warn()

> **warn**(`context`, `message`, `data`?): `void`

Defined in: [packages/core/src/core/logger.ts:27](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/logger.ts#L27)

###### Parameters

###### context

`string`

###### message

`string`

###### data?

`any`

###### Returns

`void`

***

### Orchestrator

Defined in: [packages/core/src/core/orchestrator.ts:15](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L15)

Orchestrator system that manages both "input" and "output" handlers
in a unified manner, along with scheduling recurring inputs.

#### Constructors

##### new Orchestrator()

> **new Orchestrator**(`roomManager`, `vectorDb`, `processors`, `mongoDb`, `config`?): [`Orchestrator`](globals.md#orchestrator)

Defined in: [packages/core/src/core/orchestrator.ts:43](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L43)

###### Parameters

###### roomManager

[`RoomManager`](globals.md#roommanager)

###### vectorDb

[`VectorDB`](namespaces/Types.md#vectordb)

###### processors

[`BaseProcessor`](globals.md#baseprocessor)[]

###### mongoDb

`MongoDb`

###### config?

[`LoggerConfig`](namespaces/Types.md#loggerconfig)

###### Returns

[`Orchestrator`](globals.md#orchestrator)

#### Properties

##### userId

> **userId**: `string`

Defined in: [packages/core/src/core/orchestrator.ts:37](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L37)

##### vectorDb

> `readonly` **vectorDb**: [`VectorDB`](namespaces/Types.md#vectordb)

Defined in: [packages/core/src/core/orchestrator.ts:42](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L42)

Other references in your system. Adjust as needed.

#### Methods

##### dispatchToAction()

> **dispatchToAction**\<`T`\>(`name`, `data`): `Promise`\<`unknown`\>

Defined in: [packages/core/src/core/orchestrator.ts:222](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L222)

Dispatches data to a registered action handler and returns its result.

###### Type Parameters

• **T**

###### Parameters

###### name

`string`

The name of the registered action handler to dispatch to

###### data

`T`

The data to pass to the action handler

###### Returns

`Promise`\<`unknown`\>

Promise resolving to the action handler's result

###### Throws

Error if no handler is found with the given name or if it's not an action handler

###### Example

```ts
// Register an action handler
orchestrator.registerIOHandler({
  name: "sendEmail",
  role: "action",
  handler: async (data: {to: string, body: string}) => {
    // Send email logic
    return {success: true};
  }
});

// Dispatch to the action
const result = await orchestrator.dispatchToAction("sendEmail", {
  to: "user@example.com",
  body: "Hello world"
});
```

##### dispatchToInput()

> **dispatchToInput**\<`T`\>(`name`, `data`, `userId`, `orchestratorId`?): `Promise`\<`unknown`\>

Defined in: [packages/core/src/core/orchestrator.ts:499](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L499)

Dispatches data to a registered input handler and processes the result through the autonomous flow.

###### Type Parameters

• **T**

###### Parameters

###### name

`string`

The name of the input handler to dispatch to

###### data

`T`

The data to pass to the input handler

###### userId

`string`

###### orchestratorId?

`ObjectId`

###### Returns

`Promise`\<`unknown`\>

An array of output suggestions generated from processing the input

###### Example

```ts
// Register a chat input handler
orchestrator.registerIOHandler({
  name: "user_chat",
  role: "input",
  handler: async (message) => {
    return {
      type: "chat",
      content: message.content,
      metadata: { userId: message.userId }
    };
  }
});

// Dispatch a message to the chat handler
const outputs = await orchestrator.dispatchToInput("user_chat", {
  content: "Hello AI!",
  userId: "user123"
});
```

###### Throws

If no handler is found with the given name

###### Throws

If the handler's role is not "input"

##### dispatchToOutput()

> **dispatchToOutput**\<`T`\>(`name`, `data`): `Promise`\<`unknown`\>

Defined in: [packages/core/src/core/orchestrator.ts:125](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L125)

Executes a handler with role="output" by name, passing data to it.
This is effectively "dispatchToOutput."

###### Type Parameters

• **T**

###### Parameters

###### name

`string`

###### data

`T`

###### Returns

`Promise`\<`unknown`\>

##### initializeOrchestrator()

> **initializeOrchestrator**(`userId`): `void`

Defined in: [packages/core/src/core/orchestrator.ts:77](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L77)

###### Parameters

###### userId

`string`

###### Returns

`void`

##### processContent()

> **processContent**(`content`, `source`, `userId`?): `Promise`\<[`ProcessedResult`](namespaces/Types.md#processedresult)[]\>

Defined in: [packages/core/src/core/orchestrator.ts:686](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L686)

###### Parameters

###### content

`any`

###### source

`string`

###### userId?

`string`

###### Returns

`Promise`\<[`ProcessedResult`](namespaces/Types.md#processedresult)[]\>

##### registerIOHandler()

> **registerIOHandler**(`handler`): `void`

Defined in: [packages/core/src/core/orchestrator.ts:86](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L86)

Primary method to register any IOHandler (input or output).
- If it's an input with an interval, schedule it for recurring runs.
- Otherwise, just store it in the ioHandlers map.

###### Parameters

###### handler

[`IOHandler`](namespaces/Types.md#iohandler)

###### Returns

`void`

##### removeIOHandler()

> **removeIOHandler**(`name`): `void`

Defined in: [packages/core/src/core/orchestrator.ts:110](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L110)

Removes a handler (input or output) by name, stopping scheduling if needed.

###### Parameters

###### name

`string`

###### Returns

`void`

##### scheduleTaskInDb()

> **scheduleTaskInDb**(`userId`, `handlerName`, `data`, `intervalMs`?): `Promise`\<`ObjectId`\>

Defined in: [packages/core/src/core/orchestrator.ts:533](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L533)

###### Parameters

###### userId

`string`

###### handlerName

`string`

###### data

`Record`\<`string`, `unknown`\> = `{}`

###### intervalMs?

`number`

###### Returns

`Promise`\<`ObjectId`\>

##### startPolling()

> **startPolling**(`everyMs`): `void`

Defined in: [packages/core/src/core/orchestrator.ts:563](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L563)

###### Parameters

###### everyMs

`number` = `10_000`

###### Returns

`void`

##### stop()

> **stop**(): `void`

Defined in: [packages/core/src/core/orchestrator.ts:816](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/orchestrator.ts#L816)

Stops all scheduled tasks and shuts down the orchestrator.

###### Returns

`void`

***

### Room

Defined in: [packages/core/src/core/room.ts:8](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L8)

Represents a room/conversation context that can store memories and metadata.

#### Constructors

##### new Room()

> **new Room**(`platformId`, `platform`, `metadata`?): [`Room`](globals.md#room)

Defined in: [packages/core/src/core/room.ts:22](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L22)

Creates a new Room instance

###### Parameters

###### platformId

`string`

Platform-specific identifier (e.g. tweet thread ID, chat ID)

###### platform

`string`

Platform name where this room exists

###### metadata?

`Partial`\<[`RoomMetadata`](namespaces/Types.md#roommetadata)\>

Optional metadata to initialize the room with

###### Returns

[`Room`](globals.md#room)

#### Properties

##### id

> `readonly` **id**: `string`

Defined in: [packages/core/src/core/room.ts:10](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L10)

Unique identifier for the room

##### platform

> `readonly` **platform**: `string`

Defined in: [packages/core/src/core/room.ts:24](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L24)

Platform name where this room exists

##### platformId

> `readonly` **platformId**: `string`

Defined in: [packages/core/src/core/room.ts:23](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L23)

Platform-specific identifier (e.g. tweet thread ID, chat ID)

#### Methods

##### addMemory()

> **addMemory**(`content`, `metadata`?): `Promise`\<[`Memory`](namespaces/Types.md#memory)\>

Defined in: [packages/core/src/core/room.ts:63](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L63)

Adds a new memory to the room

###### Parameters

###### content

`string`

Content of the memory

###### metadata?

`Record`\<`string`, `any`\>

Optional metadata for the memory

###### Returns

`Promise`\<[`Memory`](namespaces/Types.md#memory)\>

The created Memory object

##### getMemories()

> **getMemories**(`limit`?): [`Memory`](namespaces/Types.md#memory)[]

Defined in: [packages/core/src/core/room.ts:107](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L107)

Retrieves memories from the room

###### Parameters

###### limit?

`number`

Optional limit on number of memories to return

###### Returns

[`Memory`](namespaces/Types.md#memory)[]

Array of Memory objects

##### getMetadata()

> **getMetadata**(): [`RoomMetadata`](namespaces/Types.md#roommetadata)

Defined in: [packages/core/src/core/room.ts:115](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L115)

Gets a copy of the room's metadata

###### Returns

[`RoomMetadata`](namespaces/Types.md#roommetadata)

Copy of room metadata

##### toJSON()

> **toJSON**(): `object`

Defined in: [packages/core/src/core/room.ts:135](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L135)

Converts the room instance to a plain object

###### Returns

`object`

Plain object representation of the room

###### id

> **id**: `string`

###### memories

> **memories**: [`Memory`](namespaces/Types.md#memory)[]

###### metadata

> **metadata**: [`RoomMetadata`](namespaces/Types.md#roommetadata)

###### platform

> **platform**: `string`

###### platformId

> **platformId**: `string`

##### updateMetadata()

> **updateMetadata**(`update`): `void`

Defined in: [packages/core/src/core/room.ts:123](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L123)

Updates the room's metadata

###### Parameters

###### update

`Partial`\<[`RoomMetadata`](namespaces/Types.md#roommetadata)\>

Partial metadata object with fields to update

###### Returns

`void`

##### createDeterministicId()

> `static` **createDeterministicId**(`platform`, `platformId`): `string`

Defined in: [packages/core/src/core/room.ts:45](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L45)

Creates a deterministic room ID based on platform and platformId

###### Parameters

###### platform

`string`

Platform name

###### platformId

`string`

Platform-specific identifier

###### Returns

`string`

A deterministic room ID string

##### createDeterministicMemoryId()

> `static` **createDeterministicMemoryId**(`roomId`, `content`): `string`

Defined in: [packages/core/src/core/room.ts:90](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room.ts#L90)

Creates a deterministic memory ID based on room ID and content

###### Parameters

###### roomId

`string`

ID of the room

###### content

`string`

Content of the memory

###### Returns

`string`

A deterministic memory ID string

***

### RoomManager

Defined in: [packages/core/src/core/room-manager.ts:7](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L7)

#### Constructors

##### new RoomManager()

> **new RoomManager**(`vectorDb`?, `config`?): [`RoomManager`](globals.md#roommanager)

Defined in: [packages/core/src/core/room-manager.ts:10](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L10)

###### Parameters

###### vectorDb?

[`ChromaVectorDB`](globals.md#chromavectordb)

###### config?

###### logLevel

[`LogLevel`](namespaces/Types.md#loglevel)

###### Returns

[`RoomManager`](globals.md#roommanager)

#### Methods

##### addMemory()

> **addMemory**(`roomId`, `content`, `metadata`?): `Promise`\<[`Memory`](namespaces/Types.md#memory)\>

Defined in: [packages/core/src/core/room-manager.ts:141](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L141)

###### Parameters

###### roomId

`string`

###### content

`string`

###### metadata?

`Record`\<`string`, `any`\>

###### Returns

`Promise`\<[`Memory`](namespaces/Types.md#memory)\>

##### createRoom()

> **createRoom**(`platformId`, `platform`, `metadata`?): `Promise`\<[`Room`](globals.md#room)\>

Defined in: [packages/core/src/core/room-manager.ts:83](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L83)

###### Parameters

###### platformId

`string`

###### platform

`string`

###### metadata?

`Partial`\<[`RoomMetadata`](namespaces/Types.md#roommetadata) & `object`\>

###### Returns

`Promise`\<[`Room`](globals.md#room)\>

##### deleteRoom()

> **deleteRoom**(`roomId`): `Promise`\<`void`\>

Defined in: [packages/core/src/core/room-manager.ts:228](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L228)

###### Parameters

###### roomId

`string`

###### Returns

`Promise`\<`void`\>

##### ensureRoom()

> **ensureRoom**(`name`, `platform`, `userId`?): `Promise`\<[`Room`](globals.md#room)\>

Defined in: [packages/core/src/core/room-manager.ts:211](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L211)

###### Parameters

###### name

`string`

###### platform

`string`

###### userId?

`string`

###### Returns

`Promise`\<[`Room`](globals.md#room)\>

##### findSimilarMemoriesInRoom()

> **findSimilarMemoriesInRoom**(`content`, `roomId`, `limit`): `Promise`\<[`Memory`](namespaces/Types.md#memory)[]\>

Defined in: [packages/core/src/core/room-manager.ts:169](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L169)

###### Parameters

###### content

`string`

###### roomId

`string`

###### limit

`number` = `5`

###### Returns

`Promise`\<[`Memory`](namespaces/Types.md#memory)[]\>

##### getMemoriesFromRoom()

> **getMemoriesFromRoom**(`roomId`, `limit`?): `Promise`\<[`Memory`](namespaces/Types.md#memory)[]\>

Defined in: [packages/core/src/core/room-manager.ts:237](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L237)

###### Parameters

###### roomId

`string`

###### limit?

`number`

###### Returns

`Promise`\<[`Memory`](namespaces/Types.md#memory)[]\>

##### getRoom()

> **getRoom**(`roomId`): `Promise`\<`undefined` \| [`Room`](globals.md#room)\>

Defined in: [packages/core/src/core/room-manager.ts:23](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L23)

###### Parameters

###### roomId

`string`

###### Returns

`Promise`\<`undefined` \| [`Room`](globals.md#room)\>

##### getRoomByPlatformId()

> **getRoomByPlatformId**(`platformId`, `platform`): `Promise`\<`undefined` \| [`Room`](globals.md#room)\>

Defined in: [packages/core/src/core/room-manager.ts:71](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L71)

###### Parameters

###### platformId

`string`

###### platform

`string`

###### Returns

`Promise`\<`undefined` \| [`Room`](globals.md#room)\>

##### hasProcessedContentInRoom()

> **hasProcessedContentInRoom**(`contentId`, `roomId`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/core/room-manager.ts:261](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L261)

###### Parameters

###### contentId

`string`

###### roomId

`string`

###### Returns

`Promise`\<`boolean`\>

##### listRooms()

> **listRooms**(): `Promise`\<[`Room`](globals.md#room)[]\>

Defined in: [packages/core/src/core/room-manager.ts:193](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L193)

###### Returns

`Promise`\<[`Room`](globals.md#room)[]\>

##### markContentAsProcessed()

> **markContentAsProcessed**(`contentId`, `roomId`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/core/room-manager.ts:284](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/room-manager.ts#L284)

###### Parameters

###### contentId

`string`

###### roomId

`string`

###### Returns

`Promise`\<`boolean`\>

***

### StepManager

Defined in: [packages/core/src/core/step-manager.ts:7](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L7)

Manages a collection of steps with unique IDs.
Provides methods to add, retrieve, update, and remove steps.

#### Constructors

##### new StepManager()

> **new StepManager**(): [`StepManager`](globals.md#stepmanager)

Defined in: [packages/core/src/core/step-manager.ts:16](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L16)

Creates a new StepManager instance with empty steps collection

###### Returns

[`StepManager`](globals.md#stepmanager)

#### Methods

##### addStep()

> **addStep**(`step`): [`Step`](namespaces/Types.md#step-1)

Defined in: [packages/core/src/core/step-manager.ts:27](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L27)

Adds a new step to the collection

###### Parameters

###### step

[`Step`](namespaces/Types.md#step-1)

The step to add

###### Returns

[`Step`](namespaces/Types.md#step-1)

The added step

###### Throws

Error if a step with the same ID already exists

##### clear()

> **clear**(): `void`

Defined in: [packages/core/src/core/step-manager.ts:95](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L95)

Removes all steps from the collection

###### Returns

`void`

##### getStepById()

> **getStepById**(`id`): `undefined` \| [`Step`](namespaces/Types.md#step-1)

Defined in: [packages/core/src/core/step-manager.ts:50](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L50)

Finds a step by its ID

###### Parameters

###### id

`string`

The ID of the step to find

###### Returns

`undefined` \| [`Step`](namespaces/Types.md#step-1)

The matching step or undefined if not found

##### getSteps()

> **getSteps**(): [`Step`](namespaces/Types.md#step-1)[]

Defined in: [packages/core/src/core/step-manager.ts:41](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L41)

Gets all steps in the collection

###### Returns

[`Step`](namespaces/Types.md#step-1)[]

Array of all steps

##### removeStep()

> **removeStep**(`id`): `void`

Defined in: [packages/core/src/core/step-manager.ts:82](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L82)

Removes a step from the collection

###### Parameters

###### id

`string`

The ID of the step to remove

###### Returns

`void`

###### Throws

Error if step with given ID is not found

##### updateStep()

> **updateStep**(`id`, `updates`): `void`

Defined in: [packages/core/src/core/step-manager.ts:60](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/step-manager.ts#L60)

Updates an existing step with new properties

###### Parameters

###### id

`string`

The ID of the step to update

###### updates

`Partial`\<[`Step`](namespaces/Types.md#step-1)\>

Partial step object containing properties to update

###### Returns

`void`

###### Throws

Error if step with given ID is not found

***

### TaskScheduler\<T\>

Defined in: [packages/core/src/core/task-scheduler.ts:6](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/task-scheduler.ts#L6)

Priority queue implementation for scheduling tasks.
Tasks are ordered by their nextRun timestamp.

#### Type Parameters

• **T** *extends* `object`

Type must include a nextRun timestamp property

#### Constructors

##### new TaskScheduler()

> **new TaskScheduler**\<`T`\>(`onTaskDue`): [`TaskScheduler`](globals.md#taskschedulert)\<`T`\>

Defined in: [packages/core/src/core/task-scheduler.ts:13](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/task-scheduler.ts#L13)

###### Parameters

###### onTaskDue

(`task`) => `Promise`\<`void`\>

Callback executed when a task is due to run

###### Returns

[`TaskScheduler`](globals.md#taskschedulert)\<`T`\>

#### Methods

##### scheduleTask()

> **scheduleTask**(`task`): `void`

Defined in: [packages/core/src/core/task-scheduler.ts:20](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/task-scheduler.ts#L20)

Schedules a new task or updates an existing one.
Tasks are automatically sorted by nextRun timestamp.

###### Parameters

###### task

`T`

The task to schedule

###### Returns

`void`

##### stop()

> **stop**(): `void`

Defined in: [packages/core/src/core/task-scheduler.ts:58](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/task-scheduler.ts#L58)

Stops the scheduler and clears all pending tasks.

###### Returns

`void`

## Variables

### defaultCharacter

> `const` **defaultCharacter**: [`Character`](namespaces/Types.md#character)

Defined in: [packages/core/src/core/character.ts:2](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/character.ts#L2)

## Namespaces

- [Chains](namespaces/Chains.md)
- [IO](namespaces/IO/README.md)
- [Processors](namespaces/Processors.md)
- [Providers](namespaces/Providers.md)
- [Types](namespaces/Types.md)
- [Utils](namespaces/Utils.md)
