package com.mindflow.orchestrator.service;

import com.mindflow.common.dto.TaskMessage;
import com.mindflow.common.dto.WorkflowDefinitionDTO;
import com.mindflow.common.entity.NodeInstance;
import com.mindflow.common.entity.WorkflowDefinition;
import com.mindflow.common.util.JsonUtils;
import com.mindflow.orchestrator.repository.NodeInstanceRepository;
import com.mindflow.orchestrator.repository.WorkflowDefinitionRepository;
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
public class WorkflowEventConsumer {
    private static final Logger logger = LoggerFactory.getLogger(WorkflowEventConsumer.class);
    private static final String TASK_TOPIC = "mindflow-tasks";

    @Autowired
    private WorkflowDefinitionRepository workflowDefinitionRepository;

    @Autowired
    private NodeInstanceRepository nodeInstanceRepository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "mindflow-workflow-created", groupId = "mindflow-orchestrator-group")
    public void handleWorkflowCreated(String message) {
        try {
            logger.info("收到工作流创建事件: {}", message);
            
            Map<String, Object> event = JsonUtils.fromJson(message, Map.class);
            Long workflowInstanceId = ((Number) event.get("workflowInstanceId")).longValue();
            Long workflowDefinitionId = ((Number) event.get("workflowDefinitionId")).longValue();
            String input = (String) event.get("input");

            // 获取工作流定义
            WorkflowDefinition definition = workflowDefinitionRepository.findById(workflowDefinitionId)
                    .orElseThrow(() -> new RuntimeException("工作流定义不存在"));

            // 解析配置
            WorkflowDefinitionDTO.WorkflowConfig config = JsonUtils.fromJson(
                    definition.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class);

            // 构建依赖图
            Map<String, List<String>> dependencyMap = new HashMap<>();
            if (config.getEdges() != null) {
                for (WorkflowDefinitionDTO.EdgeConfig edge : config.getEdges()) {
                    dependencyMap.computeIfAbsent(edge.getTarget(), k -> new ArrayList<>()).add(edge.getSource());
                }
            }

            // 找到入口节点（没有依赖的节点）
            List<String> entryNodeIds = new ArrayList<>();
            for (WorkflowDefinitionDTO.NodeConfig node : config.getNodes()) {
                if (!dependencyMap.containsKey(node.getId())) {
                    entryNodeIds.add(node.getId());
                }
            }
            
            logger.info("找到 {} 个入口节点: {}", entryNodeIds.size(), entryNodeIds);

            // 推送入口节点到 Kafka
            List<NodeInstance> allNodeInstances = nodeInstanceRepository.findByWorkflowInstanceId(workflowInstanceId);
            logger.info("查询到 {} 个节点实例", allNodeInstances.size());
            
            Map<String, NodeInstance> nodeInstanceMap = new HashMap<>();
            for (NodeInstance ni : allNodeInstances) {
                nodeInstanceMap.put(ni.getNodeId(), ni);
            }

            for (String nodeId : entryNodeIds) {
                NodeInstance nodeInstance = nodeInstanceMap.get(nodeId);
                WorkflowDefinitionDTO.NodeConfig nodeConfig = config.getNodes().stream()
                        .filter(n -> n.getId().equals(nodeId))
                        .findFirst()
                        .orElse(null);

                if (nodeConfig == null) {
                    logger.error("未找到节点配置: nodeId={}", nodeId);
                    continue;
                }
                
                if (nodeInstance == null) {
                    logger.error("未找到节点实例: nodeId={}", nodeId);
                    continue;
                }

                // 先更新节点状态为 RUNNING
                nodeInstance.setStatus("RUNNING");
                nodeInstance.setStartTime(java.time.LocalDateTime.now());
                nodeInstanceRepository.save(nodeInstance);
                logger.info("已更新节点状态为 RUNNING: nodeId={}", nodeId);
                
                TaskMessage taskMessage = new TaskMessage();
                taskMessage.setWorkflowInstanceId(workflowInstanceId);
                taskMessage.setNodeInstanceId(nodeInstance.getId());
                taskMessage.setNodeId(nodeConfig.getId());
                taskMessage.setNodeType(nodeConfig.getType());
                taskMessage.setNodeName(nodeConfig.getName());
                taskMessage.setNodeConfig(nodeConfig.getConfig());
                taskMessage.setInput(input);
                taskMessage.setContext(new HashMap<>());

                // 然后发送到 Kafka
                String taskMsg = JsonUtils.toJson(taskMessage);
                try {
                    kafkaTemplate.send(TASK_TOPIC, taskMsg).get(); // 同步等待发送完成
                    logger.info("成功推送任务到 Kafka: nodeId={}, instanceId={}", nodeId, workflowInstanceId);
                } catch (Exception e) {
                    logger.error("推送任务到 Kafka 失败: nodeId={}, error={}", nodeId, e.getMessage());
                    // 回滚状态，标记节点为失败
                    nodeInstance.setStatus("FAILED");
                    nodeInstance.setErrorMessage("发送任务到队列失败: " + e.getMessage());
                    nodeInstanceRepository.save(nodeInstance);
                }
            }
            
            if (entryNodeIds.isEmpty()) {
                logger.warn("工作流没有入口节点: workflowInstanceId={}", workflowInstanceId);
            }

        } catch (Exception e) {
            logger.error("处理工作流创建事件失败", e);
        }
    }
}

