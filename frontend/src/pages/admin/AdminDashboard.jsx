import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { getCategories, refreshCategories } from '../../services/categoryService';
import { formatVnd } from '../../utils/currency';
import EquipmentManagement from './equipments/EquipmentManagement';
import UserManagement from './users/UserManagement';
import RentalManagement from './rentals/RentalManagement';
import PaymentManagement from './payments/PaymentManagement';
import ReviewManagement from './reviews/ReviewManagement';
import ReportsManagement from './reports/ReportsManagement';
import PreferenceControls from '../../components/layout/PreferenceControls';

/* ================================================================== */
/* Icons                                                                */
/* ================================================================== */

const Icon = {
  dashboard: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></svg>,
  users: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 3-6.3 6.5-6.3s6.5 2.7 6.5 6.3" /><circle cx="17" cy="8.5" r="2.4" /><path d="M15.5 13.8c2.8.4 5 2.7 5 6.2" /></svg>,
  box: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 8V21H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>,
  tag: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M20.6 12.6L12 21.2a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8L11 3h9v9z" /><circle cx="16" cy="8" r="1.5" /></svg>,
  calendar: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
  wallet: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M16 12h4" /><path d="M2 10h20" /></svg>,
  star: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill={p.filled ? '#F59E0B' : 'none'} stroke={p.filled ? '#F59E0B' : 'currentColor'} strokeWidth="1.8" {...p}><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" /></svg>,
  chart: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 20V10M12 20V4M20 20v-7" /></svg>,
  settings: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></svg>,
  logout: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>,
  search: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  chevronDown: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9l6 6 6-6" /></svg>,
  chevronLeft: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M15 6l-6 6 6 6" /></svg>,
  menu: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  close: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>,
  eye: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  pencil: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  trash: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>,
  check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
  x: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>,
  clock: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  layers: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></svg>,
  flag: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 22V4" /><path d="M4 4h13l-3 4 3 4H4" /></svg>,
  download: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 4v12M6 10l6 6 6-6" /><path d="M4 20h16" /></svg>,
  arrowUp: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  arrowDown: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3" {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
};

/* ================================================================== */
/* Shared status color palette                                         */
/* ================================================================== */

const STATUS_COLORS = {
  Active: { bg: '#ECFDF3', color: '#16A34A' },
  Suspended: { bg: '#FEF2F2', color: '#DC2626' },
  New: { bg: '#EFF6FF', color: '#2563EB' },
  Available: { bg: '#ECFDF3', color: '#16A34A' },
  Rented: { bg: '#FEF9C3', color: '#A16207' },
  'Pending Approval': { bg: '#EFF6FF', color: '#2563EB' },
  Rejected: { bg: '#FEF2F2', color: '#DC2626' },
  Pending: { bg: '#FEF9C3', color: '#A16207' },
  Confirmed: { bg: '#EFF6FF', color: '#2563EB' },
  Completed: { bg: '#ECFDF3', color: '#16A34A' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626' },
  Paid: { bg: '#ECFDF3', color: '#16A34A' },
  Failed: { bg: '#FEF2F2', color: '#DC2626' },
  Refunded: { bg: '#F1F3F6', color: '#374151' },
  Approved: { bg: '#ECFDF3', color: '#16A34A' },
  Hidden: { bg: '#F1F3F6', color: '#6B7280' },
  Enabled: { bg: '#ECFDF3', color: '#16A34A' },
  Disabled: { bg: '#F1F3F6', color: '#6B7280' },
};

function Badge({ label }) {
  const c = STATUS_COLORS[label] || { bg: '#F1F3F6', color: '#374151' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} /> {label}
    </span>
  );
}

/* ================================================================== */
/* Shared small components                                             */
/* ================================================================== */

function StatCard({ icon: IconComp, label, value, change, trend }) {
  return (
    <div className="rh-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(47,95,224,0.10)' }}>
          <IconComp style={{ color: '#2F5FE0' }} />
        </div>
        {change && (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: trend === 'up' ? '#16A34A' : '#DC2626' }}>
            {trend === 'up' ? <Icon.arrowUp /> : <Icon.arrowDown />} {change}
          </span>
        )}
      </div>
      <p className="rh-heading text-2xl font-extrabold" style={{ color: '#0F1B3D' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{label}</p>
    </div>
  );
}

function SimpleBarChart({ data, height = 180, color = '#2F5FE0' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
          <div
            className="w-full rounded-md transition-all"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, background: color, opacity: 0.9 }}
            title={`${d.label}: ${formatVnd(d.value)}`}
          />
          <span className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StackedBreakdown({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: '#F1F3F6' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs" style={{ color: '#374151' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            {seg.label} <span style={{ color: '#9CA3AF' }}>({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="rh-card p-5 sm:p-6">
      {(title || action) && (
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            {title && <h2 className="rh-heading text-base font-bold" style={{ color: '#0F1B3D' }}>{title}</h2>}
            {subtitle && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left" style={{ background: '#F7F9FC', color: '#6B7280' }}>
            {columns.map((c) => <th key={c} className="px-3 py-2.5 font-medium whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function RowActions({ actions }) {
  return (
    <div className="flex items-center gap-1.5">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          title={a.label}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ border: '1px solid #E5E7EB', color: a.danger ? '#DC2626' : '#374151' }}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(15,27,61,0.45)' }} onClick={onClose}>
      <div className={`rh-card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white" style={{ borderColor: '#EEF0F3' }}>
          <h3 className="rh-heading text-base font-bold" style={{ color: '#0F1B3D' }}>{title}</h3>
          <button onClick={onClose} aria-label="Close"><Icon.close /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#111827' }}>{value ?? '—'}</p>
    </div>
  );
}

/* ================================================================== */
/* Mock data                                                            */
/* ================================================================== */

const DASHBOARD_STATS = [
  { label: 'Total Users', value: '2,458', icon: Icon.users, change: '+12.5%', trend: 'up' },
  { label: 'Total Equipment', value: '1,284', icon: Icon.box, change: '+8.2%', trend: 'up' },
  { label: 'Active Rentals', value: '342', icon: Icon.calendar, change: '+4.1%', trend: 'up' },
  { label: 'Total Revenue', value: '128.450 ₫', icon: Icon.wallet, change: '+15.3%', trend: 'up' },
  { label: 'Pending Bookings', value: '48', icon: Icon.clock, change: '-3.2%', trend: 'down' },
  { label: 'Completed Rentals', value: '1,892', icon: Icon.check, change: '+9.7%', trend: 'up' },
  { label: 'Available Equipment', value: '923', icon: Icon.layers, change: '+2.4%', trend: 'up' },
  { label: 'Reported Issues', value: '12', icon: Icon.flag, change: '-18%', trend: 'down' },
];

const REVENUE_DATA = [
  { label: 'Mar', value: 14200 }, { label: 'Apr', value: 16800 }, { label: 'May', value: 15100 },
  { label: 'Jun', value: 19400 }, { label: 'Jul', value: 21200 }, { label: 'Aug', value: 24800 },
];
const REVENUE_RANGES = ['7 Days', '30 Days', '3 Months', '6 Months', '1 Year'];
const REVENUE_SUMMARY = { completed: 118300, refunds: 4250 };

const RENTAL_BREAKDOWN = [
  { label: 'Completed', value: 1892, color: '#16A34A' },
  { label: 'Active', value: 342, color: '#2F5FE0' },
  { label: 'Pending', value: 48, color: '#F59E0B' },
  { label: 'Cancelled', value: 96, color: '#DC2626' },
];

const RECENT_BOOKINGS = [
  { id: '#RH-10245', customer: 'Nguyen Van A', equipment: 'Canon EOS R6', period: 'Aug 20–22', amount: '3.000.000 ₫', status: 'Confirmed', createdAt: 'Aug 18, 2026' },
  { id: '#RH-10244', customer: 'Tran Thi B', equipment: 'MacBook Pro 14"', period: 'Aug 19–21', amount: '2.250.000 ₫', status: 'Pending', createdAt: 'Aug 17, 2026' },
  { id: '#RH-10243', customer: 'Le Van C', equipment: 'DJI Mini 4 Pro', period: 'Aug 16–18', amount: '2.625.000 ₫', status: 'Completed', createdAt: 'Aug 14, 2026' },
  { id: '#RH-10242', customer: 'Pham Thi D', equipment: 'JBL PartyBox 310', period: 'Aug 15–16', amount: '1.100.000 ₫', status: 'Cancelled', createdAt: 'Aug 13, 2026' },
  { id: '#RH-10241', customer: 'Vo Van E', equipment: 'Epson EB-X06', period: 'Aug 12–14', amount: '1.350.000 ₫', status: 'Completed', createdAt: 'Aug 10, 2026' },
];

const RECENT_USERS = [
  { name: 'Minh Nguyen', email: 'minh.nguyen@example.com', role: 'Customer', status: 'Active', joined: 'Aug 20, 2026' },
  { name: 'Anh Tran', email: 'anh.tran@example.com', role: 'Owner', status: 'Active', joined: 'Aug 19, 2026' },
  { name: 'Hoang Le', email: 'hoang.le@example.com', role: 'Customer', status: 'New', joined: 'Aug 18, 2026' },
  { name: 'Khoa Pham', email: 'khoa.pham@example.com', role: 'Owner', status: 'Active', joined: 'Aug 17, 2026' },
];


const EQUIPMENT_STATS = [
  { label: 'Total Equipment', value: '1,284', icon: Icon.box },
  { label: 'Available', value: '923', icon: Icon.check },
  { label: 'Rented', value: '342', icon: Icon.calendar },
  { label: 'Pending Approval', value: '14', icon: Icon.clock },
  { label: 'Rejected', value: '5', icon: Icon.x },
];

const EQUIPMENT_ADMIN = [
  { id: 1, name: 'Canon EOS R6', owner: 'Nguyen Van A', category: 'Camera', price: '600.000 ₫/ngày', status: 'Available', created: 'Aug 10, 2026', icon: '📷' },
  { id: 2, name: 'MacBook Pro 14"', owner: 'Anh Tran', category: 'Laptop', price: '300.000 ₫/ngày', status: 'Rented', created: 'Jul 28, 2026', icon: '💻' },
  { id: 3, name: 'DJI Mini 4 Pro', owner: 'Nam Vo', category: 'Drone', price: '350.000 ₫/ngày', status: 'Available', created: 'Aug 18, 2026', icon: '🚁' },
  { id: 4, name: 'Godox SL60W', owner: 'Khoa Pham', category: 'Lighting', price: '200.000 ₫/ngày', status: 'Pending Approval', created: 'Aug 21, 2026', icon: '💡' },
  { id: 5, name: 'Old Projector X1', owner: 'Tuan Nguyen', category: 'Projector', price: '150.000 ₫/ngày', status: 'Rejected', created: 'Aug 15, 2026', icon: '🎥' },
];




const REVIEW_STATS = [
  { label: 'Total Reviews', value: '1,204', icon: Icon.star },
  { label: 'Average Rating', value: '4.8', icon: Icon.star },
  { label: '5 Star', value: '892', icon: Icon.star },
  { label: '1–2 Star', value: '23', icon: Icon.flag },
];

const REVIEWS_ADMIN = [
  { id: 1, user: 'Anh Tran', equipment: 'Sony Alpha A7 IV', rating: 5, text: 'Great camera and very friendly owner.', date: 'Aug 10, 2026', status: 'Approved' },
  { id: 2, user: 'Linh Nguyen', equipment: 'JBL PartyBox 310', rating: 5, text: 'Everything worked perfectly.', date: 'Jul 25, 2026', status: 'Approved' },
  { id: 3, user: 'David Pham', equipment: 'Epson EB-X06', rating: 2, text: 'Projector had a faint image, not as described.', date: 'Jul 20, 2026', status: 'Hidden' },
  { id: 4, user: 'Khoa Tran', equipment: 'DJI Mini 4 Pro', rating: 4, text: 'Good drone, minor battery issue.', date: 'Jul 15, 2026', status: 'Approved' },
];

const MOST_RENTED = [
  { name: 'Canon EOS R6', rentals: 214 }, { name: 'DJI Mini 4 Pro', rentals: 187 }, { name: 'MacBook Pro 14"', rentals: 162 },
];
const MOST_PROFITABLE = [
  { name: 'Sony A7 IV', revenue: '14.300 ₫' }, { name: 'DJI Mini 4 Pro', revenue: '12.800 ₫' }, { name: 'MacBook Pro 14"', revenue: '11.200 ₫' },
];
const REVENUE_BY_CATEGORY = [
  { label: 'Camera', value: 42000 }, { label: 'Laptop', value: 28500 }, { label: 'Drone', value: 21300 },
  { label: 'Audio', value: 12800 }, { label: 'Gaming', value: 9600 },
];
const NEW_ACTIVE_RETURNING = [
  { label: 'New Users', value: 128, color: '#2F5FE0' },
  { label: 'Active Users', value: 2190, color: '#16A34A' },
  { label: 'Returning Users', value: 640, color: '#F59E0B' },
];

const ADMIN_PROFILE = { firstName: 'Admin', lastName: 'RentHub', email: 'admin@renthub.com', phone: '+84 900 000 000' };

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: Icon.dashboard },
  { key: 'users', label: 'Users', icon: Icon.users },
  { key: 'equipment', label: 'Equipment', icon: Icon.box },
  { key: 'categories', label: 'Categories', icon: Icon.tag },
  { key: 'rentals', label: 'Rentals', icon: Icon.calendar },
  { key: 'payments', label: 'Payments', icon: Icon.wallet },
  { key: 'reviews', label: 'Reviews', icon: Icon.star },
  { key: 'reports', label: 'Reports', icon: Icon.chart },
];

/* ================================================================== */
/* Section: Dashboard                                                   */
/* ================================================================== */

const DASHBOARD_REVENUE_RANGES = [
  '7 Days',
  '30 Days',
  '3 Months',
  '6 Months',
  '1 Year',
];

const dashboardArray = (response) => {
  const body = response?.data;
  const data = body?.data ?? body?.users ?? body?.content ?? body;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const dashboardDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dashboardMoney = formatVnd;

const dashboardDateLabel = (value) => {
  const date = dashboardDate(value);
  if (!date) return '—';

  return date.toLocaleDateString('vi-VN');
};

const dashboardUserName = (user) =>
  [
    user?.firstName,
    user?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() ||
  user?.fullName ||
  user?.name ||
  user?.username ||
  user?.email ||
  'Unknown user';

const dashboardRangeStart = (range, now = new Date()) => {
  const start = new Date(now);

  switch (range) {
    case '7 Days':
      start.setDate(start.getDate() - 6);
      break;
    case '30 Days':
      start.setDate(start.getDate() - 29);
      break;
    case '3 Months':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6 Months':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1 Year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 29);
  }

  start.setHours(0, 0, 0, 0);
  return start;
};

function DashboardSection() {
  const [range, setRange] = useState('30 Days');
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.allSettled([
          axiosClient.get('/bookings/admin/all'),
          axiosClient.get('/users/admin/all'),
          axiosClient.get('/equipments/admin'),
          axiosClient.get('/payments/admin/all'),
        ]);

        if (cancelled) return;

        const failed = results
          .map((result, index) => ({ result, index }))
          .filter(({ result }) => result.status === 'rejected');

        // Avoid showing incorrect totals when one of the APIs fails.
        if (failed.length > 0) {
          const endpointNames = [
            'Bookings',
            'Users',
            'Equipments',
            'Payments',
          ];

          console.error(
            'Dashboard API errors:',
            failed.map(({ result, index }) => ({
              endpoint: endpointNames[index],
              error: result.reason,
            })),
          );

          setError(
            `Không thể tải đầy đủ dữ liệu Dashboard: ${
              failed
                .map(({ index }) => endpointNames[index])
                .join(', ')
            }. Hãy kiểm tra quyền ADMIN và API backend.`,
          );

          setBookings([]);
          setUsers([]);
          setEquipments([]);
          setPayments([]);
          return;
        }

        const [bookingResponse, userResponse, equipmentResponse, paymentResponse] =
          results.map((result) => result.value);

        setBookings(dashboardArray(bookingResponse));
        setUsers(dashboardArray(userResponse));
        setEquipments(dashboardArray(equipmentResponse));
        setPayments(dashboardArray(paymentResponse));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load dashboard:', err);
          setError(
            err?.response?.data?.message ||
              'Không thể tải dữ liệu Dashboard. Vui lòng thử lại.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const activeRentals = bookings.filter(
      (booking) => booking.status === 'IN_PROGRESS',
    ).length;

    const pendingBookings = bookings.filter(
      (booking) => booking.status === 'PENDING',
    ).length;

    const completedRentals = bookings.filter(
      (booking) => booking.status === 'COMPLETED',
    ).length;

    const availableEquipment = equipments.filter(
      (equipment) =>
        String(equipment.status || '').toUpperCase() === 'AVAILABLE',
    ).length;

    const paidPayments = payments.filter(
      (payment) => payment.status === 'PAID',
    );

    const totalRevenue = paidPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.totalAmount ?? payment.amount ?? 0),
      0,
    );

    return [
      {
        label: 'Total Users',
        value: users.length.toLocaleString('vi-VN'),
        icon: Icon.users,
      },
      {
        label: 'Total Equipment',
        value: equipments.length.toLocaleString('vi-VN'),
        icon: Icon.box,
      },
      {
        label: 'Active Rentals',
        value: activeRentals.toLocaleString('vi-VN'),
        icon: Icon.calendar,
      },
      {
        label: 'Total Revenue',
        value: dashboardMoney(totalRevenue),
        icon: Icon.wallet,
      },
      {
        label: 'Pending Bookings',
        value: pendingBookings.toLocaleString('vi-VN'),
        icon: Icon.clock,
      },
      {
        label: 'Completed Rentals',
        value: completedRentals.toLocaleString('vi-VN'),
        icon: Icon.check,
      },
      {
        label: 'Available Equipment',
        value: availableEquipment.toLocaleString('vi-VN'),
        icon: Icon.layers,
      },
      {
        label: 'Paid Transactions',
        value: paidPayments.length.toLocaleString('vi-VN'),
        icon: Icon.chart,
      },
    ];
  }, [bookings, users, equipments, payments]);

  const revenue = useMemo(() => {
    const now = new Date();
    const start = dashboardRangeStart(range, now);

    const inRange = (payment) => {
      const date = dashboardDate(payment.paidAt);
      return date && date >= start && date <= now;
    };

    const paidPayments = payments.filter(
      (payment) => payment.status === 'PAID' && inRange(payment),
    );

    const refundedPayments = payments.filter(
      (payment) => payment.status === 'REFUNDED' && inRange(payment),
    );

    const bucketCount =
      range === '7 Days'
        ? 7
        : range === '30 Days'
          ? 30
          : range === '3 Months'
            ? 3
            : range === '6 Months'
              ? 6
              : 12;

    const daily = range === '7 Days' || range === '30 Days';
    const chartData = [];

    for (let i = 0; i < bucketCount; i += 1) {
      const bucketStart = new Date(start);

      if (daily) {
        bucketStart.setDate(start.getDate() + i);
      } else {
        bucketStart.setMonth(start.getMonth() + i);
      }

      const bucketEnd = new Date(bucketStart);

      if (daily) {
        bucketEnd.setDate(bucketEnd.getDate() + 1);
      } else {
        bucketEnd.setMonth(bucketEnd.getMonth() + 1);
      }

      const bucketValue = paidPayments.reduce((sum, payment) => {
        const paidAt = dashboardDate(payment.paidAt);

        if (
          paidAt &&
          paidAt >= bucketStart &&
          paidAt < bucketEnd
        ) {
          return sum + Number(payment.totalAmount ?? payment.amount ?? 0);
        }

        return sum;
      }, 0);

      chartData.push({
        label: daily
          ? bucketStart.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            })
          : bucketStart.toLocaleDateString('vi-VN', {
              month: 'short',
              year: '2-digit',
            }),
        value: bucketValue,
      });
    }

    const completed = paidPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.totalAmount ?? payment.amount ?? 0),
      0,
    );

    const refunds = refundedPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.totalAmount ?? payment.amount ?? 0),
      0,
    );

    return { chartData, completed, refunds };
  }, [payments, range]);

  const rentalBreakdown = useMemo(() => {
    const count = (status) =>
      bookings.filter((booking) => booking.status === status).length;

    return [
      {
        label: 'Completed',
        value: count('COMPLETED'),
        color: '#16A34A',
      },
      {
        label: 'In Progress',
        value: count('IN_PROGRESS'),
        color: '#2F5FE0',
      },
      {
        label: 'Approved',
        value: count('APPROVED'),
        color: '#0EA5E9',
      },
      {
        label: 'Pending',
        value: count('PENDING'),
        color: '#F59E0B',
      },
      {
        label: 'Cancelled',
        value: count('CANCELLED'),
        color: '#6B7280',
      },
      {
        label: 'Rejected',
        value: count('REJECTED'),
        color: '#DC2626',
      },
    ];
  }, [bookings]);

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            (dashboardDate(b.createdAt)?.getTime() || 0) -
            (dashboardDate(a.createdAt)?.getTime() || 0),
        )
        .slice(0, 5),
    [bookings],
  );

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            (dashboardDate(b.createdAt)?.getTime() || 0) -
            (dashboardDate(a.createdAt)?.getTime() || 0),
        )
        .slice(0, 5),
    [users],
  );

  if (loading) {
    return (
      <div className="rh-card p-8 text-center" style={{ color: '#6B7280' }}>
        Đang tải dữ liệu Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
          }}
        >
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            className="mt-2 underline font-semibold"
            onClick={() => window.location.reload()}
          >
            Tải lại Dashboard
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard
            title="Revenue Overview"
            subtitle="Doanh thu từ giao dịch thanh toán thành công"
            action={
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="h-9 px-3 rounded-lg text-xs"
                style={{ border: '1px solid #E5E7EB' }}
              >
                {DASHBOARD_REVENUE_RANGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            }
          >
            <SimpleBarChart
              data={revenue.chartData}
              height={180}
            />

            <div
              className="flex flex-wrap gap-6 mt-5 pt-4 border-t"
              style={{ borderColor: '#EEF0F3' }}
            >
              <DetailRow
                label="Completed Payments"
                value={dashboardMoney(revenue.completed)}
              />
              <DetailRow
                label="Refunds"
                value={dashboardMoney(revenue.refunds)}
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Rental Analytics"
          subtitle="Phân bổ booking theo trạng thái"
        >
          <StackedBreakdown segments={rentalBreakdown} />
        </SectionCard>
      </div>

      <SectionCard title="Recent Bookings">
        {recentBookings.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: '#9CA3AF' }}>
            Chưa có booking để hiển thị.
          </p>
        ) : (
          <Table
            columns={[
              'Booking ID',
              'Customer',
              'Equipment',
              'Period',
              'Amount',
              'Status',
              'Created',
            ]}
          >
            {recentBookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-t"
                style={{ borderColor: '#EEF0F3' }}
              >
                <td className="px-3 py-2.5 font-medium" style={{ color: '#111827' }}>
                  {String(booking.id || '').slice(0, 8) || '—'}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#374151' }}>
                  {booking.renterName || '—'}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#374151' }}>
                  {booking.equipmentTitle || '—'}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#6B7280' }}>
                  {dashboardDateLabel(booking.startDate)} – {dashboardDateLabel(booking.endDate)}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#111827' }}>
                  {dashboardMoney(booking.totalAmount)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge
                    label={
                      ({
                        PENDING: 'Pending',
                        APPROVED: 'Approved',
                        REJECTED: 'Rejected',
                        CANCELLED: 'Cancelled',
                        IN_PROGRESS: 'Rented',
                        COMPLETED: 'Completed',
                      })[booking.status] || booking.status || 'Unknown'
                    }
                  />
                </td>
                <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>
                  {dashboardDateLabel(booking.createdAt)}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </SectionCard>

      <SectionCard title="Recent Users">
        {recentUsers.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: '#9CA3AF' }}>
            Chưa có người dùng để hiển thị.
          </p>
        ) : (
          <Table columns={['User', 'Email', 'Role', 'Status', 'Joined']}>
            {recentUsers.map((user, index) => {
              const name = dashboardUserName(user);
              const email = user.email || '—';
              const roles = user.roles ?? user.role ?? '—';
              const roleLabel = Array.isArray(roles)
                ? roles
                    .map((role) =>
                      typeof role === 'string' ? role : role?.name || role?.authority,
                    )
                    .filter(Boolean)
                    .join(', ')
                : typeof roles === 'object'
                  ? roles.name || roles.authority || '—'
                  : roles;

              const status =
                user.status ||
                (user.active === false || user.enabled === false
                  ? 'Suspended'
                  : 'Active');

              return (
                <tr
                  key={user.id || user.email || index}
                  className="border-t"
                  style={{ borderColor: '#EEF0F3' }}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ background: '#1E3A8A' }}
                      >
                        {name
                          .split(/\s+/)
                          .map((word) => word[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: '#111827' }}>
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: '#6B7280' }}>
                    {email}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: '#374151' }}>
                    {roleLabel || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      label={
                        status === 'ACTIVE'
                          ? 'Active'
                          : status === 'SUSPENDED'
                            ? 'Suspended'
                            : status
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>
                    {dashboardDateLabel(user.createdAt || user.joinedAt)}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </SectionCard>
    </div>
  );
}


/* ================================================================== */
/* Section: Users                                                      */
/* ================================================================== */

function UsersSection() {
  return <UserManagement />;
}
/* ================================================================== */
/* Section: Equipment                                                   */
/* ================================================================== */

function EquipmentSection() {
  return <EquipmentManagement />;
}

/* ================================================================== */
/* Section: Categories                                                 */
/* ================================================================== */

function CategoriesSection() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setSelectedCategory(null);
    setForm({ name: '', description: '' });
    setAddOpen(false);
    setEditOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
    });
    setEditOpen(true);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('error', 'Category name is required.');
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (selectedCategory) {
        response = await axiosClient.put(`/equipments/categories/${selectedCategory.id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        showToast('success', response?.data?.message || 'Category updated successfully!');
      } else {
        response = await axiosClient.post('/equipments/categories', {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        showToast('success', response?.data?.message || 'Category created successfully!');
      }

      resetForm();
      const refreshed = await refreshCategories();
      setCategories(Array.isArray(refreshed) ? refreshed : []);
    } catch (error) {
      console.error('Failed to save category:', error);
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : '') ||
        error?.message ||
        'Failed to save category.';
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    try {
      const response = await axiosClient.delete(`/equipments/categories/${category.id}`);
      showToast('success', response?.data?.message || 'Category deleted successfully!');
      const refreshed = await refreshCategories();
      setCategories(Array.isArray(refreshed) ? refreshed : []);
    } catch (error) {
      console.error('Failed to delete category:', error);
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : '') ||
        error?.message ||
        'Failed to delete category.';
      showToast('error', message);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-5 top-5 z-[100] max-w-sm rounded-xl border bg-white px-4 py-3 shadow-lg" style={{ borderColor: toast.type === 'success' ? '#BBF7D0' : '#FECACA', boxShadow: '0 18px 40px -22px rgba(15,27,61,0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold" style={{ background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2', color: toast.type === 'success' ? '#16A34A' : '#DC2626' }}>
              {toast.type === 'success' ? '✓' : '!'}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                {toast.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: '#4B5563' }}>{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <SectionCard
        title="Categories"
        action={<button onClick={openAddModal} className="rh-btn-primary px-4 py-2 text-xs">+ Add Category</button>}
      >
        {loading ? (
          <div className="text-sm" style={{ color: '#6B7280' }}>Loading categories...</div>
        ) : (
          <Table columns={['Category', 'Description', 'Created Date', 'Actions']}>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-sm" style={{ color: '#6B7280' }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: '#EEF0F3' }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: '#111827' }}>{c.name}</td>
                  <td className="px-3 py-2.5" style={{ color: '#6B7280' }}>{c.description || '—'}</td>
                  <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{formatDate(c.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <RowActions
                      actions={[
                        { label: 'Edit', icon: <Icon.pencil />, onClick: () => openEditModal(c) },
                        { label: 'Delete', icon: <Icon.trash />, danger: true, onClick: () => handleDelete(c) },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </SectionCard>

      {(addOpen || editOpen) && (
        <Modal
          title={selectedCategory ? 'Edit Category' : 'Add Category'}
          onClose={resetForm}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Category Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-11 px-3 rounded-lg text-sm"
                style={{ border: '1px solid #E5E7EB' }}
                placeholder="e.g. Outdoor & Camping"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                style={{ border: '1px solid #E5E7EB' }}
                placeholder="Short description..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={resetForm} className="rh-btn-outline flex-1 py-2.5 text-sm">Cancel</button>
              <button disabled={submitting} onClick={handleSubmit} className="rh-btn-primary flex-1 py-2.5 text-sm disabled:opacity-60">
                {submitting ? 'Saving...' : selectedCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== */
/* Section: Rentals                                                    */
/* ================================================================== */

function RentalsSection() {
  return <RentalManagement />;
}

/* ================================================================== */
/* Section: Payments                                                   */
/* ================================================================== */

function PaymentsSection() {
  return <PaymentManagement />;
}

/* ================================================================== */
/* Section: Reviews                                                    */
/* ================================================================== */

function ReviewsSection() {
  return <ReviewManagement />;
}

/* ================================================================== */
/* Section: Reports & Analytics                                        */
/* ================================================================== */

function ReportsSection() {
  return <ReportsManagement />;
}
/* ================================================================== */
/* Section: Settings                                                    */
/* ================================================================== */


function SettingsSection() {
  const [tab, setTab] = useState('profile');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [message, setMessage] = useState(null);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const defaultNotifications = {
    newUser: true,
    newBooking: true,
    payment: true,
    reportedEquipment: true,
    reportedReview: false,
    system: true,
  };

  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem('renthub_admin_notifications');
      return saved
        ? { ...defaultNotifications, ...JSON.parse(saved) }
        : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  const [platform, setPlatform] = useState(() => {
    const defaults = {
      siteName: 'RentHub',
      currency: 'VND',
      commissionRate: '10',
    };

    try {
      const saved = localStorage.getItem('renthub_admin_platform');
      return saved ? { ...defaults, ...JSON.parse(saved), currency: 'VND' } : defaults;
    } catch {
      return defaults;
    }
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);

      try {
        const response = await axiosClient.get('/users/me');
        const user =
          response.data?.data ??
          response.data?.user ??
          response.data;

        if (!user || typeof user !== 'object') {
          throw new Error('Không thể đọc thông tin tài khoản.');
        }

        if (!cancelled) {
          setProfile({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          showMessage(
            'error',
            error.response?.data?.message ||
              error.message ||
              'Không thể tải hồ sơ quản trị.'
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const email = profile.email.trim();
    const phoneNumber = profile.phoneNumber.trim();

    if (!firstName || !lastName) {
      showMessage('error', 'Họ và tên không được để trống.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage('error', 'Email không hợp lệ.');
      return;
    }

    if (phoneNumber && !/^[0-9+\-\s]{8,15}$/.test(phoneNumber)) {
      showMessage('error', 'Số điện thoại không hợp lệ.');
      return;
    }

    setSavingProfile(true);
    setMessage(null);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
      };

      const response = await axiosClient.put('/users/me', payload);

      const updatedUser =
        response.data?.data ??
        response.data?.user ??
        response.data;

      setProfile({
        firstName: updatedUser?.firstName ?? firstName,
        lastName: updatedUser?.lastName ?? lastName,
        email: updatedUser?.email ?? email,
        phoneNumber: updatedUser?.phoneNumber ?? phoneNumber,
      });

      showMessage(
        'success',
        response.data?.message || 'Cập nhật hồ sơ thành công.'
      );
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Không thể cập nhật hồ sơ.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = passwords;

    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      showMessage(
        'error',
        'Mật khẩu mới phải có ít nhất 6 ký tự.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        'error',
        'Mật khẩu xác nhận không khớp.'
      );
      return;
    }

    if (oldPassword === newPassword) {
      showMessage(
        'error',
        'Mật khẩu mới phải khác mật khẩu hiện tại.'
      );
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const response = await axiosClient.post(
        '/auth/change-password',
        {
          oldPassword,
          newPassword,
        }
      );

      setPasswords({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showMessage(
        'success',
        response.data?.message ||
          response.data?.data?.message ||
          'Đổi mật khẩu thành công.'
      );
    } catch (error) {
      showMessage(
        'error',
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Không thể đổi mật khẩu.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = () => {
    setSavingPreferences(true);

    try {
      localStorage.setItem(
        'renthub_admin_notifications',
        JSON.stringify(notifs)
      );

      showMessage(
        'success',
        'Đã lưu tùy chọn thông báo trên trình duyệt này.'
      );
    } catch {
      showMessage(
        'error',
        'Không thể lưu tùy chọn thông báo trên trình duyệt.'
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSavePlatform = (event) => {
    event.preventDefault();

    const commission = Number(platform.commissionRate);

    if (!platform.siteName.trim()) {
      showMessage('error', 'Tên nền tảng không được để trống.');
      return;
    }

    if (
      !Number.isFinite(commission) ||
      commission < 0 ||
      commission > 100
    ) {
      showMessage(
        'error',
        'Phí hoa hồng phải nằm trong khoảng 0–100%.'
      );
      return;
    }

    try {
      localStorage.setItem(
        'renthub_admin_platform',
        JSON.stringify(platform)
      );

      showMessage(
        'success',
        'Đã lưu tùy chọn giao diện trên trình duyệt này. Cấu hình chưa được áp dụng trên backend.'
      );
    } catch {
      showMessage(
        'error',
        'Không thể lưu cấu hình trên trình duyệt.'
      );
    }
  };

  const inputClass =
    'w-full h-11 px-3 rounded-lg text-sm border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  const tabs = [
    ['profile', 'Profile'],
    ['security', 'Security'],
    ['notifications', 'Notifications'],
    ['platform', 'Platform Settings'],
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div
          role="alert"
          className="rounded-xl border p-4 text-sm"
          style={{
            borderColor:
              message.type === 'success' ? '#BBF7D0' : '#FECACA',
            background:
              message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color:
              message.type === 'success' ? '#166534' : '#B91C1C',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{message.text}</p>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Đóng thông báo"
              className="font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setMessage(null);
            }}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              background: tab === key ? '#2F5FE0' : '#fff',
              color: tab === key ? '#fff' : '#374151',
              borderColor: tab === key ? '#2F5FE0' : '#E5E7EB',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <SectionCard title="Admin Profile" subtitle="Thông tin tài khoản quản trị">
          {loadingProfile ? (
            <p className="text-sm text-gray-500">
              Đang tải thông tin tài khoản...
            </p>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="mb-5 flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: '#1E3A8A' }}
                >
                  {`${profile.firstName[0] || 'A'}${profile.lastName[0] || 'R'}`.toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold text-gray-800">
                    {`${profile.firstName} ${profile.lastName}`.trim() ||
                      'Admin'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Thông tin được tải từ tài khoản đang đăng nhập.
                  </p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-first-name" className="mb-1.5 block text-xs font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="settings-first-name"
                    className={inputClass}
                    value={profile.firstName}
                    onChange={(event) =>
                      updateProfileField('firstName', event.target.value)
                    }
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="settings-last-name" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="settings-last-name"
                    className={inputClass}
                    value={profile.lastName}
                    onChange={(event) =>
                      updateProfileField('lastName', event.target.value)
                    }
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="settings-email" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    className={inputClass}
                    value={profile.email}
                    onChange={(event) =>
                      updateProfileField('email', event.target.value)
                    }
                    maxLength={255}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="settings-phone" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    id="settings-phone"
                    type="tel"
                    className={inputClass}
                    value={profile.phoneNumber}
                    onChange={(event) =>
                      updateProfileField('phoneNumber', event.target.value)
                    }
                    maxLength={15}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile || loadingProfile}
                className="rh-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </SectionCard>
      )}

      {tab === 'security' && (
        <SectionCard
          title="Security"
          subtitle="Đổi mật khẩu cho tài khoản đang đăng nhập"
        >
          <form onSubmit={handleChangePassword} className="max-w-xl">
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-old-password" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="settings-old-password"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                  value={passwords.oldPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      oldPassword: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-new-password" className="mb-1.5 block text-xs font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="settings-new-password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-confirm-password" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="rh-btn-primary mt-5 px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </SectionCard>
      )}

      {tab === 'notifications' && (
        <SectionCard
          title="Notification Preferences"
          subtitle="Các tùy chọn này được lưu trên trình duyệt hiện tại"
        >
          <div className="max-w-xl">
            {[
              ['newUser', 'New User'],
              ['newBooking', 'New Booking'],
              ['payment', 'Payment'],
              ['reportedEquipment', 'Reported Equipment'],
              ['reportedReview', 'Reported Review'],
              ['system', 'System Notification'],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 border-b py-3 last:border-b-0"
                style={{ borderColor: '#EEF0F3' }}
              >
                <span className="text-sm text-gray-700">{label}</span>

                <input
                  type="checkbox"
                  checked={Boolean(notifs[key])}
                  onChange={(event) =>
                    setNotifs((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
            ))}

            <button
              type="button"
              disabled={savingPreferences}
              onClick={handleSaveNotifications}
              className="rh-btn-primary mt-5 px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {savingPreferences ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </SectionCard>
      )}

      {tab === 'platform' && (
        <SectionCard
          title="Platform Settings"
          subtitle="Bản hiện tại chỉ lưu cấu hình cục bộ, chưa thay đổi cấu hình backend"
        >
          <form onSubmit={handleSavePlatform} className="max-w-xl">
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-site-name" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Platform Name
                </label>
                <input
                  id="settings-site-name"
                  className={inputClass}
                  value={platform.siteName}
                  onChange={(event) =>
                    setPlatform((current) => ({
                      ...current,
                      siteName: event.target.value,
                    }))
                  }
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-currency" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="settings-currency"
                  className={inputClass}
                  value="VND"
                  disabled
                >
                  <option value="VND">VND — Vietnamese Dong</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings-commission" className="mb-1.5 block text-xs font-medium text-gray-700">
                  Commission Rate (%)
                </label>
                <input
                  id="settings-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className={inputClass}
                  value={platform.commissionRate}
                  onChange={(event) =>
                    setPlatform((current) => ({
                      ...current,
                      commissionRate: event.target.value,
                    }))
                  }
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Giá trị này chưa được áp dụng vào thanh toán hoặc booking.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="rh-btn-primary mt-5 px-5 py-2.5 text-sm"
            >
              Save Settings
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  );
}


/* ================================================================== */
/* Main layout: Sidebar + Topbar + active section                      */
/* ================================================================== */

const SECTION_COMPONENTS = {
  dashboard: DashboardSection,
  users: UsersSection,
  equipment: EquipmentSection,
  categories: CategoriesSection,
  rentals: RentalsSection,
  payments: PaymentsSection,
  reviews: ReviewsSection,
  reports: ReportsSection,
  settings: SettingsSection,
};

const SECTION_TITLES = {
  dashboard: 'Dashboard', users: 'User Management', equipment: 'Equipment Management',
  categories: 'Category Management', rentals: 'Rental Management', payments: 'Payment Management',
  reviews: 'Review Management', reports: 'Reports & Analytics', settings: 'Admin Settings',
};

const SECTION_SUBTITLES = {
  dashboard: 'Overview of your RentHub platform.',
  users: 'Manage RentHub users and their accounts.',
};

export default function AdminDashboard() {
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const ActiveSection = SECTION_COMPONENTS[active];

  const NavLink = ({ item }) => {
    const isActive = active === item.key;
    return (
      <button
        onClick={() => { setActive(item.key); setMobileOpen(false); }}
        title={collapsed ? item.label : undefined}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={{ background: isActive ? 'rgba(47,95,224,0.12)' : 'transparent', color: isActive ? '#2F5FE0' : '#374151' }}
      >
        <item.icon />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="rh-root min-h-screen flex" style={{ background: '#F7F9FC', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-card { border: 1px solid #EEF0F3; border-radius: 14px; background: #fff; }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
        .rh-btn-primary:hover { background: #274DBD; }
        .rh-btn-outline { border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; background: #fff; transition: background .15s ease; }
        .rh-btn-outline:hover { background: #F9FAFB; }
      `}</style>

      {/* ---------------- SIDEBAR (desktop) ---------------- */}
      <aside
        className="hidden lg:flex lg:flex-col shrink-0 bg-white border-r sticky top-0 h-screen transition-all"
        style={{ width: collapsed ? 76 : 240, borderColor: '#EEF0F3' }}
      >
        <div className="h-16 flex items-center px-4 border-b" style={{ borderColor: '#EEF0F3' }}>
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="rh-heading w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold shrink-0" style={{ background: '#2F5FE0' }}>R</div>
            {!collapsed && <span className="rh-heading text-base font-bold whitespace-nowrap" style={{ color: '#0F1B3D' }}>RentHub</span>}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => <NavLink key={item.key} item={item} />)}
          <div className="h-px my-2" style={{ background: '#EEF0F3' }} />
          <NavLink item={{ key: 'settings', label: 'Settings', icon: Icon.settings }} />
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#DC2626' }}>
            <Icon.logout />
            {!collapsed && <span>Logout</span>}
          </button>
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-12 flex items-center justify-center border-t"
          style={{ borderColor: '#EEF0F3', color: '#6B7280' }}
        >
          <Icon.chevronLeft style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />
        </button>
      </aside>

      {/* ---------------- SIDEBAR DRAWER (mobile) ---------------- */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(15,27,61,0.45)' }} onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: '#EEF0F3' }}>
              <span className="rh-heading text-base font-bold" style={{ color: '#0F1B3D' }}>RentHub</span>
              <button onClick={() => setMobileOpen(false)}><Icon.close /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => <NavLink key={item.key} item={item} />)}
              <div className="h-px my-2" style={{ background: '#EEF0F3' }} />
              <NavLink item={{ key: 'settings', label: 'Settings', icon: Icon.settings }} />
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#DC2626' }}>
                <Icon.logout /> Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ---------------- MAIN ---------------- */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b h-16 flex items-center justify-between px-4 sm:px-6" style={{ borderColor: '#EEF0F3' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu"><Icon.menu /></button>
            <div className="min-w-0">
              <h1 className="rh-heading text-base font-bold truncate" style={{ color: '#0F1B3D' }}>{SECTION_TITLES[active]}</h1>
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>Admin / {SECTION_TITLES[active]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <PreferenceControls />
            <button className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }} aria-label="Search"><Icon.search /></button>
            <button className="relative p-2 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }} aria-label="Notifications">
              <Icon.bell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
            </button>
            <div className="relative">
              <button onClick={() => setProfileMenuOpen((o) => !o)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#1E3A8A' }}>AR</div>
                <span className="hidden sm:inline text-sm font-medium" style={{ color: '#374151' }}>Admin RentHub</span>
                <Icon.chevronDown style={{ color: '#9CA3AF' }} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rh-card p-1.5" onMouseLeave={() => setProfileMenuOpen(false)}>
                  <button onClick={() => { setActive('settings'); setProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50" style={{ color: '#374151' }}>My Profile</button>
                  <button onClick={() => { setActive('settings'); setProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50" style={{ color: '#374151' }}>Settings</button>
                  <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50" style={{ color: '#DC2626' }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {active === 'dashboard' && (
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>{SECTION_SUBTITLES.dashboard}</p>
          )}
          {active === 'users' && (
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>{SECTION_SUBTITLES.users}</p>
          )}
          <ActiveSection />
        </main>
      </div>
    </div>
  );
}