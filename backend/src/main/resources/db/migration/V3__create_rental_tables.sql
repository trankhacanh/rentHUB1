-- Bảng lưu trữ thông tin đơn đặt thuê thiết bị
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);