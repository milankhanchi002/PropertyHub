import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(token) {
    if (this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Create WebSocket connection
      const socket = new SockJS('http://localhost:8080/ws');
      
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },
        debug: (str) => {
          console.log('WebSocket Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('Connected to WebSocket: ' + frame);
        this.connected = true;
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('WebSocket Error:', frame);
        this.connected = false;
        reject(frame);
      };

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
    }
  }

  subscribeToVisitChat(visitId, callback) {
    if (!this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const topic = `/topic/visit/${visitId}`;
    
    // Unsubscribe from previous subscription if exists
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const chatMessage = JSON.parse(message.body);
        callback(chatMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.subscriptions.set(topic, subscription);
    return subscription;
  }

  subscribeToLeaseChat(leaseId, callback) {
    if (!this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const topic = `/topic/lease/${leaseId}`;
    
    // Unsubscribe from previous subscription if exists
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const chatMessage = JSON.parse(message.body);
        callback(chatMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.subscriptions.set(topic, subscription);
    return subscription;
  }

  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  sendMessage(destination, message) {
    if (!this.connected || !this.client) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
