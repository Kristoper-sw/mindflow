package com.mindflow.plugin;

import com.mindflow.common.dto.TaskMessage;

import java.util.Map;

public interface TaskExecutor {
    String getType();
    
    Map<String, Object> execute(TaskMessage taskMessage) throws Exception;
}

