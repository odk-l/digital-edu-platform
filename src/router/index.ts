import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/views/IndexView.vue'),
    children: [
      {
        path: '',
        name: 'class',
        component: () => import('@/views/ClassView.vue'),
      },
      {
        path: 'detail',
        name: 'detail',
        component: () => import('@/views/ClassDetail.vue')
      },
      {
        path: 'game',
        name: 'game',
        component: () => import('@/views/GameView.vue')
      },
      {
        path: '/user',
        name: 'user',
        component: () => import('@/views/UserView.vue')
      },
      {
        path: ':childPathMatch(.*)*',
        name: 'sub-not-found',
        component: () => import('@/views/EmptyView.vue'),
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '数字化教学平台 - 首页' },
  },
  {
    path: '/board',
    name: 'board',
    component: () => import('@/views/BoardView.vue')
  },
  {
    path: '/proposal',
    name: 'proposal',
    component: () => import('@/views/ProposalView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/EmptyView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(() => {
  document.title = '西南石油大学 - 数字化教学平台'
})


export default router
