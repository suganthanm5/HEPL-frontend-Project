package com.example.outletmanagement.config;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
        private final DivisionRepository divisionRepository;
        private final ProductRepository productRepository;
        private final LocationRepository locationRepository;
        private final OutletRepository outletRepository;
        private final OutletDivisionProductRepository mappingRepository;
        private final JdbcTemplate jdbcTemplate;

        @Override
        public void run(String... args) throws Exception {
                // Ensure profile_picture column exists in users table
                try {
                        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255)");
                        log.info("Successfully added profile_picture column to users table");
                } catch (Exception e) {
                        log.debug("Could not add profile_picture column (it may already exist): " + e.getMessage());
                }

                try {
                        if (divisionRepository.count() == 0) {
                                log.info("Initializing divisions...");
                                initializeDivisions();
                                log.info("Divisions initialized successfully");
                        }
                        if (locationRepository.count() == 0) {
                                log.info("Initializing locations...");
                                initializeLocations();
                                log.info("Locations initialized successfully");
                        }
                        if (outletRepository.count() == 0) {
                                log.info("Initializing outlets...");
                                initializeOutlets();
                                log.info("Outlets initialized successfully");
                        }
                } catch (Exception e) {
                        log.error("Error initializing data: ", e);
                }
        }

        private void initializeDivisions() {
                Division division1 = Division.builder()
                                .name("Electronics")
                                .build();
                Division division2 = Division.builder()
                                .name("Clothing")
                                .build();
                Division division3 = Division.builder()
                                .name("Home & Kitchen")
                                .build();

                divisionRepository.save(division1);
                divisionRepository.save(division2);
                divisionRepository.save(division3);

                Product product1 = Product.builder()
                                .name("Laptop")
                                .productCode("ELEC-001")
                                .uimPrice(new BigDecimal("50000"))
                                .mrp(new BigDecimal("65000"))
                                .sellingPrice(new BigDecimal("60000"))
                                .purchasePrice(new BigDecimal("48000"))
                                .division(division1)
                                .build();

                Product product2 = Product.builder()
                                .name("Smartphone")
                                .productCode("ELEC-002")
                                .uimPrice(new BigDecimal("20000"))
                                .mrp(new BigDecimal("25000"))
                                .sellingPrice(new BigDecimal("23000"))
                                .purchasePrice(new BigDecimal("19000"))
                                .division(division1)
                                .build();

                Product product3 = Product.builder()
                                .name("T-Shirt")
                                .productCode("CLOTH-001")
                                .uimPrice(new BigDecimal("300"))
                                .mrp(new BigDecimal("500"))
                                .sellingPrice(new BigDecimal("450"))
                                .purchasePrice(new BigDecimal("250"))
                                .division(division2)
                                .build();

                Product product4 = Product.builder()
                                .name("Jeans")
                                .productCode("CLOTH-002")
                                .uimPrice(new BigDecimal("800"))
                                .mrp(new BigDecimal("1200"))
                                .sellingPrice(new BigDecimal("1000"))
                                .purchasePrice(new BigDecimal("700"))
                                .division(division2)
                                .build();

                Product product5 = Product.builder()
                                .name("Microwave Oven")
                                .productCode("HOME-001")
                                .uimPrice(new BigDecimal("8000"))
                                .mrp(new BigDecimal("12000"))
                                .sellingPrice(new BigDecimal("10000"))
                                .purchasePrice(new BigDecimal("7500"))
                                .division(division3)
                                .build();

                Product product6 = Product.builder()
                                .name("Cookware Set")
                                .productCode("HOME-002")
                                .uimPrice(new BigDecimal("2000"))
                                .mrp(new BigDecimal("3500"))
                                .sellingPrice(new BigDecimal("3000"))
                                .purchasePrice(new BigDecimal("1800"))
                                .division(division3)
                                .build();

                productRepository.save(product1);
                productRepository.save(product2);
                productRepository.save(product3);
                productRepository.save(product4);
                productRepository.save(product5);
                productRepository.save(product6);
        }

        private void initializeLocations() {
                Location location1 = Location.builder()
                                .name("New York")
                                .state("NY")
                                .city("New York")
                                .build();

                Location location2 = Location.builder()
                                .name("Los Angeles")
                                .state("CA")
                                .city("Los Angeles")
                                .build();

                Location location3 = Location.builder()
                                .name("Chicago")
                                .state("IL")
                                .city("Chicago")
                                .build();

                locationRepository.save(location1);
                locationRepository.save(location2);
                locationRepository.save(location3);
        }

        private void initializeOutlets() {
                java.util.List<Location> locations = locationRepository.findAll();
                if (locations.isEmpty()) {
                        log.warn("No locations found, skipping outlet initialization");
                        return;
                }

                Location location1 = locations.get(0);
                Location location2 = locations.size() > 1 ? locations.get(1) : location1;
                Location location3 = locations.size() > 2 ? locations.get(2) : location1;

                Outlet outlet1 = Outlet.builder()
                                .outletName("Tech Store NYC")
                                .outletCode("OUT-001")
                                .outletType("Premium")
                                .ownerName("John Doe")
                                .address("123 Main St, New York, NY 10001")
                                .location(location1)
                                .build();

                Outlet outlet2 = Outlet.builder()
                                .outletName("Fashion Hub LA")
                                .outletCode("OUT-002")
                                .outletType("Standard")
                                .ownerName("Jane Smith")
                                .address("456 Fashion Ave, Los Angeles, CA 90001")
                                .location(location2)
                                .build();

                Outlet outlet3 = Outlet.builder()
                                .outletName("Home Essentials Chicago")
                                .outletCode("OUT-003")
                                .outletType("Standard")
                                .ownerName("Mike Johnson")
                                .address("789 Home St, Chicago, IL 60601")
                                .location(location3)
                                .build();

                outletRepository.save(outlet1);
                outletRepository.save(outlet2);
                outletRepository.save(outlet3);

                java.util.List<Division> divisions = divisionRepository.findAll();
                java.util.List<Product> products = productRepository.findAll();

                if (divisions.isEmpty() || products.isEmpty()) {
                        log.warn("No divisions or products found, skipping mappings");
                        return;
                }

                Division division1 = divisions.get(0);
                Division division2 = divisions.size() > 1 ? divisions.get(1) : division1;
                Division division3 = divisions.size() > 2 ? divisions.get(2) : division1;

                Product product1 = products.get(0);
                Product product2 = products.size() > 1 ? products.get(1) : product1;
                Product product3 = products.size() > 2 ? products.get(2) : product1;
                Product product4 = products.size() > 3 ? products.get(3) : product1;
                Product product5 = products.size() > 4 ? products.get(4) : product1;
                Product product6 = products.size() > 5 ? products.get(5) : product1;

                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet1)
                                .division(division1)
                                .product(product1)
                                .build());
                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet1)
                                .division(division1)
                                .product(product2)
                                .build());

                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet2)
                                .division(division2)
                                .product(product3)
                                .build());
                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet2)
                                .division(division2)
                                .product(product4)
                                .build());

                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet3)
                                .division(division3)
                                .product(product5)
                                .build());
                mappingRepository.save(OutletDivisionProduct.builder()
                                .outlet(outlet3)
                                .division(division3)
                                .product(product6)
                                .build());
        }
}
