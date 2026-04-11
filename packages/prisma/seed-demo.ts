import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── User Data ───────────────────────────────────────────

const PARTICIPANTS = [
  { email: 'hunter@socialbounty.cash', firstName: 'Demo', lastName: 'Hunter' },
  { email: 'sarah.mitchell@socialbounty.cash', firstName: 'Sarah', lastName: 'Mitchell' },
  { email: 'james.peterson@socialbounty.cash', firstName: 'James', lastName: 'Peterson' },
  { email: 'thandi.mabaso@socialbounty.cash', firstName: 'Thandi', lastName: 'Mabaso' },
  { email: 'ryan.chen@socialbounty.cash', firstName: 'Ryan', lastName: 'Chen' },
  { email: 'priya.naidoo@socialbounty.cash', firstName: 'Priya', lastName: 'Naidoo' },
  { email: 'lucas.van.wyk@socialbounty.cash', firstName: 'Lucas', lastName: 'Van Wyk' },
  { email: 'aisha.khan@socialbounty.cash', firstName: 'Aisha', lastName: 'Khan' },
  { email: 'david.okonkwo@socialbounty.cash', firstName: 'David', lastName: 'Okonkwo' },
  { email: 'emma.williams@socialbounty.cash', firstName: 'Emma', lastName: 'Williams' },
  { email: 'sipho.dlamini@socialbounty.cash', firstName: 'Sipho', lastName: 'Dlamini' },
  { email: 'nina.garcia@socialbounty.cash', firstName: 'Nina', lastName: 'Garcia' },
  { email: 'alex.turner@socialbounty.cash', firstName: 'Alex', lastName: 'Turner' },
  { email: 'fatima.osman@socialbounty.cash', firstName: 'Fatima', lastName: 'Osman' },
  { email: 'kyle.joubert@socialbounty.cash', firstName: 'Kyle', lastName: 'Joubert' },
];

const BUSINESS_ADMINS = [
  { email: 'brand@socialbounty.cash', firstName: 'Demo', lastName: 'Brand', orgName: 'Demo Company', orgEmail: 'brand@socialbounty.cash', orgId: 'demo-org-id' },
  { email: 'marketing@freshroast.co', firstName: 'Lebo', lastName: 'Moloi', orgName: 'Fresh Roast Coffee', orgEmail: 'hello@freshroast.co' },
  { email: 'social@urbanfit.za', firstName: 'Craig', lastName: 'Hendricks', orgName: 'UrbanFit Gym', orgEmail: 'info@urbanfit.za' },
  { email: 'campaigns@vividmedia.co', firstName: 'Zanele', lastName: 'Khumalo', orgName: 'Vivid Media Agency', orgEmail: 'info@vividmedia.co' },
];

const SUPER_ADMINS = [
  { email: 'admin@socialbounty.cash', firstName: 'Demo', lastName: 'Super Admin' },
];

// ─── Bounty Templates ────────────────────────────────────

const BOUNTY_TEMPLATES = [
  {
    title: 'Instagram Reel — Summer Coffee Challenge',
    shortDescription: 'Create a fun Instagram Reel showing your favourite iced coffee moment this summer. Tag @freshroast and use #FreshSummer.',
    fullInstructions: 'Film a short 15-30 second Reel showcasing your iced coffee routine. Be creative — show the preparation, a scenic location, or a fun transition. Must include the Fresh Roast logo or product in at least one frame.',
    category: 'Social Media',
    rewardType: 'CASH' as const,
    rewardValue: 500,
    currency: 'ZAR' as const,
    maxSubmissions: 50,
    status: 'LIVE' as const,
    proofRequirements: 'Submit the URL to your published Instagram Reel. Must be from a public account with 500+ followers.',
    eligibilityRules: 'Must have a public Instagram account with at least 500 followers. Account must be at least 3 months old.',
    orgIndex: 0,
  },
  {
    title: 'TikTok Gym Transformation Video',
    shortDescription: 'Share your gym transformation journey in a 30-60 second TikTok video. Show your progress and tag @urbanfit.',
    fullInstructions: 'Create a transformation video showing your fitness journey. Include before/after shots if possible. Mention UrbanFit Gym in your caption and use #UrbanFitTransform.',
    category: 'Social Media',
    rewardType: 'CASH' as const,
    rewardValue: 750,
    currency: 'ZAR' as const,
    maxSubmissions: 30,
    status: 'LIVE' as const,
    proofRequirements: 'Submit TikTok URL. Post must remain live for at least 7 days.',
    eligibilityRules: 'Must be an active gym member or fitness enthusiast. TikTok account must have 1000+ followers.',
    orgIndex: 1,
  },
  {
    title: 'Google Review for Fresh Roast Café',
    shortDescription: 'Write an honest Google review for any Fresh Roast Café location. Minimum 100 words with a photo.',
    fullInstructions: 'Visit any Fresh Roast location, take a photo of your order, and write a genuine review on Google Maps. We value honest feedback — both positive and constructive. Include the photo in your review.',
    category: 'Reviews',
    rewardType: 'PRODUCT' as const,
    rewardValue: 200,
    currency: 'ZAR' as const,
    maxSubmissions: 100,
    status: 'LIVE' as const,
    proofRequirements: 'Screenshot of your published Google review showing your name and the photo.',
    eligibilityRules: 'Must have a Google account with at least 5 previous reviews.',
    orgIndex: 0,
  },
  {
    title: 'Refer a Friend to UrbanFit',
    shortDescription: 'Refer a friend who signs up for an UrbanFit membership. Earn R300 for each successful referral.',
    fullInstructions: 'Share your unique referral link with friends. When they sign up for a monthly membership and complete their first month, you earn R300. No limit on referrals.',
    category: 'Referrals',
    rewardType: 'CASH' as const,
    rewardValue: 300,
    currency: 'ZAR' as const,
    maxSubmissions: 200,
    status: 'LIVE' as const,
    proofRequirements: 'Submit the name and email of the friend who signed up. We will verify membership activation.',
    eligibilityRules: 'Open to all participants. Referred friend must be a new UrbanFit member.',
    orgIndex: 1,
  },
  {
    title: 'Product Photography — Fresh Roast New Blend',
    shortDescription: 'Take professional-quality photos of our new single-origin blend. 5 unique shots needed.',
    fullInstructions: 'Photograph the Fresh Roast Single Origin pack in creative settings. We need 5 different compositions: flat lay, lifestyle shot, close-up detail, outdoor setting, and paired with food. Minimum 2000x2000px resolution.',
    category: 'Content Creation',
    rewardType: 'CASH' as const,
    rewardValue: 1500,
    currency: 'ZAR' as const,
    maxSubmissions: 10,
    status: 'LIVE' as const,
    proofRequirements: 'Upload all 5 photos as high-resolution images. Include a behind-the-scenes shot of your setup.',
    eligibilityRules: 'Must have a portfolio or previous product photography experience. Submit examples with your application.',
    orgIndex: 0,
  },
  {
    title: 'Facebook Group Post — UrbanFit Community',
    shortDescription: 'Share your workout routine in the UrbanFit Facebook Group. Must include a gym selfie and tag the page.',
    fullInstructions: 'Write a post in the UrbanFit Community Facebook Group sharing your weekly workout routine. Include at least one photo taken at the gym. Be detailed about your exercises, sets, and reps. Encourage others to join.',
    category: 'Social Media',
    rewardType: 'SERVICE' as const,
    rewardValue: 0,
    currency: 'ZAR' as const,
    maxSubmissions: 40,
    status: 'LIVE' as const,
    proofRequirements: 'Screenshot of your Facebook Group post showing likes and comments.',
    eligibilityRules: 'Must be a member of the UrbanFit Community Facebook Group.',
    orgIndex: 1,
  },
  {
    title: 'Brand Campaign — Vivid Media Summer Push',
    shortDescription: 'Create engaging social media content for Vivid Media\'s summer brand campaign across multiple platforms.',
    fullInstructions: 'Produce 3 pieces of content: 1 Instagram Story series (minimum 5 slides), 1 TikTok video (15-60s), and 1 Facebook post. All content must follow the Vivid Media brand guidelines provided in the brand assets section. Use #VividSummer and tag @vividmedia.',
    category: 'Content Creation',
    rewardType: 'CASH' as const,
    rewardValue: 2500,
    currency: 'ZAR' as const,
    maxSubmissions: 15,
    status: 'LIVE' as const,
    proofRequirements: 'Submit URLs to all 3 posts plus screenshots of initial engagement metrics (24h after posting).',
    eligibilityRules: 'Must have combined social following of 5000+ across platforms. Previous brand collaboration experience preferred.',
    orgIndex: 2,
  },
  {
    title: 'Customer Feedback Survey — Fresh Roast',
    shortDescription: 'Complete a detailed 10-minute survey about your Fresh Roast experience and preferences.',
    fullInstructions: 'Fill out our comprehensive customer survey covering product quality, store experience, pricing perception, and new product suggestions. Survey link will be provided after acceptance.',
    category: 'Surveys',
    rewardType: 'PRODUCT' as const,
    rewardValue: 100,
    currency: 'ZAR' as const,
    maxSubmissions: 500,
    status: 'LIVE' as const,
    proofRequirements: 'Submit your survey confirmation code shown at the end of the survey.',
    eligibilityRules: 'Must have purchased from Fresh Roast at least once in the past 6 months.',
    orgIndex: 0,
  },
  {
    title: 'Blog Post — UrbanFit Workout Tips',
    shortDescription: 'Write a 500+ word blog post about fitness tips, mentioning UrbanFit Gym as your training partner.',
    fullInstructions: 'Write an original blog post on your personal blog, Medium, or any publishing platform. Topic should relate to fitness, health, or gym culture. Naturally mention UrbanFit Gym with a backlink. No AI-generated content — we check.',
    category: 'Content Creation',
    rewardType: 'CASH' as const,
    rewardValue: 800,
    currency: 'ZAR' as const,
    maxSubmissions: 20,
    status: 'LIVE' as const,
    proofRequirements: 'Submit the URL to your published blog post.',
    eligibilityRules: 'Must have an established blog or Medium account with at least 3 previous posts.',
    orgIndex: 1,
  },
  {
    title: 'Event Coverage — Fresh Roast Tasting Night',
    shortDescription: 'Attend and create live social media coverage of our monthly coffee tasting event in Cape Town.',
    fullInstructions: 'Attend the Fresh Roast Tasting Night on the last Friday of the month at our Bree Street location. Create real-time coverage: minimum 10 Instagram Stories, 3 feed posts, and 1 Reel. Capture the atmosphere, people, and coffee.',
    category: 'Social Media',
    rewardType: 'CASH' as const,
    rewardValue: 1200,
    currency: 'ZAR' as const,
    maxSubmissions: 5,
    status: 'LIVE' as const,
    proofRequirements: 'Submit URLs to all content plus a screenshot of your Story highlights showing the event.',
    eligibilityRules: 'Must be based in Cape Town. Must have Instagram account with 2000+ followers. Must attend in person.',
    orgIndex: 0,
  },
  {
    title: 'Unboxing Video — UrbanFit Merch Drop',
    shortDescription: 'Create an unboxing video of our new UrbanFit merchandise line. Show genuine reactions and review each item.',
    fullInstructions: 'We will ship you a merch pack (t-shirt, water bottle, gym bag, resistance bands). Film an unboxing video showing your genuine reaction. Review each item briefly. Post on TikTok or Instagram Reels.',
    category: 'Content Creation',
    rewardType: 'PRODUCT' as const,
    rewardValue: 600,
    currency: 'ZAR' as const,
    maxSubmissions: 25,
    status: 'LIVE' as const,
    proofRequirements: 'Submit URL to your published unboxing video.',
    eligibilityRules: 'Must have TikTok or Instagram with 1500+ followers. Must provide shipping address in South Africa.',
    orgIndex: 1,
  },
  {
    title: 'Draft — Holiday Campaign Ideas',
    shortDescription: 'Internal draft for upcoming December holiday campaign. Not yet published.',
    fullInstructions: 'This bounty is still being planned. Details to follow.',
    category: 'Content Creation',
    rewardType: 'CASH' as const,
    rewardValue: 3000,
    currency: 'ZAR' as const,
    maxSubmissions: 10,
    status: 'DRAFT' as const,
    proofRequirements: 'TBD',
    eligibilityRules: 'TBD',
    orgIndex: 2,
  },
  {
    title: 'Paused — Street Style Photography',
    shortDescription: 'Street style photography campaign temporarily paused while we update brand guidelines.',
    fullInstructions: 'Capture street style fashion photography in urban settings featuring our brand. Currently paused for guideline updates.',
    category: 'Content Creation',
    rewardType: 'CASH' as const,
    rewardValue: 1000,
    currency: 'ZAR' as const,
    maxSubmissions: 20,
    status: 'PAUSED' as const,
    proofRequirements: 'Submit 5 edited photos in high resolution.',
    eligibilityRules: 'Must have street photography portfolio.',
    orgIndex: 2,
  },
  {
    title: 'Closed — Launch Day Social Blitz',
    shortDescription: 'This campaign has ended. Thank you to all who participated in our product launch social media blitz.',
    fullInstructions: 'Campaign completed. All submissions have been reviewed and payouts processed.',
    category: 'Social Media',
    rewardType: 'CASH' as const,
    rewardValue: 400,
    currency: 'ZAR' as const,
    maxSubmissions: 100,
    status: 'CLOSED' as const,
    proofRequirements: 'Campaign completed.',
    eligibilityRules: 'Campaign completed.',
    orgIndex: 0,
  },
  {
    title: 'Instagram Story Takeover — Vivid Media',
    shortDescription: 'Take over the @vividmedia Instagram account for a day and share behind-the-scenes of your creative process.',
    fullInstructions: 'You will be given temporary access to post Instagram Stories on the @vividmedia account for 24 hours. Show your creative process, daily routine, and how you approach content creation. Minimum 15 Stories throughout the day.',
    category: 'Social Media',
    rewardType: 'CASH' as const,
    rewardValue: 2000,
    currency: 'ZAR' as const,
    maxSubmissions: 4,
    status: 'LIVE' as const,
    proofRequirements: 'Screenshot of Story insights after 24 hours showing reach and engagement.',
    eligibilityRules: 'Must have 10,000+ Instagram followers. Must be available for a full day takeover. Previous takeover experience preferred.',
    orgIndex: 2,
  },
];

// ─── Main Seed Function ──────────────────────────────────

async function main() {
  console.log('Seeding database...\n');

  // ── 1. Create Participants (15) ──

  const participantUsers = [];
  for (const p of PARTICIPANTS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { firstName: p.firstName, lastName: p.lastName, role: 'PARTICIPANT', status: 'ACTIVE', emailVerified: true },
      create: { email: p.email, firstName: p.firstName, lastName: p.lastName, role: 'PARTICIPANT', status: 'ACTIVE', emailVerified: true },
    });
    participantUsers.push(user);
  }
  console.log(`  Created ${participantUsers.length} participants`);

  // ── 2. Create Business Admins (4) + Organisations ──

  const orgs = [];
  for (const ba of BUSINESS_ADMINS) {
    const user = await prisma.user.upsert({
      where: { email: ba.email },
      update: { firstName: ba.firstName, lastName: ba.lastName, role: 'BUSINESS_ADMIN', status: 'ACTIVE', emailVerified: true },
      create: { email: ba.email, firstName: ba.firstName, lastName: ba.lastName, role: 'BUSINESS_ADMIN', status: 'ACTIVE', emailVerified: true },
    });

    const orgData = {
      name: ba.orgName,
      contactEmail: ba.orgEmail,
      status: 'ACTIVE' as const,
    };

    const org = ba.orgId
      ? await prisma.brand.upsert({
          where: { id: ba.orgId },
          update: orgData,
          create: { id: ba.orgId, ...orgData },
        })
      : await prisma.brand.create({ data: orgData }).catch(async () => {
          // Org may exist if re-seeding — find by name
          const existing = await prisma.brand.findFirst({ where: { name: ba.orgName } });
          return existing!;
        });

    orgs.push(org);

    await prisma.brandMember.upsert({
      where: { userId_brandId: { userId: user.id, brandId: org.id } },
      update: { role: 'OWNER' },
      create: { userId: user.id, brandId: org.id, role: 'OWNER' },
    });
  }
  console.log(`  Created ${BUSINESS_ADMINS.length} business admins with ${orgs.length} organisations`);

  // ── 3. Create Super Admin (1) ──

  for (const sa of SUPER_ADMINS) {
    await prisma.user.upsert({
      where: { email: sa.email },
      update: { firstName: sa.firstName, lastName: sa.lastName, role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true },
      create: { email: sa.email, firstName: sa.firstName, lastName: sa.lastName, role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true },
    });
  }
  console.log(`  Created ${SUPER_ADMINS.length} super admins`);

  // ── 4. Create Bounties (15) ──

  const bounties = [];
  const now = new Date();
  for (let i = 0; i < BOUNTY_TEMPLATES.length; i++) {
    const t = BOUNTY_TEMPLATES[i];
    const org = orgs[t.orgIndex];
    const baUser = await prisma.brandMember.findFirst({
      where: { brandId: org.id, role: 'OWNER' },
    });

    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = new Date(now.getTime() + (30 + i * 5) * 24 * 60 * 60 * 1000); // 30-100 days from now

    const bounty = await prisma.bounty.create({
      data: {
        brandId: org.id,
        createdById: baUser!.userId,
        title: t.title,
        shortDescription: t.shortDescription,
        fullInstructions: t.fullInstructions,
        category: t.category,
        rewardType: t.rewardType,
        rewardValue: t.rewardValue,
        currency: t.currency,
        maxSubmissions: t.maxSubmissions,
        startDate: t.status === 'DRAFT' ? null : startDate,
        endDate: t.status === 'CLOSED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : endDate,
        status: t.status,
        proofRequirements: t.proofRequirements,
        eligibilityRules: t.eligibilityRules,
        paymentStatus: t.status === 'LIVE' ? 'PAID' : t.status === 'DRAFT' ? 'UNPAID' : 'PAID',
      },
    });
    bounties.push(bounty);

    // Create a reward line for each bounty
    if (t.rewardValue > 0) {
      await prisma.bountyReward.create({
        data: {
          bountyId: bounty.id,
          rewardType: t.rewardType,
          name: t.rewardType === 'CASH' ? 'Cash Reward' : t.rewardType === 'PRODUCT' ? 'Product Voucher' : 'Service Credit',
          monetaryValue: t.rewardValue,
          sortOrder: 0,
        },
      });
    }
  }
  console.log(`  Created ${bounties.length} bounties`);

  // ── 5. Create Submissions (spread across participants and live bounties) ──

  const liveBounties = bounties.filter((b) => b.status === 'LIVE');
  const submissionStatuses = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO'] as const;
  const payoutStatuses = ['NOT_PAID', 'PENDING', 'PAID'] as const;
  let submissionCount = 0;

  for (let i = 0; i < Math.min(participantUsers.length, 12); i++) {
    const user = participantUsers[i];
    // Each participant submits to 1-3 random bounties
    const numSubmissions = 1 + (i % 3);

    for (let j = 0; j < numSubmissions; j++) {
      const bounty = liveBounties[(i + j) % liveBounties.length];

      // Check if submission already exists
      const exists = await prisma.submission.findFirst({
        where: { bountyId: bounty.id, userId: user.id },
      });
      if (exists) continue;

      const statusIndex = (i + j) % submissionStatuses.length;
      const status = submissionStatuses[statusIndex];
      const isApproved = status === 'APPROVED';

      await prisma.submission.create({
        data: {
          bountyId: bounty.id,
          userId: user.id,
          proofText: `This is my submission proof for "${bounty.title}". I completed the task as described and here is my evidence.`,
          proofLinks: [`https://instagram.com/p/demo_${user.id.slice(0, 8)}_${j}`],
          status,
          payoutStatus: isApproved ? payoutStatuses[j % payoutStatuses.length] : 'NOT_PAID',
          reviewerNote: status === 'REJECTED' ? 'Content did not meet the requirements. Please review the guidelines.' :
                        status === 'NEEDS_MORE_INFO' ? 'Please provide a clearer screenshot of the post metrics.' :
                        status === 'APPROVED' ? 'Great work! Content meets all requirements.' : null,
        },
      });
      submissionCount++;
    }
  }
  console.log(`  Created ${submissionCount} submissions`);

  // ── 6. System Settings ──

  await prisma.systemSetting.upsert({
    where: { key: 'signupsEnabled' },
    update: {},
    create: { key: 'signupsEnabled', value: 'true', type: 'boolean' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'submissionsEnabled' },
    update: {},
    create: { key: 'submissionsEnabled', value: 'true', type: 'boolean' },
  });

  // ── Summary ──

  console.log('\n═══════════════════════════════════════');
  console.log('  Seed complete!');
  console.log('═══════════════════════════════════════');
  console.log(`  Users:         ${PARTICIPANTS.length + BUSINESS_ADMINS.length + SUPER_ADMINS.length} total`);
  console.log(`    Participants: ${PARTICIPANTS.length}`);
  console.log(`    Bus. Admins:  ${BUSINESS_ADMINS.length}`);
  console.log(`    Super Admins: ${SUPER_ADMINS.length}`);
  console.log(`  Organisations: ${orgs.length}`);
  console.log(`  Bounties:      ${bounties.length} (${liveBounties.length} live, 1 draft, 1 paused, 1 closed)`);
  console.log(`  Submissions:   ${submissionCount}`);
  console.log('  Auth:          OTP (passwordless)');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
