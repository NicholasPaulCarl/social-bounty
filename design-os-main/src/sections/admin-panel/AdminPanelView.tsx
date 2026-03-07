import data from '@/../product/sections/admin-panel/data.json'
import { AdminPanel } from './components/AdminPanel'

export default function AdminPanelView() {
  return (
    <AdminPanel
      dashboardStats={data.dashboardStats}
      users={data.users as any}
      organizations={data.organizations as any}
      bounties={data.bounties as any}
      submissions={data.submissions as any}
      auditLogs={data.auditLogs as any}
      healthChecks={data.healthChecks as any}
      systemErrors={data.systemErrors as any}
      killSwitches={data.killSwitches}
      onViewUser={(id) => console.log('View user:', id)}
      onSuspendUser={(id, reason) => console.log('Suspend user:', id, reason)}
      onReinstateUser={(id) => console.log('Reinstate user:', id)}
      onForcePasswordReset={(id) => console.log('Force password reset:', id)}
      onViewOrg={(id) => console.log('View org:', id)}
      onSuspendOrg={(id, reason) => console.log('Suspend org:', id, reason)}
      onReinstateOrg={(id) => console.log('Reinstate org:', id)}
      onOverrideSubmission={(id, status, reason) => console.log('Override submission:', id, status, reason)}
      onToggleKillSwitch={(id, enabled) => console.log('Toggle kill switch:', id, enabled)}
    />
  )
}
