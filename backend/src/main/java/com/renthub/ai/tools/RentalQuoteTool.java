package com.renthub.ai.tools;

import com.renthub.ai.dto.AiRentalQuoteResult;
import com.renthub.booking.dto.RentalQuotePreview;
import com.renthub.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.UUID;

/**
 * Read-only quote tool.
 *
 * It delegates all availability and pricing rules to BookingService.
 * It never creates, updates, or reserves a booking and never initiates payment.
 */
@Component
@RequiredArgsConstructor
public class RentalQuoteTool {

        private static final Logger log = LoggerFactory.getLogger(RentalQuoteTool.class);

        private final BookingService bookingService;

        @Tool(name = "calculate_rental_quote", description = """
                        Tính báo giá thuê thiết bị RentHub theo ngày bằng logic backend.
                        Chỉ gọi sau khi đã lấy equipmentId chính xác từ kết quả
                        search_available_equipment.
                        Người dùng phải cung cấp ngày bắt đầu và ngày kết thúc.
                        Hai ngày phải ở định dạng yyyy-MM-dd.
                        Công cụ tự kiểm tra lịch thuê qua BookingService và tính
                        tiền thuê, tiền đặt cọc, tổng chi phí dự kiến.
                        Không tự tính tiền bằng LLM.
                        Công cụ chỉ xem trước báo giá; không tạo booking, không giữ chỗ,
                        không thanh toán và không đảm bảo thiết bị còn trống ở thời điểm đặt.
                        endDate không được tính vào số ngày thuê theo quy tắc RentHub hiện tại.
                        """)
        public AiRentalQuoteResult calculateRentalQuote(
                        @ToolParam(description = "UUID chính xác của thiết bị lấy từ kết quả search_available_equipment. Không tự tạo hoặc đoán UUID.", required = true) String equipmentId,

                        @ToolParam(description = "Ngày bắt đầu thuê theo định dạng yyyy-MM-dd. Phải do người dùng cung cấp hoặc đã xác định rõ trong ngữ cảnh hiện tại.", required = true) String startDate,

                        @ToolParam(description = "Ngày kết thúc thuê theo định dạng yyyy-MM-dd. Phải do người dùng cung cấp; ngày này không được tính vào số ngày thuê.", required = true) String endDate) {
                log.debug(
                                "[AI_RENTAL_QUOTE_CALL] equipmentId={}, startDate={}, endDate={}",
                                equipmentId,
                                startDate,
                                endDate);

                final UUID parsedEquipmentId;
                final LocalDate parsedStartDate;
                final LocalDate parsedEndDate;

                try {
                        parsedEquipmentId = UUID.fromString(requireText(equipmentId, "equipmentId"));
                        parsedStartDate = LocalDate.parse(requireText(startDate, "startDate"));
                        parsedEndDate = LocalDate.parse(requireText(endDate, "endDate"));
                } catch (IllegalArgumentException | DateTimeParseException exception) {
                        log.debug(
                                        "[AI_RENTAL_QUOTE_INVALID_INPUT] exceptionType={}",
                                        exception.getClass().getSimpleName());
                        return AiRentalQuoteResult.invalidRequest(
                                        "Mã thiết bị hoặc ngày không hợp lệ. Hãy kiểm tra UUID và sử dụng định dạng ngày yyyy-MM-dd.");
                }

                try {
                        RentalQuotePreview quote = bookingService.previewQuote(
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate);

                        String status = quote.available() ? "SUCCESS" : "NOT_AVAILABLE";
                        String message = quote.available()
                                        ? "Đã tính báo giá dự kiến từ dữ liệu hiện tại của RentHub. Chưa tạo booking hoặc giữ chỗ."
                                        : "Thiết bị hiện không còn trống lịch trong khoảng ngày yêu cầu. Số tiền bên dưới chỉ là ước tính tham khảo, không phải xác nhận có thể đặt thuê.";

                        AiRentalQuoteResult result = new AiRentalQuoteResult(
                                        status,
                                        message,
                                        quote.equipmentId(),
                                        quote.equipmentTitle(),
                                        quote.startDate(),
                                        quote.endDate(),
                                        quote.totalDays(),
                                        quote.pricePerDay(),
                                        quote.rentalAmount(),
                                        quote.depositAmount(),
                                        quote.estimatedTotal(),
                                        quote.available());

                        log.debug(
                                        "[AI_RENTAL_QUOTE_RESULT] status={}, equipmentId={}, totalDays={}, rentalAmountVnd={}, depositAmountVnd={}, estimatedTotalVnd={}, available={}",
                                        result.status(),
                                        result.equipmentId(),
                                        result.totalDays(),
                                        result.rentalAmountVnd(),
                                        result.depositAmountVnd(),
                                        result.estimatedTotalVnd(),
                                        result.available());

                        return result;
                } catch (IllegalArgumentException exception) {
                        log.debug(
                                        "[AI_RENTAL_QUOTE_REJECTED] equipmentId={}, reason={}",
                                        parsedEquipmentId,
                                        exception.getMessage());

                        if ("Equipment not found".equals(exception.getMessage())) {
                                return AiRentalQuoteResult.notFound(
                                                "Không tìm thấy thiết bị với mã đã cung cấp.");
                        }

                        return AiRentalQuoteResult.invalidRequest(
                                        "Không thể tính báo giá. Hãy kiểm tra thiết bị và khoảng ngày thuê; ngày kết thúc phải sau ngày bắt đầu và ngày bắt đầu không được ở quá khứ.");
                } catch (RuntimeException exception) {
                        log.error(
                                        "[AI_RENTAL_QUOTE_ERROR] equipmentId={}, startDate={}, endDate={}",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        exception);

                        return AiRentalQuoteResult.error(
                                        "Hệ thống hiện chưa thể tính báo giá. Vui lòng thử lại sau; không thể xác nhận chi phí ở thời điểm này.");
                }
        }

        private String requireText(String value, String fieldName) {
                if (value == null || value.isBlank()) {
                        throw new IllegalArgumentException(fieldName + " is required");
                }
                return value.trim();
        }
}
