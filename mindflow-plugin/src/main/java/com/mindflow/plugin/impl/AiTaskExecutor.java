package com.mindflow.plugin.impl;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.plugin.TaskExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class AiTaskExecutor implements TaskExecutor {
    private static final Logger logger = LoggerFactory.getLogger(AiTaskExecutor.class);

    @Override
    public String getType() {
        return "ai";
    }

    @Override
    public Map<String, Object> execute(TaskMessage taskMessage) throws Exception {
        logger.info("执行 AI 任务: nodeId={}, input={}", taskMessage.getNodeId(), taskMessage.getInput());
        
        Map<String, Object> nodeConfig = taskMessage.getNodeConfig();
        String prompt = nodeConfig != null ? (String) nodeConfig.get("prompt") : "默认提示词";
        String model = nodeConfig != null ? (String) nodeConfig.get("model") : "gpt-3.5-turbo";
        
        // 模拟 AI 调用
        Thread.sleep(1000);
        
        Map<String, Object> result = new HashMap<>();
        result.put("output", "AI 处理结果: " + prompt + " (模型: " + model + ")");
        result.put("status", "SUCCESS");
        result.put("model", model);
        
        logger.info("AI 任务执行完成: nodeId={}", taskMessage.getNodeId());
        return result;
    }
}

