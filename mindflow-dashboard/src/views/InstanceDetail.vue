<template>
  <div>
    <div class="header">
      <h2>执行实例详情</h2>
      <div>
        <el-button v-if="instance && instance.status === 'RUNNING'" type="warning" @click="terminateInstance">终止</el-button>
        <el-button v-if="instance && instance.status !== 'RUNNING'" type="danger" @click="deleteInstance">删除</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
    <div v-if="instance" class="detail-container">
      <el-card>
        <h3>基本信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="实例 ID">{{ instance.id }}</el-descriptions-item>
          <el-descriptions-item label="工作流名称">{{ instance.workflowName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(instance.status)">{{ instance.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ instance.startTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ instance.endTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card style="margin-top: 20px">
        <h3>节点执行情况</h3>
        <el-table :data="instance.nodeInstances || []" border style="width: 100%">
          <el-table-column prop="nodeName" label="节点名称" />
          <el-table-column prop="nodeType" label="节点类型" width="100" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="180" />
          <el-table-column prop="endTime" label="结束时间" width="180" />
          <el-table-column label="输出" width="200">
            <template #default="scope">
              <el-button size="small" @click="viewOutput(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="outputDialogVisible" title="节点输出" width="600px">
        <pre>{{ selectedOutput }}</pre>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

export default {
  name: 'InstanceDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const instance = ref(null)
    const outputDialogVisible = ref(false)
    const selectedOutput = ref('')

    const loadInstance = async () => {
      try {
        instance.value = await api.get(`/workflows/instances/${route.params.id}`)
      } catch (error) {
        console.error('加载实例详情失败:', error)
      }
    }

    const getStatusType = (status) => {
      const statusMap = {
        'RUNNING': 'warning',
        'SUCCESS': 'success',
        'FAILED': 'danger',
        'PENDING': 'info'
      }
      return statusMap[status] || 'info'
    }

    const viewOutput = (nodeInstance) => {
      try {
        const output = JSON.parse(nodeInstance.output || '{}')
        selectedOutput.value = JSON.stringify(output, null, 2)
      } catch (e) {
        selectedOutput.value = nodeInstance.output || '无输出'
      }
      outputDialogVisible.value = true
    }

    const terminateInstance = async () => {
      try {
        await ElMessageBox.confirm('确定要终止这个工作流实例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await api.post(`/workflows/instances/${route.params.id}/terminate`)
        ElMessage.success('工作流已终止')
        await loadInstance()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('终止失败:', error)
        }
      }
    }

    const deleteInstance = async () => {
      try {
        await ElMessageBox.confirm('确定要删除这个工作流实例吗？删除后无法恢复', '危险操作', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'error'
        })
        
        await api.delete(`/workflows/instances/${route.params.id}`)
        ElMessage.success('工作流实例已删除')
        router.push('/instances')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    }

    const goBack = () => {
      router.push('/instances')
    }

    onMounted(async () => {
      await loadInstance()
      
      // 建立 WebSocket 连接，实时接收状态更新
      import('../websocket').then(({ connectWebSocket, subscribeToStatus, disconnectWebSocket }) => {
        connectWebSocket().then(() => {
          subscribeToStatus((data) => {
            // 如果是当前查看的工作流实例，刷新数据
            if (data.workflowInstanceId === parseInt(route.params.id)) {
              console.log('收到状态更新:', data)
              loadInstance()
            }
          })
        }).catch(err => {
          console.error('WebSocket 连接失败，使用轮询模式', err)
          // 降级到轮询模式
          setInterval(loadInstance, 3000)
        })
        
        // 组件卸载时断开连接
        onUnmounted(() => {
          disconnectWebSocket()
        })
      })
    })

    return {
      instance,
      outputDialogVisible,
      selectedOutput,
      getStatusType,
      viewOutput,
      terminateInstance,
      deleteInstance,
      goBack
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

.detail-container {
  max-width: 1200px;
}

h3 {
  margin-bottom: 15px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
}
</style>

