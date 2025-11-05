-- MindFlow 数据库初始化脚本

CREATE DATABASE IF NOT EXISTS mindflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mindflow;

-- 工作流定义表
CREATE TABLE IF NOT EXISTS workflow_definition (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    config TEXT NOT NULL,
    status VARCHAR(50),
    create_time DATETIME,
    update_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 工作流实例表
CREATE TABLE IF NOT EXISTS workflow_instance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workflow_definition_id BIGINT NOT NULL,
    status VARCHAR(50),
    input TEXT,
    output TEXT,
    error_message TEXT,
    start_time DATETIME,
    end_time DATETIME,
    INDEX idx_workflow_definition_id (workflow_definition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 节点实例表
CREATE TABLE IF NOT EXISTS node_instance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workflow_instance_id BIGINT NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(50),
    node_name VARCHAR(200),
    status VARCHAR(50),
    input TEXT,
    output TEXT,
    error_message TEXT,
    start_time DATETIME,
    end_time DATETIME,
    INDEX idx_workflow_instance_id (workflow_instance_id),
    INDEX idx_node_id (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

