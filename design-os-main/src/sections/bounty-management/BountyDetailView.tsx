import data from '@/../product/sections/bounty-management/data.json'
import { BountyDetail } from './components/BountyDetail'

export default function BountyDetailView() {
  // Show the first live bounty with submissions for a rich detail preview
  const bounty = data.bounties.find((b) => b.status === 'live' && b.submissionCount > 0) ?? data.bounties[0]
  const category = data.categories.find((c) => c.id === bounty.categoryId)

  return (
    <BountyDetail
      bounty={bounty}
      category={category}
      onEdit={() => console.log('Edit bounty')}
      onPublish={() => console.log('Publish bounty')}
      onPause={() => console.log('Pause bounty')}
      onResume={() => console.log('Resume bounty')}
      onClose={() => console.log('Close bounty')}
      onDuplicate={() => console.log('Duplicate bounty')}
      onViewSubmissions={() => console.log('View submissions')}
      onBack={() => console.log('Back to list')}
    />
  )
}
