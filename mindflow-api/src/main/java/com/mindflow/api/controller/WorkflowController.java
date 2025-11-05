package com.mindflow.api.controller;

import com.mindflow.api.repository.NodeInstanceRepository;
import com.mindflow.api.repository.WorkflowDefinitionRepository;
import com.mindflow.api.repository.WorkflowInstanceRepository;
import com.mindflow.api.service.InstanceStatusService;
import com.mindflow.api.service.WorkflowService;
import com.mindflow.common.dto.WorkflowDefinitionDTO;
import com.mindflow.common.dto.WorkflowInstanceDTO;
import com.mindflow.common.entity.NodeInstance;
import com.mindflow.common.entity.WorkflowDefinition;
import com.mindflow.common.entity.WorkflowInstance;
import com.mindflow.common.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workflows")
@CrossOrigin(origins = "*")
public class WorkflowController {
    
    @Autowired
    private WorkflowDefinitionRepository workflowDefinitionRepository;

    @Autowired
    private WorkflowInstanceRepository workflowInstanceRepository;

    @Autowired
    private NodeInstanceRepository nodeInstanceRepository;

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private InstanceStatusService instanceStatusService;

    @PostMapping("/definitions")
    public ResponseEntity<WorkflowDefinitionDTO> createWorkflowDefinition(@RequestBody WorkflowDefinitionDTO dto) {
        WorkflowDefinition definition = new WorkflowDefinition();
        definition.setName(dto.getName());
        definition.setDescription(dto.getDescription());
        definition.setConfig(JsonUtils.toJson(dto.getConfig()));
        definition.setStatus("ACTIVE");
        definition = workflowDefinitionRepository.save(definition);
        
        dto.setId(definition.getId());
        dto.setStatus(definition.getStatus());
        dto.setCreateTime(definition.getCreateTime());
        dto.setUpdateTime(definition.getUpdateTime());
        
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/definitions")
    public ResponseEntity<List<WorkflowDefinitionDTO>> listWorkflowDefinitions() {
        List<WorkflowDefinition> definitions = workflowDefinitionRepository.findAll();
        List<WorkflowDefinitionDTO> dtos = definitions.stream().map(def -> {
            WorkflowDefinitionDTO dto = new WorkflowDefinitionDTO();
            dto.setId(def.getId());
            dto.setName(def.getName());
            dto.setDescription(def.getDescription());
            dto.setConfig(JsonUtils.fromJson(def.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class));
            dto.setStatus(def.getStatus());
            dto.setCreateTime(def.getCreateTime());
            dto.setUpdateTime(def.getUpdateTime());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/definitions/{id}")
    public ResponseEntity<WorkflowDefinitionDTO> getWorkflowDefinition(@PathVariable("id") Long id) {
        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流定义不存在"));
        
        WorkflowDefinitionDTO dto = new WorkflowDefinitionDTO();
        dto.setId(definition.getId());
        dto.setName(definition.getName());
        dto.setDescription(definition.getDescription());
        dto.setConfig(JsonUtils.fromJson(definition.getConfig(), WorkflowDefinitionDTO.WorkflowConfig.class));
        dto.setStatus(definition.getStatus());
        dto.setCreateTime(definition.getCreateTime());
        dto.setUpdateTime(definition.getUpdateTime());
        
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/definitions/{id}")
    public ResponseEntity<WorkflowDefinitionDTO> updateWorkflowDefinition(
            @PathVariable("id") Long id,
            @RequestBody WorkflowDefinitionDTO dto) {
        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流定义不存在"));
        
        definition.setName(dto.getName());
        definition.setDescription(dto.getDescription());
        definition.setConfig(JsonUtils.toJson(dto.getConfig()));
        definition = workflowDefinitionRepository.save(definition);
        
        dto.setId(definition.getId());
        dto.setStatus(definition.getStatus());
        dto.setCreateTime(definition.getCreateTime());
        dto.setUpdateTime(definition.getUpdateTime());
        
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/definitions/{id}")
    public ResponseEntity<Void> deleteWorkflowDefinition(@PathVariable("id") Long id) {
        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流定义不存在"));
        
        // 检查是否有关联的工作流实例
        List<WorkflowInstance> instances = workflowInstanceRepository.findByWorkflowDefinitionId(id);
        if (!instances.isEmpty()) {
            // 可选：删除所有关联的实例（谨慎操作）
            // 或者：不允许删除有实例的定义
            throw new RuntimeException("无法删除该工作流定义，存在 " + instances.size() + " 个关联的工作流实例");
        }
        
        // 删除工作流定义
        workflowDefinitionRepository.delete(definition);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/instances")
    public ResponseEntity<WorkflowInstanceDTO> createWorkflowInstance(
            @RequestParam(value = "workflowDefinitionId", required = false) Long workflowDefinitionId,
            @RequestParam(value = "input", required = false, defaultValue = "{}") String input) {
        if (workflowDefinitionId == null) {
            throw new RuntimeException("workflowDefinitionId 不能为空");
        }
        Long instanceId = workflowService.createWorkflowInstance(workflowDefinitionId, input);
        WorkflowInstance instance = workflowInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));
        
        WorkflowInstanceDTO dto = convertToDTO(instance);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/instances")
    public ResponseEntity<List<WorkflowInstanceDTO>> listWorkflowInstances(
            @RequestParam(value = "workflowDefinitionId", required = false) Long workflowDefinitionId) {
        List<WorkflowInstance> instances;
        if (workflowDefinitionId != null) {
            instances = workflowInstanceRepository.findByWorkflowDefinitionId(workflowDefinitionId);
        } else {
            instances = workflowInstanceRepository.findAll();
        }
        
        List<WorkflowInstanceDTO> dtos = instances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/instances/{id}")
    public ResponseEntity<WorkflowInstanceDTO> getWorkflowInstance(@PathVariable("id") Long id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));
        
        WorkflowInstanceDTO dto = convertToDTO(instance);
        
        // 加载节点实例
        List<NodeInstance> nodeInstances = nodeInstanceRepository.findByWorkflowInstanceId(id);
        List<com.mindflow.common.dto.NodeInstanceDTO> nodeDTOs = nodeInstances.stream().map(ni -> {
            com.mindflow.common.dto.NodeInstanceDTO nodeDTO = new com.mindflow.common.dto.NodeInstanceDTO();
            nodeDTO.setId(ni.getId());
            nodeDTO.setWorkflowInstanceId(ni.getWorkflowInstanceId());
            nodeDTO.setNodeId(ni.getNodeId());
            nodeDTO.setNodeType(ni.getNodeType());
            nodeDTO.setNodeName(ni.getNodeName());
            nodeDTO.setStatus(ni.getStatus());
            nodeDTO.setInput(ni.getInput());
            nodeDTO.setOutput(ni.getOutput());
            nodeDTO.setErrorMessage(ni.getErrorMessage());
            nodeDTO.setStartTime(ni.getStartTime());
            nodeDTO.setEndTime(ni.getEndTime());
            return nodeDTO;
        }).collect(Collectors.toList());
        dto.setNodeInstances(nodeDTOs);
        
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/instances/{id}/stream")
    public SseEmitter streamInstanceStatus(@PathVariable("id") Long id) {
        // 验证实例存在
        workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));
        
        return instanceStatusService.addEmitter(id);
    }

    @PostMapping("/instances/{id}/terminate")
    public ResponseEntity<WorkflowInstanceDTO> terminateWorkflowInstance(@PathVariable("id") Long id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));
        
        if ("RUNNING".equals(instance.getStatus())) {
            instance.setStatus("TERMINATED");
            instance.setEndTime(java.time.LocalDateTime.now());
            instance.setErrorMessage("工作流被手动终止");
            workflowInstanceRepository.save(instance);
            
            // 终止所有运行中的节点
            List<NodeInstance> runningNodes = nodeInstanceRepository.findByWorkflowInstanceId(id)
                    .stream()
                    .filter(n -> "RUNNING".equals(n.getStatus()) || "PENDING".equals(n.getStatus()))
                    .toList();
            
            for (NodeInstance node : runningNodes) {
                node.setStatus("TERMINATED");
                node.setErrorMessage("工作流被终止");
                node.setEndTime(java.time.LocalDateTime.now());
                nodeInstanceRepository.save(node);
            }
        }
        
        return ResponseEntity.ok(convertToDTO(instance));
    }

    @DeleteMapping("/instances/{id}")
    public ResponseEntity<Void> deleteWorkflowInstance(@PathVariable("id") Long id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流实例不存在"));
        
        // 只能删除已完成或已终止的实例
        if ("RUNNING".equals(instance.getStatus())) {
            throw new RuntimeException("无法删除运行中的工作流实例，请先终止");
        }
        
        // 删除所有节点实例
        List<NodeInstance> nodeInstances = nodeInstanceRepository.findByWorkflowInstanceId(id);
        nodeInstanceRepository.deleteAll(nodeInstances);
        
        // 删除工作流实例
        workflowInstanceRepository.delete(instance);
        
        return ResponseEntity.ok().build();
    }

    private WorkflowInstanceDTO convertToDTO(WorkflowInstance instance) {
        WorkflowInstanceDTO dto = new WorkflowInstanceDTO();
        dto.setId(instance.getId());
        dto.setWorkflowDefinitionId(instance.getWorkflowDefinitionId());
        
        WorkflowDefinition definition = workflowDefinitionRepository.findById(instance.getWorkflowDefinitionId())
                .orElse(null);
        if (definition != null) {
            dto.setWorkflowName(definition.getName());
        }
        
        dto.setStatus(instance.getStatus());
        dto.setInput(instance.getInput());
        dto.setOutput(instance.getOutput());
        dto.setErrorMessage(instance.getErrorMessage());
        dto.setStartTime(instance.getStartTime());
        dto.setEndTime(instance.getEndTime());
        return dto;
    }
}
