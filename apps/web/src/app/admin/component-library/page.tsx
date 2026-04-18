'use client';

import { useState, useEffect } from 'react';
import { Star, Palette, Circle, LayoutGrid, Network, List, Crown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LibrarySidebar } from './_components/LibrarySidebar';
import DesignTokensSection from './_components/sections/DesignTokensSection';
import AtomsSection from './_components/sections/AtomsSection';
import MoleculesSection from './_components/sections/MoleculesSection';
import OrganismsSection from './_components/sections/OrganismsSection';
import FormSectionsSection from './_components/sections/FormSectionsSection';
import PrimeReactSection from './_components/sections/PrimeReactSection';
import BrandSection from './_components/sections/BrandSection';

const SECTION_IDS = [
  'brand',
  'design-tokens',
  'atoms',
  'molecules',
  'organisms',
  'form-sections',
  'primereact',
];

export default function ComponentLibraryPage() {
  const [activeSection, setActiveSection] = useState('design-tokens');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    sections.forEach((el) => observer.observe(el!));

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <PageHeader
        title="Component library"
        subtitle="Social Bounty design system — canonical tokens + component reference"
        breadcrumbs={[
          { label: 'Dashboard', url: '/admin/dashboard' },
          { label: 'Component library' },
        ]}
      />

      <div className="flex gap-8">
        <LibrarySidebar activeSection={activeSection} />

        <main className="flex-1 min-w-0 animate-fade-up">
          <section id="brand" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Star size={20} strokeWidth={2} className="text-pink-600" />
              Brand guidelines
            </h2>
            <BrandSection />
          </section>

          <section id="design-tokens" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Palette size={20} strokeWidth={2} className="text-pink-600" />
              Design tokens
            </h2>
            <DesignTokensSection />
          </section>

          <section id="atoms" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Circle size={20} strokeWidth={2} className="text-pink-600" />
              Atoms
            </h2>
            <AtomsSection />
          </section>

          <section id="molecules" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <LayoutGrid size={20} strokeWidth={2} className="text-pink-600" />
              Molecules
            </h2>
            <MoleculesSection />
          </section>

          <section id="organisms" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Network size={20} strokeWidth={2} className="text-pink-600" />
              Organisms
            </h2>
            <OrganismsSection />
          </section>

          <section id="form-sections" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <List size={20} strokeWidth={2} className="text-pink-600" />
              Form sections
            </h2>
            <FormSectionsSection />
          </section>

          <section id="primereact" className="mb-16">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
              <Crown size={20} strokeWidth={2} className="text-pink-600" />
              PrimeReact components
            </h2>
            <PrimeReactSection />
          </section>
        </main>
      </div>
    </div>
  );
}
