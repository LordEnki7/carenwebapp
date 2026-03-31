import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Incident, InsertIncident } from "@shared/schema";

export function useIncidents() {
  return useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });
}

export function useIncident(id: number) {
  return useQuery<Incident>({
    queryKey: ["/api/incidents", id],
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (incident: InsertIncident) => {
      const response = await apiRequest("POST", "/api/incidents", incident);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Incident> }) => {
      const response = await apiRequest("PATCH", `/api/incidents/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useDashboardStats() {
  return useQuery<{
    total: number;
    cloudBackups: number;
    emergencyContacts: number;
    attorneyConnects: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });
}
