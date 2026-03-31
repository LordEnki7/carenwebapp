import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EmergencyContact, InsertEmergencyContact } from "@shared/schema";

export function useEmergencyContacts() {
  return useQuery({
    queryKey: ['/api/emergency-contacts'],
    queryFn: async () => {
      const response = await apiRequest('/api/emergency-contacts');
      return response as EmergencyContact[];
    },
  });
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contact: InsertEmergencyContact) => 
      apiRequest('/api/emergency-contacts', 'POST', contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}

export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmergencyContact> }) =>
      apiRequest(`/api/emergency-contacts/${id}`, 'PATCH', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}

export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/emergency-contacts/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}