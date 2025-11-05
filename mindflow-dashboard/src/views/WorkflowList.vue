<template>
  <div>
    <div class="header">
      <h2>工作流管理</h2>
      <el-button type="primary" @click="goToEditor">新建工作流</el-button>
    </div>
    <el-table :data="workflows" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="editWorkflow(scope.row)">编辑</el-button>
          <el-button size="small" type="primary" @click="runWorkflow(scope.row)">执行</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'WorkflowList',
  setup() {
    const router = useRouter()
    const workflows = ref([])

    const loadWorkflows = async () => {
      try {
        workflows.value = await api.get('/workflows/definitions')
      } catch (error) {
        console.error('加载工作流失败:', error)
      }
    }

    const goToEditor = () => {
      router.push('/workflows/new')
    }

    const editWorkflow = (workflow) => {
      router.push(`/workflows/${workflow.id}`)
    }

    const runWorkflow = async (workflow) => {
      try {
        await api.post('/workflows/instances', null, {
          params: {
            workflowDefinitionId: workflow.id,
            input: '{}'
          }
        })
        ElMessage.success('工作流已启动执行')
        router.push('/instances')
      } catch (error) {
        console.error('执行工作流失败:', error)
      }
    }

    onMounted(() => {
      loadWorkflows()
    })

    return {
      workflows,
      goToEditor,
      editWorkflow,
      runWorkflow
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}
</style>

