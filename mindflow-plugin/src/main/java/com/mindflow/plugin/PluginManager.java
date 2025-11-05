package com.mindflow.plugin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ServiceLoader;

@Component
public class PluginManager {
    private static final Logger logger = LoggerFactory.getLogger(PluginManager.class);
    
    private final Map<String, TaskExecutor> executors = new HashMap<>();
    
    @Autowired(required = false)
    private List<TaskExecutor> springExecutors;

    @PostConstruct
    public void init() {
        // 加载 Spring 管理的执行器
        if (springExecutors != null) {
            for (TaskExecutor executor : springExecutors) {
                executors.put(executor.getType(), executor);
                logger.info("加载任务执行器: type={}", executor.getType());
            }
        }
        
        // 通过 SPI 加载其他执行器
        ServiceLoader<TaskExecutor> serviceLoader = ServiceLoader.load(TaskExecutor.class);
        for (TaskExecutor executor : serviceLoader) {
            if (!executors.containsKey(executor.getType())) {
                executors.put(executor.getType(), executor);
                logger.info("通过 SPI 加载任务执行器: type={}", executor.getType());
            }
        }
        
        logger.info("任务执行器加载完成，共 {} 个", executors.size());
    }

    public TaskExecutor getExecutor(String type) {
        TaskExecutor executor = executors.get(type);
        if (executor == null) {
            throw new IllegalArgumentException("不支持的任务类型: " + type);
        }
        return executor;
    }

    public boolean hasExecutor(String type) {
        return executors.containsKey(type);
    }
}

