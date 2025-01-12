import { Account, type Call, CallData, RpcProvider } from "starknet";
import { env } from "./env";
import type { CoTTransaction } from "../types";
import { ethers } from "ethers";
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

async function queryGraphQL<T>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T | Error> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors) {
      return new Error(result.errors[0].message);
    }

    if (!result.data) {
      return new Error("No data returned from GraphQL query");
    }

    return result.data;
  } catch (error) {
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

export const fetchData = async (
  query: string,
  variables: Record<string, unknown>
) => {
  return await queryGraphQL<string>(env.GRAPHQL_URL + "/graphql", query, {
    variables,
  });
};

export const getStarknetProvider = () => {
  return new RpcProvider({
    nodeUrl: env.STARKNET_RPC_URL,
  });
};

export const getStarknetAccount = () => {
  return new Account(
    getStarknetProvider(),
    env.STARKNET_ADDRESS,
    env.STARKNET_PRIVATE_KEY
  );
};

export const executeStarknetTransaction = async (call: Call): Promise<any> => {
  try {
    call.calldata = CallData.compile(call.calldata || []);

    const { transaction_hash } = await getStarknetAccount().execute(call);

    return await getStarknetAccount().waitForTransaction(transaction_hash, {
      retryInterval: 1000,
    });
  } catch (error) {
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export interface EvmTransaction extends CoTTransaction {
  network: "evm";
  method: string;
  value?: string;
  gasLimit?: string;
}

export async function executeEvmTransaction(
  transaction: EvmTransaction
): Promise<any> {
  try {
    // Initialize provider (customize based on your needs)
    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);

    // Initialize wallet/signer
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    // Create contract instance
    const contract = new ethers.Contract(
      transaction.contractAddress,
      ["function " + transaction.method + "(...)"], // You might want to pass ABI instead
      wallet
    );

    // Prepare transaction options
    const txOptions = {
      value: BigInt(transaction.value || "0"),
      gasLimit: BigInt(transaction.gasLimit || "0"),
    };

    // Execute transaction
    const tx = await contract[transaction.method](
      ...transaction.calldata,
      txOptions
    );
    const receipt = await tx.wait();

    return receipt;
  } catch (error) {
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}
