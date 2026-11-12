import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../utils/currency';

/* ================================================================== */
/* Icons                                                                */
/* ================================================================== */

const Icon = {
  search: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  eye: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  calendar: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
  handshake: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M2 12l4-4 4 2 4-4 4 4-2 2" /><path d="M8 14l2 2 2-2 2 2 3-3" /></svg>,
  package: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M21 8V21H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>,
  compare: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M8 3v18M16 3v18" /><path d="M4 8h4M16 8h4M4 16h4M16 16h4" /></svg>,
  check: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="2" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
  truck: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M1 7h13v10H1z" /><path d="M14 10h4l4 4v3h-8z" /><circle cx="6" cy="19" r="1.6" /><circle cx="18" cy="19" r="1.6" /></svg>,
  return: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M3 10h11a4 4 0 0 1 0 8h-2" /><path d="M7 6l-4 4 4 4" /></svg>,
  layers: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></svg>,
  tag: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M20.6 12.6L12 21.2a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8L11 3h9v9z" /><circle cx="16" cy="8" r="1.5" /></svg>,
  lock: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  shield: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" /></svg>,
  message: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  clock: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  clipboard: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 11h6M9 15h6" /></svg>,
  chevronDown: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9l6 6 6-6" /></svg>,
  menu: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  close: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>,
  facebook: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg>,
  instagram: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
  linkedin: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.1 3.77-2.1 4 0 4.75 2.7 4.75 6.2V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.05 1.4-2.05 2.8V21H9z" /></svg>,
};

const STEPS = [
  { n: '01', title: 'Browse Equipment', text: 'Explore a wide range of equipment and find the right one for your needs.', icon: Icon.search },
  { n: '02', title: 'Choose Your Equipment', text: 'Check equipment details, pricing, availability, location, and rental terms.', icon: Icon.eye },
  { n: '03', title: 'Book & Pay', text: 'Select your rental dates, confirm your booking, and complete the payment securely.', icon: Icon.calendar },
  { n: '04', title: 'Pick Up & Enjoy', text: 'Meet the equipment provider, receive your equipment, and enjoy your rental.', icon: Icon.handshake },
];

const JOURNEY = [
  { title: 'Search', text: 'Look for equipment by category, location, or keyword.', icon: Icon.search },
  { title: 'Compare', text: 'Compare price, rating, and availability side by side.', icon: Icon.compare },
  { title: 'Book', text: 'Pick your rental dates and send a request.', icon: Icon.calendar },
  { title: 'Confirm', text: 'Get confirmation once the owner accepts.', icon: Icon.check },
  { title: 'Pick Up', text: 'Meet the owner and collect the equipment.', icon: Icon.truck },
  { title: 'Return', text: 'Return the equipment and leave a review.', icon: Icon.return },
];

const BENEFITS = [
  { title: 'Wide Selection', text: 'Find equipment for work, projects, events, travel, and more.', icon: Icon.layers },
  { title: 'Transparent Pricing', text: 'See rental prices and fees clearly before booking.', icon: Icon.tag },
  { title: 'Secure Payments', text: 'Your payments are processed securely.', icon: Icon.lock },
  { title: 'Verified Equipment', text: 'View detailed equipment information before making a decision.', icon: Icon.shield },
  { title: 'Flexible Rental', text: 'Choose rental dates that fit your schedule.', icon: Icon.clock },
  { title: 'Easy Booking', text: 'Book equipment with a simple and straightforward process.', icon: Icon.clipboard },
];

const OWNER_FEATURES = [
  'Create your equipment listing',
  'Upload photos and equipment details',
  'Set your rental price',
  'Manage availability',
  'Receive rental requests',
  'Track your bookings',
];

const TRUST_FEATURES = [
  { title: 'Secure Payments', text: 'Protected transactions and secure payment processing.', icon: Icon.lock },
  { title: 'Clear Rental Terms', text: 'Know the rental conditions before confirming your booking.', icon: Icon.check },
  { title: 'Equipment Information', text: 'Review detailed equipment information before renting.', icon: Icon.shield },
  { title: 'Reliable Communication', text: 'Stay connected with equipment providers throughout the rental process.', icon: Icon.message },
];

const FAQS = [
  { q: 'How do I rent equipment on RentHub?', a: 'Browse the catalog, open the listing you like, choose your rental dates, and send a booking request. Once the owner accepts, you can proceed with payment.' },
  { q: 'Do I need an account to rent equipment?', a: 'Yes, you need a RentHub account to send booking requests, message owners, and manage your rentals from your profile.' },
  { q: 'How do I know if equipment is available?', a: 'Each listing shows a live availability badge and lets you pick specific rental dates — unavailable dates are disabled automatically.' },
  { q: 'How does payment work?', a: 'Payment is processed securely once the owner accepts your booking request. You are not charged before that confirmation.' },
  { q: 'Can I cancel my booking?', a: 'Yes, most listings support free cancellation up to 24 hours before the rental starts. Check the specific listing for its cancellation policy.' },
  { q: 'How can I list my equipment?', a: 'Go to "List Your Equipment", fill in the details, upload photos, set your price and availability, then publish your listing.' },
  { q: 'How do I contact the equipment owner?', a: 'Once you view a listing, use the "Message Owner" button on the Equipment Detail page to start a conversation directly.' },
];

/* ================================================================== */

export default function HowItWorks() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="rh-root" style={{ background: '#fff', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-card { border: 1px solid #EEF0F3; border-radius: 16px; background: #fff; }
        .rh-card-hover { transition: box-shadow .2s ease, transform .2s ease; }
        .rh-card-hover:hover { box-shadow: 0 16px 32px -16px rgba(15,27,61,0.18); transform: translateY(-3px); }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease, transform .1s ease; }
        .rh-btn-primary:hover { background: #274DBD; }
        .rh-btn-primary:active { transform: scale(0.98); }
        .rh-btn-outline { border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; background: #fff; transition: background .15s ease; }
        .rh-btn-outline:hover { background: #F9FAFB; }
        .rh-fade { animation: rh-fadeup .5s ease both; }
        @keyframes rh-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .rh-fade { animation: none; } .rh-card-hover:hover { transform: none; } }
      `}</style>

     

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden" style={{ background: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="rh-fade">
            <h1 className="rh-heading text-4xl sm:text-5xl font-extrabold leading-tight" style={{ color: '#0F1B3D' }}>
              Rent Equipment.<br />Simple, Fast, Reliable.
            </h1>
            <p className="mt-5 text-base max-w-md" style={{ color: '#6B7280' }}>
              Find the equipment you need, book it with confidence, and enjoy a seamless rental experience with RentHub.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/browse" className="rh-btn-primary px-6 py-3 text-sm">Browse Equipment</Link>
              <Link to="/list-equipment" className="rh-btn-outline px-6 py-3 text-sm">List Your Equipment</Link>
            </div>
          </div>

          <div className="relative h-72 lg:h-96 hidden sm:block">
            <div className="absolute right-4 top-6 w-40 h-40 rounded-3xl" style={{ background: 'rgba(47,95,224,0.10)' }} />
            <div className="absolute right-24 top-24 w-28 h-28 rounded-full" style={{ background: 'rgba(15,27,61,0.06)' }} />
            {[
              { icon: '📷', top: '4%', left: '2%' },
              { icon: '📅', top: '28%', left: '38%' },
              { icon: '✅', top: '55%', left: '8%' },
              { icon: '💳', top: '10%', left: '62%' },
              { icon: '🤝', top: '60%', left: '55%' },
            ].map((it, i) => (
              <div key={i} className="absolute w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-white" style={{ top: it.top, left: it.left, boxShadow: '0 12px 24px -10px rgba(15,27,61,0.25)' }}>
                {it.icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW RENTING WORKS ---------------- */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="rh-heading text-3xl font-bold" style={{ color: '#0F1B3D' }}>How Renting Works</h2>
          <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>From finding the right equipment to returning it, RentHub makes every step simple.</p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          <div className="hidden lg:block absolute top-9 left-[12%] right-[12%] h-px" style={{ background: '#E5E7EB' }} />
          {STEPS.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="w-[72px] h-[72px] rounded-2xl mx-auto flex items-center justify-center relative z-10" style={{ background: '#fff', border: '1px solid #EEF0F3', boxShadow: '0 8px 20px -10px rgba(15,27,61,0.15)' }}>
                <s.icon />
              </div>
              <p className="rh-heading text-xs font-extrabold mt-3" style={{ color: 'rgba(47,95,224,0.5)' }}>{s.n}</p>
              <h3 className="font-semibold text-sm mt-1" style={{ color: '#111827' }}>{s.title}</h3>
              <p className="text-sm mt-1.5" style={{ color: '#6B7280' }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- RENTAL PROCESS VISUAL (journey timeline) ---------------- */}
      <section className="py-16 lg:py-20" style={{ background: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="rh-heading text-3xl font-bold" style={{ color: '#0F1B3D' }}>Your Rental Journey</h2>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden lg:grid grid-cols-6 gap-4 relative">
            <div className="absolute top-6 left-[8%] right-[8%] h-px" style={{ background: '#E5E7EB' }} />
            {JOURNEY.map((j, i) => (
              <div key={j.title} className="rh-card rh-card-hover p-5 text-center relative z-10">
                <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(47,95,224,0.08)' }}>
                  <j.icon width={20} height={20} />
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Step {i + 1}</p>
                <h3 className="font-semibold text-sm" style={{ color: '#111827' }}>{j.title}</h3>
                <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>{j.text}</p>
              </div>
            ))}
          </div>

          {/* Mobile: vertical timeline */}
          <div className="lg:hidden space-y-4">
            {JOURNEY.map((j, i) => (
              <div key={j.title} className="rh-card p-5 flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(47,95,224,0.08)' }}>
                    <j.icon width={20} height={20} />
                  </div>
                  {i < JOURNEY.length - 1 && <div className="w-px flex-1 mt-2" style={{ background: '#E5E7EB' }} />}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Step {i + 1}</p>
                  <h3 className="font-semibold text-sm mt-0.5" style={{ color: '#111827' }}>{j.title}</h3>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{j.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- WHY RENT WITH RENTHUB ---------------- */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="rh-heading text-3xl font-bold" style={{ color: '#0F1B3D' }}>Why Rent With RentHub?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rh-card rh-card-hover p-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(47,95,224,0.10)' }}>
                <b.icon width={20} height={20} />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#111827' }}>{b.title}</h3>
              <p className="text-sm" style={{ color: '#6B7280' }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FOR EQUIPMENT OWNERS ---------------- */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-16 lg:pb-20">
        <div className="rh-card p-8 sm:p-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center" style={{ background: '#0F1B3D', border: 'none' }}>
          <div>
            <h2 className="rh-heading text-2xl sm:text-3xl font-extrabold text-white">Have Equipment to Rent?</h2>
            <p className="mt-3 text-sm max-w-md" style={{ color: '#93A3C7' }}>
              Turn your unused equipment into an additional source of income by listing it on RentHub.
            </p>
            <ul className="mt-6 space-y-2.5">
              {OWNER_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#DCE4FF' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(47,95,224,0.35)' }}>
                    <Icon.check width={12} height={12} style={{ stroke: '#fff' }} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/list-equipment" className="rh-btn-primary px-6 py-3 text-sm">List Your Equipment</Link>
              <Link to="/how-it-works" className="px-6 py-3 text-sm font-semibold rounded-lg text-white border" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>Learn More</Link>
            </div>
          </div>

          {/* Dashboard/listing mockup */}
          <div className="rounded-2xl p-5 bg-white hidden sm:block">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>My Equipment</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#ECFDF3', color: '#16A34A' }}>Live</span>
            </div>
            {[
              { name: 'Sony Alpha A7 IV', price: 250000, views: '32 views' },
              { name: 'MacBook Pro 14"', price: 300000, views: '48 views' },
              { name: 'DJI Mini 4 Pro', price: 350000, views: '76 views' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: '#EEF0F3' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: '#F7F9FC' }}>📷</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#111827' }}>{item.name}</p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{item.views}</p>
                  </div>
                </div>
                <p className="text-xs font-bold" style={{ color: '#0F1B3D' }}>{formatVnd(item.price)} / ngày</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SAFETY & TRUST ---------------- */}
      <section className="py-16 lg:py-20" style={{ background: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="rh-heading text-3xl font-bold" style={{ color: '#0F1B3D' }}>Rent With Confidence</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map((t) => (
              <div key={t.title} className="rh-card p-6 bg-white">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(47,95,224,0.10)' }}>
                  <t.icon width={20} height={20} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#111827' }}>{t.title}</h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="max-w-4xl mx-auto px-5 lg:px-8 py-16 lg:py-20">
        <div className="text-center mb-10">
          <h2 className="rh-heading text-3xl font-bold" style={{ color: '#0F1B3D' }}>Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="rh-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold" style={{ color: '#111827' }}>{item.q}</span>
                  <Icon.chevronDown style={{ color: '#6B7280', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease', flexShrink: 0 }} />
                </button>
                {open && (
                  <div className="px-5 pb-4 text-sm" style={{ color: '#6B7280' }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-20">
        <div className="rounded-3xl text-center py-14 px-6" style={{ background: '#0F1B3D' }}>
          <h2 className="rh-heading text-3xl font-extrabold text-white">Ready to Get Started?</h2>
          <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: '#93A3C7' }}>
            Find the equipment you need or start earning from the equipment you already own.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link to="/browse" className="rh-btn-primary px-6 py-3 text-sm">Browse Equipment</Link>
            <Link to="/list-equipment" className="px-6 py-3 text-sm font-semibold rounded-lg text-white border" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>List Your Equipment</Link>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t" style={{ borderColor: '#EEF0F3' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="rh-heading w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold" style={{ background: '#2F5FE0' }}>R</div>
              <span className="rh-heading text-lg font-bold" style={{ color: '#0F1B3D' }}>RentHub</span>
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>Your trusted equipment rental platform.</p>
          </div>
          {[
            { title: 'Platform', links: ['Browse Equipment', 'How It Works', 'List Your Equipment'] },
            { title: 'Company', links: ['About Us', 'Contact', 'Careers'] },
            { title: 'Support', links: ['Help Center', 'FAQ', 'Terms & Conditions', 'Privacy Policy'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}><Link to="/" className="text-sm hover:underline" style={{ color: '#6B7280' }}>{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t py-6" style={{ borderColor: '#EEF0F3' }}>
          <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>© 2026 RentHub. All rights reserved.</p>
            <div className="flex gap-3" style={{ color: '#6B7280' }}>
              <a href="#" aria-label="Facebook" className="hover:text-[#2F5FE0]"><Icon.facebook /></a>
              <a href="#" aria-label="Instagram" className="hover:text-[#2F5FE0]"><Icon.instagram /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-[#2F5FE0]"><Icon.linkedin /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}