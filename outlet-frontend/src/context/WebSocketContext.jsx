/**
 * WebSocketContext.jsx
 *
 * Provides real-time event data to the entire app via React Context.
 *
 * Exposes:
 *   - isConnected        : boolean — WebSocket connection status
 *   - latestOrder        : last order event received
 *   - latestStockUpdate  : last stock update event received
 *   - latestAlert        : last low-stock alert received
 *   - latestNotification : last generic notification received
 *   - orderEvents        : array of recent order events (last 20)
 *   - alertEvents        : array of recent alert events (last 20)
 *
 * Usage:
 *   const { isConnected, orderEvents, latestAlert } = useWebSocketContext();
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getCookie } from '../utils/cookieUtils';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { subscribe, publish, isConnected, disconnect } = useWebSocket();
  const { role, user } = useAuth();

  const [latestOrder, setLatestOrder] = useState(null);
  const [latestStockUpdate, setLatestStockUpdate] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);
  const [orderEvents, setOrderEvents] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);

  const addToList = (list, setList, event, max = 20) => {
    setList(prev => [event, ...prev].slice(0, max));
  };

  useEffect(() => {
    // ── Orders topic ─────────────────────────────────────────
    const unsubOrders = subscribe('orders', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';
      
      // Admin and Manager see all events. Others see only their own outlet's events.
      const isRelevant = !isUserOrOutletManager || 
                         (event.outletId && String(event.outletId) === String(userOutletId));
      
      if (!isRelevant) return;

      setLatestOrder(event);
      addToList(orderEvents, setOrderEvents, event);

      if (event.type === 'NEW_ORDER') {
        toast(`📦 New order ${event.orderNo} from ${event.outletName}`, {
          icon: '🛒',
          style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc' },
          duration: 5000,
        });
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        const icons = { APPROVED: '✅', REJECTED: '❌', COMPLETED: '🎉', PENDING: '⏳' };
        toast(`${icons[event.status] || '📋'} Order ${event.orderNo} → ${event.status}`, {
          style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc' },
          duration: 4000,
        });
      }
    });

    // ── Stock updates topic ───────────────────────────────────
    const unsubStock = subscribe('stock-updates', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';
      
      const isRelevant = !isUserOrOutletManager || 
                         (event.outletId && String(event.outletId) === String(userOutletId));

      if (!isRelevant) return;

      setLatestStockUpdate(event);
      toast(`📊 Stock updated: ${event.productName} → ${event.newQuantity} units`, {
        icon: '📦',
        style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc' },
        duration: 3500,
      });
    });

    // ── Alerts topic ─────────────────────────────────────────
    const unsubAlerts = subscribe('alerts', (event) => {
      const userOutletId = user?.outletId || getCookie('outletId');
      const isUserOrOutletManager = role === 'USER' || role === 'OUTLET_MANAGER';
      
      const isRelevant = !isUserOrOutletManager || 
                         (event.outletId && String(event.outletId) === String(userOutletId));

      if (!isRelevant) return;

      setLatestAlert(event);
      addToList(alertEvents, setAlertEvents, event);

      if (event.type === 'LOW_STOCK_ALERT') {
        toast.error(`⚠️ Low stock: ${event.productName} has only ${event.quantity} units left!`, {
          duration: 6000,
          style: { borderRadius: '10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
        });
      }
    });

    // ── Notifications topic ───────────────────────────────────
    const unsubNotifs = subscribe('notifications', (event) => {
      setLatestNotification(event);
      toast(event.message, {
        icon: 'ℹ️',
        style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc' },
        duration: 4000,
      });

      // Save to localStorage so they persist in Notification Page
      try {
        const savedNotifs = localStorage.getItem('realtime_notifications');
        const notifsList = savedNotifs ? JSON.parse(savedNotifs) : [];
        
        // Add new notification to the beginning
        const newNotif = {
          id: `realtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: event.type,
          message: event.message,
          timestamp: event.timestamp || new Date().toISOString()
        };
        
        // Keep last 50 notifications
        const updatedList = [newNotif, ...notifsList].slice(0, 50);
        localStorage.setItem('realtime_notifications', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Failed to store realtime notification', err);
      }
    });

    return () => {
      unsubOrders();
      unsubStock();
      unsubAlerts();
      unsubNotifs();
    };
  }, [subscribe, role, user]);

  const value = {
    isConnected,
    publish,
    disconnect,
    latestOrder,
    latestStockUpdate,
    latestAlert,
    latestNotification,
    orderEvents,
    alertEvents,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocketContext must be used inside <WebSocketProvider>');
  return ctx;
}

export default WebSocketContext;
