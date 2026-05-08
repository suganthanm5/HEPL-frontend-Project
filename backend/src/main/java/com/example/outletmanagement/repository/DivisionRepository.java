package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.entity.Division;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Long>, JpaSpecificationExecutor<Division> {

}
