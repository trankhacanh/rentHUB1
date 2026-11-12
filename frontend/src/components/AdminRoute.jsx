import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  // Kiểm tra xem mảng roles có chứa "ROLE_ADMIN" không
  const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');

  if (!isAdmin) {
    alert('Bạn không có quyền truy cập trang quản trị!');
    return <Navigate to="/" replace />;
  }

  return children;
}