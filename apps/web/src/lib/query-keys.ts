import type {
  BountyListParams,
  MySubmissionsParams,
  SubmissionReviewListParams,
  AdminUserListParams,
  AdminOrgListParams,
  AuditLogListParams,
  AdminRecentErrorsParams,
  DisputeListParams,
  AdminDisputeListParams,
} from '@social-bounty/shared';

export const queryKeys = {
  bounties: {
    all: ['bounties'] as const,
    lists: () => [...queryKeys.bounties.all, 'list'] as const,
    list: (filters: BountyListParams) => [...queryKeys.bounties.lists(), filters] as const,
    details: () => [...queryKeys.bounties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bounties.details(), id] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    mine: (filters: MySubmissionsParams) => [...queryKeys.submissions.all, 'mine', filters] as const,
    forBounty: (bountyId: string, filters: SubmissionReviewListParams) =>
      [...queryKeys.submissions.all, 'forBounty', bountyId, filters] as const,
    detail: (id: string) => [...queryKeys.submissions.all, 'detail', id] as const,
    reviewQueue: (filters: Record<string, unknown>) => [...queryKeys.submissions.all, 'reviewQueue', filters] as const,
    myEarnings: () => [...queryKeys.submissions.all, 'myEarnings'] as const,
  },
  organisations: {
    all: ['organisations'] as const,
    detail: (id: string) => [...queryKeys.organisations.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.organisations.all, id, 'members'] as const,
  },
  admin: {
    users: (filters: AdminUserListParams) => ['admin', 'users', filters] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
    organisations: (filters: AdminOrgListParams) => ['admin', 'organisations', filters] as const,
    orgDetail: (id: string) => ['admin', 'organisations', id] as const,
    auditLogs: (filters: AuditLogListParams) => ['admin', 'audit-logs', filters] as const,
    auditLogDetail: (id: string) => ['admin', 'audit-logs', id] as const,
    dashboard: ['admin', 'dashboard'] as const,
    systemHealth: ['admin', 'system-health'] as const,
    recentErrors: (filters: AdminRecentErrorsParams) => ['admin', 'recent-errors', filters] as const,
    settings: ['admin', 'settings'] as const,
  },
  disputes: {
    all: ['disputes'] as const,
    mine: (params: DisputeListParams) => [...queryKeys.disputes.all, 'mine', params] as const,
    forOrg: (params: DisputeListParams) => [...queryKeys.disputes.all, 'forOrg', params] as const,
    detail: (id: string) => [...queryKeys.disputes.all, 'detail', id] as const,
    adminList: (params: AdminDisputeListParams) => [...queryKeys.disputes.all, 'adminList', params] as const,
    stats: () => [...queryKeys.disputes.all, 'stats'] as const,
  },
  business: {
    dashboard: ['business', 'dashboard'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
};
