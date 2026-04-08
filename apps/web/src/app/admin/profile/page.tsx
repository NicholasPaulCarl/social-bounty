'use client';

import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function AdminProfilePage() {
  const toast = useToast();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    updateProfile.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Profile updated');
          refetch();
        },
        onError: () => setProfileError('Couldn\'t update profile. Try again.'),
      },
    );
  };

  return (
    <>
      <PageHeader title="Profile" />

      <div className="space-y-6 max-w-2xl animate-fade-up">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
          {profileError && <Message severity="error" text={profileError} className="w-full mb-4" />}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Email
              </label>
              <InputText id="email" value={profile?.email || ''} disabled className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-1">
                  First Name
                </label>
                <InputText
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-1">
                  Last Name
                </label>
                <InputText
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button label="Save Changes" type="submit" icon="pi pi-save" loading={updateProfile.isPending} />
            </div>
          </form>
        </div>

      </div>
    </>
  );
}
