/** Submission review lifecycle status */
export type SubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

/** Payout status for approved submissions */
export type PayoutStatus = 'not_paid' | 'pending' | 'paid'

/** Types of proof a participant can submit */
export type ProofType = 'text' | 'link' | 'image'

export interface ProofItem {
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
  status: SubmissionStatus | 'submitted'
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
  status: SubmissionStatus
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

export interface MySubmissionsProps {
  submissions: MySubmission[]
  bounties: BountyReference[]
  earningsSummary: EarningsSummary

  /** Navigate to the submission detail view */
  onViewSubmission?: (submissionId: string) => void
  /** Navigate to the bounty detail in Bounty Marketplace */
  onViewBounty?: (bountyId: string) => void
}

export interface SubmissionDetailProps {
  submission: MySubmission
  bounty: BountyReference

  /** Resubmit updated proof (for Needs More Info status) */
  onResubmit?: (links: string[], images: File[]) => void
  /** Navigate back to the submissions list */
  onBack?: () => void
  /** Navigate to the bounty detail in Bounty Marketplace */
  onViewBounty?: (bountyId: string) => void
}
