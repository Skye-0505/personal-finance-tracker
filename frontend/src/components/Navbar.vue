<template>
  <nav class="navbar" :class="{ 'scrolled': isScrolled }">
    <div class="navbar-container">
      <router-link to="/dashboard" class="navbar-logo">
        <div class="logo-icon">
          <i class="bi bi-calculator-fill"></i>
        </div>
        <span class="logo-text">FinTrack</span>
      </router-link>

      <div class="desktop-menu">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </div>

      <div class="user-section">
        <button class="user-info" @click="showDropdown = !showDropdown">
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <span class="user-name">{{ displayName }}</span>
          <i class="bi bi-chevron-down" :class="{ 'rotate': showDropdown }"></i>
        </button>

        <div v-if="showDropdown" class="dropdown-menu">
          <button class="dropdown-item logout" @click="handleLogout">
            <i class="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
        <i :class="mobileMenuOpen ? 'bi bi-x-lg' : 'bi bi-list'"></i>
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-menu">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-nav-link"
        :class="{ active: isActive(item.path) }"
        @click="mobileMenuOpen = false"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </router-link>
      <button class="mobile-nav-link logout" @click="handleLogout">
        <i class="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser, logout as logoutService } from '../router'

const router = useRouter()
const route = useRoute()

const currentUser = ref(null)
const showDropdown = ref(false)
const mobileMenuOpen = ref(false)
const isScrolled = ref(false)

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi bi-speedometer2' },
  { path: '/analytics', label: 'Analytics', icon: 'bi bi-bar-chart' },
  { path: '/transactions', label: 'Transactions', icon: 'bi bi-receipt' },
  { path: '/categories', label: 'Categories', icon: 'bi bi-tags' },
  { path: '/profile', label: 'Profile', icon: 'bi bi-person-circle' }
]

const loadUser = () => {
  currentUser.value = getCurrentUser()
}

const displayName = computed(() => {
  return currentUser.value?.username || 'User'
})

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleLogout = () => {
  showDropdown.value = false
  mobileMenuOpen.value = false
  logoutService()
}

const handleClickOutside = (event) => {
  const userSection = document.querySelector('.user-section')
  if (userSection && !userSection.contains(event.target) && showDropdown.value) {
    showDropdown.value = false
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => {
  loadUser()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(180, 170, 160, 0.2);
  transition: all 0.3s ease;
}

.navbar.scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(92, 91, 90, 0.08);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 10;
}

.navbar-logo {
  display: flex;
  margin-right: 20px;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.navbar-logo:hover {
  transform: translateY(-1px);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #9CAF9A 0%, #7C9A7A 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(159, 175, 154, 0.2);
}

.logo-icon i {
  font-size: 20px;
  color: white;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #5C5B5A 0%, #9CAF9A 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.3px;
}

.desktop-menu {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 40px;
  text-decoration: none;
  color: #8C8A89;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link i {
  font-size: 18px;
}

.nav-link:hover {
  background: rgba(159, 175, 154, 0.1);
  color: #5C5B5A;
}

.nav-link.active {
  background: rgba(159, 175, 154, 0.15);
  color: #7C9A7A;
}

.nav-link.active i {
  color: #7C9A7A;
}

.user-section {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border-radius: 40px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: none;
  border: none;
  font-size: 14px;
}

.user-info:hover {
  background: rgba(159, 175, 154, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #9CAF9A;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #5C5B5A;
}

.dropdown-icon {
  font-size: 14px;
  color: #C0BAB2;
  transition: transform 0.2s ease;
}

.dropdown-icon.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  display: block;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(92, 91, 90, 0.12);
  border: 1px solid rgba(180, 170, 160, 0.15);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #5C5B5A;
  transition: background 0.2s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(159, 175, 154, 0.1);
}

.dropdown-item i {
  font-size: 16px;
  color: #9CAF9A;
  width: 20px;
}

.dropdown-item.logout {
  color: #C9A9A6;
}

.dropdown-item.logout i {
  color: #C9A9A6;
}

.dropdown-divider {
  height: 1px;
  background: rgba(180, 170, 160, 0.2);
  margin: 4px 0;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 28px;
  color: #5C5B5A;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.mobile-menu-btn:hover {
  background: rgba(159, 175, 154, 0.1);
}

.mobile-menu {
  height: fit-content;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  padding: 80px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  text-decoration: none;
  color: #5C5B5A;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s ease;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.mobile-nav-link i {
  font-size: 22px;
  color: #9CAF9A;
  width: 28px;
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  background: rgba(159, 175, 154, 0.1);
  color: #7C9A7A;
}

.mobile-nav-link.active i {
  color: #7C9A7A;
}

.mobile-nav-link.logout {
  color: #C9A9A6;
}

.mobile-nav-link.logout i {
  color: #C9A9A6;
}

.mobile-divider {
  height: 1px;
  background: rgba(180, 170, 160, 0.2);
  margin: 12px 0;
}

@media (max-width: 768px) {
  .desktop-menu {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .navbar-container {
    padding: 10px 20px;
  }
  
  .user-name {
    display: none;
  }
  
  .user-info {
    padding: 6px;
  }
  
  .dropdown-icon {
    display: none;
  }

  .user-section {
    display: none;
  }
}

@media (min-width: 769px) {
  .mobile-menu {
    display: none;
  }
}
</style>