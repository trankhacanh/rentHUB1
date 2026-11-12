import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

function validateField(name, value, allValues) {
  switch (name) {
    case 'firstName':
      return value.trim() ? '' : 'First name is required';
    case 'lastName':
      return value.trim() ? '' : 'Last name is required';
    case 'email': {
      if (!value) return 'Email is required';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address';
    }
    case 'phoneNumber': {
      if (!value) return 'Phone number is required';
      return /^[0-9+\-\s]{8,15}$/.test(value) ? '' : 'Please enter a valid phone number';
    }
    case 'password': {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return 'Include an uppercase letter and a number';
      return '';
    }
    case 'confirmPassword': {
      if (!value) return 'Please confirm your password';
      return value === allValues.password ? '' : 'Passwords do not match';
    }
    default:
      return '';
  }
}

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_META = [
  { label: '', color: '#E5E7EB' },
  { label: 'Weak', color: '#DC2626' },
  { label: 'Fair', color: '#F59E0B' },
  { label: 'Good', color: '#2F5FE0' },
  { label: 'Strong', color: '#16A34A' },
];

export default function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, next) }));
    }
    if (name === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', next.confirmPassword, next) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData) }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      newErrors[key] = validateField(key, formData[key], formData);
    });
    setErrors(newErrors);
    setTouched({ firstName: true, lastName: true, email: true, phoneNumber: true, password: true, confirmPassword: true });

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (!agreed) setAgreeError('You must agree to the Terms of Service and Privacy Policy');
    if (hasErrors || !agreed) return;

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      await axiosClient.post('/auth/signup', payload);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setServerError('Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <div className="rh-root min-h-screen flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }

    
/* Hide browser-native password reveal controls */
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none;
}

input[type="password"]::-webkit-credentials-auto-fill-button {
  visibility: hidden;
  display: none !important;
  pointer-events: none;
}


        .rh-card { animation: rh-in 0.5s ease both; }
        @keyframes rh-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rh-input {
          height: 50px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .rh-input:focus-within { border-color: #2F5FE0; box-shadow: 0 0 0 3px rgba(47,95,224,0.12); }
        .rh-input.rh-input-error { border-color: #DC2626; }
        .rh-input.rh-input-error:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
        .rh-input input { outline: none; background: transparent; }

        .rh-btn {
          height: 50px;
          background: #2F5FE0;
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .rh-btn:hover:not(:disabled) { background: #274DBD; }
        .rh-btn:active:not(:disabled) { transform: scale(0.99); }
        .rh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .rh-btn-ghost {
          height: 50px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          font-weight: 600;
          color: #374151;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .rh-btn-ghost:hover { background: #F9FAFB; border-color: #D1D5DB; }

        .rh-float { animation: rh-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .rh-float, .rh-card { animation: none; } }
        @keyframes rh-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* LEFT — Branding */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0F1B3D' }}
      >
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="rh-heading w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg" style={{ background: '#2F5FE0' }}>R</div>
          <span className="rh-heading text-white text-lg font-bold tracking-tight">RentHub</span>
        </div>

        <div className="relative z-10">
          <h1 className="rh-heading text-white text-4xl font-extrabold leading-tight max-w-sm">
            Start renting in minutes.
          </h1>
          <p className="mt-4 text-sm max-w-xs" style={{ color: '#93A3C7' }}>
            List the equipment you own or find exactly what you need — RentHub connects owners and renters instantly.
          </p>
        </div>

        <div className="relative h-56 z-10">
          <div className="rh-float absolute left-4 top-2 w-28 h-28 rounded-2xl" style={{ background: 'rgba(47,95,224,0.25)', border: '1px solid rgba(47,95,224,0.4)' }} />
          <div className="rh-float absolute left-24 top-18 w-20 h-20 rounded-full" style={{ background: 'rgba(147,163,199,0.15)', animationDelay: '1.2s' }} />
          <div className="absolute left-10 top-8 w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: '#1E3A8A' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DCE4FF" strokeWidth="1.8">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="rh-float absolute left-40 top-4 w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: '#2F5FE0', animationDelay: '0.6s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: '#5C6B94' }}>© {new Date().getFullYear()} RentHub. All rights reserved.</p>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ background: '#F7F9FC' }}>
        <div className="rh-card w-full bg-white rounded-2xl p-8 sm:p-10" style={{ maxWidth: '460px', boxShadow: '0 8px 30px -12px rgba(15,27,61,0.12)' }}>
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="rh-heading w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg" style={{ background: '#2F5FE0' }}>R</div>
            <span className="rh-heading text-lg font-bold tracking-tight" style={{ color: '#0F1B3D' }}>RentHub</span>
          </div>

          <h2 className="rh-heading text-2xl font-bold" style={{ color: '#111827' }}>Create your account</h2>
          <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>Join RentHub and start renting today.</p>

          {serverError && (
            <div className="mt-5 px-3.5 py-2.5 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>First name</label>
                <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.firstName && errors.firstName ? 'rh-input-error' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <input
                    type="text" name="firstName" className="w-full text-sm" placeholder="John"
                    value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                  />
                </div>
                {touched.firstName && errors.firstName && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Last name</label>
                <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.lastName && errors.lastName ? 'rh-input-error' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <input
                    type="text" name="lastName" className="w-full text-sm" placeholder="Doe"
                    value={formData.lastName} onChange={handleChange} onBlur={handleBlur}
                  />
                </div>
                {touched.lastName && errors.lastName && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.lastName}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
              <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.email && errors.email ? 'rh-input-error' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M22 6l-10 7L2 6" /><path d="M2 6h20v12H2z" />
                </svg>
                <input
                  type="email" name="email" className="w-full text-sm" placeholder="Enter your email"
                  value={formData.email} onChange={handleChange} onBlur={handleBlur}
                />
              </div>
              {touched.email && errors.email && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Phone number</label>
              <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.phoneNumber && errors.phoneNumber ? 'rh-input-error' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  type="tel" name="phoneNumber" className="w-full text-sm" placeholder="+84 912 345 678"
                  value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur}
                />
              </div>
              {touched.phoneNumber && errors.phoneNumber && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.phoneNumber}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password</label>
              <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.password && errors.password ? 'rh-input-error' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'} name="password" className="w-full text-sm" placeholder="Create a password"
                  value={formData.password} onChange={handleChange} onBlur={handleBlur}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < strength ? STRENGTH_META[strength].color : '#E5E7EB' }} />
                    ))}
                  </div>
                  {STRENGTH_META[strength].label && (
                    <p className="mt-1 text-xs" style={{ color: STRENGTH_META[strength].color }}>{STRENGTH_META[strength].label}</p>
                  )}
                </div>
              )}
              {touched.password && errors.password && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.password}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm password</label>
              <div className={`rh-input flex items-center gap-2.5 px-3.5 ${touched.confirmPassword && errors.confirmPassword ? 'rh-input-error' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showConfirm ? 'text' : 'password'} name="confirmPassword" className="w-full text-sm" placeholder="Re-enter your password"
                  value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                />
                <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{errors.confirmPassword}</p>}
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-2.5 text-sm" style={{ color: '#6B7280' }}>
                <input
                  type="checkbox" className="mt-0.5" style={{ accentColor: '#2F5FE0' }}
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setAgreeError(''); }}
                />
                <span>
                  I agree to the <Link to="/terms" className="font-medium hover:underline" style={{ color: '#2F5FE0' }}>Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="font-medium hover:underline" style={{ color: '#2F5FE0' }}>Privacy Policy</Link>
                </span>
              </label>
              {agreeError && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{agreeError}</p>}
            </div>

            <button type="submit" disabled={loading} className="rh-btn w-full text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Or continue with</span>
            <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
          </div>

          <button type="button" className="rh-btn-ghost w-full flex items-center justify-center gap-2.5 text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38z" />
              <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76z" />
            </svg>
            Sign up with Google
          </button>

          <p className="mt-7 text-center text-sm" style={{ color: '#6B7280' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2F5FE0' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}