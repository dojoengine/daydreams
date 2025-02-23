import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import type { IChain } from "../types";
import bs58 from "bs58";

export interface SolanaChainConfig {
  /**
   * A descriptive chain name or environment (e.g., "solana-mainnet", "solana-devnet").
   */
  chainName: string;

  /**
   * RPC endpoint for Solana (e.g. https://api.devnet.solana.com).
   */
  rpcUrl: string;

  /**
   * Base-58 encoded private key or some format from which you can construct a Keypair.
   * In a real scenario, handle keys more securely (e.g., using a keystore or external vault).
   */
  privateKey: string;
}

export class SolanaChain implements IChain {
  public chainId: string; // e.g. "solana-mainnet" or "solana-devnet"
  private connection: Connection;
  private keypair: Keypair;

  constructor(private config: SolanaChainConfig) {
    this.chainId = config.chainName;

    // 1) Create a Connection to the Solana cluster
    this.connection = new Connection(config.rpcUrl);

    // 2) Create a Keypair from the private key
    //    - We assume it's a base-58 encoded private key (64- or 32-byte).
    //    - Another approach is if config.privateKey is a JSON array of 64 ints, etc.
    this.keypair = this.createKeypairFromBase58(config.privateKey);
  }

  /**
   * Example "read" method. Because Solana doesn't have a direct "contract read" by default,
   * we might interpret read calls as:
   *  - "getAccountInfo" or
   *  - "getBalance", or
   *  - "getProgramAccounts"
   *
   * So let's define a simple structure we can parse to do the relevant read.
   *
   * read({ type: "getBalance", address: "..." })
   * read({ type: "getAccountInfo", address: "..." })
   */
  public async read(call: unknown): Promise<any> {
    try {
      const { type, address } = call as {
        type: string;
        address: string;
      };

      switch (type) {
        case "getBalance": {
          const pubKey = new PublicKey(address);
          const lamports = await this.connection.getBalance(pubKey);
          return lamports; // in lamports
        }
        case "getAccountInfo": {
          const pubKey = new PublicKey(address);
          const accountInfo = await this.connection.getAccountInfo(pubKey);
          return accountInfo; // can be null if not found
        }
        case "getBlockHeight": {
          const blockHeight = await this.connection.getBlockHeight();
          return blockHeight;
        }
        // Extend with more read patterns as needed
        default:
          throw new Error(`Unknown read type: ${type}`);
      }
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred in Solana read()");
    }
  }

  /**
   * Example "write" method. We'll treat this as "send a Solana transaction."
   * A typical transaction might have multiple instructions.
   *
   * We'll define a structure for the `call` param:
   * {
   *   instructions: TransactionInstruction[];
   *   signers?: Keypair[];
   * }
   * where "instructions" is an array of instructions you want to execute.
   *
   * The agent or caller is responsible for constructing those instructions (e.g. for
   * token transfers or program interactions).
   */
  public async write(call: unknown): Promise<any> {
    try {
      const { instructions, signers = [] } = call as {
        instructions: any[]; // or TransactionInstruction[]
        signers: Keypair[];
      };

      // 1) Build a Transaction object
      const transaction = new Transaction().add(...instructions);

      // 2) We'll sign with the primary keypair + any additional signers
      // Typically, the main Keypair is the fee payer
      transaction.feePayer = this.keypair.publicKey;

      // 3) Send and confirm the transaction
      const txSig = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair, ...signers]
      );

      return txSig; // transaction signature
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error in Solana write()");
    }
  }

  /**
   * Helper method: Convert a base-58 string private key into a Keypair.
   * Implementation depends on how your private key is stored.
   */
  private createKeypairFromBase58(secretBase58: string): Keypair {
    const secretKeyBytes = Buffer.from(bs58.decode(secretBase58));
    // For Solana, a 64-byte secret is typical.
    // Another approach is if you have a 32-byte seed, etc.
    return Keypair.fromSecretKey(secretKeyBytes);
  }
}
