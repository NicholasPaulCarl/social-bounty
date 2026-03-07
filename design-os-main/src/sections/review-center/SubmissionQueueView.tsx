import data from '@/../product/sections/review-center/data.json'
import { SubmissionQueue } from './components/SubmissionQueue'

export default function SubmissionQueueView() {
  return (
    <SubmissionQueue
      submissions={data.submissions as any}
      participants={data.participants}
      bounties={data.bounties as any}
      onViewSubmission={(id) => console.log('View submission:', id)}
      onApprove={(id, note) => console.log('Approve:', id, note)}
      onReject={(id, reason) => console.log('Reject:', id, reason)}
      onRequestMoreInfo={(id, msg) => console.log('Request info:', id, msg)}
      onMarkPaid={(id) => console.log('Mark paid:', id)}
      onBackToQueue={() => console.log('Back to queue')}
    />
  )
}
