import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EmergencyContact, InsertEmergencyContact } from "@shared/schema";

export function useEmergencyContacts() {
  return useQuery<EmergencyContact[]>({
    queryKey: ['/api/emergency-contacts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/emergency-contacts');
      return response.json() as Promise<EmergencyContact[]>;
    },
  });
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contact: InsertEmergencyContact) => 
      apiRequest('POST', '/api/emergency-contacts', contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}

export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmergencyContact> }) =>
      apiRequest('PATCH', `/api/emergency-contacts/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}

export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/emergency-contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
    },
  });
}