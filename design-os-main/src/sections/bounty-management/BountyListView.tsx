import data from '@/../product/sections/bounty-management/data.json'
import { BountyList } from './components/BountyList'

export default function BountyListView() {
  return (
    <BountyList
      bounties={data.bounties}
      categories={data.categories}
      onCreateBounty={() => console.log('Create bounty')}
      onViewBounty={(id) => console.log('View bounty:', id)}
      onEditBounty={(id) => console.log('Edit bounty:', id)}
      onPublishBounty={(id) => console.log('Publish bounty:', id)}
      onPauseBounty={(id) => console.log('Pause bounty:', id)}
      onResumeBounty={(id) => console.log('Resume bounty:', id)}
      onCloseBounty={(id) => console.log('Close bounty:', id)}
      onDuplicateBounty={(id) => console.log('Duplicate bounty:', id)}
    />
  )
}
