import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { AuthCard, AuthButton, FormInput, Icon }  from '../components/auth/AuthComponents';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    if (!email.trim()) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    setFieldError('');
    setApiError('');
    setStatus('loading');

    try {
      // Backend contract: POST /api/auth/forgot-password { email }
      // The API intentionally returns success regardless of whether the
      // email exists, so we never reveal account existence here.
      await axiosClient.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch (err) {
      setApiError('Something went wrong. Please try again later.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#EFF6FF' }}>
            <Icon.mailOpen />
          </div>
          <h2 className="rh-heading text-xl font-bold" style={{ color: '#111827' }}>Check your email</h2>
          <p className="text-sm mt-2.5 leading-relaxed" style={{ color: '#6B7280' }}>
            If an account exists for this email, we have sent a 6-digit OTP code. Please check your inbox and enter it on the next screen to reset your password.
          </p>
          <Link to="/reset-password" className="rh-btn w-full text-sm mt-6 inline-flex">Continue to OTP</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot Password?" subtitle="Enter your email address and we'll send you a 6-digit OTP to reset your password.">
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
          onChange={(e) => { setEmail(e.target.value); if (fieldError) setFieldError(''); }}
          error={fieldError}
          disabled={status === 'loading'}
        />
        <AuthButton type="submit" loading={status === 'loading'} loadingText="Sending...">
          Send OTP
        </AuthButton>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium hover:underline" style={{ color: '#2F5FE0' }}>← Back to Login</Link>
      </p>
    </AuthCard>
  );
}