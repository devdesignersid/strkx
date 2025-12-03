import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsService } from '@/services/api/lists.service';

export const useLists = (params?: any) => {
  return useQuery({
    queryKey: ['lists', params],
    queryFn: () => listsService.findAll(params),
  });
};

export const useList = (id: string, params?: any) => {
  return useQuery({
    queryKey: ['list', id, params],
    queryFn: () => listsService.findOne(id, params),
    enabled: !!id,
  });
};

export const useCreateList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
};

export const useDeleteList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
};
