import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => { utils.auth.me.invalidate(); window.location.reload(); } });
  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);
  return { user: user || null, isLoading, isAuthenticated: !!user, logout };
}
