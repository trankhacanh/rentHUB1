package com.renthub.equipment.repository;

import com.renthub.equipment.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
}