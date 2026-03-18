package com.propertyhub.controller;

import com.propertyhub.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        // Broadcast the message to all subscribers
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage) {
        // Broadcast user joined message
        chatMessage.setType("JOIN");
        return chatMessage;
    }

    // Method to send messages to specific chat rooms (visit/lease specific)
    public void sendToChatRoom(String chatType, Long chatId, ChatMessage message) {
        String destination = "/topic/" + chatType + "/" + chatId;
        messagingTemplate.convertAndSend(destination, message);
    }
}
