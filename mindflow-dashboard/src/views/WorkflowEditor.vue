<template>
  <div>
    <div class="header">
      <h2>{{ isEdit ? '编辑工作流' : '新建工作流' }}</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="saveWorkflow">保存</el-button>
      </div>
    </div>
    <el-form :model="form" label-width="100px">
      <el-form-item label="名称">
        <el-input v-model="form.name" placeholder="请输入工作流名称" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" placeholder="请输入工作流描述" />
      </el-form-item>
      <el-form-item label="配置 JSON">
        <div style="margin-bottom: 10px; color: #606266; font-size: 14px;">
          ⚠️ 只需输入 config 部分，格式：<code>{"nodes": [...], "edges": [...]}</code>
        </div>
        <el-input
          v-model="configJson"
          type="textarea"
          :rows="20"
          placeholder='{"nodes": [{"id": "node1", "type": "ai", "name": "节点1", "config": {}}], "edges": [{"id": "edge1", "source": "node1", "target": "node2"}]}'
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

export default {
  name: 'WorkflowEditor',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const isEdit = computed(() => !!route.params.id)
    const form = reactive({
      name: '',
      description: ''
    })
    const configJson = ref('{"nodes":[],"edges":[]}')

    const loadWorkflow = async () => {
      if (isEdit.value) {
        try {
          const workflow = await api.get(`/workflows/definitions/${route.params.id}`)
          form.name = workflow.name
          form.description = workflow.description || ''
          configJson.value = JSON.stringify(workflow.config, null, 2)
        } catch (error) {
          console.error('加载工作流失败:', error)
        }
      }
    }

    const saveWorkflow = async () => {
      try {
        let config
        try {
          config = JSON.parse(configJson.value)
        } catch (e) {
          ElMessage.error('JSON 格式错误')
          return
        }

        // 智能处理：如果用户输入了完整的工作流定义（包含 config 字段），自动提取 config 部分
        if (config.config && (config.config.nodes || config.config.edges)) {
          config = config.config
        }

        // 验证 config 必须包含 nodes 或 edges
        if (!config.nodes && !config.edges) {
          ElMessage.error('config 必须包含 nodes 或 edges 字段')
          return
        }

        const workflowData = {
          name: form.name,
          description: form.description,
          config: config
        }

        if (isEdit.value) {
          await api.request({
            method: 'PUT',
            url: `/workflows/definitions/${route.params.id}`,
            data: workflowData
          })
          ElMessage.success('工作流更新成功')
        } else {
          await api.post('/workflows/definitions', workflowData)
          ElMessage.success('工作流创建成功')
        }
        router.push('/workflows')
      } catch (error) {
        console.error('保存工作流失败:', error)
      }
    }

    const goBack = () => {
      router.push('/workflows')
    }

    onMounted(() => {
      loadWorkflow()
    })

    return {
      isEdit,
      form,
      configJson,
      saveWorkflow,
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
</style>

