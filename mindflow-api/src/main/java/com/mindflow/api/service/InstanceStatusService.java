package com.mindflow.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class InstanceStatusService {
    // 存储每个工作流实例的 SSE 连接
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> instanceEmitters = new ConcurrentHashMap<>();

    /**
     * 添加 SSE 连接
     */
    public SseEmitter addEmitter(Long instanceId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        instanceEmitters.computeIfAbsent(instanceId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        
        emitter.onCompletion(() -> removeEmitter(instanceId, emitter));
        emitter.onTimeout(() -> removeEmitter(instanceId, emitter));
        emitter.onError(e -> removeEmitter(instanceId, emitter));
        
        return emitter;
    }

    /**
     * 移除 SSE 连接
     */
    private void removeEmitter(Long instanceId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = instanceEmitters.get(instanceId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                instanceEmitters.remove(instanceId);
            }
        }
    }

    /**
     * 发送状态更新到所有监听该实例的客户端
     */
    public void sendStatusUpdate(Long instanceId, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = instanceEmitters.get(instanceId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("status-update")
                            .data(data));
                } catch (IOException e) {
                    removeEmitter(instanceId, emitter);
                }
            }
        }
    }
}

