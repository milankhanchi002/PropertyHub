package com.propertyhub.model;

public class ChatMessage {
    private String type; // JOIN, LEAVE, CHAT
    private String content;
    private String sender;
    private String chatType; // visit or lease
    private Long chatId; // visit or lease ID
    private String senderName;
    private String timestamp;

    public ChatMessage() {}

    public ChatMessage(String type, String content, String sender, String chatType, Long chatId, String senderName) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.chatType = chatType;
        this.chatId = chatId;
        this.senderName = senderName;
        this.timestamp = java.time.LocalDateTime.now().toString();
    }

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getChatType() { return chatType; }
    public void setChatType(String chatType) { this.chatType = chatType; }

    public Long getChatId() { return chatId; }
    public void setChatId(Long chatId) { this.chatId = chatId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
