import data from '@/../product/sections/bounty-marketplace/data.json'
import { BountyDetail } from './components/BountyDetail'

export default function BountyDetailView() {
  // Show bounty-002 (Blog Review) — has deadline, spots remaining, no user submission
  const bounty = data.bounties.find((b) => b.id === 'bounty-002')!
  const category = data.categories.find((c) => c.id === bounty.categoryId)!
  const organization = data.organizations.find((o) => o.id === bounty.organizationId)!

  return (
    <BountyDetail
      bounty={bounty as any}
      category={category}
      organization={organization}
      userSubmission={null}
      isAuthenticated={true}
      onSubmitProof={() => console.log('Navigate to submit proof')}
      onBack={() => console.log('Back to browse')}
      onLogin={() => console.log('Login prompt')}
    />
  )
}
