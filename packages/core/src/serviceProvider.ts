import type { Container } from "./container";

type ServiceProvider = {
  register?: (container: Container) => void;
  boot?: (container: Container) => void | Promise<void>;
};

type ServiceState = {
  providers: ServiceProvider[];
  booted: Set<ServiceProvider>;
  registered: Set<ServiceProvider>;
};

type ServiceManager = {
  register: (provider: ServiceProvider) => void;
  bootAll: () => Promise<void>;
  isBooted: (provider: ServiceProvider) => boolean;
  isRegistered: (provider: ServiceProvider) => boolean;
};

const service = (config: ServiceProvider): ServiceProvider => config;

const createServiceManager = (container: Container): ServiceManager => {
  const state: ServiceState = {
    providers: [],
    booted: new Set(),
    registered: new Set(),
  };

  const registerProvider = (
    container: Container,
    provider: ServiceProvider
  ): void => {
    if (state.registered.has(provider)) return;
    state.registered.add(provider);
    if (provider.register) provider.register(container);
  };

  const bootProvider = async (
    container: Container,
    provider: ServiceProvider
  ): Promise<void> => {
    if (state.booted.has(provider)) return;
    state.booted.add(provider);
    if (provider.boot) await provider.boot(container);
  };

  return {
    register: (provider: ServiceProvider): void => {
      if (!state.providers.includes(provider)) {
        state.providers.push(provider);
        registerProvider(container, provider);
      }
    },

    bootAll: async (): Promise<void> => {
      // First register all providers
      for (const provider of state.providers) {
        registerProvider(container, provider);
      }

      // Then boot them
      for (const provider of state.providers) {
        await bootProvider(container, provider);
      }
    },

    isBooted: (provider: ServiceProvider): boolean =>
      state.booted.has(provider),

    isRegistered: (provider: ServiceProvider): boolean =>
      state.registered.has(provider),
  };
};

export {
  createServiceManager,
  service,
  type ServiceProvider,
  type ServiceManager,
};
