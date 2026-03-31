import { useQuery } from "@tanstack/react-query";
import type { LegalRights } from "@shared/schema";

export function useLegalRights(state?: string) {
  return useQuery<LegalRights[]>({
    queryKey: ["/api/legal-rights", state],
    queryFn: async () => {
      const url = state ? `/api/legal-rights?state=${state}` : "/api/legal-rights";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch legal rights");
      return response.json();
    },
  });
}

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
