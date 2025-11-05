package com.mindflow.orchestrator.service;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.common.dto.WorkflowDefinitionDTO;
import com.mindflow.common.entity.NodeInstance;
import com.mindflow.common.entity.WorkflowDefinition;
import com.mindflow.common.entity.WorkflowInstance;
import com.mindflow.common.util.JsonUtils;
import com.mindflow.orchestrator.repository.NodeInstanceRepository;
import com.mindflow.orchestrator.repository.WorkflowDefinitionRepository;
import com.mindflow.orchestrator.repository.WorkflowInstanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NodeCompletionConsumer {
    private static final Logger logger = LoggerFactory.getLogger(NodeCompletionConsumer.class);
    private static final String TASK_TOPIC = "mindflow-tasks";
    private static final String STATUS_UPDATE_TOPIC = "mindflow-status-updates";

    @Autowired
    private WorkflowDefinitionRepository workflowDefinitionRepository;

    @Autowired
    private WorkflowInstanceRepository workflowInstanceRepository;

    @Autowired
    private NodeInstanceRepository nodeInstanceRepository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "mindflow-node-completed", groupId = "mindflow-orchestrator-group")
    public void handleNodeCompleted(String message) {
        try {
            logger.info("收到节点完成事件: {}", message);

            Map<String, Object> event = JsonUtils.fromJson(message, Map.class);
            Long workflowInstanceId = ((Number) event.get("workflowInstanceId")).longValue();
            Long nodeInstanceId = ((Number) event.get("nodeInstanceId")).longValue();
            String nodeId = (String) event.get("nodeId");
            String status = (String) event.get("status");
            String output = (String) event.get("output");

            logger.info("节点完成: workflowInstanceId={}, nodeInstanceId={}, status={}",
                    workflowInstanceId, nodeInstanceId, status);

            // 获取节点实例
            NodeInstance nodeInstance = nodeInstanceRepository.findById(nodeInstanceId)
                    .orElseThrow(() -> new RuntimeException("节点实例不存在"));

            // 获取工作流实例和定义
            WorkflowInstance workflowInstance = workflowInstanceRepository.findById(workflowInstanceId)
                    .orElseThrow(() -> new RuntimeException("工作流实例不存在"));

            // 如果节点失败，立即标记工作流为失败
            if ("FAILED".equals(status)) {
                workflowInstance.setStatus("FAILED");
                workflowInstance.setEndTime(java.time.LocalDateTime.now());
                workflowInstance.setErrorMessage("节点 " + nodeInstance.getNodeName() + " 执行失败");
                workflowInstanceRepository.save(workflowInstance);
                
                // 发送状态更新通知
                broadcastStatusUpdate(workflowInstanceId, "FAILED", "节点执行失败");
                logger.info("工作流失败: workflowInstanceId={}, 原因: 节点执行失败", workflowInstanceId);
                return;
            }

            WorkflowDefinition definition = workflowDefinitionRepository.findById(workflowInstance.getWorkflowDefinitionId())
                    .orElseThrow(() -> new RuntimeException("工作流定义不存在"));

            // 解析配置
            WorkflowDefinitionDTO.WorkflowConfig config = JsonUtils.fromJson(
                    definition.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class);

            // 找到下一个节点
            List<String> nextNodeIds = new ArrayList<>();
            if (config.getEdges() != null) {
                logger.info("工作流配置中有 {} 条边", config.getEdges().size());
                for (WorkflowDefinitionDTO.EdgeConfig edge : config.getEdges()) {
                    logger.debug("检查边: source={}, target={}, 当前节点={}", 
                            edge.getSource(), edge.getTarget(), nodeInstance.getNodeId());
                    if (edge.getSource().equals(nodeInstance.getNodeId())) {
                        nextNodeIds.add(edge.getTarget());
                        logger.info("找到下一个节点: {}", edge.getTarget());
                    }
                }
            } else {
                logger.warn("工作流配置中没有边定义");
            }
            
            logger.info("当前节点 {} 的下一个节点列表: {}", nodeInstance.getNodeId(), nextNodeIds);

            // 检查每个下一个节点的依赖是否都完成
            for (String nextNodeId : nextNodeIds) {
                logger.info("开始检查下一个节点 {} 的依赖", nextNodeId);
                boolean allDependenciesCompleted = true;
                List<String> dependencies = new ArrayList<>();
                if (config.getEdges() != null) {
                    for (WorkflowDefinitionDTO.EdgeConfig edge : config.getEdges()) {
                        if (edge.getTarget().equals(nextNodeId)) {
                            dependencies.add(edge.getSource());
                            NodeInstance dependencyNode = nodeInstanceRepository
                                    .findByWorkflowInstanceId(workflowInstanceId)
                                    .stream()
                                    .filter(n -> n.getNodeId().equals(edge.getSource()))
                                    .findFirst()
                                    .orElse(null);
                            if (dependencyNode == null) {
                                logger.warn("未找到依赖节点实例: {}", edge.getSource());
                                allDependenciesCompleted = false;
                                break;
                            }
                            logger.info("依赖节点 {} 的状态: {}", edge.getSource(), dependencyNode.getStatus());
                            if (!"SUCCESS".equals(dependencyNode.getStatus())) {
                                logger.info("依赖节点 {} 尚未成功完成，状态: {}", edge.getSource(), dependencyNode.getStatus());
                                allDependenciesCompleted = false;
                                break;
                            }
                        }
                    }
                }
                
                logger.info("节点 {} 的所有依赖: {}, 是否全部完成: {}", nextNodeId, dependencies, allDependenciesCompleted);

                if (allDependenciesCompleted) {
                    logger.info("节点 {} 的所有依赖已完成，准备推送任务", nextNodeId);
                    // 推送下一个节点
                    NodeInstance nextNodeInstance = nodeInstanceRepository
                            .findByWorkflowInstanceId(workflowInstanceId)
                            .stream()
                            .filter(n -> n.getNodeId().equals(nextNodeId))
                            .findFirst()
                            .orElse(null);

                    if (nextNodeInstance == null) {
                        logger.error("未找到下一个节点实例: nodeId={}, workflowInstanceId={}", nextNodeId, workflowInstanceId);
                        // 打印所有节点实例供调试
                        List<NodeInstance> allNodeInstances = nodeInstanceRepository.findByWorkflowInstanceId(workflowInstanceId);
                        logger.error("当前工作流实例的所有节点: {}", 
                                allNodeInstances.stream().map(NodeInstance::getNodeId).toList());
                        continue;
                    }

                    logger.info("找到下一个节点实例: nodeId={}, status={}", nextNodeId, nextNodeInstance.getStatus());
                    
                    if (!"PENDING".equals(nextNodeInstance.getStatus())) {
                        logger.info("下一个节点状态不是 PENDING，跳过推送: nodeId={}, status={}", 
                                nextNodeId, nextNodeInstance.getStatus());
                        continue;
                    }

                    WorkflowDefinitionDTO.NodeConfig nextNodeConfig = config.getNodes().stream()
                            .filter(n -> n.getId().equals(nextNodeId))
                            .findFirst()
                            .orElse(null);

                    if (nextNodeConfig == null) {
                        logger.error("未找到下一个节点配置: nodeId={}", nextNodeId);
                        continue;
                    }

                    // 先更新节点状态为 RUNNING
                    nextNodeInstance.setStatus("RUNNING");
                    nextNodeInstance.setStartTime(java.time.LocalDateTime.now());
                    nodeInstanceRepository.save(nextNodeInstance);
                    logger.info("已更新下一个节点状态为 RUNNING: nodeId={}", nextNodeId);
                    
                    TaskMessage taskMessage = new TaskMessage();
                    taskMessage.setWorkflowInstanceId(workflowInstanceId);
                    taskMessage.setNodeInstanceId(nextNodeInstance.getId());
                    taskMessage.setNodeId(nextNodeConfig.getId());
                    taskMessage.setNodeType(nextNodeConfig.getType());
                    taskMessage.setNodeName(nextNodeConfig.getName());
                    taskMessage.setNodeConfig(nextNodeConfig.getConfig());
                    taskMessage.setInput(output);
                    taskMessage.setContext(new HashMap<>());

                    // 然后发送到 Kafka
                    String taskMsg = JsonUtils.toJson(taskMessage);
                    try {
                        kafkaTemplate.send(TASK_TOPIC, taskMsg).get(); // 同步等待发送完成
                        logger.info("成功推送下一个任务到 Kafka: nodeId={}", nextNodeId);
                    } catch (Exception e) {
                        logger.error("推送下一个任务到 Kafka 失败: nodeId={}, error={}", nextNodeId, e.getMessage());
                        // 回滚状态，标记节点为失败
                        nextNodeInstance.setStatus("FAILED");
                        nextNodeInstance.setErrorMessage("发送任务到队列失败: " + e.getMessage());
                        nodeInstanceRepository.save(nextNodeInstance);
                    }
                } else {
                    logger.info("节点 {} 的依赖尚未全部完成，暂不推送", nextNodeId);
                }
            }
            
            if (nextNodeIds.isEmpty()) {
                logger.info("节点 {} 没有后续节点，可能是结束节点", nodeInstance.getNodeId());
            }

            // 检查工作流状态
            List<NodeInstance> allNodes = nodeInstanceRepository.findByWorkflowInstanceId(workflowInstanceId);
            
            // 如果有节点失败，立即标记工作流失败
            boolean hasFailedNode = allNodes.stream().anyMatch(n -> "FAILED".equals(n.getStatus()));
            if (hasFailedNode && !"FAILED".equals(workflowInstance.getStatus())) {
                workflowInstance.setStatus("FAILED");
                workflowInstance.setEndTime(java.time.LocalDateTime.now());
                workflowInstance.setErrorMessage("节点执行失败");
                workflowInstanceRepository.save(workflowInstance);
                logger.warn("工作流因节点失败而终止: workflowInstanceId={}", workflowInstanceId);
                
                // 通过 Kafka 发送工作流失败状态更新
                broadcastStatusUpdate(workflowInstanceId, "FAILED", "节点执行失败");
                return; // 不再处理后续节点
            }
            
            // 检查工作流是否全部完成
            boolean allCompleted = allNodes.stream()
                    .allMatch(n -> "SUCCESS".equals(n.getStatus()) || "FAILED".equals(n.getStatus()));

            if (allCompleted) {
                boolean allSuccess = allNodes.stream().allMatch(n -> "SUCCESS".equals(n.getStatus()));
                String finalStatus = allSuccess ? "SUCCESS" : "FAILED";
                workflowInstance.setStatus(finalStatus);
                workflowInstance.setEndTime(java.time.LocalDateTime.now());
                workflowInstanceRepository.save(workflowInstance);
                
                // 发送状态更新通知
                broadcastStatusUpdate(workflowInstanceId, finalStatus, "工作流执行完成");
                logger.info("工作流完成: workflowInstanceId={}, status={}", workflowInstanceId, finalStatus);
            } else {
                // 发送节点状态更新通知
                broadcastStatusUpdate(workflowInstanceId, "RUNNING", "节点执行进度更新");
            }

        } catch (Exception e) {
            logger.error("处理节点完成事件失败", e);
        }
    }

    /**
     * 广播状态更新到前端
     */
    private void broadcastStatusUpdate(Long workflowInstanceId, String status, String message) {
        try {
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("workflowInstanceId", workflowInstanceId);
            statusUpdate.put("status", status);
            statusUpdate.put("message", message);
            statusUpdate.put("timestamp", System.currentTimeMillis());
            
            String updateMessage = JsonUtils.toJson(statusUpdate);
            kafkaTemplate.send(STATUS_UPDATE_TOPIC, updateMessage);
            logger.debug("发送状态更新通知: workflowInstanceId={}, status={}", workflowInstanceId, status);
        } catch (Exception e) {
            logger.error("发送状态更新失败", e);
        }
    }
}

