import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import WorkflowList from '../views/WorkflowList.vue'
import WorkflowEditor from '../views/WorkflowEditor.vue'
import InstanceList from '../views/InstanceList.vue'
import InstanceDetail from '../views/InstanceDetail.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/workflows',
    name: 'WorkflowList',
    component: WorkflowList
  },
  {
    path: '/workflows/new',
    name: 'WorkflowEditor',
    component: WorkflowEditor
  },
  {
    path: '/workflows/:id',
    name: 'WorkflowEditorEdit',
    component: WorkflowEditor
  },
  {
    path: '/instances',
    name: 'InstanceList',
    component: InstanceList
  },
  {
    path: '/instances/:id',
    name: 'InstanceDetail',
    component: InstanceDetail
  },
  {
    path: '/',
    redirect: '/workflows'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path === '/login') {
    if (token) {
      next('/workflows')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router

