import data from '@/../product/sections/bounty-management/data.json'
import { BountyForm } from './components/BountyForm'

export default function BountyFormView() {
  // Show the edit form for a live bounty with submissions (demonstrates field locking)
  const bounty = data.bounties.find((b) => b.status === 'live' && b.submissionCount > 0) ?? data.bounties[0]

  return (
    <BountyForm
      bounty={bounty}
      categories={data.categories}
      hasSubmissions={bounty.submissionCount > 0}
      onSave={(formData) => console.log('Save bounty:', formData)}
      onPublish={(id) => console.log('Publish bounty:', id)}
      onCancel={() => console.log('Cancel')}
    />
  )
}
