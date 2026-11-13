package com.renthub.ai.application;

import com.renthub.ai.dto.AiEquipmentSearchItem;
import com.renthub.ai.dto.AiEquipmentSearchResult;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiEquipmentSearchService {

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_LIMIT = 8;
    private static final int MAX_FILTER_LENGTH = 80;
    private static final int MAX_DESCRIPTION_LENGTH = 320;
    private static final int MAX_MONEY_PRECISION = 15;

    private final EquipmentRepository equipmentRepository;

    public AiEquipmentSearchResult searchAvailableEquipment(
            String keyword,
            String category,
            String city,
            String district,
            BigDecimal minPricePerDay,
            BigDecimal maxPricePerDay,
            Integer requestedLimit
    ) {
        String normalizedKeyword = normalizeFilter(keyword);
        String normalizedCategory = normalizeFilter(category);
        String normalizedCity = normalizeFilter(city);
        String normalizedDistrict = normalizeFilter(district);

        if (!isValidMoney(minPricePerDay) || !isValidMoney(maxPricePerDay)) {
            return invalidResult(
                    "Giá lọc không hợp lệ. Giá phải là số không âm và không vượt quá giới hạn hỗ trợ."
            );
        }

        if (minPricePerDay != null
                && maxPricePerDay != null
                && minPricePerDay.compareTo(maxPricePerDay) > 0) {
            return invalidResult(
                    "Giá tối thiểu đang lớn hơn giá tối đa. Hãy điều chỉnh lại khoảng giá."
            );
        }

        int limit = normalizeLimit(requestedLimit);

        List<Equipment> matchingEquipment = equipmentRepository.searchAvailableForAi(
                normalizedKeyword,
                normalizedCategory,
                normalizedCity,
                normalizedDistrict,
                minPricePerDay,
                maxPricePerDay,
                PageRequest.of(0, limit)
        );

        if (matchingEquipment.isEmpty()) {
            return new AiEquipmentSearchResult(
                    "NO_RESULTS",
                    "Không tìm thấy thiết bị có trạng thái đăng tin AVAILABLE phù hợp với các bộ lọc đã cung cấp. Không được tự tạo sản phẩm hoặc giá thay thế.",
                    0,
                    List.of()
            );
        }

        List<AiEquipmentSearchItem> items = matchingEquipment.stream()
                .map(this::toAiSearchItem)
                .toList();

        return new AiEquipmentSearchResult(
                "SUCCESS",
                "Đây là các thiết bị thực tế lấy từ database RentHub. Giá và tiền đặt cọc là VND. AVAILABLE chỉ là trạng thái đăng tin, không xác nhận thiết bị còn lịch thuê ở một khoảng ngày cụ thể. Không hiển thị ownerId, ownerName, serial number hoặc địa chỉ đường/phường đầy đủ.",
                items.size(),
                items
        );
    }

    private AiEquipmentSearchItem toAiSearchItem(Equipment equipment) {
        return new AiEquipmentSearchItem(
                equipment.getId(),
                cleanText(equipment.getTitle(), 160),
                equipment.getCategory() != null
                        ? cleanText(equipment.getCategory().getName(), 100)
                        : null,
                cleanText(equipment.getBrand(), 100),
                cleanText(equipment.getModel(), 100),
                cleanText(equipment.getDescription(), MAX_DESCRIPTION_LENGTH),
                equipment.getPricePerDay(),
                equipment.getDepositAmount(),
                cleanText(equipment.getCity(), 100),
                cleanText(equipment.getDistrict(), 100),
                cleanText(equipment.getCondition(), 80),
                "AVAILABLE"
        );
    }

    private static String normalizeFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        // Prevent user/model-provided LIKE wildcards from broadening the query.
        String normalized = value.strip()
                .replace('%', ' ')
                .replace('_', ' ')
                .replaceAll("\\s+", " ");

        if (normalized.length() > MAX_FILTER_LENGTH) {
            normalized = normalized.substring(0, MAX_FILTER_LENGTH);
        }

        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private static String cleanText(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        // Listing descriptions are untrusted user content. Strip markup and control
        // whitespace before placing the text in the model context.
        String cleaned = value
                .replaceAll("(?is)<script[^>]*>.*?</script>", " ")
                .replaceAll("(?is)<style[^>]*>.*?</style>", " ")
                .replaceAll("(?s)<[^>]+>", " ")
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ")
                .replaceAll("\\s+", " ")
                .strip();

        if (cleaned.length() > maxLength) {
            return cleaned.substring(0, maxLength - 1).stripTrailing() + "…";
        }

        return StringUtils.hasText(cleaned) ? cleaned : null;
    }

    private static boolean isValidMoney(BigDecimal amount) {
        return amount == null
                || (amount.signum() >= 0
                && amount.precision() <= MAX_MONEY_PRECISION
                && amount.scale() <= 2);
    }

    private static int normalizeLimit(Integer requestedLimit) {
        if (requestedLimit == null) {
            return DEFAULT_LIMIT;
        }

        return Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
    }

    private static AiEquipmentSearchResult invalidResult(String message) {
        return new AiEquipmentSearchResult(
                "INVALID_FILTERS",
                message,
                0,
                List.of()
        );
    }
}
