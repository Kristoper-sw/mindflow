package com.mindflow.orchestrator.service;

import com.mindflow.common.util.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StatusBroadcastService {
    private static final Logger logger = LoggerFactory.getLogger(StatusBroadcastService.class);
    private static final String CHANNEL_PREFIX = "workflow-status:";

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * 广播工作流状态更新
     */
    public void broadcastWorkflowStatus(Long workflowInstanceId, String status) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("workflowInstanceId", workflowInstanceId);
            message.put("status", status);
            message.put("timestamp", System.currentTimeMillis());
            
            String channel = CHANNEL_PREFIX + workflowInstanceId;
            redisTemplate.convertAndSend(channel, JsonUtils.toJson(message));
            
            logger.debug("广播工作流状态: instanceId={}, status={}", workflowInstanceId, status);
        } catch (Exception e) {
            logger.error("广播工作流状态失败", e);
        }
    }

    /**
     * 广播节点状态更新
     */
    public void broadcastNodeStatus(Long workflowInstanceId, Long nodeInstanceId, String status) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("workflowInstanceId", workflowInstanceId);
            message.put("nodeInstanceId", nodeInstanceId);
            message.put("status", status);
            message.put("timestamp", System.currentTimeMillis());
            
            String channel = CHANNEL_PREFIX + workflowInstanceId;
            redisTemplate.convertAndSend(channel, JsonUtils.toJson(message));
            
            logger.debug("广播节点状态: instanceId={}, nodeInstanceId={}, status={}", 
                    workflowInstanceId, nodeInstanceId, status);
        } catch (Exception e) {
            logger.error("广播节点状态失败", e);
        }
    }
}

