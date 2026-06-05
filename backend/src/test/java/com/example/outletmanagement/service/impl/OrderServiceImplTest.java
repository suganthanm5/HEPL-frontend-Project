package com.example.outletmanagement.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.example.outletmanagement.entity.Order;
import com.example.outletmanagement.entity.Outlet;
import com.example.outletmanagement.entity.User;
import com.example.outletmanagement.repository.OrderRepository;
import com.example.outletmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @BeforeEach
    public void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetFilteredOrders_OutletManager() {
        // Arrange
        String username = "manager1";
        Pageable pageable = PageRequest.of(0, 10);
        Order.OrderStatus status = Order.OrderStatus.PENDING;
        Long outletId = 2L;

        // Mock SecurityContext
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(username);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Create Outlet Manager
        Outlet outlet = new Outlet();
        outlet.setId(outletId);

        User currentUser = User.builder()
                .id(10L)
                .username(username)
                .role(User.Role.OUTLET_MANAGER)
                .outlet(outlet)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(currentUser));

        Page<Order> expectedPage = new PageImpl<>(Collections.emptyList());
        when(orderRepository.findFilteredOrders(status, outletId, null, null, pageable)).thenReturn(expectedPage);

        // Act
        Page<Order> result = orderService.getFilteredOrders(status, null, null, pageable);

        // Assert
        assertNotNull(result);
        verify(orderRepository).findFilteredOrders(status, outletId, null, null, pageable);
    }
}
