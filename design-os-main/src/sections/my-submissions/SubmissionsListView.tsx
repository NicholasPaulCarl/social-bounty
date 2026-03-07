import data from '@/../product/sections/my-submissions/data.json'
import { SubmissionsList } from './components/SubmissionsList'

export default function SubmissionsListView() {
  return (
    <SubmissionsList
      submissions={data.submissions as any}
      bounties={data.bounties}
      earningsSummary={data.earningsSummary}
      onViewSubmission={(id) => console.log('View submission:', id)}
      onViewBounty={(id) => console.log('View bounty:', id)}
    />
  )
}
