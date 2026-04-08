'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import type {
  UpdateProfileRequest,
  UpsertSocialLinkRequest,
} from '@social-bounty/shared';

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

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useDeleteProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userApi.deleteProfilePicture(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: queryKeys.user.socialLinks,
    queryFn: () => userApi.getSocialLinks(),
  });
}

export function useUpsertSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertSocialLinkRequest) => userApi.upsertSocialLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.socialLinks });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useDeleteSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.deleteSocialLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.socialLinks });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
