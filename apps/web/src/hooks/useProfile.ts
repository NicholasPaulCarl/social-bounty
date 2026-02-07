'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import type { UpdateProfileRequest, ChangePasswordRequest } from '@social-bounty/shared';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: () => userApi.getMe(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => userApi.changePassword(data),
  });
}
