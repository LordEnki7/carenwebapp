import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ENV } from "../config/environment";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check for session tokens (custom domain, demo, or regular)
  const customDomainToken = localStorage.getItem('customDomainToken');
  const demoSessionKey = localStorage.getItem('demoSessionKey');
  const regularSessionToken = localStorage.getItem('regularSessionToken');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Priority order: Custom domain token > Demo session key > Regular session token
  if (customDomainToken) {
    headers.Authorization = `Bearer ${customDomainToken}`;
  } else if (demoSessionKey) {
    headers.Authorization = `Bearer ${demoSessionKey}`;
  } else if (regularSessionToken) {
    headers.Authorization = `Bearer ${regularSessionToken}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${ENV.API_BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers,
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
    // Include session tokens in Authorization header (custom domain, demo, or regular)
    const customDomainToken = localStorage.getItem('customDomainToken');
    const demoSessionKey = localStorage.getItem('demoSessionKey');
    const regularSessionToken = localStorage.getItem('regularSessionToken');
    const headers: Record<string, string> = {};
    
    // Priority order: Custom domain token > Demo session key > Regular session token
    if (customDomainToken) {
      headers.Authorization = `Bearer ${customDomainToken}`;
    } else if (demoSessionKey) {
      headers.Authorization = `Bearer ${demoSessionKey}`;
    } else if (regularSessionToken) {
      headers.Authorization = `Bearer ${regularSessionToken}`;
    }

    const baseUrl = queryKey[0] as string;
    const fullUrl = baseUrl.startsWith('http') ? baseUrl : `${ENV.API_BASE_URL}${baseUrl}`;
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
