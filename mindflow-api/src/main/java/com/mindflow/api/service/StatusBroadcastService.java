package com.mindflow.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StatusBroadcastService {
    private static final Logger logger = LoggerFactory.getLogger(StatusBroadcastService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 监听工作流状态更新事件，通过 WebSocket 推送给前端
     */
    @KafkaListener(topics = "mindflow-status-updates", groupId = "mindflow-api-status-group")
    public void handleStatusUpdate(String message) {
        try {
            logger.info("收到状态更新: {}", message);
            
            // 广播给所有订阅的客户端
            messagingTemplate.convertAndSend("/topic/workflow-status", message);
            
        } catch (Exception e) {
            logger.error("推送状态更新失败", e);
        }
    }
}

