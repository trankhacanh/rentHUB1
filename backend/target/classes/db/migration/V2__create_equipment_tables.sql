-- Bảng lưu danh mục thiết bị (Ví dụ: Máy ảnh, Xe máy, Thiết bị cắm trại...)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu thông tin thiết bị cho thuê
CREATE TABLE equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, MAINTENANCE, INACTIVE
    address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chèn sẵn một số Danh mục mẫu
INSERT INTO categories (name, description) VALUES
('Máy ảnh & Cụm camera', 'Các loại camera, ống kính, thiết bị quay phim'),
('Đồ cắm trại & Dã ngoại', 'Lều, túi ngủ, bếp dã ngoại, đèn pin'),
('Thiết bị điện tử', 'Laptop, máy chiếu, thiết bị âm thanh'),
('Phương tiện di chuyển', 'Xe máy, xe đạp, xe điện');