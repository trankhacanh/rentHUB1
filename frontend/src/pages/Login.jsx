import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await axiosClient.post('/auth/signin', {
      email: email.trim(),
      password,
    });

    // Backend có thể trả JWT trong response.data.data
    const payload = response.data?.data ?? response.data;
    const token = payload?.token;
    const roles = payload?.roles ?? [];

    // Không coi đăng nhập là thành công nếu thiếu token
    if (!token) {
      throw new Error('Invalid login response: missing token.');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));

    if (roles.includes('ROLE_ADMIN')) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  } catch (err) {
    // Xóa phiên cũ khi đăng nhập thất bại
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setError(
      err.response?.status === 401
        ? 'Invalid email or password. Please try again.'
        : err.message === 'Invalid login response: missing token.'
          ? 'Login response is invalid. Please contact support.'
          : 'Unable to sign in. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="rh-root min-h-screen flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }

        .rh-card { animation: rh-in 0.5s ease both; }
        @keyframes rh-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
     
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

        .rh-input {
          height: 50px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .rh-input:focus-within {
          border-color: #2F5FE0;
          box-shadow: 0 0 0 3px rgba(47,95,224,0.12);
        }
        .rh-input input {
          outline: none;
          background: transparent;
        }

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

        .rh-float {
          animation: rh-float 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .rh-float, .rh-card { animation: none; }
        }
        @keyframes rh-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* LEFT — Branding */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0F1B3D' }}
      >
        <div className="flex items-center gap-2.5 relative z-10">
          <div
            className="rh-heading w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg"
            style={{ background: '#2F5FE0' }}
          >
            R
          </div>
          <span className="rh-heading text-white text-lg font-bold tracking-tight">RentHub</span>
        </div>

        <div className="relative z-10">
          <h1 className="rh-heading text-white text-4xl font-extrabold leading-tight max-w-sm">
            Rent what you need.
            <br />
            Share what you have.
          </h1>
          <p className="mt-4 text-sm max-w-xs" style={{ color: '#93A3C7' }}>
            The marketplace for equipment rental — list your gear or find what you need, in minutes.
          </p>
        </div>

        {/* Abstract illustration */}
        <div className="relative h-56 z-10">
          <div
            className="rh-float absolute left-4 top-2 w-28 h-28 rounded-2xl"
            style={{ background: 'rgba(47,95,224,0.25)', border: '1px solid rgba(47,95,224,0.4)' }}
          />
          <div
            className="rh-float absolute left-20 top-16 w-20 h-20 rounded-full"
            style={{ background: 'rgba(147,163,199,0.15)', animationDelay: '1.5s' }}
          />
          <div
            className="absolute left-10 top-8 w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ background: '#1E3A8A' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DCE4FF" strokeWidth="1.8">
              <path d="M21 8V21H3V8" />
              <path d="M1 3h22v5H1z" />
              <path d="M10 12h4" />
            </svg>
          </div>
          <div
            className="rh-float absolute left-40 top-4 w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: '#2F5FE0', animationDelay: '0.8s' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: '#5C6B94' }}>
          © {new Date().getFullYear()} RentHub. All rights reserved.
        </p>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: '#F7F9FC' }}>
        <div
          className="rh-card w-full bg-white rounded-2xl p-8 sm:p-10"
          style={{ maxWidth: '420px', boxShadow: '0 8px 30px -12px rgba(15,27,61,0.12)' }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div
              className="rh-heading w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg"
              style={{ background: '#2F5FE0' }}
            >
              R
            </div>
            <span className="rh-heading text-lg font-bold tracking-tight" style={{ color: '#0F1B3D' }}>
              RentHub
            </span>
          </div>

          <h2 className="rh-heading text-2xl font-bold" style={{ color: '#111827' }}>
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
            Sign in to your RentHub account
          </p>

          {error && (
            <div
              className="mt-5 px-3.5 py-2.5 rounded-lg text-sm"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Email
              </label>
              <div className="rh-input flex items-center gap-2.5 px-3.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M4 4h16v16H4z" opacity="0" />
                  <path d="M22 6l-10 7L2 6" />
                  <path d="M2 6h20v12H2z" />
                </svg>
                <input
                  type="email"
                  className="w-full text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="rh-input flex items-center gap-2.5 px-3.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 mb-6">
              <label className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
                <input type="checkbox" style={{ accentColor: '#2F5FE0' }} />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: '#2F5FE0' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="rh-btn w-full text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm" style={{ color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#2F5FE0' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}