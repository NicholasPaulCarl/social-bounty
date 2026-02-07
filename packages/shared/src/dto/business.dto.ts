import { BountyStatus, SubmissionStatus, PayoutStatus } from '../enums';

// ─────────────────────────────────────
// Business Admin Dashboard DTOs
// ─────────────────────────────────────

// GET /business/dashboard
export interface BusinessDashboardResponse {
  organisation: {
    id: string;
    name: string;
  };
  bounties: {
    total: number;
    byStatus: Record<BountyStatus, number>;
  };
  submissions: {
    total: number;
    pendingReview: number;
    byStatus: Record<SubmissionStatus, number>;
    byPayoutStatus: Record<PayoutStatus, number>;
  };
}
