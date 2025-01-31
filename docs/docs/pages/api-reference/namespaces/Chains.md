# Chains

## Classes

### EvmChain

Defined in: [packages/core/src/core/chains/evm.ts:44](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/evm.ts#L44)

Implementation of the IChain interface for Ethereum Virtual Machine (EVM) compatible chains.
Provides methods for reading from and writing to EVM-based blockchains.

#### Example

```typescript
const evmChain = new EvmChain({
  chainName: "ethereum",
  rpcUrl: process.env.ETH_RPC_URL,
  privateKey: process.env.ETH_PRIVATE_KEY,
  chainId: 1
});
```

#### Implements

- [`IChain`](Types.md#ichain)

#### Constructors

##### new EvmChain()

> **new EvmChain**(`config`): [`EvmChain`](Chains.md#evmchain)

Defined in: [packages/core/src/core/chains/evm.ts:66](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/evm.ts#L66)

Creates a new EVM chain instance

###### Parameters

###### config

`EvmChainConfig`

Configuration options for the chain connection

###### Returns

[`EvmChain`](Chains.md#evmchain)

#### Properties

##### chainId

> **chainId**: `string`

Defined in: [packages/core/src/core/chains/evm.ts:50](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/evm.ts#L50)

Unique identifier for this chain implementation.
Matches the IChain interface.
This could be "ethereum", "polygon", etc.

###### Implementation of

[`IChain`](Types.md#ichain).[`chainId`](Types.md#chainid)

#### Methods

##### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/evm.ts:90](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/evm.ts#L90)

Performs a read operation on the blockchain, typically calling a view/pure contract function
that doesn't modify state.

###### Parameters

###### call

`unknown`

The call parameters

###### Returns

`Promise`\<`any`\>

The result of the contract call

###### Throws

Error if the call fails

###### Implementation of

[`IChain`](Types.md#ichain).[`read`](Types.md#read)

##### write()

> **write**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/evm.ts:134](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/evm.ts#L134)

Performs a write operation on the blockchain by sending a transaction that modifies state.
Examples include transferring tokens or updating contract storage.

###### Parameters

###### call

`unknown`

The transaction parameters

###### Returns

`Promise`\<`any`\>

The transaction receipt after confirmation

###### Throws

Error if the transaction fails

###### Implementation of

[`IChain`](Types.md#ichain).[`write`](Types.md#write)

***

### SolanaChain

Defined in: [packages/core/src/core/chains/solana.ts:29](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/solana.ts#L29)

#### Implements

- [`IChain`](Types.md#ichain)

#### Constructors

##### new SolanaChain()

> **new SolanaChain**(`config`): [`SolanaChain`](Chains.md#solanachain)

Defined in: [packages/core/src/core/chains/solana.ts:34](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/solana.ts#L34)

###### Parameters

###### config

`SolanaChainConfig`

###### Returns

[`SolanaChain`](Chains.md#solanachain)

#### Properties

##### chainId

> **chainId**: `string`

Defined in: [packages/core/src/core/chains/solana.ts:30](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/solana.ts#L30)

A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)

###### Implementation of

[`IChain`](Types.md#ichain).[`chainId`](Types.md#chainid)

#### Methods

##### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/solana.ts:58](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/solana.ts#L58)

Example "read" method. Because Solana doesn't have a direct "contract read" by default,
we might interpret read calls as:
 - "getAccountInfo" or
 - "getBalance", or
 - "getProgramAccounts"

So let's define a simple structure we can parse to do the relevant read.

read({ type: "getBalance", address: "..." })
read({ type: "getAccountInfo", address: "..." })

###### Parameters

###### call

`unknown`

###### Returns

`Promise`\<`any`\>

###### Implementation of

[`IChain`](Types.md#ichain).[`read`](Types.md#read)

##### write()

> **write**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/solana.ts:106](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/solana.ts#L106)

Example "write" method. We'll treat this as "send a Solana transaction."
A typical transaction might have multiple instructions.

We'll define a structure for the `call` param:
{
  instructions: TransactionInstruction[];
  signers?: Keypair[];
}
where "instructions" is an array of instructions you want to execute.

The agent or caller is responsible for constructing those instructions (e.g. for
token transfers or program interactions).

###### Parameters

###### call

`unknown`

###### Returns

`Promise`\<`any`\>

###### Implementation of

[`IChain`](Types.md#ichain).[`write`](Types.md#write)

***

### StarknetChain

Defined in: [packages/core/src/core/chains/starknet.ts:28](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/starknet.ts#L28)

Implementation of the IChain interface for interacting with the Starknet L2 blockchain

#### Example

```ts
const starknet = new StarknetChain({
  rpcUrl: process.env.STARKNET_RPC_URL,
  address: process.env.STARKNET_ADDRESS,
  privateKey: process.env.STARKNET_PRIVATE_KEY
});
```

#### Implements

- [`IChain`](Types.md#ichain)

#### Constructors

##### new StarknetChain()

> **new StarknetChain**(`config`): [`StarknetChain`](Chains.md#starknetchain)

Defined in: [packages/core/src/core/chains/starknet.ts:40](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/starknet.ts#L40)

Creates a new StarknetChain instance

###### Parameters

###### config

`StarknetChainConfig`

Configuration options for the Starknet connection

###### Returns

[`StarknetChain`](Chains.md#starknetchain)

#### Properties

##### chainId

> **chainId**: `string` = `"starknet"`

Defined in: [packages/core/src/core/chains/starknet.ts:30](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/starknet.ts#L30)

Unique identifier for this chain implementation

###### Implementation of

[`IChain`](Types.md#ichain).[`chainId`](Types.md#chainid)

#### Methods

##### read()

> **read**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/starknet.ts:55](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/starknet.ts#L55)

Performs a read-only call to a Starknet contract

###### Parameters

###### call

`Call`

The contract call parameters

###### Returns

`Promise`\<`any`\>

The result of the contract call

###### Throws

Error if the call fails

###### Implementation of

[`IChain`](Types.md#ichain).[`read`](Types.md#read)

##### write()

> **write**(`call`): `Promise`\<`any`\>

Defined in: [packages/core/src/core/chains/starknet.ts:72](https://github.com/daydreamsai/daydreams/blob/f0e72101c0795a088a55fd072950f44bb2267eb0/packages/core/src/core/chains/starknet.ts#L72)

Executes a state-changing transaction on Starknet

###### Parameters

###### call

`Call`

The transaction parameters

###### Returns

`Promise`\<`any`\>

The transaction receipt after confirmation

###### Throws

Error if the transaction fails

###### Implementation of

[`IChain`](Types.md#ichain).[`write`](Types.md#write)
