package com.mindflow.orchestrator.service;

import com.mindflow.common.dto.*;
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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class WorkflowOrchestratorService {
    private static final Logger logger = LoggerFactory.getLogger(WorkflowOrchestratorService.class);
    private static final String TASK_TOPIC = "mindflow-tasks";

    @Autowired
    private WorkflowDefinitionRepository workflowDefinitionRepository;

    @Autowired
    private WorkflowInstanceRepository workflowInstanceRepository;

    @Autowired
    private NodeInstanceRepository nodeInstanceRepository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Long createWorkflowInstance(Long workflowDefinitionId, String input) {
        logger.info("创建工作流实例: workflowDefinitionId={}", workflowDefinitionId);

        WorkflowDefinition definition = workflowDefinitionRepository.findById(workflowDefinitionId)
                .orElseThrow(() -> new RuntimeException("工作流定义不存在: " + workflowDefinitionId));

        // 创建工作流实例
        WorkflowInstance instance = new WorkflowInstance();
        instance.setWorkflowDefinitionId(workflowDefinitionId);
        instance.setStatus("RUNNING");
        instance.setInput(input);
        instance = workflowInstanceRepository.save(instance);

        // 解析工作流配置
        WorkflowDefinitionDTO.WorkflowConfig config = JsonUtils.fromJson(
                definition.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class);

        if (config == null || config.getNodes() == null) {
            throw new RuntimeException("工作流配置无效");
        }

        // 创建节点实例并找到入口节点
        Map<String, NodeInstance> nodeInstanceMap = new HashMap<>();
        List<NodeInstance> nodeInstances = new ArrayList<>();

        for (WorkflowDefinitionDTO.NodeConfig nodeConfig : config.getNodes()) {
            NodeInstance nodeInstance = new NodeInstance();
            nodeInstance.setWorkflowInstanceId(instance.getId());
            nodeInstance.setNodeId(nodeConfig.getId());
            nodeInstance.setNodeType(nodeConfig.getType());
            nodeInstance.setNodeName(nodeConfig.getName());
            nodeInstance.setStatus("PENDING");
            nodeInstance.setInput(input);
            nodeInstance = nodeInstanceRepository.save(nodeInstance);
            nodeInstanceMap.put(nodeConfig.getId(), nodeInstance);
            nodeInstances.add(nodeInstance);
        }

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

        // 推送入口节点到 Kafka
        for (String nodeId : entryNodeIds) {
            NodeInstance nodeInstance = nodeInstanceMap.get(nodeId);
            WorkflowDefinitionDTO.NodeConfig nodeConfig = config.getNodes().stream()
                    .filter(n -> n.getId().equals(nodeId))
                    .findFirst()
                    .orElse(null);

            if (nodeConfig != null) {
                TaskMessage taskMessage = new TaskMessage();
                taskMessage.setWorkflowInstanceId(instance.getId());
                taskMessage.setNodeInstanceId(nodeInstance.getId());
                taskMessage.setNodeId(nodeConfig.getId());
                taskMessage.setNodeType(nodeConfig.getType());
                taskMessage.setNodeName(nodeConfig.getName());
                taskMessage.setNodeConfig(nodeConfig.getConfig());
                taskMessage.setInput(input);
                taskMessage.setContext(new HashMap<>());

                String message = JsonUtils.toJson(taskMessage);
                kafkaTemplate.send(TASK_TOPIC, message);
                logger.info("推送任务到 Kafka: nodeId={}, instanceId={}", nodeId, instance.getId());

                nodeInstance.setStatus("RUNNING");
                nodeInstanceRepository.save(nodeInstance);
            }
        }

        return instance.getId();
    }

    public void onNodeCompleted(Long workflowInstanceId, Long nodeInstanceId, String output, String status) {
        logger.info("节点完成: workflowInstanceId={}, nodeInstanceId={}, status={}",
                workflowInstanceId, nodeInstanceId, status);

        NodeInstance nodeInstance = nodeInstanceRepository.findById(nodeInstanceId)
                .orElseThrow(() -> new RuntimeException("节点实例不存在"));

        nodeInstance.setStatus(status);
        nodeInstance.setOutput(output);
        nodeInstance.setEndTime(java.time.LocalDateTime.now());
        nodeInstanceRepository.save(nodeInstance);

        // 获取工作流定义和实例
        WorkflowInstance workflowInstance = workflowInstanceRepository.findById(workflowInstanceId)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));

        WorkflowDefinition definition = workflowDefinitionRepository.findById(workflowInstance.getWorkflowDefinitionId())
                .orElseThrow(() -> new RuntimeException("工作流定义不存在"));

        // 解析配置
        WorkflowDefinitionDTO.WorkflowConfig config = JsonUtils.fromJson(
                definition.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class);

        // 找到下一个节点
        List<String> nextNodeIds = new ArrayList<>();
        if (config.getEdges() != null) {
            for (WorkflowDefinitionDTO.EdgeConfig edge : config.getEdges()) {
                if (edge.getSource().equals(nodeInstance.getNodeId())) {
                    nextNodeIds.add(edge.getTarget());
                }
            }
        }

        // 检查所有依赖是否完成
        for (String nextNodeId : nextNodeIds) {
            boolean allDependenciesCompleted = true;
            if (config.getEdges() != null) {
                for (WorkflowDefinitionDTO.EdgeConfig edge : config.getEdges()) {
                    if (edge.getTarget().equals(nextNodeId)) {
                        NodeInstance dependencyNode = nodeInstanceRepository
                                .findByWorkflowInstanceId(workflowInstanceId)
                                .stream()
                                .filter(n -> n.getNodeId().equals(edge.getSource()))
                                .findFirst()
                                .orElse(null);
                        if (dependencyNode == null || !"SUCCESS".equals(dependencyNode.getStatus())) {
                            allDependenciesCompleted = false;
                            break;
                        }
                    }
                }
            }

            if (allDependenciesCompleted) {
                // 推送下一个节点
                NodeInstance nextNodeInstance = nodeInstanceRepository
                        .findByWorkflowInstanceId(workflowInstanceId)
                        .stream()
                        .filter(n -> n.getNodeId().equals(nextNodeId))
                        .findFirst()
                        .orElse(null);

                if (nextNodeInstance != null && "PENDING".equals(nextNodeInstance.getStatus())) {
                    WorkflowDefinitionDTO.NodeConfig nextNodeConfig = config.getNodes().stream()
                            .filter(n -> n.getId().equals(nextNodeId))
                            .findFirst()
                            .orElse(null);

                    if (nextNodeConfig != null) {
                        TaskMessage taskMessage = new TaskMessage();
                        taskMessage.setWorkflowInstanceId(workflowInstanceId);
                        taskMessage.setNodeInstanceId(nextNodeInstance.getId());
                        taskMessage.setNodeId(nextNodeConfig.getId());
                        taskMessage.setNodeType(nextNodeConfig.getType());
                        taskMessage.setNodeName(nextNodeConfig.getName());
                        taskMessage.setNodeConfig(nextNodeConfig.getConfig());
                        taskMessage.setInput(output);
                        taskMessage.setContext(new HashMap<>());

                        String message = JsonUtils.toJson(taskMessage);
                        kafkaTemplate.send(TASK_TOPIC, message);
                        logger.info("推送下一个任务到 Kafka: nodeId={}", nextNodeId);

                        nextNodeInstance.setStatus("RUNNING");
                        nodeInstanceRepository.save(nextNodeInstance);
                    }
                }
            }
        }

        // 检查工作流是否完成
        List<NodeInstance> allNodes = nodeInstanceRepository.findByWorkflowInstanceId(workflowInstanceId);
        boolean allCompleted = allNodes.stream()
                .allMatch(n -> "SUCCESS".equals(n.getStatus()) || "FAILED".equals(n.getStatus()));

        if (allCompleted) {
            boolean allSuccess = allNodes.stream().allMatch(n -> "SUCCESS".equals(n.getStatus()));
            workflowInstance.setStatus(allSuccess ? "SUCCESS" : "FAILED");
            workflowInstance.setEndTime(java.time.LocalDateTime.now());
            workflowInstanceRepository.save(workflowInstance);
            logger.info("工作流完成: workflowInstanceId={}, status={}", workflowInstanceId, workflowInstance.getStatus());
        }
    }
}

