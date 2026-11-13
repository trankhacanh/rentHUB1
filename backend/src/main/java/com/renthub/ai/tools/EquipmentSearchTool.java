package com.renthub.ai.tools;

import com.renthub.ai.application.AiEquipmentSearchService;
import com.renthub.ai.dto.AiEquipmentSearchResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Exposes the real RentHub equipment search service to the AI model.
 *
 * The tool description emphasizes strict equipment-type matching. Actual
 * database filtering is still performed by AiEquipmentSearchService.
 */
@Component
@RequiredArgsConstructor
public class EquipmentSearchTool {

    private static final Logger log = LoggerFactory.getLogger(EquipmentSearchTool.class);

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_LIMIT = 8;

    private final AiEquipmentSearchService aiEquipmentSearchService;

    @Tool(
            name = "search_available_equipment",
            description = """
                    Tìm kiếm thiết bị thật trong danh sách RentHub có trạng thái đăng tin AVAILABLE.

                    Sử dụng công cụ này khi người dùng muốn tìm, lọc, so sánh hoặc được gợi ý thiết bị
                    theo loại thiết bị, từ khóa, thương hiệu, model, nhu cầu sử dụng, địa điểm hoặc ngân sách.

                    QUY TẮC KHỚP LOẠI THIẾT BỊ (RẤT QUAN TRỌNG):
                    - Khi người dùng nêu rõ một loại thiết bị, PHẢI truyền category tương ứng để lọc.
                    - Ví dụ: người dùng hỏi "máy ảnh" thì category phải là "Máy ảnh" hoặc tên danh mục
                      tương ứng trong RentHub như "Máy ảnh & Cụm camera".
                    - Không xem phụ kiện hoặc thiết bị có liên quan là cùng loại với thiết bị được hỏi.
                      Ví dụ: gimbal, tripod, lens và phụ kiện quay phim không được tự động xem là máy ảnh.
                    - Không mở rộng sang danh mục chung như "Thiết bị điện tử" chỉ để làm tăng số kết quả.
                    - Nếu không tìm thấy thiết bị đúng loại, chấp nhận trả về danh sách rỗng và thông báo
                      không tìm thấy; không thay thế bằng thiết bị gần giống nhưng sai loại.
                    - Chỉ truyền bộ lọc mà người dùng đã nêu hoặc có thể xác định rõ ràng từ câu hỏi.

                    QUY TẮC TỪ KHÓA:
                    - keyword dùng cho tên thiết bị, thương hiệu, model hoặc nhu cầu cụ thể.
                    - Không tự thêm thông số kỹ thuật, thương hiệu hoặc model mà người dùng chưa yêu cầu.
                    - Khi category đã thể hiện loại thiết bị, vẫn nên truyền keyword nếu người dùng có nêu
                      tên/model/thương hiệu cụ thể.

                    Giá thuê và tiền đặt cọc trong kết quả tính bằng VND.
                    Công cụ chỉ tìm danh sách thiết bị; KHÔNG xác nhận lịch thuê còn trống theo ngày
                    và KHÔNG tạo booking hoặc thanh toán.

                    Chỉ sử dụng các bản ghi thực tế mà công cụ trả về. Không tự tạo tên, giá, tiền cọc,
                    tình trạng hoặc địa điểm cho thiết bị.
                    """
    )
    public AiEquipmentSearchResult searchAvailableEquipment(
            @ToolParam(
                    description = """
                            Từ khóa thiết bị, thương hiệu hoặc model mà người dùng yêu cầu.
                            Ví dụ: Canon, Canon EOS R6, máy ảnh.
                            Có thể sử dụng nhu cầu kỹ thuật nếu người dùng nêu rõ.
                            Không tự thêm độ phân giải, tính năng hoặc thông số kỹ thuật chưa được yêu cầu.
                            Có thể bỏ trống nếu người dùng chỉ lọc theo tiêu chí khác.
                            """,
                    required = false
            ) String keyword,

            @ToolParam(
                    description = """
                            Tên hoặc một phần tên danh mục thiết bị cần lọc.
                            Khi người dùng nêu rõ loại thiết bị, hãy truyền danh mục tương ứng thay vì để null.
                            Ví dụ: "Máy ảnh" có thể khớp danh mục "Máy ảnh & Cụm camera".
                            Không chọn danh mục rộng hơn và không gộp phụ kiện vào loại thiết bị chính.
                            Ví dụ: gimbal không phải máy ảnh; tripod không phải máy ảnh.
                            Chỉ để trống khi người dùng thực sự không nêu hoặc không hàm ý loại thiết bị.
                            """,
                    required = false
            ) String category,

            @ToolParam(
                    description = "Thành phố người dùng yêu cầu. Chỉ truyền khi câu hỏi có địa điểm rõ ràng.",
                    required = false
            ) String city,

            @ToolParam(
                    description = "Quận/huyện người dùng yêu cầu. Chỉ truyền khi câu hỏi có địa điểm rõ ràng.",
                    required = false
            ) String district,

            @ToolParam(
                    description = "Giá thuê tối thiểu mỗi ngày tính bằng VND. Chỉ truyền khi người dùng đã nêu rõ mức giá tối thiểu hoặc điều kiện trước đó vẫn đang được tiếp tục. Nếu không có, bắt buộc truyền null.",
                    required = false
            ) BigDecimal minPricePerDay,

            @ToolParam(
                    description = "Giá thuê tối đa mỗi ngày tính bằng VND. Chỉ truyền khi người dùng đã nêu rõ ngân sách tối đa hoặc điều kiện trước đó vẫn đang được tiếp tục. Nếu không có, bắt buộc truyền null. Không tự đặt ngân sách mặc định.",
                    required = false
            ) BigDecimal maxPricePerDay,

            @ToolParam(
                    description = "Số kết quả mong muốn. Hệ thống giới hạn từ 1 đến 8; mặc định 5.",
                    required = false
            ) Integer limit
    ) {
        String normalizedKeyword = normalizeText(keyword);
        String normalizedCategory = normalizeText(category);
        String normalizedCity = normalizeText(city);
        String normalizedDistrict = normalizeText(district);
        Integer normalizedLimit = normalizeLimit(limit);

        log.debug(
                """
                        [AI_TOOL_CALL]
                        Tool: search_available_equipment
                        keyword: {}
                        category: {}
                        city: {}
                        district: {}
                        minPricePerDay: {}
                        maxPricePerDay: {}
                        limit: {}
                        """,
                normalizedKeyword,
                normalizedCategory,
                normalizedCity,
                normalizedDistrict,
                minPricePerDay,
                maxPricePerDay,
                normalizedLimit
        );

        AiEquipmentSearchResult result = aiEquipmentSearchService.searchAvailableEquipment(
                normalizedKeyword,
                normalizedCategory,
                normalizedCity,
                normalizedDistrict,
                minPricePerDay,
                maxPricePerDay,
                normalizedLimit
        );

        log.debug("[AI_TOOL_RESULT] Tool execution completed. Result: {}", result);
        return result;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Integer normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }

    @PostConstruct
    public void logGeneratedToolSchema() {
        try {
            var method = EquipmentSearchTool.class.getMethod(
                    "searchAvailableEquipment",
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    BigDecimal.class,
                    BigDecimal.class,
                    Integer.class
            );

            String schema = JsonSchemaGenerator.generateForMethodInput(method);
            log.info("[AI_TOOL_SCHEMA] search_available_equipment:\n{}", schema);
        } catch (ReflectiveOperationException exception) {
            log.error("Cannot generate EquipmentSearchTool schema", exception);
        }
    }
}
