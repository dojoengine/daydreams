import { ethers } from "ethers";
import type { IChain } from "../types";

/**
 * Configuration options for initializing an EVM chain connection
 */
export interface EvmChainConfig {
  /**
   * A name or descriptive label for this EVM chain (e.g. "ethereum", "polygon", "bsc", etc.)
   */
  chainName: string;

  /**
   * The RPC endpoint URL (e.g., Infura, Alchemy, local node, etc.)
   */
  rpcUrl: string;

  /**
   * A private key for signing transactions. In production, manage keys securely!
   */
  privateKey: string;

  /**
   * (Optional) Chain ID (e.g. 1 for mainnet, 5 for Goerli). Not strictly required,
   * but can help with certain ethers.js checks.
   */
  chainId?: number;
}

/**
 * Implementation of the IChain interface for Ethereum Virtual Machine (EVM) compatible chains.
 * Provides methods for reading from and writing to EVM-based blockchains.
 *
 * @example
 * ```typescript
 * const evmChain = new EvmChain({
 *   chainName: "ethereum",
 *   rpcUrl: process.env.ETH_RPC_URL,
 *   privateKey: process.env.ETH_PRIVATE_KEY,
 *   chainId: 1
 * });
 * ```
 */
export class EvmChain implements IChain {
  /**
   * Unique identifier for this chain implementation.
   * Matches the IChain interface.
   * This could be "ethereum", "polygon", etc.
   */
  public chainId: string;

  /**
   * JSON-RPC provider instance for connecting to the blockchain
   */
  private provider: ethers.JsonRpcProvider;

  /**
   * Wallet instance for signing transactions
   */
  private signer: ethers.Wallet;

  /**
   * Creates a new EVM chain instance
   * @param config - Configuration options for the chain connection
   */
  constructor(private config: EvmChainConfig) {
    this.chainId = config.chainName;
    // 1) Create a provider for this chain
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, {
      chainId: config.chainId,
      name: config.chainName,
    });

    // 2) Create a signer from the private key
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
  }

  /**
   * Performs a read operation on the blockchain, typically calling a view/pure contract function
   * that doesn't modify state.
   *
   * @param call - The call parameters
   * @param call.contractAddress - Address of the contract to call
   * @param call.abi - Contract ABI (interface)
   * @param call.functionName - Name of the function to call
   * @param call.args - Arguments to pass to the function
   * @returns The result of the contract call
   * @throws Error if the call fails
   */
  public async read(call: unknown): Promise<any> {
    try {
      // In a real implementation, you might use a Zod schema or TS check here:
      const {
        contractAddress,
        abi,
        functionName,
        args = [],
      } = call as {
        contractAddress: string;
        abi: any;
        functionName: string;
        args?: any[];
      };

      // 1) Create a contract object with the provider
      const contract = new ethers.Contract(contractAddress, abi, this.provider);

      // 2) Call the function
      return await contract[functionName](...args);
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred in read()");
    }
  }

  /**
   * Performs a write operation on the blockchain by sending a transaction that modifies state.
   * Examples include transferring tokens or updating contract storage.
   *
   * @param call - The transaction parameters
   * @param call.contractAddress - Address of the contract to interact with
   * @param call.abi - Contract ABI (interface)
   * @param call.functionName - Name of the function to call
   * @param call.args - Arguments to pass to the function
   * @param call.overrides - Optional transaction overrides (gas limit, gas price, etc)
   * @returns The transaction receipt after confirmation
   * @throws Error if the transaction fails
   */
  public async write(call: unknown): Promise<any> {
    try {
      const {
        contractAddress,
        abi,
        functionName,
        args = [],
        overrides = {},
      } = call as {
        contractAddress: string;
        abi: any;
        functionName: string;
        args?: any[];
        overrides?: ethers.Overrides;
      };

      // 1) Create a contract object connected to the signer
      const contract = new ethers.Contract(contractAddress, abi, this.signer);

      // 2) Send the transaction
      const tx = await contract[functionName](...args, overrides);

      // 3) Optionally wait for it to confirm
      const receipt = await tx.wait();
      return receipt; // or return { tx, receipt } if you want both
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred in write()");
    }
  }
}
