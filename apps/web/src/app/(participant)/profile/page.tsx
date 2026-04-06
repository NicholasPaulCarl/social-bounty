'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Fieldset } from 'primereact/fieldset';
import { Message } from 'primereact/message';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ApiError } from '@/lib/api/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!profile) return null;

  const startEditing = () => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ firstName, lastName });
      showSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError) showError(err.message);
      else showError('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      if (err instanceof ApiError) setPasswordError(err.message);
      else setPasswordError('Failed to change password');
    }
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        actions={
          !editing ? (
            <Button label="Edit Profile" icon="pi pi-pencil" onClick={startEditing} />
          ) : undefined
        }
      />

      {!profile.emailVerified && (
        <Message
          severity="warn"
          text="Your email is not verified. Please check your inbox for a verification link."
          className="w-full mb-4"
        />
      )}

      <div className="space-y-6 max-w-2xl">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-on-surface">Account Details</h3>
              {user?.role && <StatusBadge type="role" value={user.role} size="small" />}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
                      First Name
                    </label>
                    <InputText
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
                      Last Name
                    </label>
                    <InputText
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    label="Save"
                    icon="pi pi-check"
                    onClick={handleSaveProfile}
                    loading={updateProfile.isPending}
                  />
                  <Button
                    label="Cancel"
                    outlined
                    onClick={() => setEditing(false)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-on-surface-variant">Name</p>
                  <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Fieldset legend="Change Password" toggleable collapsed>
          <div className="space-y-4">
            {passwordError && <Message severity="error" text={passwordError} className="w-full" />}

            <div>
              <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
                Current Password
              </label>
              <Password
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
                New Password
              </label>
              <Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
                Confirm New Password
              </label>
              <Password
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>
            <Button
              label="Change Password"
              icon="pi pi-lock"
              onClick={handleChangePassword}
              loading={changePassword.isPending}
            />
          </div>
        </Fieldset>
      </div>
    </>
  );
}
