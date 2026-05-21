package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM users WHERE username = :username", nativeQuery = true)
    Long existsByUsernameAll(String username);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM users WHERE email = :email", nativeQuery = true)
    Long existsByEmailAll(String email);
}
