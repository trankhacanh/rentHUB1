import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { AuthCard, AuthButton, PasswordInput, PasswordStrength, isPasswordStrong, FormInput, Icon } from '../components/auth/AuthComponents';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [apiError, setApiError] = useState('');

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Please enter your email.';
    if (!otp.trim()) newErrors.otp = 'Please enter the OTP code.';
    if (!isPasswordStrong(password)) newErrors.password = 'Password does not meet the requirements above.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your new password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setApiError('');
    setStatus('loading');

    try {
      await axiosClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword: password,
      });
      setStatus('success');
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong. Please try again later.';
      setApiError(message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#ECFDF3' }}>
            <Icon.checkCircle />
          </div>
          <h2 className="rh-heading text-xl font-bold" style={{ color: '#111827' }}>Password Reset Successful</h2>
          <p className="text-sm mt-2.5 leading-relaxed" style={{ color: '#6B7280' }}>
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <button onClick={() => navigate('/login')} className="rh-btn w-full text-sm mt-6">Sign In</button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset Your Password" subtitle="Enter the OTP sent to your email and choose a new password.">
      {apiError && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}>
          {apiError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          label="Email Address"
          icon={<Icon.mail />}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((er) => ({ ...er, email: '' })); }}
          error={errors.email}
          disabled={status === 'loading'}
        />

        <FormInput
          label="OTP Code"
          icon={<Icon.lock />}
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => { setOtp(e.target.value); if (errors.otp) setErrors((er) => ({ ...er, otp: '' })); }}
          error={errors.otp}
          disabled={status === 'loading'}
        />

        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((er) => ({ ...er, password: '' })); }}
          error={errors.password}
          disabled={status === 'loading'}
        />
        <PasswordStrength password={password} />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((er) => ({ ...er, confirmPassword: '' })); }}
          error={errors.confirmPassword}
          valid={passwordsMatch}
          disabled={status === 'loading'}
        />
        {passwordsMismatch && !errors.confirmPassword && (
          <p className="-mt-3 mb-4 text-xs" style={{ color: '#DC2626' }}>Passwords do not match.</p>
        )}
        {passwordsMatch && (
          <p className="-mt-3 mb-4 text-xs flex items-center gap-1" style={{ color: '#16A34A' }}>
            <Icon.check /> Passwords match
          </p>
        )}

        <AuthButton type="submit" loading={status === 'loading'} loadingText="Resetting...">
          Reset Password
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/forgot-password" className="font-medium hover:underline" style={{ color: '#2F5FE0' }}>← Request a new code</Link>
      </p>
    </AuthCard>
  );
}