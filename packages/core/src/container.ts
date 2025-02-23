type Constructor<T> = new (...args: any[]) => T;
type Factory<T> = (container: Container) => T;
type FunctionType = (...args: any[]) => any;
type Token = string | symbol | Constructor<any> | FunctionType;

export interface Container {
  register: <T>(token: Token, factory: Factory<T>) => Container;
  singleton: <T>(token: Token, factory: Factory<T>) => Container;
  instance: <T>(token: Token, instance: T) => Container;
  alias: (aliasToken: string | symbol, originalToken: Token) => Container;
  resolve: <T>(token: Token) => T;
}

export const createContainer = (): Container => {
  const instances = new Map<Token, any>();
  const factories = new Map<Token, Factory<any>>();
  const singletons = new Set<Token>();
  const aliases = new Map<string | symbol, Token>();

  const getTokenString = (token: Token): string => {
    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") {
      return token.name || "anonymous function";
    }
    return "unknown token";
  };

  const resolveToken = (token: Token): Token => {
    if (typeof token === "string" || typeof token === "symbol") {
      return aliases.get(token) || token;
    }
    return token;
  };

  const container: Container = {
    register: <T>(token: Token, factory: Factory<T>): Container => {
      factories.set(token, factory);
      instances.delete(token);
      return container;
    },

    singleton: <T>(token: Token, factory: Factory<T>): Container => {
      factories.set(token, factory);
      singletons.add(token);
      instances.delete(token);
      return container;
    },

    instance: <T>(token: Token, value: T): Container => {
      instances.set(token, value);
      factories.delete(token);
      singletons.delete(token);
      return container;
    },

    alias: (aliasToken: string | symbol, originalToken: Token): Container => {
      aliases.set(aliasToken, originalToken);
      return container;
    },

    resolve: <T>(token: Token): T => {
      const resolvedToken = resolveToken(token);

      if (instances.has(resolvedToken)) {
        return instances.get(resolvedToken);
      }

      const factory = factories.get(resolvedToken);
      if (!factory) {
        throw new Error(
          `No registration found for ${getTokenString(resolvedToken)}`
        );
      }

      if (singletons.has(resolvedToken)) {
        if (!instances.has(resolvedToken)) {
          instances.set(resolvedToken, factory(container));
        }
        return instances.get(resolvedToken);
      }

      return factory(container);
    },
  };

  return container;
};

export default createContainer;
