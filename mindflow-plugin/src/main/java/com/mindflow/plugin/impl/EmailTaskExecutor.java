package com.mindflow.plugin.impl;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.plugin.TaskExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class EmailTaskExecutor implements TaskExecutor {
    private static final Logger logger = LoggerFactory.getLogger(EmailTaskExecutor.class);

    @Override
    public String getType() {
        return "email";
    }

    @Override
    public Map<String, Object> execute(TaskMessage taskMessage) throws Exception {
        logger.info("执行邮件任务: nodeId={}", taskMessage.getNodeId());
        
        Map<String, Object> nodeConfig = taskMessage.getNodeConfig();
        String to = nodeConfig != null ? (String) nodeConfig.get("to") : null;
        String subject = nodeConfig != null ? (String) nodeConfig.get("subject") : "无主题";
        String content = nodeConfig != null ? (String) nodeConfig.get("content") : taskMessage.getInput();
        
        if (to == null) {
            throw new IllegalArgumentException("邮件任务缺少收件人配置");
        }
        
        // 模拟发送邮件
        Thread.sleep(500);
        
        logger.info("发送邮件: to={}, subject={}", to, subject);
        
        Map<String, Object> result = new HashMap<>();
        result.put("output", "邮件已发送至: " + to);
        result.put("status", "SUCCESS");
        result.put("to", to);
        result.put("subject", subject);
        
        logger.info("邮件任务执行完成: nodeId={}", taskMessage.getNodeId());
        return result;
    }
}

