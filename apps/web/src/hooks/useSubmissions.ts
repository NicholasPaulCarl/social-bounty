'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionApi } from '@/lib/api/submissions';
import { queryKeys } from '@/lib/query-keys';
import type {
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  ReviewSubmissionRequest,
  UpdatePayoutRequest,
  MySubmissionsParams,
  SubmissionReviewListParams,
} from '@social-bounty/shared';

export function useMySubmissions(params: MySubmissionsParams) {
  return useQuery({
    queryKey: queryKeys.submissions.mine(params),
    queryFn: () => submissionApi.listMine(params),
  });
}

export function useSubmissionsForBounty(bountyId: string, params: SubmissionReviewListParams) {
  return useQuery({
    queryKey: queryKeys.submissions.forBounty(bountyId, params),
    queryFn: () => submissionApi.listForBounty(bountyId, params),
    enabled: !!bountyId,
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => submissionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSubmission(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, images }: { data: CreateSubmissionRequest; images?: File[] }) =>
      submissionApi.create(bountyId, data, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useUpdateSubmission(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, images }: { data: UpdateSubmissionRequest; images?: File[] }) =>
      submissionApi.update(id, data, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useReviewSubmission(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewSubmissionRequest) => submissionApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useUpdatePayout(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePayoutRequest) => submissionApi.updatePayout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
