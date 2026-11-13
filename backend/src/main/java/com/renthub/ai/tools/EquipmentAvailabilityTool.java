package com.renthub.ai.tools;

import com.renthub.ai.dto.AiEquipmentAvailabilityResult;
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
 * Read-only AI adapter over the existing BookingService availability rule.
 * This class does not query booking tables directly and never creates a
 * booking.
 */
@Component
@RequiredArgsConstructor
public class EquipmentAvailabilityTool {

        private static final Logger log = LoggerFactory.getLogger(EquipmentAvailabilityTool.class);

        private final BookingService bookingService;

        @Tool(name = "check_equipment_availability", description = "Kiểm tra một thiết bị RentHub có còn trống trong một khoảng ngày cụ thể hay không. "
                        +
                        "BẮT BUỘC phải có equipmentId lấy từ kết quả search_available_equipment và cả startDate, endDate. "
                        +
                        "Ngày phải ở định dạng ISO yyyy-MM-dd. Không được gọi tool này nếu người dùng chưa cung cấp đủ hai ngày; "
                        +
                        "hãy hỏi lại ngày còn thiếu. endDate là ngày kết thúc KHÔNG bao gồm trong khoảng thuê theo quy tắc BookingService. "
                        +
                        "Tool chỉ kiểm tra, tuyệt đối không tạo hoặc thay đổi booking. " +
                        "AVAILABLE của tin đăng không thay thế kết quả kiểm tra lịch này.")

        public AiEquipmentAvailabilityResult checkEquipmentAvailability(

                        @ToolParam(description = "UUID thiết bị lấy chính xác từ kết quả search_available_equipment; không tự đoán hoặc tự tạo ID.") String equipmentId,
                        @ToolParam(description = "Ngày bắt đầu thuê theo định dạng ISO yyyy-MM-dd, do người dùng cung cấp hoặc đã xác định rõ trong hội thoại.") String startDate,
                        @ToolParam(description = "Ngày kết thúc thuê theo định dạng ISO yyyy-MM-dd. Theo BookingService, ngày này không được tính vào số ngày thuê.") String endDate) {
                log.debug(
                                "[AI_AVAILABILITY_CALL] equipmentId={}, startDate={}, endDate={}",
                                equipmentId,
                                startDate,
                                endDate);
                UUID parsedEquipmentId;
                LocalDate parsedStartDate;
                LocalDate parsedEndDate;

                try {
                        parsedEquipmentId = UUID.fromString(requireText(equipmentId, "equipmentId"));
                        parsedStartDate = LocalDate.parse(requireText(startDate, "startDate"));
                        parsedEndDate = LocalDate.parse(requireText(endDate, "endDate"));
                } catch (IllegalArgumentException | DateTimeParseException ex) {
                        return new AiEquipmentAvailabilityResult(
                                        "INVALID_INPUT",
                                        null,
                                        null,
                                        null,
                                        null,
                                        "Không thể kiểm tra lịch thuê vì ID hoặc ngày không hợp lệ. " +
                                                        "Hãy sử dụng UUID hợp lệ và ngày theo định dạng yyyy-MM-dd.");
                }

                try {
                        boolean available = bookingService.checkAvailability(
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate);

                        String message = available
                                        ? "BookingService xác nhận thiết bị không có booking chặn lịch trong khoảng ngày đã yêu cầu và tin đăng đang ở trạng thái AVAILABLE."
                                        : "BookingService xác nhận thiết bị không khả dụng trong khoảng ngày đã yêu cầu. "
                                                        +
                                                        "Kết quả false có thể do tin đăng không còn AVAILABLE hoặc có booking trùng lịch; "
                                                        +
                                                        "không được tự suy đoán nguyên nhân cụ thể.";

                        log.debug(
                                        "[AI_AVAILABILITY_RESULT] equipmentId={}, startDate={}, endDate={}, available={}",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        available);

                        return new AiEquipmentAvailabilityResult(
                                        "SUCCESS",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        available,
                                        message);
                } catch (IllegalArgumentException ex) {
                        // BookingService uses IllegalArgumentException for invalid dates and missing
                        // equipment.
                        log.warn(
                                        "[AI_AVAILABILITY_REJECTED] equipmentId={}, reason={}",
                                        parsedEquipmentId,
                                        ex.getMessage());
                        return new AiEquipmentAvailabilityResult(
                                        "INVALID_REQUEST",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        null,
                                        "Không thể xác minh lịch thuê. Vui lòng kiểm tra lại thiết bị và khoảng ngày yêu cầu.");
                } catch (RuntimeException ex) {
                        log.error(
                                        "[AI_AVAILABILITY_ERROR] equipmentId={}, startDate={}, endDate={}",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        ex);
                        return new AiEquipmentAvailabilityResult(
                                        "ERROR",
                                        parsedEquipmentId,
                                        parsedStartDate,
                                        parsedEndDate,
                                        null,
                                        "Hệ thống hiện chưa thể kiểm tra lịch thuê. Không được kết luận thiết bị còn trống.");
                }
        }

        private String requireText(String value, String fieldName) {
                if (value == null || value.isBlank()) {
                        throw new IllegalArgumentException(fieldName + " is required");
                }
                return value.trim();
        }
}
