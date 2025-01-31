# Providers

## Functions

### fetchGraphQL()

> **fetchGraphQL**\<`DataType`\>(`endpoint`, `query`, `variables`?): `Promise`\<`DataType` \| `Error`\>

Defined in: [packages/core/src/core/providers/api.ts:59](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/providers/api.ts#L59)

A helper function to perform GraphQL queries.
- `endpoint`: the GraphQL endpoint URL.
- `query`: the GraphQL query string.
- `variables`: an optional variables object for the query.

#### Type Parameters

• **DataType** = `unknown`

#### Parameters

##### endpoint

`string`

##### query

`string`

##### variables?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`DataType` \| `Error`\>
