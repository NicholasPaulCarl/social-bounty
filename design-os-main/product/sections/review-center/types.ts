/** Submission review lifecycle status */
export type SubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

/** Payout status for approved submissions */
export type PayoutStatus = 'not_paid' | 'pending' | 'paid'

/** Types of proof a participant can submit */
export type ProofType = 'text' | 'link' | 'image'

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

export interface ReviewHistoryEntry {
  status: SubmissionStatus | 'submitted'
  changedAt: string
  changedBy: string | null
  note: string | null
}

export interface Payout {
  status: PayoutStatus
  amount: number
  paidAt: string | null
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

export interface ReviewCenterProps {
  submissions: Submission[]
  participants: Participant[]
  bounties: BountySummary[]

  /** Navigate to the full-page submission detail view */
  onViewSubmission?: (submissionId: string) => void
  /** Approve a submission (optional note) */
  onApprove?: (submissionId: string, note?: string) => void
  /** Reject a submission (mandatory reason) */
  onReject?: (submissionId: string, reason: string) => void
  /** Request more info from the participant (mandatory message) */
  onRequestMoreInfo?: (submissionId: string, message: string) => void
  /** Mark an approved submission's payout as paid */
  onMarkPaid?: (submissionId: string) => void
  /** Navigate back to the queue from detail view */
  onBackToQueue?: () => void
}

export interface SubmissionDetailProps {
  submission: Submission
  participant: Participant
  bounty: BountySummary

  /** Approve this submission (optional note) */
  onApprove?: (note?: string) => void
  /** Reject this submission (mandatory reason) */
  onReject?: (reason: string) => void
  /** Request more info (mandatory message) */
  onRequestMoreInfo?: (message: string) => void
  /** Mark payout as paid */
  onMarkPaid?: () => void
  /** Navigate back to the queue */
  onBack?: () => void
  /** Open an image in lightbox view */
  onOpenLightbox?: (imageUrl: string) => void
}
