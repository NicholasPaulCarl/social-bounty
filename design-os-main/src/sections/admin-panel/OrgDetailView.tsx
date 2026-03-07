import data from '@/../product/sections/admin-panel/data.json'
import { OrgDetail } from './components/OrgDetail'

export default function OrgDetailView() {
  // Show org-nova (NovaTech Group) — suspended org with members, bounties, and audit activity
  const org = data.organizations.find((o) => o.id === 'org-nova')!

  // Filter members by org name
  const members = data.users.filter((u) => u.organizationName === org.name)

  // Filter bounties by org name
  const bounties = data.bounties.filter((b) => b.organizationName === org.name)

  // Filter submissions related to this org's bounties
  const orgBountyTitles = new Set(bounties.map((b) => b.title))
  const submissions = data.submissions.filter((s) => orgBountyTitles.has(s.bountyTitle))

  // Filter audit logs related to this org
  const auditLogs = data.auditLogs.filter((l) => l.entityId === org.id)

  return (
    <OrgDetail
      organization={org as any}
      members={members as any}
      bounties={bounties as any}
      submissions={submissions as any}
      auditLogs={auditLogs as any}
      onBack={() => console.log('Back to admin panel')}
      onSuspendOrg={(id, reason) => console.log('Suspend org:', id, reason)}
      onReinstateOrg={(id) => console.log('Reinstate org:', id)}
      onViewUser={(id) => console.log('View user:', id)}
    />
  )
}
