import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Shared design tokens (same system as Login/Register/Home)           */
/* Navy #0F1B3D · Primary blue #2F5FE0 · Plus Jakarta Sans + Inter     */
/* ------------------------------------------------------------------ */

export const AUTH_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
  .rh-root { font-family: 'Inter', sans-serif; }
  .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }

  .rh-card { animation: rh-in 0.4s ease both; }
  @keyframes rh-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .rh-input { height: 48px; border: 1px solid #E5E7EB; border-radius: 10px; transition: border-color .15s ease, box-shadow .15s ease; }
  .rh-input:focus-within { border-color: #2F5FE0; box-shadow: 0 0 0 3px rgba(47,95,224,0.12); }
  .rh-input.rh-err { border-color: #DC2626; }
  .rh-input.rh-err:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
  .rh-input.rh-ok { border-color: #16A34A; }
  .rh-input input { outline: none; background: transparent; width: 100%; }

  .rh-btn { height: 48px; background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease, transform .1s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .rh-btn:hover:not(:disabled) { background: #274DBD; }
  .rh-btn:active:not(:disabled) { transform: scale(0.99); }
  .rh-btn:disabled { opacity: .65; cursor: not-allowed; }

  .rh-btn-outline { height: 48px; border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
  .rh-btn-outline:hover { background: #F9FAFB; }

  .rh-spin { animation: rh-spin 0.7s linear infinite; }
  @keyframes rh-spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) { .rh-card { animation: none; } .rh-spin { animation: none; } }
`;

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

export const Icon = {
  mail: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" {...p}><path d="M22 6l-10 7L2 6" /><path d="M2 6h20v12H2z" /></svg>,
  lock: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" {...p}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  eye: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" {...p}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
  checkCircle: (p) => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>,
  mailOpen: (p) => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.6" {...p}><path d="M2 6l10 7 10-7" /><rect x="2" y="5" width="20" height="14" rx="2" /></svg>,
  warning: (p) => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.6" {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>,
};

/* ------------------------------------------------------------------ */
/* AuthCard — centered card shell shared by every auth page            */
/* ------------------------------------------------------------------ */

export function AuthCard({ title, subtitle, children, width = 420 }) {
  return (
    <div className="rh-root min-h-screen flex items-center justify-center px-5 py-12" style={{ background: '#F7F9FC' }}>
      <style>{AUTH_STYLES}</style>
      <div className="rh-card w-full bg-white rounded-2xl p-8 sm:p-10" style={{ maxWidth: width, boxShadow: '0 8px 30px -12px rgba(15,27,61,0.12)' }}>
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="rh-heading w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg" style={{ background: '#2F5FE0' }}>R</div>
          <span className="rh-heading text-lg font-bold tracking-tight" style={{ color: '#0F1B3D' }}>RentHub</span>
        </Link>
        {title && <h2 className="rh-heading text-2xl font-bold" style={{ color: '#111827' }}>{title}</h2>}
        {subtitle && <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AuthButton — primary submit button with loading spinner             */
/* ------------------------------------------------------------------ */

export function AuthButton({ children, loading, loadingText, ...rest }) {
  return (
    <button className="rh-btn w-full text-sm" disabled={loading || rest.disabled} {...rest}>
      {loading && (
        <svg className="rh-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" />
        </svg>
      )}
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* FormInput — labeled input with left icon + error message            */
/* ------------------------------------------------------------------ */

export function FormInput({ label, icon, error, type = 'text', ...rest }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>}
      <div className={`rh-input flex items-center gap-2.5 px-3.5 ${error ? 'rh-err' : ''}`}>
        {icon}
        <input type={type} className="w-full text-sm" {...rest} />
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PasswordInput — FormInput variant with show/hide toggle             */
/* ------------------------------------------------------------------ */

export function PasswordInput({ label, error, valid, value, onChange, placeholder, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>}
      <div className={`rh-input flex items-center gap-2.5 px-3.5 ${error ? 'rh-err' : valid ? 'rh-ok' : ''}`}>
        <Icon.lock />
        <input type={show ? 'text' : 'password'} className="w-full text-sm" value={value} onChange={onChange} placeholder={placeholder} {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <Icon.eyeOff /> : <Icon.eye />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PasswordStrength — realtime requirement checklist                   */
/* ------------------------------------------------------------------ */

export function getPasswordChecks(pw) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  };
}

export function PasswordStrength({ password }) {
  const checks = getPasswordChecks(password);
  const items = [
    ['length', 'At least 8 characters'],
    ['upper', 'At least one uppercase letter'],
    ['lower', 'At least one lowercase letter'],
    ['number', 'At least one number'],
  ];
  return (
    <div className="mt-1 mb-4 p-3.5 rounded-lg" style={{ background: '#F7F9FC' }}>
      <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>Password must contain:</p>
      <ul className="space-y-1.5">
        {items.map(([key, label]) => {
          const ok = checks[key];
          return (
            <li key={key} className="flex items-center gap-2 text-xs" style={{ color: ok ? '#16A34A' : '#9CA3AF' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: ok ? '#DCFCE7' : '#E5E7EB', color: ok ? '#16A34A' : '#9CA3AF' }}>
                <Icon.check />
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function isPasswordStrong(pw) {
  const c = getPasswordChecks(pw);
  return c.length && c.upper && c.lower && c.number;
}