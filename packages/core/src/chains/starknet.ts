import { RpcProvider, Account, type Call, CallData } from "starknet";
import type { IChain } from "../types";

/**
 * Configuration options for initializing a Starknet chain connection
 */
export interface StarknetChainConfig {
  /** The RPC endpoint URL for connecting to Starknet */
  rpcUrl: string;
  /** The Starknet account contract address */
  address: string;
  /** Private key for signing transactions. Should be managed securely! */
  privateKey: string;
}

/**
 * Implementation of the IChain interface for interacting with the Starknet L2 blockchain
 *
 * @example
 * ```ts
 * const starknet = new StarknetChain({
 *   rpcUrl: process.env.STARKNET_RPC_URL,
 *   address: process.env.STARKNET_ADDRESS,
 *   privateKey: process.env.STARKNET_PRIVATE_KEY
 * });
 * ```
 */
export class StarknetChain implements IChain {
  /** Unique identifier for this chain implementation */
  public chainId = "starknet";
  /** RPC provider instance for connecting to Starknet */
  private provider: RpcProvider;
  /** Account instance for transaction signing */
  private account: Account;

  /**
   * Creates a new StarknetChain instance
   * @param config - Configuration options for the Starknet connection
   */
  constructor(config: StarknetChainConfig) {
    this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
    this.account = new Account(
      this.provider,
      config.address,
      config.privateKey
    );
  }

  /**
   * Performs a read-only call to a Starknet contract
   * @param call - The contract call parameters
   * @returns The result of the contract call
   * @throws Error if the call fails
   */
  public async read(call: Call): Promise<any> {
    try {
      call.calldata = CallData.compile(call.calldata || []);
      return this.provider.callContract(call);
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  }

  /**
   * Executes a state-changing transaction on Starknet
   * @param call - The transaction parameters
   * @returns The transaction receipt after confirmation
   * @throws Error if the transaction fails
   */
  public async write(call: Call): Promise<any> {
    try {
      call.calldata = CallData.compile(call.calldata || []);
      const { transaction_hash } = await this.account.execute(call);
      return this.account.waitForTransaction(transaction_hash, {
        retryInterval: 1000,
      });
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  }
}
