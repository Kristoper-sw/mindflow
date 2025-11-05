<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>MindFlow - 分布式 AI 工作流平台</h1>
        <div class="header-right">
          <span v-if="user">{{ user }}</span>
          <el-button v-if="user" @click="logout" type="danger" size="small">退出</el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu router :default-active="$route.path">
            <el-menu-item index="/workflows">
              <span>工作流管理</span>
            </el-menu-item>
            <el-menu-item index="/instances">
              <span>执行实例</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from './api'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const user = ref('')

    onMounted(() => {
      const token = localStorage.getItem('token')
      if (token) {
        user.value = 'admin'
      } else {
        router.push('/login')
      }
    })

    const logout = () => {
      localStorage.removeItem('token')
      user.value = ''
      router.push('/login')
      ElMessage.success('已退出登录')
    }

    return {
      user,
      logout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: Arial, sans-serif;
  height: 100vh;
}

.el-header {
  background-color: #409EFF;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.el-header h1 {
  font-size: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-aside {
  background-color: #304156;
}

.el-menu {
  border-right: none;
}

.el-menu-item {
  color: #bfcbd9;
}

.el-menu-item:hover {
  background-color: #263445;
}

.el-main {
  padding: 20px;
}
</style>

