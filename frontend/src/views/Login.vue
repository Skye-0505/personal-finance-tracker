<template>
  <div class="login-container">
    <!-- Background with soft gradient -->
    <div class="background-gradient"></div>
    
    <!-- Decorative circles -->
    <div class="deco-circle circle-1"></div>
    <div class="deco-circle circle-2"></div>
    <div class="deco-circle circle-3"></div>
    
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <!-- Main Card -->
          <div class="login-card">
            <!-- Logo Image -->
            <div class="text-center mb-4">
              <img src="../assets/img/login.png" alt="Finance Tracker Logo" class="logo-image">
              <h1 class="app-title">FinTrack</h1>
              <p class="app-subtitle">Track your spending, achieve your goals</p>
            </div>
            
            <!-- Error Alert -->
            <transition name="fade">
              <div v-if="errorMessage" class="alert alert-custom alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-circle me-2"></i>
                {{ errorMessage }}
                <button type="button" class="btn-close" @click="errorMessage = ''"></button>
              </div>
            </transition>
            
            <!-- Login Form -->
            <form @submit.prevent="handleLogin">
              <!-- Username Field -->
              <div class="form-group mb-4">
                <label for="username" class="form-label">
                  <i class="bi bi-person-fill me-2"></i>Username
                </label>
                <div class="input-wrapper">
                  <input 
                    type="text" 
                    class="form-control-custom" 
                    id="username"
                    v-model="credentials.username"
                    placeholder="Enter your username"
                    autocomplete="username"
                    required
                  >
                </div>
              </div>
              
              <!-- Password Field -->
              <div class="form-group mb-4">
                <label for="password" class="form-label">
                  <i class="bi bi-lock-fill me-2"></i>Password
                </label>
                <div class="input-wrapper">
                  <input 
                    :type="showPassword ? 'text' : 'password'" 
                    class="form-control-custom" 
                    id="password"
                    v-model="credentials.password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                  >
                  <button 
                    class="password-toggle" 
                    type="button"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                  </button>
                </div>
              </div>
              
              <!-- Remember Me Checkbox -->
              <div class="mb-4">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="rememberMe">
                  <span class="checkmark"></span>
                  <span class="checkbox-text">Remember me</span>
                </label>
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit" 
                class="btn-login"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                {{ isLoading ? 'Signing in...' : 'Sign In' }}
              </button>
              
              <!-- Demo Account Hint -->
              <div class="demo-hint">
                <i class="bi bi-info-circle-fill me-2"></i>
                <span>Demo account: <strong>7270_root</strong> / <strong>123456</strong></span>
              </div>
            </form>
          </div>
          
          <!-- Footer -->
          <div class="footer-text">
            <p class="mb-0">
              <small>Don't have an account? 
                <router-link to="/register" class="text-decoration-none">Register here</router-link>
              </small>
            </p>
            <p class="mb-0">
              <i class="bi bi-shield-check"></i> Secure login with token-based authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'

const router = useRouter()

const credentials = ref({
  username: '',
  password: ''
})

const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  const result = await login(credentials.value.username, credentials.value.password)

  if (!result.success) {
    errorMessage.value = result.message || result.data?.message || 'Login failed'
    isLoading.value = false
    return
  }

  const { token, user } = result.data

  // Store token based on Remember Me selection
  if (rememberMe.value) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    console.log('✅ Saved to localStorage (remember me)')
  } else {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    console.log('✅ Saved to sessionStorage (session only)')
  }

  // Redirect to dashboard
  router.push('/dashboard')
}
</script>

<style scoped>
/* ==================== Morandi Color Palette ==================== */

/* Container Styles */
.login-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.background-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 50%, #DFD7CD 100%);
  z-index: -2;
}

/* Decorative Circles */
.deco-circle {
  position: fixed;
  border-radius: 50%;
  background: rgba(159, 175, 154, 0.15);
  backdrop-filter: blur(40px);
  z-index: -1;
  animation: float 20s ease-in-out infinite;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: rgba(168, 191, 204, 0.2);
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -80px;
  background: rgba(201, 169, 166, 0.2);
  animation-delay: -5s;
}

.circle-3 {
  width: 250px;
  height: 250px;
  bottom: 30%;
  right: 20%;
  background: rgba(143, 188, 170, 0.15);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* Login Card */
.login-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 32px;
  padding: 40px 36px;
  box-shadow: 0 20px 40px rgba(92, 91, 90, 0.08), 
              0 8px 16px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 48px rgba(92, 91, 90, 0.12);
}

/* Logo Image */
.logo-image {
  width: 100px;
  height: auto;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 16px rgba(92, 91, 90, 0.1));
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #5C5B5A 0%, #9CAF9A 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: #9B9792;
  margin-bottom: 0;
}

/* Form Elements */
.form-group {
  position: relative;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #5C5B5A;
  margin-bottom: 8px;
  display: block;
}

.form-label i {
  color: #9CAF9A;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
}

.form-control-custom {
  width: 100%;
  padding: 14px 40px 14px 18px;
  font-size: 15px;
  border: 2px solid rgba(180, 170, 160, 0.2);
  border-radius: 18px;
  background: white;
  transition: all 0.3s ease;
  color: #5C5B5A;
}

.form-control-custom:focus {
  outline: none;
  border-color: #9CAF9A;
  box-shadow: 0 0 0 4px rgba(159, 175, 154, 0.12);
}

.form-control-custom::placeholder {
  color: #CEC8C0;
}

.password-toggle {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #C0BAB2;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #9CAF9A;
}

/* Remember Me Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: white;
  border: 2px solid rgba(159, 175, 154, 0.4);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label:hover .checkmark {
  border-color: #9CAF9A;
}

.checkbox-label input:checked ~ .checkmark {
  background-color: #9CAF9A;
  border-color: #9CAF9A;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  margin-left: 10px;
  font-size: 14px;
  color: #8C8A89;
}

/* Login Button */
.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 18px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(92, 122, 89, 0.3);
  margin-top: 8px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(92, 122, 89, 0.4);
  background: linear-gradient(135deg, #6F8E6D 0%, #4E6D4C 100%);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Demo Hint */
.demo-hint {
  background: rgba(159, 175, 154, 0.1);
  border-radius: 14px;
  padding: 12px 16px;
  margin-top: 24px;
  font-size: 13px;
  color: #5C5B5A;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(159, 175, 154, 0.2);
  transition: all 0.2s ease;
}

.demo-hint:hover {
  background: rgba(159, 175, 154, 0.15);
  border-color: rgba(159, 175, 154, 0.3);
}

.demo-hint i {
  color: #9CAF9A;
  font-size: 16px;
}

.demo-hint strong {
  color: #8FBCAA;
  font-weight: 600;
  background: rgba(143, 188, 170, 0.15);
  padding: 2px 6px;
  border-radius: 8px;
  margin: 0 2px;
}

/* Custom Alert */
.alert-custom {
  background: linear-gradient(135deg, #FFF8F3 0%, #FFF2EA 100%);
  border: none;
  border-radius: 18px;
  color: #E68A5E;
  padding: 14px 18px;
  margin-bottom: 24px;
  border-left: 4px solid #E68A5E;
  font-size: 14px;
}

/* Footer */
.footer-text {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #C0BAB2;
}

.footer-text i {
  color: #9CAF9A;
  margin-right: 6px;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .login-card {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .logo-image {
    width: 80px;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .deco-circle {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
  }
  
  .logo-image {
    width: 70px;
  }
  
  .app-title {
    font-size: 26px;
  }
}
</style>