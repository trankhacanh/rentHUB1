package com.renthub.ai.application;

import com.renthub.ai.knowledge.application.KnowledgeSourceCitation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Adds citations only when the answer explicitly cites a retrieved source.
 * It also suppresses citations for answers that explicitly state that the
 * requested information is not present or cannot be verified from evidence.
 * Model-generated source titles are never trusted.
 */
@Component
public class KnowledgeCitationFormatter {

    private static final Pattern CITATION_PATTERN =
            Pattern.compile("\\[S(\\d+)]");

    /**
     * Conservative guard against a model attaching a retrieved but irrelevant
     * source to an answer that says the information is unavailable.
     */
    private static final Pattern NO_EVIDENCE_PATTERN =
            Pattern.compile(
                    "(?iu)(?:"
                            + "\\b(?:chưa|không)\\s+(?:có|tìm thấy|tìm được|được tìm thấy|được cung cấp|"
                            + "được đề cập|được xác nhận|được xác minh)\\b"
                            + "[^.!?\\n]{0,180}\\b(?:tài liệu|thông tin|nguồn|dữ liệu|chính sách)\\b"
                            + "|\\b(?:tài liệu|thông tin|nguồn|dữ liệu|chính sách)\\b"
                            + "[^.!?\\n]{0,160}\\b(?:không|chưa)\\s+(?:đề cập|xác nhận|xác minh|cung cấp|hỗ trợ)\\b"
                            + "|\\b(?:không|chưa)\\s+(?:đủ|có đủ)\\s+(?:cơ sở|thông tin)\\b"
                            + "|\\bkhông thể\\s+(?:xác nhận|xác minh|kiểm chứng)\\b"
                            + ")"
            );

    public String appendSources(
            String answer,
            List<KnowledgeSourceCitation> sources
    ) {
        String safeAnswer = answer == null ? "" : answer.trim();

        if (sources == null || sources.isEmpty()) {
            return removeAllCitationMarkers(safeAnswer);
        }

        /*
         * If the model says there is no approved evidence for the requested
         * information, remove its citation markers.
         *
         * Example:
         * "RentHub chưa có tài liệu được duyệt để xác minh phí giao hàng. [S1]"
         *
         * In this case, FAQ must not be displayed as a supporting source.
         */
        if (NO_EVIDENCE_PATTERN.matcher(safeAnswer).find()) {
            return removeAllCitationMarkers(safeAnswer);
        }

        safeAnswer = removeUnknownCitationMarkers(safeAnswer, sources);

        List<KnowledgeSourceCitation> selectedSources =
                selectCitedSources(safeAnswer, sources);

        /*
         * Never append all retrieved sources as a fallback.
         * The model must explicitly cite a valid source.
         */
        if (selectedSources.isEmpty()) {
            return safeAnswer;
        }

        StringBuilder footer =
                new StringBuilder("Nguồn tham khảo:");

        for (KnowledgeSourceCitation source : selectedSources) {
            footer.append("\n- ")
                    .append(source.marker())
                    .append(" ")
                    .append(source.displayName());
        }

        if (safeAnswer.isBlank()) {
            return footer.toString();
        }

        return safeAnswer + "\n\n" + footer;
    }

    /**
     * Returns only the footer to append after a completed stream.
     *
     * Note: This method cannot retract an inline [S#] marker that was
     * already sent to the client during streaming.
     */
    public String sourcesFooter(
            String streamedAnswer,
            List<KnowledgeSourceCitation> sources
    ) {
        String originalAnswer =
                streamedAnswer == null ? "" : streamedAnswer.trim();

        String completeAnswer =
                appendSources(originalAnswer, sources);

        String footerSeparator = "\n\nNguồn tham khảo:";

        int footerIndex =
                completeAnswer.lastIndexOf(footerSeparator);

        if (footerIndex >= 0) {
            return completeAnswer.substring(footerIndex + 2);
        }

        if (originalAnswer.isBlank()
                && completeAnswer.startsWith("Nguồn tham khảo:")) {
            return completeAnswer;
        }

        return "";
    }

    /**
     * Sanitize a complete response after streaming has finished.
     */
    public String sanitizeCompletedAnswer(
            String answer,
            List<KnowledgeSourceCitation> sources
    ) {
        return appendSources(answer, sources);
    }

    private String removeAllCitationMarkers(String answer) {
        Matcher matcher = CITATION_PATTERN.matcher(answer);

        return matcher.replaceAll("")
                .replaceAll("[ \\t]{2,}", " ")
                .trim();
    }

    private String removeUnknownCitationMarkers(
            String answer,
            List<KnowledgeSourceCitation> sources
    ) {
        Set<Integer> allowedIndexes = new LinkedHashSet<>();

        for (KnowledgeSourceCitation source : sources) {
            allowedIndexes.add(source.index());
        }

        Matcher matcher = CITATION_PATTERN.matcher(answer);
        StringBuffer sanitized = new StringBuffer();

        while (matcher.find()) {
            boolean allowed;

            try {
                allowed = allowedIndexes.contains(
                        Integer.parseInt(matcher.group(1))
                );
            } catch (NumberFormatException ignored) {
                allowed = false;
            }

            matcher.appendReplacement(
                    sanitized,
                    allowed
                            ? Matcher.quoteReplacement(matcher.group())
                            : ""
            );
        }

        matcher.appendTail(sanitized);

        return sanitized.toString().trim();
    }

    private List<KnowledgeSourceCitation> selectCitedSources(
            String answer,
            List<KnowledgeSourceCitation> sources
    ) {
        Set<Integer> referencedIndexes = new LinkedHashSet<>();

        Matcher matcher = CITATION_PATTERN.matcher(answer);

        while (matcher.find()) {
            try {
                referencedIndexes.add(
                        Integer.parseInt(matcher.group(1))
                );
            } catch (NumberFormatException ignored) {
                // Ignore malformed citation markers.
            }
        }

        if (referencedIndexes.isEmpty()) {
            return List.of();
        }

        List<KnowledgeSourceCitation> selectedSources =
                new ArrayList<>();

        for (KnowledgeSourceCitation source : sources) {
            if (referencedIndexes.contains(source.index())) {
                selectedSources.add(source);
            }
        }

        return selectedSources;
    }
}