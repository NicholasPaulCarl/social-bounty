import data from '@/../product/sections/my-submissions/data.json'
import { MySubmissionDetail } from './components/MySubmissionDetail'

export default function MySubmissionDetailView() {
  // Show sub-my-004 (Blog Review) — Needs More Info status, has reviewer note for inline resubmit demo
  const submission = data.submissions.find((s) => s.id === 'sub-my-004')!
  const bounty = data.bounties.find((b) => b.id === submission.bountyId)!

  return (
    <MySubmissionDetail
      submission={submission as any}
      bounty={bounty}
      onResubmit={(links, images) => console.log('Resubmit:', { links, images })}
      onBack={() => console.log('Back to list')}
      onViewBounty={(id) => console.log('View bounty:', id)}
    />
  )
}
