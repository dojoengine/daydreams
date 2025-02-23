/**
 * A generic response shape for GraphQL queries.
 */
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

/**
 * A generalized error type for convenience.
 */
class ApiError extends Error {
  constructor(
    public message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

/**
 * A helper function to perform generic REST requests.
 * - `url`: full endpoint (including protocol, domain, path)
 * - `options`: standard `fetch` options such as method, headers, body, etc.
 */
export async function fetchRest<ResponseType = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ResponseType> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new ApiError(`HTTP Error: ${res.status} ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
      });
    }
    return (await res.json()) as ResponseType;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError("Unknown error during REST fetch", error);
  }
}

/**
 * A helper function to perform GraphQL queries.
 * - `endpoint`: the GraphQL endpoint URL.
 * - `query`: the GraphQL query string.
 * - `variables`: an optional variables object for the query.
 */
export async function fetchGraphQL<DataType = unknown>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<DataType | Error> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      throw new ApiError(`HTTP Error: ${res.status} ${res.statusText}`, {
        status: res.status,
        statusText: res.statusText,
      });
    }

    const result = (await res.json()) as GraphQLResponse<DataType>;

    if (result.errors && result.errors.length > 0) {
      return new ApiError(result.errors[0].message, result.errors);
    }

    if (!result.data) {
      return new ApiError("No data returned from GraphQL query");
    }

    return result.data;
  } catch (error) {
    return error instanceof ApiError
      ? error
      : new ApiError("Unknown error during GraphQL fetch", error);
  }
}
