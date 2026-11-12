import React from 'react';
import { Link } from 'react-router-dom';

export default function AppFooter() {
  const columns = [
    {
      title: 'Platform',
      links: [
        ['Browse Equipment', '/browse'],
        ['Categories', '/categories'],
        ['List Equipment', '/list-equipment'],
        ['How It Works', '/how-it-works'],
      ],
    },
    {
      title: 'Company',
      links: [
        ['About Us', '/about'],
        ['Contact', '/contact'],
        ['Careers', '/careers'],
        ['Help Center', '/help'],
      ],
    },
    {
      title: 'Legal',
      links: [
        ['Privacy Policy', '/privacy'],
        ['Terms of Service', '/terms'],
        ['Rental Policy', '/rental-policy'],
      ],
    },
  ];

  return (
    <footer className="border-t" style={{ borderColor: '#EEF0F3' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="rh-heading w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold"
              style={{ background: '#2F5FE0' }}
            >
              R
            </div>

            <span
              className="rh-heading text-lg font-bold"
              style={{ color: '#0F1B3D' }}
            >
              RentHub
            </span>
          </div>

          <p className="text-sm" style={{ color: '#6B7280' }}>
            RentHub makes renting and sharing equipment simple, flexible, and accessible.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>
              {column.title}
            </h4>

            <ul className="space-y-2">
              {column.links.map(([label, path]) => (
                <li key={label}>
                  <Link to={path} className="text-sm hover:underline" style={{ color: '#6B7280' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t py-6" style={{ borderColor: '#EEF0F3' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            © 2026 RentHub. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs font-medium" style={{ color: '#6B7280' }}>
            <a href="#" className="hover:text-[#2F5FE0]">Facebook</a>
            <a href="#" className="hover:text-[#2F5FE0]">Instagram</a>
            <a href="#" className="hover:text-[#2F5FE0]">X</a>
            <a href="#" className="hover:text-[#2F5FE0]">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
