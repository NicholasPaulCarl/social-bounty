/**
 * Production Seed Script
 *
 * Creates exactly 3 accounts for launch:
 * - Hunter (PARTICIPANT)
 * - Brand (BUSINESS_ADMIN) with Brand
 * - Super Admin (SUPER_ADMIN)
 *
 * Auth is passwordless (OTP via email) — no passwords needed.
 *
 * Usage: npx ts-node seed-production.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AccountConfig {
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARTICIPANT' | 'BUSINESS_ADMIN' | 'SUPER_ADMIN';
  orgName?: string;
}

const ACCOUNTS: AccountConfig[] = [
  {
    email: 'hunter@socialbounty.cash',
    firstName: 'Demo',
    lastName: 'Hunter',
    role: 'PARTICIPANT',
  },
  {
    email: 'brand@socialbounty.cash',
    firstName: 'Demo',
    lastName: 'Brand',
    role: 'BUSINESS_ADMIN',
    orgName: 'Social Bounty Official',
  },
  {
    email: 'admin@socialbounty.cash',
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  },
];

async function main() {
  console.log('\n=== Social Bounty — Production Seed ===\n');

  for (const account of ACCOUNTS) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (existing) {
      console.log(`  ⚠ Skipping ${account.email} — already exists`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // Create brand + membership for Business Admin
    if (account.role === 'BUSINESS_ADMIN' && account.orgName) {
      const org = await prisma.brand.create({
        data: {
          name: account.orgName,
          contactEmail: account.email,
          status: 'ACTIVE',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });
      console.log(`  ✓ Created org: ${org.name} (${org.id})`);
    }

    // Create wallet for the user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        currency: 'ZAR',
      },
    });

    console.log(`  ✓ Created ${account.role}: ${account.email}`);
  }

  console.log('\n=== Accounts ===\n');
  console.log('  ┌──────────────────┬────────────────────────────┐');
  console.log('  │ Role             │ Email                      │');
  console.log('  ├──────────────────┼────────────────────────────┤');
  for (const account of ACCOUNTS) {
    const role = account.role.padEnd(16);
    const email = account.email.padEnd(26);
    console.log(`  │ ${role} │ ${email} │`);
  }
  console.log('  └──────────────────┴────────────────────────────┘');
  console.log('\n  Auth: OTP via email (passwordless)\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
