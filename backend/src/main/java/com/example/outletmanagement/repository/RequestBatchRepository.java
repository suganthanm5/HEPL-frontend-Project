package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.RequestBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestBatchRepository extends JpaRepository<RequestBatch, Long> {
}
