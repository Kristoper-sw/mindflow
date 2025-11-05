package com.mindflow.orchestrator.repository;

import com.mindflow.common.entity.NodeInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeInstanceRepository extends JpaRepository<NodeInstance, Long> {
    List<NodeInstance> findByWorkflowInstanceId(Long workflowInstanceId);
}

