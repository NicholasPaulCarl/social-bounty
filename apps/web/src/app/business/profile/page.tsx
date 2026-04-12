'use client';

import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function BusinessProfilePage() {
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
  if (!profile) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('First name and last name are required.');
      return;
    }

    updateProfile.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Profile updated');
          refetch();
        },
        onError: () => setProfileError("Couldn't update profile. Try again."),
      },
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" />

      <div className="space-y-6 max-w-2xl">
        {/* Account Details */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
            Account Details
          </h3>
          {profileError && <Message severity="error" text={profileError} className="w-full mb-4" />}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
                <label htmlFor="lastName" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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

            <div>
              <label htmlFor="email" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2">
                <InputText id="email" value={profile.email || ''} disabled className="w-full" />
                {profile.emailVerified ? (
                  <span className="text-accent-emerald text-xs flex items-center gap-1 whitespace-nowrap">
                    <i className="pi pi-check-circle text-xs" /> Verified
                  </span>
                ) : (
                  <span className="text-accent-amber text-xs flex items-center gap-1 whitespace-nowrap">
                    <i className="pi pi-exclamation-circle text-xs" /> Unverified
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                label="Save Changes"
                type="submit"
                icon="pi pi-save"
                loading={updateProfile.isPending}
              />
            </div>
          </form>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
            Security
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            This account uses email verification codes (OTP) to sign in. No password is required.
          </p>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider font-medium mb-1">
              Authentication Method
            </p>
            <p className="text-text-primary text-sm font-medium flex items-center gap-2">
              <i className="pi pi-lock text-accent-emerald text-xs" />
              Email OTP (one-time passcode)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
