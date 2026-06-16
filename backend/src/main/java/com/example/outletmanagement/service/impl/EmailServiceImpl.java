package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Order;
import com.example.outletmanagement.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:admin}")
    private String fromEmail;

    private String getBaseEmailTemplate(String title, String content) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }" +
               "  .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; }" +
               "  .header { background-color: #1a237e; color: #ffffff; padding: 30px 40px; text-align: center; }" +
               "  .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }" +
               "  .content { padding: 40px; color: #333333; line-height: 1.6; font-size: 16px; }" +
               "  .content h2 { color: #1a237e; font-size: 20px; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }" +
               "  .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }" +
               "  .info-table th, .info-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eeeeee; }" +
               "  .info-table th { background-color: #f9f9f9; color: #555555; width: 40%; font-weight: 600; }" +
               "  .info-table td { color: #222222; }" +
               "  .footer { background-color: #f9f9f9; padding: 20px 40px; text-align: center; color: #888888; font-size: 14px; border-top: 1px solid #eeeeee; }" +
               "  .badge-success { background-color: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; }" +
               "  .badge-info { background-color: #e3f2fd; color: #1565c0; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class='email-container'>" +
               "    <div class='header'>" +
               "      <h1>Outlet Management System</h1>" +
               "    </div>" +
               "    <div class='content'>" +
               "      <h2>" + title + "</h2>" +
               content +
               "      <br><p>Best regards,<br><strong>Outlet Management System Team</strong></p>" +
               "    </div>" +
               "    <div class='footer'>" +
               "      &copy; " + java.time.Year.now().getValue() + " Outlet Management System. All rights reserved." +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    @Async
    @Override
    public void sendOrderNotification(Order order) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo("admin@outletmanagement.local"); 
            helper.setFrom("noreply@outletmanagement.local");
            helper.setSubject("New Order Placed: " + order.getOrderNo());
            
            String content = "<p>Hello Admin,</p>" +
                             "<p>A new order has been placed and requires your attention.</p>" +
                             "<table class='info-table'>" +
                             "<tr><th>Order No</th><td><span class='badge-info'>" + order.getOrderNo() + "</span></td></tr>" +
                             "<tr><th>Outlet</th><td>" + order.getOutlet().getOutletName() + "</td></tr>" +
                             "<tr><th>Placed By</th><td>" + order.getUser().getName() + "</td></tr>" +
                             "<tr><th>Date</th><td>" + order.getRequestDate() + "</td></tr>" +
                             "</table>" +
                             "<p>Please review this order in the admin dashboard at your earliest convenience.</p>";
            
            helper.setText(getBaseEmailTemplate("New Order Received", content), true);
            javaMailSender.send(mimeMessage);
            log.info("Order notification email sent successfully for order: {}", order.getOrderNo());
        } catch (Exception e) {
            log.error("Failed to send order notification email for order: {}", order.getOrderNo(), e);
        }
    }

    @Async
    @Override
    public void sendOrderApprovedNotification(Order order) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo("admin@outletmanagement.local"); 
            helper.setFrom("noreply@outletmanagement.local");
            helper.setSubject("Order Approved: " + order.getOrderNo());
            
            String content = "<p>Hello,</p>" +
                             "<p>We are pleased to inform you that your order has been successfully <strong>approved</strong>.</p>" +
                             "<table class='info-table'>" +
                             "<tr><th>Order No</th><td><strong>" + order.getOrderNo() + "</strong></td></tr>" +
                             "<tr><th>Outlet</th><td>" + order.getOutlet().getOutletName() + "</td></tr>" +
                             "<tr><th>Status</th><td><span class='badge-success'>" + order.getStatus().name() + "</span></td></tr>" +
                             "<tr><th>Approved By</th><td>" + order.getApprovedBy() + "</td></tr>" +
                             "</table>" +
                             "<p>Thank you for using the Outlet Management System.</p>";

            helper.setText(getBaseEmailTemplate("Order Approved", content), true);
            javaMailSender.send(mimeMessage);
            log.info("Order approved email sent successfully for order: {}", order.getOrderNo());
        } catch (Exception e) {
            log.error("Failed to send order approved email for order: {}", order.getOrderNo(), e);
        }
    }

    @Async
    @Override
    public void sendUserRegistrationNotification(com.example.outletmanagement.entity.User user) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo(user.getEmail()); 
            helper.setFrom("noreply@outletmanagement.local");
            helper.setSubject("Welcome to Outlet Management System!");
            
            String content = "<p>Hello <strong>" + user.getUsername() + "</strong>,</p>" +
                             "<p>Welcome to the Outlet Management System! We are absolutely thrilled to have you on board.</p>" +
                             "<p>Your account has been successfully created. You can now log in to the system using your registered credentials to start managing your operations efficiently.</p>" +
                             "<div style='text-align: center; margin: 30px 0;'>" +
                             "  <a href='http://localhost:5173' style='background-color: #1a237e; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;'>Go to Dashboard</a>" +
                             "</div>" +
                             "<p>If you have any questions or need assistance, feel free to reach out to our support team.</p>";

            helper.setText(getBaseEmailTemplate("Welcome Aboard!", content), true);
            javaMailSender.send(mimeMessage);
            log.info("User registration email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send user registration email to: {}", user.getEmail(), e);
        }
    }
}
