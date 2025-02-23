import { useRouteContext } from "@tanstack/react-router";

export function useAgent() {
  const context = useRouteContext({ from: "__root__" });
  return context.agent;
}
