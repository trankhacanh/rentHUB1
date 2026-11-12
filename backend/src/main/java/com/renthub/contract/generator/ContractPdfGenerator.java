
package com.renthub.contract.generator;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.time.ZoneId;
@Component
@Slf4j
public class ContractPdfGenerator {
    private static final ZoneId VIETNAM_ZONE =
        ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String REGULAR_FONT =
            "fonts/NotoSans-Regular.ttf";

    private static final String BOLD_FONT =
            "fonts/NotoSans-Bold.ttf";

    private static final Locale VIETNAMESE =
            Locale.forLanguageTag("vi-VN");

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", VIETNAMESE);

    private static final DateTimeFormatter DATE_TIME_FORMAT =
        DateTimeFormatter.ofPattern(
                "dd/MM/yyyy HH:mm:ss 'GMT'XXX",
                VIETNAMESE
        );

    private static final float MARGIN = 48f;
    private static final float BODY_FONT_SIZE = 10.5f;
    private static final float BODY_LEADING = 16f;

    public byte[] generate(ContractPdfData data) {
        if (data == null) {
            throw new IllegalArgumentException("Contract PDF data is required");
        }

        try (
                PDDocument document = new PDDocument();
                ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            PDFont regularFont;
            PDFont boldFont;

            try (InputStream input =
                         new ClassPathResource(REGULAR_FONT).getInputStream()) {
                regularFont = PDType0Font.load(document, input);
            }

            try (InputStream input =
                         new ClassPathResource(BOLD_FONT).getInputStream()) {
                boldFont = PDType0Font.load(document, input);
            }

            document.getDocumentInformation().setTitle(
                    "Contract " + data.contractId()
            );

            document.getDocumentInformation().setSubject(
                    "RentHub Electronic Rental Contract"
            );

            try (PdfPageWriter writer =
                         new PdfPageWriter(document, regularFont, boldFont)) {

                writeDocument(writer, data);
            }

            document.save(output);

            byte[] result = output.toByteArray();

            log.info(
                    "Generated contract PDF: contractId={}, version={}, size={}",
                    data.contractId(),
                    data.versionNumber(),
                    result.length
            );

            return result;

        } catch (IOException exception) {
            log.error(
                    "Failed to generate PDF for contract {}",
                    data.contractId(),
                    exception
            );

            throw new IllegalStateException(
                    "Failed to generate contract PDF",
                    exception
            );
        }
    }

    private void writeDocument(
            PdfPageWriter writer,
            ContractPdfData data
    ) throws IOException {

        writer.writeTitle("HỢP ĐỒNG THUÊ THIẾT BỊ");

        writer.writeParagraph(
                "Mã hợp đồng: " + data.contractId()
        );

        writer.writeParagraph(
                "Mã phiên bản: " + data.contractVersionId()
                        + " (Version " + data.versionNumber() + ")"
        );

        writer.writeSection("I. THÔNG TIN THIẾT BỊ");

        writer.writeParagraph(
                "Tên thiết bị: " + data.equipmentTitle()
        );

        writer.writeParagraph(
                "Ngày bắt đầu thuê: " + DATE_FORMAT.format(data.startDate())
        );

        writer.writeParagraph(
                "Ngày kết thúc thuê: " + DATE_FORMAT.format(data.endDate())
        );

        writer.writeParagraph(
                "Tổng số ngày thuê: " + data.totalDays()
        );

        writer.writeSection("II. THÔNG TIN THANH TOÁN");

        writer.writeParagraph(
                "Đơn giá thuê mỗi ngày: " + formatMoney(data.pricePerDay())
        );

        writer.writeParagraph(
                "Tiền thuê: " + formatMoney(data.rentalAmount())
        );

        writer.writeParagraph(
                "Tiền đặt cọc: " + formatMoney(data.depositAmount())
        );

        writer.writeParagraph(
                "Tổng số tiền: " + formatMoney(data.totalAmount())
        );

        writer.writeSection("III. THÔNG TIN CÁC BÊN");

        writer.writeParagraph(
                "BÊN THUÊ (RENTER)"
        );

        writer.writeParagraph(
                "Họ và tên: " + valueOrDefault(data.renterName())
        );

        writer.writeParagraph(
                "Email: " + valueOrDefault(data.renterEmail())
        );

        writer.writeParagraph(
                "BÊN CHO THUÊ (OWNER)"
        );

        writer.writeParagraph(
                "Họ và tên: " + valueOrDefault(data.ownerName())
        );

        writer.writeParagraph(
                "Email: " + valueOrDefault(data.ownerEmail())
        );

        writer.writeSection("IV. ĐIỀU KHOẢN HỢP ĐỒNG");

        writer.writeParagraph(
                valueOrDefault(data.terms())
        );

        writer.writeSection("V. XÁC NHẬN ĐIỆN TỬ");

        writer.writeParagraph(
                "Bên thuê: " + valueOrDefault(data.renterName())
        );

        writer.writeParagraph(
                "Thời điểm xác nhận: "
                        + DATE_TIME_FORMAT.format(
        data.renterSignedAt().withZoneSameInstant(VIETNAM_ZONE)
)
        );

        writer.writeParagraph(
                "Bên cho thuê: " + valueOrDefault(data.ownerName())
        );

        writer.writeParagraph(
                "Thời điểm xác nhận: "
                        + DATE_TIME_FORMAT.format(
        data.ownerSignedAt().withZoneSameInstant(VIETNAM_ZONE)
)
        );

        writer.writeParagraph(
                "Hai bên đã xác nhận hợp đồng thông qua tài khoản RentHub. "
                        + "Các thời điểm trên là thời điểm xác nhận được hệ thống ghi nhận, "
                        + "không phải chứng thư chữ ký số."
        );
    }

    private String formatMoney(BigDecimal amount) {
        NumberFormat formatter =
                NumberFormat.getNumberInstance(VIETNAMESE);

        formatter.setMinimumFractionDigits(0);
        formatter.setMaximumFractionDigits(2);

        return formatter.format(amount) + " VND";
    }

    private String valueOrDefault(String value) {
        return value == null || value.isBlank()
                ? "Chưa cung cấp"
                : value;
    }

    private static class PdfPageWriter implements AutoCloseable {

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;

        private PDPageContentStream contentStream;

        private float cursorY;

        private final float pageWidth = PDRectangle.A4.getWidth();

        private final float contentWidth =
                PDRectangle.A4.getWidth() - 2 * MARGIN;

        private PdfPageWriter(
                PDDocument document,
                PDFont regularFont,
                PDFont boldFont
        ) throws IOException {
            this.document = document;
            this.regularFont = regularFont;
            this.boldFont = boldFont;

            newPage();
        }

        private void newPage() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }

            PDPage page = new PDPage(PDRectangle.A4);

            document.addPage(page);

            contentStream = new PDPageContentStream(
                    document,
                    page
            );

            cursorY = page.getMediaBox().getHeight() - MARGIN;
        }

        private void ensureSpace(float requiredHeight)
                throws IOException {

            if (cursorY - requiredHeight < MARGIN) {
                newPage();
            }
        }

        private void writeTitle(String text) throws IOException {
            float fontSize = 18f;

            ensureSpace(36f);

            float textWidth =
                    boldFont.getStringWidth(text) * fontSize / 1000f;

            float x = (pageWidth - textWidth) / 2f;

            contentStream.beginText();
            contentStream.setFont(boldFont, fontSize);
            contentStream.newLineAtOffset(x, cursorY);
            contentStream.showText(text);
            contentStream.endText();

            cursorY -= 35f;
        }

        private void writeSection(String title) throws IOException {
            ensureSpace(32f);

            writeLine(title, boldFont, 12f, 19f);

            contentStream.moveTo(MARGIN, cursorY + 5f);
            contentStream.lineTo(pageWidth - MARGIN, cursorY + 5f);
            contentStream.stroke();

            cursorY -= 8f;
        }

        private void writeParagraph(String text) throws IOException {
            if (text == null || text.isBlank()) {
                cursorY -= 5f;
                return;
            }

            String[] paragraphs = text
                    .replace("\r\n", "\n")
                    .replace('\r', '\n')
                    .split("\n", -1);

            for (String paragraph : paragraphs) {
                if (paragraph.isBlank()) {
                    cursorY -= BODY_LEADING;
                    continue;
                }

                List<String> lines = wrapText(paragraph);

                for (String line : lines) {
                    writeLine(
                            line,
                            regularFont,
                            BODY_FONT_SIZE,
                            BODY_LEADING
                    );
                }
            }

            cursorY -= 3f;
        }

        private List<String> wrapText(String text) throws IOException {
            List<String> lines = new ArrayList<>();

            StringBuilder currentLine = new StringBuilder();

            for (String word : text.trim().split("\\s+")) {
                String candidate = currentLine.isEmpty()
                        ? word
                        : currentLine + " " + word;

                float width = regularFont.getStringWidth(candidate)
                        * BODY_FONT_SIZE / 1000f;

                if (width <= contentWidth) {
                    currentLine.setLength(0);
                    currentLine.append(candidate);
                } else {
                    if (!currentLine.isEmpty()) {
                        lines.add(currentLine.toString());
                    }

                    currentLine.setLength(0);
                    currentLine.append(word);
                }
            }

            if (!currentLine.isEmpty()) {
                lines.add(currentLine.toString());
            }

            return lines;
        }

        private void writeLine(
                String text,
                PDFont font,
                float fontSize,
                float leading
        ) throws IOException {

            ensureSpace(leading + 2f);

            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(MARGIN, cursorY);
            contentStream.showText(text);
            contentStream.endText();

            cursorY -= leading;
        }

        @Override
        public void close() throws IOException {
            if (contentStream != null) {
                contentStream.close();
                contentStream = null;
            }
        }
    }
}
