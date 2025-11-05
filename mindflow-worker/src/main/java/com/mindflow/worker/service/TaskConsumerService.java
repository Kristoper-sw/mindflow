package com.mindflow.worker.service;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.common.entity.NodeInstance;
import com.mindflow.common.util.JsonUtils;
import com.mindflow.plugin.PluginManager;
import com.mindflow.plugin.TaskExecutor;
import com.mindflow.worker.repository.NodeInstanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class TaskConsumerService {
    private static final Logger logger = LoggerFactory.getLogger(TaskConsumerService.class);
    private static final String NODE_COMPLETED_TOPIC = "mindflow-node-completed";

    @Autowired
    private PluginManager pluginManager;

    @Autowired
    private NodeInstanceRepository nodeInstanceRepository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "mindflow-tasks", groupId = "mindflow-worker-group")
    @Transactional
    public void consumeTask(String message) {
        try {
            logger.info("收到任务消息: {}", message);
            TaskMessage taskMessage = JsonUtils.fromJson(message, TaskMessage.class);

            NodeInstance nodeInstance = nodeInstanceRepository.findById(taskMessage.getNodeInstanceId())
                    .orElseThrow(() -> new RuntimeException("节点实例不存在"));

            if (!"RUNNING".equals(nodeInstance.getStatus())) {
                logger.warn("节点状态不是 RUNNING，跳过执行: nodeId={}, status={}",
                        taskMessage.getNodeId(), nodeInstance.getStatus());
                return;
            }

            // 执行任务
            TaskExecutor executor = pluginManager.getExecutor(taskMessage.getNodeType());
            Map<String, Object> result = executor.execute(taskMessage);

            // 更新节点状态
            String output = JsonUtils.toJson(result);
            String status = "SUCCESS".equals(result.get("status")) ? "SUCCESS" : "FAILED";
            nodeInstance.setOutput(output);
            nodeInstance.setStatus(status);
            nodeInstance.setEndTime(java.time.LocalDateTime.now());
            nodeInstanceRepository.save(nodeInstance);

            // 通过 Kafka 通知编排器节点完成
            Map<String, Object> completionEvent = new HashMap<>();
            completionEvent.put("workflowInstanceId", taskMessage.getWorkflowInstanceId());
            completionEvent.put("nodeInstanceId", taskMessage.getNodeInstanceId());
            completionEvent.put("nodeId", taskMessage.getNodeId());
            completionEvent.put("status", status);
            completionEvent.put("output", output);

            String eventMessage = JsonUtils.toJson(completionEvent);
            try {
                kafkaTemplate.send(NODE_COMPLETED_TOPIC, eventMessage).get(); // 同步等待发送完成
                logger.info("成功发送节点完成事件到 Kafka: nodeId={}, status={}", taskMessage.getNodeId(), status);
            } catch (Exception e) {
                logger.error("发送节点完成事件到 Kafka 失败: nodeId={}, error={}", taskMessage.getNodeId(), e.getMessage());
                throw new RuntimeException("发送节点完成事件失败", e);
            }

            logger.info("任务执行完成: nodeId={}, status={}", taskMessage.getNodeId(), status);

        } catch (Exception e) {
            logger.error("任务执行失败", e);
            try {
                TaskMessage taskMessage = JsonUtils.fromJson(message, TaskMessage.class);
                NodeInstance nodeInstance = nodeInstanceRepository.findById(taskMessage.getNodeInstanceId())
                        .orElse(null);
                if (nodeInstance != null) {
                    nodeInstance.setStatus("FAILED");
                    nodeInstance.setErrorMessage(e.getMessage());
                    nodeInstance.setEndTime(java.time.LocalDateTime.now());
                    nodeInstanceRepository.save(nodeInstance);

                    // 发送失败事件
                    Map<String, Object> completionEvent = new HashMap<>();
                    completionEvent.put("workflowInstanceId", taskMessage.getWorkflowInstanceId());
                    completionEvent.put("nodeInstanceId", taskMessage.getNodeInstanceId());
                    completionEvent.put("nodeId", taskMessage.getNodeId());
                    completionEvent.put("status", "FAILED");
                    completionEvent.put("errorMessage", e.getMessage());

                    String eventMessage = JsonUtils.toJson(completionEvent);
                    try {
                        kafkaTemplate.send(NODE_COMPLETED_TOPIC, eventMessage).get();
                        logger.info("成功发送节点失败事件到 Kafka: nodeId={}", taskMessage.getNodeId());
                    } catch (Exception sendEx) {
                        logger.error("发送节点失败事件到 Kafka 失败: {}", sendEx.getMessage());
                    }
                }
            } catch (Exception ex) {
                logger.error("更新失败状态时出错", ex);
            }
        }
    }
}
