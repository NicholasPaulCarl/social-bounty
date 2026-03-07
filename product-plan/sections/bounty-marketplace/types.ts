/** Reward type for a bounty */
export type RewardType = 'cash' | 'gift_card' | 'credit'

/** Proof types a bounty can require */
export type ProofType = 'text' | 'link' | 'image'

/** Submission status visible to the participant */
export type SubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

/** Sort options for bounty browse */
export type BountySortOption = 'newest' | 'ending_soon' | 'highest_reward'

/** Layout mode for browse view */
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
  proofRequirements: ProofType[]
  eligibilityText: string
  startDate: string
  endDate: string | null
  maxSubmissions: number | null
  currentSubmissions: number
  createdAt: string
}

export interface UserSubmission {
  bountyId: string
  status: SubmissionStatus
  submittedAt: string
}

export interface ProofLinkInput {
  url: string
}

export interface ProofImageInput {
  file: File
  previewUrl: string
}

export interface BountyMarketplaceProps {
  bounties: MarketplaceBounty[]
  categories: Category[]
  organizations: Organization[]
  /** Current user's existing submissions (empty if unauthenticated) */
  userSubmissions: UserSubmission[]
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean

  /** Navigate to the bounty detail page */
  onViewBounty?: (bountyId: string) => void
}

export interface BountyDetailPageProps {
  bounty: MarketplaceBounty
  category: Category
  organization: Organization
  /** Current user's submission for this bounty, if any */
  userSubmission: UserSubmission | null
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean

  /** Navigate to the submit proof form */
  onSubmitProof?: () => void
  /** Navigate back to the browse list */
  onBack?: () => void
  /** Prompt the user to log in */
  onLogin?: () => void
}

export interface SubmitProofPageProps {
  bounty: MarketplaceBounty
  organization: Organization

  /** Submit the proof form */
  onSubmit?: (links: string[], images: File[]) => void
  /** Navigate back to the bounty detail */
  onBack?: () => void
}
