import { useQuery } from "@tanstack/react-query";

export function useAttorneys(state?: string, specialty?: string) {
  return useQuery({
    queryKey: ["/api/attorneys", state, specialty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state) params.append("state", state);
      if (specialty) params.append("specialty", specialty);
      
      const url = `/api/attorneys${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch attorneys");
      return response.json();
    },
  });
}