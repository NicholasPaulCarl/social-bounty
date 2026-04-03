/**
 * Production Seed Script
 *
 * Creates exactly 3 accounts for launch:
 * - Hunter (PARTICIPANT)
 * - Brand (BUSINESS_ADMIN) with Organisation
 * - Super Admin (SUPER_ADMIN)
 *
 * Usage: npx ts-node seed-production.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

interface AccountConfig {
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARTICIPANT' | 'BUSINESS_ADMIN' | 'SUPER_ADMIN';
  password: string;
  orgName?: string;
}

function generatePassword(): string {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

const ACCOUNTS: AccountConfig[] = [
  {
    email: 'hunter@socialbounty.cash',
    firstName: 'Demo',
    lastName: 'Hunter',
    role: 'PARTICIPANT',
    password: generatePassword(),
  },
  {
    email: 'brand@socialbounty.cash',
    firstName: 'Demo',
    lastName: 'Brand',
    role: 'BUSINESS_ADMIN',
    password: generatePassword(),
    orgName: 'Social Bounty Official',
  },
  {
    email: 'admin@socialbounty.cash',
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    password: generatePassword(),
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

    const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        status: 'ACTIVE',
        emailVerified: true,
        credential: {
          create: { passwordHash },
        },
      },
    });

    // Create organisation + membership for Business Admin
    if (account.role === 'BUSINESS_ADMIN' && account.orgName) {
      const org = await prisma.organisation.create({
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

  console.log('\n=== Login Credentials ===\n');
  console.log('  ┌──────────────────┬────────────────────────────┬──────────────────┐');
  console.log('  │ Role             │ Email                      │ Password         │');
  console.log('  ├──────────────────┼────────────────────────────┼──────────────────┤');
  for (const account of ACCOUNTS) {
    const role = account.role.padEnd(16);
    const email = account.email.padEnd(26);
    const pass = account.password.padEnd(16);
    console.log(`  │ ${role} │ ${email} │ ${pass} │`);
  }
  console.log('  └──────────────────┴────────────────────────────┴──────────────────┘');
  console.log('\n  ⚠ Save these credentials securely — they are only shown once.\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
