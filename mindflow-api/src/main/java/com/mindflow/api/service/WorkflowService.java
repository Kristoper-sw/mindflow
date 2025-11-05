package com.mindflow.api.service;

import com.mindflow.api.repository.NodeInstanceRepository;
import com.mindflow.api.repository.WorkflowDefinitionRepository;
import com.mindflow.api.repository.WorkflowInstanceRepository;
import com.mindflow.common.dto.WorkflowDefinitionDTO;
import com.mindflow.common.entity.NodeInstance;
import com.mindflow.common.entity.WorkflowDefinition;
import com.mindflow.common.entity.WorkflowInstance;
import com.mindflow.common.util.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

@Service
public class WorkflowService {
    private static final Logger logger = LoggerFactory.getLogger(WorkflowService.class);
    private static final String WORKFLOW_CREATED_TOPIC = "mindflow-workflow-created";

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

        // 创建节点实例
        for (WorkflowDefinitionDTO.NodeConfig nodeConfig : config.getNodes()) {
            NodeInstance nodeInstance = new NodeInstance();
            nodeInstance.setWorkflowInstanceId(instance.getId());
            nodeInstance.setNodeId(nodeConfig.getId());
            nodeInstance.setNodeType(nodeConfig.getType());
            nodeInstance.setNodeName(nodeConfig.getName());
            nodeInstance.setStatus("PENDING");
            nodeInstance.setInput(input);
            nodeInstanceRepository.save(nodeInstance);
        }

        // 在事务提交后发送工作流创建事件到 Kafka，由 orchestrator 处理
        final Long instanceId = instance.getId();
        final Long defId = workflowDefinitionId;
        final String inputData = input;
        
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                Map<String, Object> event = new HashMap<>();
                event.put("workflowInstanceId", instanceId);
                event.put("workflowDefinitionId", defId);
                event.put("input", inputData);
                
                String message = JsonUtils.toJson(event);
                try {
                    kafkaTemplate.send(WORKFLOW_CREATED_TOPIC, message).get();
                    logger.info("事务提交后成功发送工作流创建事件到 Kafka: instanceId={}", instanceId);
                } catch (Exception e) {
                    logger.error("发送工作流创建事件到 Kafka 失败: instanceId={}, error={}", instanceId, e.getMessage());
                }
            }
        });
        
        logger.info("已注册事务提交后回调，将在事务提交后发送 Kafka 消息: instanceId={}", instance.getId());

        return instance.getId();
    }
}

