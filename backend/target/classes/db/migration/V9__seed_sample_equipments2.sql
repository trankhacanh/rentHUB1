-- Seed 10 sample rental products for a SECOND owner account, with concrete image URLs.
-- Assumes khacanh204@gmail.com already exists as a user with ROLE_OWNER.
-- (Fixed the typo from "gmai.com" -> "gmail.com"; adjust below if that was intentional.)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM user_roles
                WHERE role_name = 'ROLE_OWNER'
                    AND user_id = (
                            SELECT id
                            FROM users
                            WHERE email = 'khacanh204@gmail.com'
                    )
    ) THEN
                RAISE EXCEPTION 'Cannot seed equipments: khacanh204@gmail.com is not an existing ROLE_OWNER';
    END IF;
END $$;

WITH seed_data (id, title, description, price_per_day, category_name, brand, model, condition, year_purchased, city, district, image_url) AS (
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, 'Máy khoan Bosch Professional', 'Máy khoan động lực dùng cho khoan tường, gỗ và kim loại.', 90000.00, 'Dụng cụ & Thiết bị', 'Bosch', 'GSB 13 RE', 'Tốt', 2021, 'Ho Chi Minh City', 'District 7', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'Máy hàn điện tử Mini', 'Máy hàn que mini, gọn nhẹ, phù hợp sửa chữa tại nhà.', 100000.00, 'Dụng cụ & Thiết bị', 'Jasic', 'ARC 200', 'Tốt', 2022, 'Ho Chi Minh City', 'District 12', 'https://images.unsplash.com/photo-1581091870621-1e9c7d1a7a3d?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'Máy cắt gạch cầm tay', 'Máy cắt gạch, đá dùng cho công trình nhỏ và sửa nhà.', 130000.00, 'Dụng cụ & Thiết bị', 'Makita', '4100NH', 'Tốt', 2021, 'Ho Chi Minh City', 'Go Vap District', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'Drone DJI Mini 3', 'Flycam nhỏ gọn quay 4K, phù hợp du lịch và làm nội dung.', 400000.00, 'Thiết bị điện tử', 'DJI', 'Mini 3', 'Mới', 2023, 'Da Nang', 'Ngu Hanh Son District', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'Gimbal chống rung DJI RS3', 'Gimbal ổn định hình ảnh cho máy ảnh DSLR/mirrorless.', 180000.00, 'Thiết bị điện tử', 'DJI', 'RS 3', 'Tốt', 2022, 'Da Nang', 'Thanh Khe District', 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'Máy chơi game PlayStation 5', 'Máy chơi game thế hệ mới kèm 2 tay cầm.', 250000.00, 'Thiết bị điện tử', 'Sony', 'PlayStation 5', 'Tốt', 2022, 'Ha Noi', 'Hoan Kiem District', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000007'::uuid, 'Bàn ủi hơi nước đứng', 'Bàn ủi công suất lớn, phù hợp cho sự kiện, studio chụp ảnh.', 70000.00, 'Đồ gia dụng', 'Philips', 'GC682', 'Tốt', 2021, 'Ha Noi', 'Tay Ho District', 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000008'::uuid, 'Máy pha cà phê Espresso', 'Máy pha cà phê gia đình, phù hợp tổ chức tiệc nhỏ.', 160000.00, 'Đồ gia dụng', 'Delonghi', 'EC685', 'Tốt', 2022, 'Ho Chi Minh City', 'Phu Nhuan District', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000009'::uuid, 'Xe máy điện VinFast Klara', 'Xe máy điện tiết kiệm, phù hợp di chuyển trong thành phố.', 200000.00, 'Phương tiện di chuyển', 'VinFast', 'Klara S', 'Tốt', 2022, 'Ho Chi Minh City', 'District 2', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000010'::uuid, 'Ván trượt Skateboard', 'Ván trượt thể thao dành cho người mới tập và biểu diễn.', 60000.00, 'Đồ thể thao', 'Element', 'Complete Deck', 'Tốt', 2022, 'Ha Noi', 'Long Bien District', 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=1200&auto=format&fit=crop')
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
            AND u.email = 'khacanh204@gmail.com'
    LIMIT 1
) owner
JOIN categories c ON c.name = s.category_name
ON CONFLICT (id) DO NOTHING;

WITH seed_images (equipment_id, image_url) AS (
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1581091870621-1e9c7d1a7a3d?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000007'::uuid, 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000008'::uuid, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000009'::uuid, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&auto=format&fit=crop'),
        ('20000000-0000-0000-0000-000000000010'::uuid, 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=1200&auto=format&fit=crop')
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