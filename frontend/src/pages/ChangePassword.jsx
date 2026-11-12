import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { AuthCard, AuthButton, PasswordInput, PasswordStrength, isPasswordStrong }  from '../components/auth/AuthComponents';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const newErrors = {};
    if (!currentPassword) newErrors.currentPassword = 'Please enter your current password.';
    if (!isPasswordStrong(newPassword)) newErrors.newPassword = 'Password does not meet the requirements above.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your new password.';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setApiError('');
    setLoading(true);
    try {
      await axiosClient.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong. Please try again later.';

      if (err?.response?.status === 401 || err?.response?.status === 400) {
        setErrors({ currentPassword: message });
      } else {
        setApiError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Change Password" subtitle="Update your password to keep your account secure.">
      {success && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg text-sm flex items-center gap-2" style={{ background: '#ECFDF3', color: '#16A34A', border: '1px solid #BBF7D0' }}>
          Password changed successfully.
        </div>
      )}
      {apiError && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <PasswordInput
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors((er) => ({ ...er, currentPassword: '' })); }}
          error={errors.currentPassword}
          disabled={loading}
        />

        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors((er) => ({ ...er, newPassword: '' })); }}
          error={errors.newPassword}
          disabled={loading}
        />
        <PasswordStrength password={newPassword} />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((er) => ({ ...er, confirmPassword: '' })); }}
          error={errors.confirmPassword}
          valid={passwordsMatch}
          disabled={loading}
        />
        {passwordsMatch && (
          <p className="-mt-3 mb-4 text-xs" style={{ color: '#16A34A' }}>Passwords match</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            disabled={loading}
            className="rh-btn-outline flex-1 text-sm"
          >
            Cancel
          </button>
          <AuthButton type="submit" loading={loading} loadingText="Changing..." style={{ flex: 1 }}>
            Change Password
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
}