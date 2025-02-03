# Utils

## Functions

### calculateImportance()

> **calculateImportance**(`result`): `number`

Defined in: [packages/core/src/core/utils.ts:75](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L75)

#### Parameters

##### result

`string`

#### Returns

`number`

***

### determineEmotions()

> **determineEmotions**(`action`, `result`, `importance`): `string`[]

Defined in: [packages/core/src/core/utils.ts:36](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L36)

#### Parameters

##### action

`string`

##### result

`string` | `Record`\<`string`, `any`\>

##### importance

`number`

#### Returns

`string`[]

***

### generateContentId()

> **generateContentId**(`content`): `string`

Defined in: [packages/core/src/core/utils.ts:269](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L269)

#### Parameters

##### content

`any`

#### Returns

`string`

***

### generateUniqueId()

> **generateUniqueId**(): `string`

Defined in: [packages/core/src/core/utils.ts:31](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L31)

#### Returns

`string`

***

### getTimeContext()

> **getTimeContext**(`timestamp`): `string`

Defined in: [packages/core/src/core/utils.ts:258](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L258)

#### Parameters

##### timestamp

`Date`

#### Returns

`string`

***

### hashString()

> **hashString**(`str`): `string`

Defined in: [packages/core/src/core/utils.ts:248](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L248)

#### Parameters

##### str

`string`

#### Returns

`string`

***

### injectTags()

> **injectTags**(`tags`, `text`): `string`

Defined in: [packages/core/src/core/utils.ts:5](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L5)

#### Parameters

##### tags

`Record`\<`string`, `string`\> = `{}`

##### text

`string`

#### Returns

`string`

***

### isValidDateValue()

> **isValidDateValue**(`value`): value is string \| number \| Date

Defined in: [packages/core/src/core/utils.ts:238](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L238)

#### Parameters

##### value

`unknown`

#### Returns

value is string \| number \| Date

***

### validateLLMResponseSchema()

> **validateLLMResponseSchema**\<`T`\>(`__namedParameters`): `Promise`\<`T`\>

Defined in: [packages/core/src/core/utils.ts:135](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/utils.ts#L135)

#### Type Parameters

• **T**

#### Parameters

##### \_\_namedParameters

[`LLMValidationOptions`](Types.md#llmvalidationoptionst)\<`T`\>

#### Returns

`Promise`\<`T`\>
