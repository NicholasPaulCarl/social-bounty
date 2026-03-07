import data from '@/../product/sections/admin-panel/data.json'
import { UserDetail } from './components/UserDetail'

export default function UserDetailView() {
  // Show user-003 (Alex Chen) — suspended user with submissions and audit log activity
  const user = data.users.find((u) => u.id === 'user-003')!

  // Filter submissions by this user's name
  const submissions = data.submissions.filter((s) => s.participantName === user.name)

  // Filter audit logs related to this user
  const auditLogs = data.auditLogs.filter((l) => l.entityId === user.id)

  return (
    <UserDetail
      user={user as any}
      submissions={submissions as any}
      auditLogs={auditLogs as any}
      onBack={() => console.log('Back to admin panel')}
      onSuspendUser={(id, reason) => console.log('Suspend user:', id, reason)}
      onReinstateUser={(id) => console.log('Reinstate user:', id)}
      onForcePasswordReset={(id) => console.log('Force password reset:', id)}
    />
  )
}
