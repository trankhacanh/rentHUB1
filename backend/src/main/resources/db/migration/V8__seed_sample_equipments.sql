-- Seed 10 sample rental products with concrete image URLs.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM user_roles
                WHERE role_name = 'ROLE_OWNER'
                    AND user_id = (
                            SELECT id
                            FROM users
                            WHERE email = 'trankhacanh79@gmail.com'
                    )
    ) THEN
                RAISE EXCEPTION 'Cannot seed equipments: trankhacanh79@gmail.com is not an existing ROLE_OWNER';
    END IF;
END $$;

WITH seed_data (id, title, description, price_per_day, category_name, brand, model, condition, year_purchased, city, district, image_url) AS (
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'Sony Alpha A7 III', 'Máy ảnh mirrorless full-frame phù hợp chụp ảnh và quay phim.', 350000.00, 'Máy ảnh & Cụm camera', 'Sony', 'Alpha A7 III', 'Tốt', 2021, 'Ho Chi Minh City', 'District 1', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'Canon EOS R6', 'Máy ảnh full-frame tốc độ cao, kèm pin và thẻ nhớ.', 450000.00, 'Máy ảnh & Cụm camera', 'Canon', 'EOS R6', 'Tốt', 2022, 'Ho Chi Minh City', 'Binh Thanh District', 'https://images.unsplash.com/photo-1606986628253-4b5e5e6f2b7b?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'Ống kính Sigma 24-70mm', 'Ống kính zoom đa dụng ngàm Sony E cho chụp chân dung và sự kiện.', 220000.00, 'Máy ảnh & Cụm camera', 'Sigma', '24-70mm F2.8 DG DN', 'Tốt', 2022, 'Ho Chi Minh City', 'District 3', 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'Lều cắm trại 4 người', 'Lều chống nước, phù hợp cho chuyến đi cuối tuần.', 180000.00, 'Đồ cắm trại & Dã ngoại', 'Naturehike', 'Cloud Up 4', 'Mới', 2023, 'Da Nang', 'Hai Chau District', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'Bộ bàn ghế dã ngoại', 'Bộ bàn gấp và bốn ghế nhôm nhẹ cho picnic.', 120000.00, 'Đồ cắm trại & Dã ngoại', 'Naturehike', 'Outdoor Set', 'Tốt', 2022, 'Da Nang', 'Son Tra District', 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000006'::uuid, 'MacBook Pro 14 inch', 'Laptop hiệu năng cao cho công việc, thiết kế và lập trình.', 550000.00, 'Thiết bị điện tử', 'Apple', 'MacBook Pro M2 Pro', 'Tốt', 2023, 'Ha Noi', 'Cau Giay District', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000007'::uuid, 'Máy chiếu mini Full HD', 'Máy chiếu nhỏ gọn cho xem phim và thuyết trình.', 200000.00, 'Thiết bị điện tử', 'XGIMI', 'MoGo 2 Pro', 'Mới', 2023, 'Ha Noi', 'Dong Da District', 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000008'::uuid, 'Loa Bluetooth JBL', 'Loa di động chống nước, thời lượng pin dài.', 150000.00, 'Thiết bị điện tử', 'JBL', 'Charge 5', 'Tốt', 2022, 'Ho Chi Minh City', 'Thu Duc City', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000009'::uuid, 'Xe máy Honda Winner X', 'Xe máy côn tay phù hợp di chuyển trong thành phố và đi phượt.', 300000.00, 'Phương tiện di chuyển', 'Honda', 'Winner X', 'Tốt', 2021, 'Ho Chi Minh City', 'Tan Binh District', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000010'::uuid, 'Xe đạp địa hình', 'Xe đạp địa hình 27.5 inch cho hoạt động thể thao ngoài trời.', 180000.00, 'Phương tiện di chuyển', 'Giant', 'Talon 2', 'Tốt', 2022, 'Ha Noi', 'Ba Dinh District', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200&auto=format&fit=crop')
)
INSERT INTO equipments (
    id, owner_id, category_id, title, description, price_per_day,
    status, condition, brand, model, year_purchased, city, district,
    availability, allow_request_booking, image_urls
)
SELECT
    s.id,
    owner.id,
    c.id,
    s.title,
    s.description,
    s.price_per_day,
    'AVAILABLE',
    s.condition,
    s.brand,
    s.model,
    s.year_purchased,
    s.city,
    s.district,
    'Available',
    true,
    s.image_url
FROM seed_data s
CROSS JOIN LATERAL (
    SELECT u.id
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
        WHERE ur.role_name = 'ROLE_OWNER'
            AND u.email = 'trankhacanh79@gmail.com'
    LIMIT 1
) owner
JOIN categories c ON c.name = s.category_name
ON CONFLICT (id) DO NOTHING;

WITH seed_images (equipment_id, image_url) AS (
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1606986628253-4b5e5e6f2b7b?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000006'::uuid, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000007'::uuid, 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000008'::uuid, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000009'::uuid, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop'),
        ('10000000-0000-0000-0000-000000000010'::uuid, 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200&auto=format&fit=crop')
)
INSERT INTO equipment_images (equipment_id, image_url, is_cover, sort_order)
SELECT si.equipment_id, si.image_url, true, 0
FROM seed_images si
JOIN equipments e ON e.id = si.equipment_id
WHERE NOT EXISTS (
    SELECT 1
    FROM equipment_images ei
    WHERE ei.equipment_id = si.equipment_id
      AND ei.image_url = si.image_url
);
