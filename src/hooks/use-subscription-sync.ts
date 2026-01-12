import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateProSubscription } from "@/server/subscription";

// Simple hook to activate Pro subscription after checkout
export function useActivatePro() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await activateProSubscription();
      return result;
    },
    onSuccess: () => {
      // Refresh credits automatically
      queryClient.invalidateQueries({ queryKey: ["userCredits"] });
    },
  });

  return {
    activatePro: mutation.mutateAsync,
    isActivating: mutation.isPending,
    error: mutation.error,
  };
}
