import data from '@/../product/sections/bounty-marketplace/data.json'
import { BountyBrowse } from './components/BountyBrowse'

export default function BountyBrowseView() {
  return (
    <BountyBrowse
      bounties={data.bounties as any}
      categories={data.categories}
      organizations={data.organizations}
      userSubmissions={data.userSubmissions as any}
      isAuthenticated={true}
      onViewBounty={(id) => console.log('View bounty:', id)}
    />
  )
}
