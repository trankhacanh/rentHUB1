package com.renthub.outbox.service;


import com.renthub.outbox.repository.OutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OutboxTransactionIntegrationTest {

    @Autowired
    private OutboxEventService outboxEventService;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;


    @Test
    void recordEvent_shouldRollbackWhenOuterTransactionRollsBack() {
        UUID aggregateId = UUID.randomUUID();
        UUID eventId;

        TransactionTemplate transactionTemplate =
                new TransactionTemplate(transactionManager);

        eventId = transactionTemplate.execute(status -> {
            UUID recordedId = outboxEventService.recordEvent(
                    "ROLLBACK_TEST",
                    aggregateId,
                    "ROLLBACK_TEST_EVENT",
                    Map.of(
                            "testId", aggregateId.toString(),
                            "message", "This event must be rolled back"
                    )
            );

            // Buộc rollback transaction bên ngoài.
            status.setRollbackOnly();

            return recordedId;
        });

        assertThat(eventId).isNotNull();

        // Transaction đã kết thúc; truy vấn mới kiểm tra dữ liệu thực tế.
        assertThat(outboxEventRepository.existsById(eventId)).isFalse();
    }
}