'use client';

import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function BusinessProfilePage() {
  const toast = useToast();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
        onError: () => setProfileError('Failed to update profile'),
      },
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.showSuccess('Password changed successfully');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: () => setPasswordError('Failed to change password. Check your current password.'),
      },
    );
  };

  return (
    <>
      <PageHeader title="Profile" />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Personal Information</h3>
          {profileError && <Message severity="error" text={profileError} className="w-full mb-4" />}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <InputText id="email" value={profile?.email || ''} disabled className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
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
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
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
              <Button
                label="Save Changes"
                type="submit"
                icon="pi pi-save"
                loading={updateProfile.isPending}
              />
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Change Password</h3>
          {passwordError && <Message severity="error" text={passwordError} className="w-full mb-4" />}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                Current Password
              </label>
              <Password
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>

            <Divider />

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                New Password
              </label>
              <Password
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm New Password
              </label>
              <Password
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>

            <div className="flex justify-end">
              <Button
                label="Change Password"
                type="submit"
                icon="pi pi-lock"
                severity="warning"
                loading={changePassword.isPending}
              />
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
