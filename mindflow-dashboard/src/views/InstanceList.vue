<template>
  <div>
    <div class="header">
      <h2>执行实例</h2>
      <el-button @click="loadInstances">刷新</el-button>
    </div>
    <el-table :data="instances" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="workflowName" label="工作流名称" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180" />
      <el-table-column prop="endTime" label="结束时间" width="180" />
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

export default {
  name: 'InstanceList',
  setup() {
    const router = useRouter()
    const instances = ref([])

    const loadInstances = async () => {
      try {
        instances.value = await api.get('/workflows/instances')
      } catch (error) {
        console.error('加载实例失败:', error)
      }
    }

    const getStatusType = (status) => {
      const statusMap = {
        'RUNNING': 'warning',
        'SUCCESS': 'success',
        'FAILED': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const viewDetail = (instance) => {
      router.push(`/instances/${instance.id}`)
    }

    onMounted(() => {
      loadInstances()
    })

    return {
      instances,
      loadInstances,
      getStatusType,
      viewDetail
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

