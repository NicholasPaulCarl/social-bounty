export const LEGAL_ENTITY = {
  registeredName: 'Social Bounty (Pty) Ltd',
  tradingName: 'Social Bounty',
  cipcRegNumber: '2026/301053/07',
  incorporationDate: '2026-04-14',
  incorporationYear: '2026',
  financialYearEnd: '28 February',
  vatStatus: 'Not currently VAT-registered',
  vatNumber: null as string | null,
  registeredAddress: {
    street: '2 Alyth Road',
    suburb: 'Forest Town',
    city: 'Johannesburg',
    province: 'Gauteng',
    postcode: '2193',
    country: 'South Africa',
    formatted: '2 Alyth Road, Forest Town, Johannesburg, Gauteng, 2193, South Africa',
  },
  domain: 'socialbounty.cash',
  websiteUrl: 'https://socialbounty.cash',
  emails: {
    privacy: 'privacy@socialbounty.cash',
    legal: 'legal@socialbounty.cash',
    complaints: 'complaints@socialbounty.cash',
    takedown: 'dmca@socialbounty.cash',
    general: 'hello@socialbounty.cash',
    dataSubjectRights: 'privacy@socialbounty.cash',
  },
  informationOfficer: {
    name: 'Nicholas Paul Carl Schreiber',
    role: 'Director (Acting Information Officer)',
    email: 'privacy@socialbounty.cash',
  },
  governingLaw: 'South Africa',
  governingLawDivision: 'Gauteng Division of the High Court of South Africa',
  paymentPartner: {
    name: 'TradeSafe Escrow (Pty) Ltd',
    role: 'Registered digital escrow partner',
    url: 'https://www.tradesafe.co.za',
  },
  verificationProcessor: {
    name: 'Apify',
    jurisdiction: 'Czech Republic / United States',
    role: 'Social-media verification processor',
    url: 'https://apify.com',
  },
  informationRegulator: {
    name: 'Information Regulator of South Africa',
    url: 'https://inforegulator.org.za',
    email: 'POPIAComplaints@inforegulator.org.za',
  },
  nationalConsumerCommission: {
    name: 'National Consumer Commission',
    url: 'https://www.thencc.gov.za',
  },
} as const;

// LEGAL_VERSION + LEGAL_EFFECTIVE_DATE live in @social-bounty/shared so the
// API can read the same source-of-truth when stamping User.termsAcceptedVersion
// at signup. Re-exported here so existing import sites keep working.
export { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE } from '@social-bounty/shared';
