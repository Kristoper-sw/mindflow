package com.mindflow.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowDefinitionDTO {
    private Long id;
    
    @NotBlank(message = "工作流名称不能为空")
    private String name;
    
    private String description;
    
    @NotNull(message = "工作流配置不能为空")
    private WorkflowConfig config;
    
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public static class WorkflowConfig {
        private List<NodeConfig> nodes;
        private List<EdgeConfig> edges;

        public WorkflowConfig() {
        }

        public List<NodeConfig> getNodes() {
            return nodes;
        }

        public void setNodes(List<NodeConfig> nodes) {
            this.nodes = nodes;
        }

        public List<EdgeConfig> getEdges() {
            return edges;
        }

        public void setEdges(List<EdgeConfig> edges) {
            this.edges = edges;
        }
    }

    public static class NodeConfig {
        private String id;
        private String type;
        private String name;
        private Map<String, Object> config;
        private Integer x;
        private Integer y;

        public NodeConfig() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Map<String, Object> getConfig() {
            return config;
        }

        public void setConfig(Map<String, Object> config) {
            this.config = config;
        }

        public Integer getX() {
            return x;
        }

        public void setX(Integer x) {
            this.x = x;
        }

        public Integer getY() {
            return y;
        }

        public void setY(Integer y) {
            this.y = y;
        }
    }

    public static class EdgeConfig {
        private String id;
        private String source;
        private String target;

        public EdgeConfig() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public WorkflowConfig getConfig() {
        return config;
    }

    public void setConfig(WorkflowConfig config) {
        this.config = config;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}

