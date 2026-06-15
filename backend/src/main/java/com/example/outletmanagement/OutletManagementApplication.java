package com.example.outletmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class OutletManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(OutletManagementApplication.class, args);
		System.out.println("Application started successfully");
	}

}