package com.example.outletmanagement.scheduler;

import com.example.outletmanagement.entity.ProductBatch;
import com.example.outletmanagement.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BatchScheduler {

    private final ProductBatchRepository productBatchRepository;

    /**
     * Runs every day at midnight to mark expired batches
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void markExpiredBatches() {
        log.info("Running scheduled task: markExpiredBatches");
        LocalDate today = LocalDate.now();
        
        int updatedCount = productBatchRepository.updateStatusForExpiredBatches(
                today, 
                ProductBatch.Status.ACTIVE, 
                ProductBatch.Status.EXPIRED
                
    
        );
        
        if (updatedCount > 0) {
            log.info("Successfully marked {} batches as EXPIRED", updatedCount);
        }
    }
}
