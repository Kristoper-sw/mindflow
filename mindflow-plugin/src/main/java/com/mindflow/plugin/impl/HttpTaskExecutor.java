package com.mindflow.plugin.impl;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.plugin.TaskExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class HttpTaskExecutor implements TaskExecutor {
    private static final Logger logger = LoggerFactory.getLogger(HttpTaskExecutor.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getType() {
        return "http";
    }

    @Override
    public Map<String, Object> execute(TaskMessage taskMessage) throws Exception {
        logger.info("执行 HTTP 任务: nodeId={}", taskMessage.getNodeId());
        
        Map<String, Object> nodeConfig = taskMessage.getNodeConfig();
        String url = nodeConfig != null ? (String) nodeConfig.get("url") : null;
        String method = nodeConfig != null ? (String) nodeConfig.get("method") : "GET";
        Map<String, String> headers = new HashMap<>();
        Object headersObj = nodeConfig != null ? nodeConfig.get("headers") : null;

        if (headersObj instanceof Map) {
            headers.putAll((Map<String, String>) headersObj);
        }

        Object body = nodeConfig != null ? nodeConfig.get("body") : null;
        
        if (url == null) {
            throw new IllegalArgumentException("HTTP 任务缺少 URL 配置");
        }
        
        HttpHeaders httpHeaders = new HttpHeaders();
        if(headers != null) {
            headers.forEach(httpHeaders::set);
        }
        
        HttpEntity<Object> entity = new HttpEntity<>(body, httpHeaders);
        HttpMethod httpMethod = HttpMethod.valueOf(method.toUpperCase());
        
        ResponseEntity<String> response = restTemplate.exchange(url, httpMethod, entity, String.class);
        
        Map<String, Object> result = new HashMap<>();
        result.put("output", response.getBody());
        result.put("status", "SUCCESS");
        result.put("statusCode", response.getStatusCodeValue());
        result.put("headers", response.getHeaders());
        
        logger.info("HTTP 任务执行完成: nodeId={}, statusCode={}", taskMessage.getNodeId(), response.getStatusCodeValue());
        return result;
    }
}

