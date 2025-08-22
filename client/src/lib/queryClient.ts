import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      // Try to parse as JSON first
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text if it's not HTML
        if (!text.includes('<') && !text.includes('DOCTYPE')) {
          errorMessage = text;
        } else {
          // It's likely an HTML error page, use a user-friendly message
          errorMessage = `Server error (${res.status}). Please check your connection and try again.`;
        }
      }
    } catch {
      // If we can't read the response, use status text
      errorMessage = res.statusText || `Server error (${res.status})`;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Safe JSON parsing
    const text = await res.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse JSON response:", error, "Response text:", text);
      throw new Error("Invalid server response. Please try again.");
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
