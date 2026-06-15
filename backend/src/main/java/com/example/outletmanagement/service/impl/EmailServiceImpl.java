package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Order;
import com.example.outletmanagement.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:admin}")
    private String fromEmail;

    @Async
    @Override
    public void sendOrderNotification(Order order) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            
            // Note: Since we don't have a specific admin email defined in properties, 
            // and this is Mailtrap sandbox, it will trap all emails anyway.
            // We use a dummy email address here.
            message.setTo("admin@outletmanagement.local"); 
            
            // Set the sender email to whatever mailtrap username or default is
            message.setFrom("noreply@outletmanagement.local");
            
            message.setSubject("New Order Placed: " + order.getOrderNo());
            message.setText("Hello Admin,\n\n" +
                    "A new order has been placed.\n" +
                    "Order No: " + order.getOrderNo() + "\n" +
                    "Outlet: " + order.getOutlet().getOutletName() + "\n" +
                    "Placed By: " + order.getUser().getName() + "\n" +
                    "Date: " + order.getRequestDate() + "\n\n" +
                    "Please review the order in the system.\n\n" +
                    "Best regards,\n" +
                    "Outlet Management System");

            javaMailSender.send(message);
            log.info("Order notification email sent successfully for order: {}", order.getOrderNo());
        } catch (Exception e) {
            log.error("Failed to send order notification email for order: {}", order.getOrderNo(), e);
        }
    }

    @Async
    @Override
    public void sendOrderApprovedNotification(Order order) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            
            message.setTo("admin@outletmanagement.local"); 
            message.setFrom("noreply@outletmanagement.local");
            
            message.setSubject("Order Approved: " + order.getOrderNo());
            message.setText("Hello,\n\n" +
                    "The order has been approved.\n" +
                    "Order No: " + order.getOrderNo() + "\n" +
                    "Outlet: " + order.getOutlet().getOutletName() + "\n" +
                    "Status: " + order.getStatus().name() + "\n" +
                    "Approved By: " + order.getApprovedBy() + "\n\n" +
                    "Best regards,\n" +
                    "Outlet Management System");

            javaMailSender.send(message);
            log.info("Order approved email sent successfully for order: {}", order.getOrderNo());
        } catch (Exception e) {
            log.error("Failed to send order approved email for order: {}", order.getOrderNo(), e);
        }
    }
}
