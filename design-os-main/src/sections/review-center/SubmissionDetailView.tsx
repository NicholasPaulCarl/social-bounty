import data from '@/../product/sections/review-center/data.json'
import { SubmissionDetail } from './components/SubmissionDetail'

export default function SubmissionDetailView() {
  // Show sub-008 (Design templates) — has rich history, multiple image proofs, and a pending payout
  const submission = data.submissions.find((s) => s.id === 'sub-008')!
  const participant = data.participants.find((p) => p.id === submission.participantId)!
  const bounty = data.bounties.find((b) => b.id === submission.bountyId)!

  return (
    <SubmissionDetail
      submission={submission as any}
      participant={participant}
      bounty={bounty as any}
      onApprove={(note) => console.log('Approve:', note)}
      onReject={(reason) => console.log('Reject:', reason)}
      onRequestMoreInfo={(msg) => console.log('Request info:', msg)}
      onMarkPaid={() => console.log('Mark paid')}
      onBack={() => console.log('Back to queue')}
      onOpenLightbox={(url) => console.log('Open lightbox:', url)}
    />
  )
}
