-- V1__init_auth_tables.sql

-- Bảng lưu trữ các quyền/vai trò (Role)
CREATE TABLE roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu trữ thông tin Người dùng (User)
-- Dùng UUID làm khóa chính để tăng tính bảo mật và dễ dàng mở rộng phân tán sau này
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng trung gian n-n giữa users và roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_name)
);

-- Khởi tạo sẵn một số Role cơ bản vào DB
INSERT INTO roles (name, description) VALUES
('ROLE_USER', 'Người dùng bình thường (Người đi thuê)'),
('ROLE_OWNER', 'Chủ thiết bị (Người cho thuê)'),
('ROLE_ADMIN', 'Quản trị viên hệ thống');