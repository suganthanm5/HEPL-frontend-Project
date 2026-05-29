package com.example.outletmanagement.websocket;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Central service to push real-time events to all connected frontend clients via Socket.IO.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketEventPublisher {

    private final SocketIOServer socketIOServer;

    // ── Stock Updated ────────────────────────────────────────
    public void publishStockUpdate(Long outletId, Long productId, int newQuantity, String productName) {
        Map<String, Object> payload = Map.of(
                "type", "STOCK_UPDATE",
                "outletId", outletId,
                "productId", productId,
                "productName", productName,
                "newQuantity", newQuantity,
                "timestamp", LocalDateTime.now().toString()
        );
        socketIOServer.getBroadcastOperations().sendEvent("stock-updates", payload);
        log.info("Socket.IO published STOCK_UPDATE: product={} qty={}", productName, newQuantity);
    }

    // ── New Order Created ────────────────────────────────────
    public void publishNewOrder(Long orderId, String orderNo, Long outletId, String outletName, String status) {
        Map<String, Object> payload = Map.of(
                "type", "NEW_ORDER",
                "orderId", orderId,
                "orderNo", orderNo,
                "outletId", outletId,
                "outletName", outletName,
                "status", status,
                "timestamp", LocalDateTime.now().toString()
        );
        socketIOServer.getBroadcastOperations().sendEvent("orders", payload);
        log.info("Socket.IO published NEW_ORDER: orderId={} outlet={}", orderId, outletName);
    }

    // ── Order Status Changed ─────────────────────────────────
    public void publishOrderStatusChange(Long orderId, String orderNo, Long outletId, String outletName, String newStatus) {
        Map<String, Object> payload = Map.of(
                "type", "ORDER_STATUS_CHANGED",
                "orderId", orderId,
                "orderNo", orderNo,
                "outletId", outletId,
                "outletName", outletName,
                "status", newStatus,
                "timestamp", LocalDateTime.now().toString()
        );
        socketIOServer.getBroadcastOperations().sendEvent("orders", payload);
        log.info("Socket.IO published ORDER_STATUS_CHANGED: orderId={} status={}", orderId, newStatus);
    }

    // ── Low Stock Alert ──────────────────────────────────────
    public void publishLowStockAlert(String productName, int quantity, Long outletId) {
        Map<String, Object> payload = Map.of(
                "type", "LOW_STOCK_ALERT",
                "productName", productName,
                "quantity", quantity,
                "outletId", outletId,
                "timestamp", LocalDateTime.now().toString()
        );
        socketIOServer.getBroadcastOperations().sendEvent("alerts", payload);
        log.info("Socket.IO published LOW_STOCK_ALERT: product={} qty={}", productName, quantity);
    }

    // ── Generic Notification ─────────────────────────────────
    public void publishNotification(String message, String type) {
        Map<String, Object> payload = Map.of(
                "type", type != null ? type : "INFO",
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        );
        socketIOServer.getBroadcastOperations().sendEvent("notifications", payload);
        log.info("Socket.IO published NOTIFICATION: {}", message);
    }
}
