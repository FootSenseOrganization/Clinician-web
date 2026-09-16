import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized QueryClient instance with production caching policies:
 * - staleTime: 3 minutes — prevents redundant refetching on frequent page transitions.
 * - gcTime: 15 minutes — retains cached data in memory for instant back/forward tab navigation.
 * - refetchOnWindowFocus: false — prevents jarring re-renders when switching browser tabs.
 * - retry: skips retrying authorization errors (401, 403).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 15,    // 15 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 401/403 auth errors or not found
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === "PGRST116") {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
