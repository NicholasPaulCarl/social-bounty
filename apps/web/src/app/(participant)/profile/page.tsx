'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);

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
      await changePassword.mutateAsync({ currentPassword, newPassword });
      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
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
          className="w-full mb-6"
        />
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Account Details */}
        <div className="glass-card p-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-lg font-heading font-semibold">
              {(profile.firstName?.[0] || '').toUpperCase()}
              {(profile.lastName?.[0] || '').toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">Account Details</h3>
              {user?.role && <StatusBadge type="role" value={user.role} size="small" />}
            </div>
          </div>

          {editing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                    First Name
                  </label>
                  <InputText
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
                  severity="secondary"
                  onClick={() => setEditing(false)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Name</p>
                <p className="text-text-primary font-medium">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-text-primary font-medium">{profile.email}</p>
                  {profile.emailVerified ? (
                    <span className="text-accent-emerald text-xs flex items-center gap-1">
                      <i className="pi pi-check-circle text-xs" /> Verified
                    </span>
                  ) : (
                    <span className="text-accent-amber text-xs flex items-center gap-1">
                      <i className="pi pi-exclamation-circle text-xs" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <div className="flex items-center gap-3">
              <i className="pi pi-lock text-text-muted" />
              <h3 className="text-lg font-heading font-semibold text-text-primary">Change Password</h3>
            </div>
            <i className={`pi ${showPasswordSection ? 'pi-chevron-up' : 'pi-chevron-down'} text-text-muted text-sm`} />
          </button>

          {showPasswordSection && (
            <div className="space-y-5 mt-6 pt-6 border-t border-glass-border">
              {passwordError && <Message severity="error" text={passwordError} className="w-full" />}

              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
          )}
        </div>
      </div>
    </>
  );
}
