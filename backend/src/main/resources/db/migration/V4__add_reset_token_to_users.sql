-- Thêm các cột phục vụ tính năng Quên mật khẩu / Đặt lại mật khẩu vào bảng users
ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expiry TIMESTAMP NULL;