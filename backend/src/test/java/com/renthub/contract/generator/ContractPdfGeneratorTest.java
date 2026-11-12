
package com.renthub.contract.generator;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

//import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

class ContractPdfGeneratorTest {

    private final ContractPdfGenerator generator =
            new ContractPdfGenerator();

    @Test
    void shouldGenerateValidPdfWithVietnameseContent() throws Exception {
        ContractPdfData data = createData(
                "Bên thuê có trách nhiệm bảo quản thiết bị. "
                        + "Bên cho thuê cam kết bàn giao đúng thời hạn."
        );

        byte[] pdfBytes = generator.generate(data);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            assertFalse(document.isEncrypted());
            assertEquals(1, document.getNumberOfPages());

            String extractedText =
                    new PDFTextStripper().getText(document);

            assertTrue(extractedText.contains("HỢP ĐỒNG THUÊ THIẾT BỊ"));
            assertTrue(extractedText.contains("Máy chiếu mini Full HD"));
            assertTrue(extractedText.contains("THÔNG TIN THANH TOÁN"));
            assertTrue(extractedText.contains("Nguyễn Văn An"));
            assertTrue(extractedText.contains("Trần Thị Bình"));
            assertTrue(extractedText.contains("ĐIỀU KHOẢN HỢP ĐỒNG"));
            assertTrue(extractedText.contains("XÁC NHẬN ĐIỆN TỬ"));
            assertTrue(extractedText.contains("Bên thuê"));
        }
    }
    @Test
void shouldConvertSignatureTimestampsToVietnamTime() throws Exception {
    ZonedDateTime renterSignedAt =
            ZonedDateTime.parse("2026-11-02T15:50:29Z");

    ZonedDateTime ownerSignedAt =
            ZonedDateTime.parse("2026-11-02T15:51:08Z");

    ContractPdfData data = createData(
            "Điều khoản kiểm thử múi giờ.",
            renterSignedAt,
            ownerSignedAt
    );

    byte[] pdfBytes = generator.generate(data);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
        String extractedText =
                new PDFTextStripper().getText(document);

        assertTrue(
                extractedText.contains(
                        "02/11/2026 22:50:29 GMT+07:00"
                ),
                "Renter signature must be displayed in GMT+7"
        );

        assertTrue(
                extractedText.contains(
                        "02/11/2026 22:51:08 GMT+07:00"
                ),
                "Owner signature must be displayed in GMT+7"
        );
    }
}
    @Test
    void shouldAutomaticallyCreateMultiplePagesForLongContract()
            throws Exception {

        String longTerms = IntStream.rangeClosed(1, 200)
                .mapToObj(i ->
                        "Dòng điều khoản số " + i
                                + ": Bên thuê có trách nhiệm bảo quản "
                                + "thiết bị và hoàn trả đúng thời hạn."
                )
                .collect(Collectors.joining("\n"));

        ContractPdfData data = createData(longTerms);

        byte[] pdfBytes = generator.generate(data);

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            assertTrue(
                    document.getNumberOfPages() > 1,
                    "Long contract should generate multiple pages"
            );

            String extractedText =
                    new PDFTextStripper().getText(document);

            assertTrue(
                    extractedText.contains("Dòng điều khoản số 200"),
                    "Last contract terms should not be lost"
            );

            assertTrue(
                    extractedText.contains("XÁC NHẬN ĐIỆN TỬ"),
                    "Signature confirmation should be present"
            );
        }
    }

    @Test
    void shouldRejectContractWithoutBothSignatures() {
        assertThrows(
                IllegalArgumentException.class,
                () -> createDataWithoutOwnerSignature()
        );
    }

   private ContractPdfData createData(String terms) {
    ZonedDateTime signedAt =
            ZonedDateTime.parse("2026-11-02T20:58:46+07:00");

    return createData(terms, signedAt, signedAt);
}

private ContractPdfData createData(
        String terms,
        ZonedDateTime renterSignedAt,
        ZonedDateTime ownerSignedAt
) {
    return new ContractPdfData(
            UUID.randomUUID(),
            UUID.randomUUID(),
            1,

            "Máy chiếu mini Full HD",
            LocalDate.of(2026, 11, 5),
            LocalDate.of(2026, 11, 7),
            2,

            new BigDecimal("200000.00"),
            new BigDecimal("400000.00"),
            new BigDecimal("100000.00"),
            new BigDecimal("500000.00"),

            "Nguyễn Văn An",
            "renter@example.com",

            "Trần Thị Bình",
            "owner@example.com",

            terms,

            renterSignedAt,
            ownerSignedAt
    );
}

    private ContractPdfData createDataWithoutOwnerSignature() {
        ZonedDateTime signedAt =
                ZonedDateTime.parse("2026-11-02T20:58:46+07:00");

        return new ContractPdfData(
                UUID.randomUUID(),
                UUID.randomUUID(),
                1,
                "Máy chiếu",
                LocalDate.of(2026, 11, 5),
                LocalDate.of(2026, 11, 7),
                2,
                new BigDecimal("200000"),
                new BigDecimal("400000"),
                BigDecimal.ZERO,
                new BigDecimal("400000"),
                "Nguyễn Văn An",
                "renter@example.com",
                "Trần Thị Bình",
                "owner@example.com",
                "Điều khoản thử nghiệm",
                signedAt,
                null
        );
    }
}
