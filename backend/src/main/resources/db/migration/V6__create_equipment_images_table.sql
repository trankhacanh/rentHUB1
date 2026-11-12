CREATE TABLE equipment_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_images_equipment_id
    ON equipment_images (equipment_id);
