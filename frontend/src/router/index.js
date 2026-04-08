import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/Analytics.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../views/Transactions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories/:id',
      name: 'categoryDetail',
      component: () => import('../views/CategoryDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

const isLoggedIn = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const user = localStorage.getItem('user') || sessionStorage.getItem('user')
  return !!(token && user)
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      return null
    }
  }
  return null
}

export const getCurrentToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  window.location.href = '/login'
}

router.beforeEach((to, from, next) => {
  const loggedIn = isLoggedIn()
  
  console.log('🔐 Route Guard - To:', to.path, 'LoggedIn:', loggedIn)
  
  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta?.requiresGuest)
  
  if (requiresAuth && !loggedIn) {
    console.log('❌ Redirect to /login')
    next('/login')
  } else if (requiresGuest && loggedIn) {
    console.log('✅ Redirect to /dashboard')
    next('/dashboard')
  } else {
    console.log('✅ Allow access')
    next()
  }
})

export default router