// =============================================================================
// UI Data Shapes — Combined Reference
//
// These types define the data that UI components expect to receive as props.
// They are a frontend contract, not a database schema. How you model, store,
// and fetch this data is an implementation decision.
// =============================================================================

// -----------------------------------------------------------------------------
// From: sections/bounty-marketplace
// -----------------------------------------------------------------------------

export type RewardType = 'cash' | 'gift_card' | 'credit'

export type MarketplaceProofType = 'text' | 'link' | 'image'

export type MarketplaceSubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

export type BountySortOption = 'newest' | 'ending_soon' | 'highest_reward'

export type LayoutMode = 'grid' | 'list'

export interface Category {
  id: string
  name: string
}

export interface Organization {
  id: string
  name: string
  logoUrl: string | null
}

export interface MarketplaceBounty {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  rewardType: RewardType
  rewardAmount: number
  categoryId: string
  organizationId: string
  proofRequirements: MarketplaceProofType[]
  eligibilityText: string
  startDate: string
  endDate: string | null
  maxSubmissions: number | null
  currentSubmissions: number
  createdAt: string
}

export interface UserSubmission {
  bountyId: string
  status: MarketplaceSubmissionStatus
  submittedAt: string
}

// -----------------------------------------------------------------------------
// From: sections/my-submissions
// -----------------------------------------------------------------------------

export type MySubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

export type PayoutStatus = 'not_paid' | 'pending' | 'paid'

export type ProofType = 'text' | 'link' | 'image'

export type ProofItem = {
  type: 'text'
  value: string
} | {
  type: 'link'
  value: string
} | {
  type: 'image'
  url: string
  alt: string
  filename: string
}

export interface TimelineEntry {
  status: MySubmissionStatus | 'submitted'
  changedAt: string
  note: string | null
}

export interface Payout {
  status: PayoutStatus
  amount: number
  paidAt: string | null
}

export interface BountyReference {
  id: string
  title: string
  organizationName: string
  rewardAmount: number
  categoryName: string
}

export interface MySubmission {
  id: string
  bountyId: string
  status: MySubmissionStatus
  submittedAt: string
  updatedAt: string
  proof: ProofItem[]
  timeline: TimelineEntry[]
  payout: Payout | null
}

export interface EarningsSummary {
  totalSubmissions: number
  approvedCount: number
  totalEarned: number
  pendingPayout: number
}

// -----------------------------------------------------------------------------
// From: sections/bounty-management
// -----------------------------------------------------------------------------

export type BountyStatus = 'draft' | 'live' | 'paused' | 'closed'

export type BountyPriority = 'low' | 'medium' | 'high'

export interface ManagementCategory {
  id: string
  name: string
  slug: string
}

export interface StatusHistoryEntry {
  status: BountyStatus
  changedAt: string
  changedBy: string
}

export interface Bounty {
  id: string
  title: string
  description: string
  instructions: string
  categoryId: string
  tags: string[]
  rewardAmount: number
  startDate: string | null
  endDate: string | null
  maxSubmissions: number
  eligibilityCriteria: string
  proofRequirements: ProofType[]
  proofTemplate: string | null
  priority: BountyPriority
  featured: boolean
  termsAndConditions: string
  status: BountyStatus
  submissionCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
  statusHistory: StatusHistoryEntry[]
}

// -----------------------------------------------------------------------------
// From: sections/review-center
// -----------------------------------------------------------------------------

export type SubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

export interface Participant {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  joinedAt: string
}

export interface BountySummary {
  id: string
  title: string
  rewardAmount: number
  categoryName: string
  proofRequirements: ProofType[]
}

export interface ReviewHistoryEntry {
  status: SubmissionStatus | 'submitted'
  changedAt: string
  changedBy: string | null
  note: string | null
}

export interface Submission {
  id: string
  bountyId: string
  participantId: string
  status: SubmissionStatus
  submittedAt: string
  updatedAt: string
  proof: ProofItem[]
  reviewHistory: ReviewHistoryEntry[]
  payout: Payout | null
}

// -----------------------------------------------------------------------------
// From: sections/admin-panel
// -----------------------------------------------------------------------------

export type AdminTab = 'dashboard' | 'users' | 'organizations' | 'oversight' | 'audit_logs' | 'troubleshooting'

export type UserRole = 'participant' | 'business_admin'

export type UserStatus = 'active' | 'suspended'

export type OrgStatus = 'active' | 'suspended' | 'inactive'

export type AdminBountyStatus = 'draft' | 'live' | 'paused' | 'closed'

export type AdminSubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

export type AdminPayoutStatus = 'not_paid' | 'pending' | 'paid'

export type AuditAction =
  | 'user.suspended'
  | 'user.reinstated'
  | 'user.password_reset'
  | 'organization.suspended'
  | 'organization.reinstated'
  | 'submission.status_override'
  | 'system.kill_switch'

export type HealthStatus = 'healthy' | 'degraded' | 'down'

export type ErrorLevel = 'info' | 'warning' | 'error'

export interface DashboardStats {
  users: { total: number; active: number; suspended: number }
  organizations: { total: number; active: number; inactive: number }
  bounties: { draft: number; live: number; paused: number; closed: number }
  submissions: { submitted: number; in_review: number; needs_more_info: number; approved: number; rejected: number }
  payouts: { not_paid: number; pending: number; paid: number }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  organizationName: string | null
  joinedAt: string
}

export interface AdminOrganization {
  id: string
  name: string
  status: OrgStatus
  memberCount: number
  bountyCount: number
  contactEmail: string
  createdAt: string
}

export interface AdminBounty {
  id: string
  title: string
  organizationName: string
  status: AdminBountyStatus
  rewardAmount: number
  submissionCount: number
  createdAt: string
}

export interface AdminSubmission {
  id: string
  bountyTitle: string
  participantName: string
  status: AdminSubmissionStatus
  submittedAt: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorName: string
  actorRole: string
  action: AuditAction
  entityType: string
  entityId: string
  entityLabel: string
  beforeState: string | null
  afterState: string | null
  reason: string | null
}

export interface HealthCheck {
  service: string
  status: HealthStatus
  responseTime: number
  lastChecked: string
}

export interface SystemError {
  id: string
  timestamp: string
  level: ErrorLevel
  service: string
  message: string
  count: number
}

export interface KillSwitch {
  id: string
  label: string
  description: string
  enabled: boolean
}
