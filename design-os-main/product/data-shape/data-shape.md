# Data Shape

## Entities

### User
A person who uses the platform. Users authenticate with email/password and are assigned a role (Participant, Business Admin, or Super Admin) that determines their access and capabilities.

### Organization
A business or company that creates and manages bounties. Each organization has its own pool of bounties, members, and payout records.

### OrganizationMember
The membership link between a User and an Organization, capturing the user's role within that specific organization. A business admin belongs to exactly one organization.

### Bounty
A task posted by an organization with a defined reward, requirements, and deadline. Bounties move through a lifecycle: Draft, Live, Paused, Closed.

### Submission
A participant's completed work for a specific bounty, including structured proof-of-completion. Submissions follow a review lifecycle: Submitted, In Review, Needs More Info, Approved, Rejected.

### Payout
A financial record tracking payment for an approved submission. Tracks status (Not Paid, Pending, Paid) and is linked to both the submission and the participant.

### FileUpload
A file (image, document, etc.) attached to a submission as proof-of-completion. Stores metadata like file type, size, and storage location.

### AuditLog
A timestamped record of significant actions taken by admins and the system, including user management changes, submission overrides, and configuration updates. Used for accountability and troubleshooting.

## Relationships

- Organization has many OrganizationMember
- OrganizationMember belongs to Organization and User
- Organization has many Bounty
- Bounty has many Submission
- Submission belongs to Bounty and User (the participant)
- Submission has one Payout
- Submission has many FileUpload
- AuditLog belongs to User (the actor)
