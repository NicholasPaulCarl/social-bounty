import data from '@/../product/sections/bounty-marketplace/data.json'
import { SubmitProof } from './components/SubmitProof'

export default function SubmitProofView() {
  // Show submit form for bounty-002 (Blog Review)
  const bounty = data.bounties.find((b) => b.id === 'bounty-002')!
  const organization = data.organizations.find((o) => o.id === bounty.organizationId)!

  return (
    <SubmitProof
      bounty={bounty as any}
      organization={organization}
      onSubmit={(links, images) => console.log('Submit proof:', { links, images })}
      onBack={() => console.log('Back to bounty detail')}
    />
  )
}
