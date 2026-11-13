
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppHeader from './AppHeader';
import AiChatWidget from '../../features/ai-assistant/components/AiChatWidget';

export default function MainLayout() {
  const { pathname } = useLocation();

  // Những trang không hiển thị header chung
  const hideHeaderPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  const hideHeader = hideHeaderPaths.includes(pathname);

  // Các trang sử dụng header tối giản
  const minimalHeaderPaths = ['/profile'];
  const isMinimalHeader = minimalHeaderPaths.includes(pathname);

  return (
    <>
      {!hideHeader && (
        <AppHeader
          activePath={pathname}
          minimal={isMinimalHeader}
        />
      )}

      <Outlet />

      {/* AI Assistant: chỉ hiển thị trên các trang chính */}
      {!hideHeader && <AiChatWidget />}
    </>
  );
}
