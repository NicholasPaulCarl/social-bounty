/** Bounty lifecycle status */
export type BountyStatus = 'draft' | 'live' | 'paused' | 'closed'

/** Priority level for bounties */
export type BountyPriority = 'low' | 'medium' | 'high'

/** Types of proof a participant can submit */
export type ProofType = 'text' | 'link' | 'image'

export interface Category {
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

export interface BountyManagementProps {
  bounties: Bounty[]
  categories: Category[]

  /** Navigate to the create bounty form */
  onCreateBounty?: () => void
  /** Navigate to the edit form for a specific bounty */
  onEditBounty?: (bountyId: string) => void
  /** Navigate to the bounty detail page */
  onViewBounty?: (bountyId: string) => void
  /** Publish a draft bounty (Draft → Live) */
  onPublishBounty?: (bountyId: string) => void
  /** Pause a live bounty (Live → Paused) */
  onPauseBounty?: (bountyId: string) => void
  /** Resume a paused bounty (Paused → Live) */
  onResumeBounty?: (bountyId: string) => void
  /** Close a bounty permanently (any → Closed) */
  onCloseBounty?: (bountyId: string) => void
  /** Duplicate a bounty as a new draft */
  onDuplicateBounty?: (bountyId: string) => void
}

export interface BountyFormProps {
  /** Existing bounty data when editing, undefined when creating */
  bounty?: Bounty
  categories: Category[]
  /** Whether certain fields are locked due to existing submissions */
  hasSubmissions?: boolean

  /** Save the bounty (create or update) */
  onSave?: (data: Partial<Bounty>) => void
  /** Publish the bounty after saving */
  onPublish?: (bountyId: string) => void
  /** Cancel and navigate back */
  onCancel?: () => void
}

export interface BountyDetailProps {
  bounty: Bounty
  category: Category | undefined

  /** Navigate to the edit form */
  onEdit?: () => void
  /** Publish the bounty */
  onPublish?: () => void
  /** Pause the bounty */
  onPause?: () => void
  /** Resume the bounty */
  onResume?: () => void
  /** Close the bounty */
  onClose?: () => void
  /** Duplicate the bounty */
  onDuplicate?: () => void
  /** Navigate to submissions for this bounty in Review Center */
  onViewSubmissions?: () => void
  /** Navigate back to the bounty list */
  onBack?: () => void
}
