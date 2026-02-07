import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;
const DEMO_PASSWORD = 'DemoPassword123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  // Upsert Participant
  await prisma.user.upsert({
    where: { email: 'participant@demo.com' },
    update: { passwordHash, firstName: 'Demo', lastName: 'Participant', role: 'PARTICIPANT', status: 'ACTIVE', emailVerified: true },
    create: {
      email: 'participant@demo.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Participant',
      role: 'PARTICIPANT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Upsert Business Admin
  const businessAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { passwordHash, firstName: 'Demo', lastName: 'Business Admin', role: 'BUSINESS_ADMIN', status: 'ACTIVE', emailVerified: true },
    create: {
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Business Admin',
      role: 'BUSINESS_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Upsert Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@demo.com' },
    update: { passwordHash, firstName: 'Demo', lastName: 'Super Admin', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true },
    create: {
      email: 'superadmin@demo.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Upsert Demo Organisation
  const org = await prisma.organisation.upsert({
    where: { id: 'demo-org-id' },
    update: { name: 'Demo Company', contactEmail: 'admin@demo.com', status: 'ACTIVE' },
    create: {
      id: 'demo-org-id',
      name: 'Demo Company',
      contactEmail: 'admin@demo.com',
      status: 'ACTIVE',
    },
  });

  // Upsert OrganisationMember linking Business Admin to Demo Company
  await prisma.organisationMember.upsert({
    where: { userId_organisationId: { userId: businessAdmin.id, organisationId: org.id } },
    update: { role: 'OWNER' },
    create: {
      userId: businessAdmin.id,
      organisationId: org.id,
      role: 'OWNER',
    },
  });

  console.log('Demo seed data created:');
  console.log(`  Participant: participant@demo.com`);
  console.log(`  Business Admin: admin@demo.com (org: ${org.name})`);
  console.log(`  Super Admin: superadmin@demo.com`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
