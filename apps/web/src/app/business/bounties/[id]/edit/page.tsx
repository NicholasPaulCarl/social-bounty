'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useBounty, useUpdateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { RewardType } from '@social-bounty/shared';

const rewardTypeOptions = [
  { label: 'Cash', value: RewardType.CASH },
  { label: 'Product', value: RewardType.PRODUCT },
  { label: 'Service', value: RewardType.SERVICE },
  { label: 'Other', value: RewardType.OTHER },
];

export default function EditBountyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: bounty, isLoading, error, refetch } = useBounty(id);
  const updateBounty = useUpdateBounty(id);

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullInstructions, setFullInstructions] = useState('');
  const [category, setCategory] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>(RewardType.CASH);
  const [rewardValue, setRewardValue] = useState<number | null>(null);
  const [rewardDescription, setRewardDescription] = useState('');
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [eligibilityRules, setEligibilityRules] = useState('');
  const [proofRequirements, setProofRequirements] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (bounty) {
      setTitle(bounty.title);
      setShortDescription(bounty.shortDescription);
      setFullInstructions(bounty.fullInstructions);
      setCategory(bounty.category);
      setRewardType(bounty.rewardType as RewardType);
      setRewardValue(bounty.rewardValue ? parseFloat(bounty.rewardValue) : null);
      setRewardDescription(bounty.rewardDescription || '');
      setMaxSubmissions(bounty.maxSubmissions ?? null);
      setStartDate(bounty.startDate ? new Date(bounty.startDate) : null);
      setEndDate(bounty.endDate ? new Date(bounty.endDate) : null);
      setEligibilityRules(bounty.eligibilityRules);
      setProofRequirements(bounty.proofRequirements);
    }
  }, [bounty]);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    updateBounty.mutate(
      {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        fullInstructions: fullInstructions.trim(),
        category: category.trim(),
        rewardType,
        rewardValue: rewardValue ?? undefined,
        rewardDescription: rewardDescription.trim() || undefined,
        maxSubmissions: maxSubmissions ?? undefined,
        startDate: startDate?.toISOString() ?? undefined,
        endDate: endDate?.toISOString() ?? undefined,
        eligibilityRules: eligibilityRules.trim(),
        proofRequirements: proofRequirements.trim(),
      },
      {
        onSuccess: () => {
          toast.showSuccess('Bounty updated successfully');
          router.push(`/business/bounties/${id}`);
        },
        onError: () => setFormError('Failed to update bounty. Please try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty.title, url: `/business/bounties/${id}` },
    { label: 'Edit' },
  ];

  return (
    <>
      <PageHeader title="Edit Bounty" breadcrumbs={breadcrumbs} />

      <Card>
        {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">Title *</label>
            <InputText id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" required />
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-neutral-700 mb-1">Short Description *</label>
            <InputTextarea id="shortDescription" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className="w-full" required />
          </div>

          <div>
            <label htmlFor="fullInstructions" className="block text-sm font-medium text-neutral-700 mb-1">Full Instructions *</label>
            <InputTextarea id="fullInstructions" value={fullInstructions} onChange={(e) => setFullInstructions(e.target.value)} rows={5} className="w-full" required />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
            <InputText id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rewardType" className="block text-sm font-medium text-neutral-700 mb-1">Reward Type *</label>
              <Dropdown id="rewardType" value={rewardType} options={rewardTypeOptions} onChange={(e) => setRewardType(e.value)} className="w-full" />
            </div>
            <div>
              <label htmlFor="rewardValue" className="block text-sm font-medium text-neutral-700 mb-1">Reward Value</label>
              <InputNumber id="rewardValue" value={rewardValue} onValueChange={(e) => setRewardValue(e.value ?? null)} mode="currency" currency="USD" locale="en-US" className="w-full" />
            </div>
          </div>

          <div>
            <label htmlFor="rewardDescription" className="block text-sm font-medium text-neutral-700 mb-1">Reward Description</label>
            <InputText id="rewardDescription" value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} className="w-full" />
          </div>

          <div>
            <label htmlFor="eligibilityRules" className="block text-sm font-medium text-neutral-700 mb-1">Eligibility Rules *</label>
            <InputTextarea id="eligibilityRules" value={eligibilityRules} onChange={(e) => setEligibilityRules(e.target.value)} rows={3} className="w-full" required />
          </div>

          <div>
            <label htmlFor="proofRequirements" className="block text-sm font-medium text-neutral-700 mb-1">Proof Requirements *</label>
            <InputTextarea id="proofRequirements" value={proofRequirements} onChange={(e) => setProofRequirements(e.target.value)} rows={3} className="w-full" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="maxSubmissions" className="block text-sm font-medium text-neutral-700 mb-1">Max Submissions</label>
              <InputNumber id="maxSubmissions" value={maxSubmissions} onValueChange={(e) => setMaxSubmissions(e.value ?? null)} min={1} className="w-full" />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
              <Calendar id="startDate" value={startDate} onChange={(e) => setStartDate(e.value ?? null)} showTime className="w-full" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
              <Calendar id="endDate" value={endDate} onChange={(e) => setEndDate(e.value ?? null)} showTime className="w-full" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button label="Cancel" type="button" outlined severity="secondary" onClick={() => router.push(`/business/bounties/${id}`)} />
            <Button label="Save Changes" type="submit" icon="pi pi-save" loading={updateBounty.isPending} />
          </div>
        </form>
      </Card>
    </>
  );
}
