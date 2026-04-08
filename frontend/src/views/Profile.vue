<template>
  <div class="profile-container">
    <NavBar />

    <div class="profile-content">
      <div class="page-header">
        <h2>Profile</h2>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="profile-grid">
        <!-- Profile Info Card -->
        <div class="profile-card">
          <div class="card-header">
            <i class="bi bi-person-circle"></i>
            <h3>Profile Information</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Username</span>
              <div class="info-value">
                <span v-if="!editing">{{ user?.username }}</span>
                <input 
                  v-else 
                  type="text" 
                  v-model="editUsername" 
                  class="edit-input"
                  placeholder="Enter new username"
                >
                <button v-if="!editing" class="icon-btn edit" @click="startEdit">
                  <i class="bi bi-pencil"></i>
                </button>
                <div v-else class="edit-actions">
                  <button class="icon-btn save" @click="saveUsername">
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button class="icon-btn cancel" @click="cancelEdit">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="info-row">
              <span class="info-label">Member Since</span>
              <span class="info-value">{{ formatDate(user?.created_at) }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value">
                <span :class="['status-badge', user?.is_active ? 'active' : 'inactive']">
                  {{ user?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="profile-card">
          <div class="card-header">
            <i class="bi bi-lock"></i>
            <h3>Change Password</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="handlePasswordChange">
              <div class="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  v-model="passwordForm.currentPassword" 
                  class="form-control"
                  required
                >
              </div>

              <div class="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  v-model="passwordForm.newPassword" 
                  class="form-control"
                  required
                >
                <small class="form-hint">Password must be at least 6 characters</small>
              </div>

              <div class="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  v-model="passwordForm.confirmPassword" 
                  class="form-control"
                  required
                >
              </div>

              <div v-if="passwordError" class="error-message">
                <i class="bi bi-exclamation-circle"></i> {{ passwordError }}
              </div>
              <div v-if="passwordSuccess" class="success-message">
                <i class="bi bi-check-circle"></i> {{ passwordSuccess }}
              </div>

              <button type="submit" class="btn-submit" :disabled="passwordLoading">
                {{ passwordLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Danger Zone Card -->
        <div v-if="!isAdmin" class="profile-card danger-card">
          <div class="card-header">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>Danger Zone</h3>
          </div>
          <div class="card-body">
            <p class="danger-text">
              Once you deactivate your account, you will not be able to log in again.
              All your data will be preserved but inaccessible.
            </p>
            <button class="btn-danger" @click="confirmDeactivate">
              <i class="bi bi-trash"></i> Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Deactivate Modal -->
    <div v-if="showDeactivateModal" class="modal-overlay" @click.self="closeDeactivateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Deactivate Account</h3>
          <button class="close-btn" @click="closeDeactivateModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to deactivate your account?</p>
          <p class="warning-text">This action cannot be undone. You will be logged out immediately.</p>
          
          <div class="form-group">
            <label>Type your username to confirm</label>
            <input 
              type="text" 
              v-model="confirmUsername" 
              class="form-control"
              placeholder="Enter your username"
            >
          </div>

          <div v-if="deactivateError" class="error-message">
            <i class="bi bi-exclamation-circle"></i> {{ deactivateError }}
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeDeactivateModal">Cancel</button>
            <button 
              class="btn-confirm-danger" 
              @click="handleDeactivate"
              :disabled="deactivateLoading || confirmUsername !== user?.username"
            >
              {{ deactivateLoading ? 'Deactivating...' : 'Yes, Deactivate Account' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getProfile, updateProfile, changePassword, deactivateAccount } from '../api/auth'
import { logout } from '../router'

const router = useRouter()

const user = ref(null)
const isLoading = ref(true)

// Edit username
const editing = ref(false)
const editUsername = ref('')
const updateLoading = ref(false)

// Change password
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Deactivate account
const showDeactivateModal = ref(false)
const confirmUsername = ref('')
const deactivateLoading = ref(false)
const deactivateError = ref('')
const isAdmin = computed(() => {
  return user.value?.username === '7270_root'
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const loadProfile = async () => {
  isLoading.value = true
  const result = await getProfile()
  if (result.success && result.data) {
    user.value = result.data
  }
  isLoading.value = false
}

const startEdit = () => {
  editUsername.value = user.value?.username || ''
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  editUsername.value = ''
}

const saveUsername = async () => {
  if (!editUsername.value.trim()) {
    alert('Username cannot be empty')
    return
  }
  
  if (editUsername.value.length < 3) {
    alert('Username must be at least 3 characters')
    return
  }
  
  updateLoading.value = true
  const result = await updateProfile({ username: editUsername.value })
  
  if (result.success) {
    user.value.username = editUsername.value
    editing.value = false
    alert('Username updated successfully')
  } else {
    alert(result.data?.message || 'Failed to update username')
  }
  
  updateLoading.value = false
}

const handlePasswordChange = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  
  if (!passwordForm.value.currentPassword) {
    passwordError.value = 'Current password is required'
    return
  }
  
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }
  
  passwordLoading.value = true
  
  const result = await changePassword({
    currentPassword: passwordForm.value.currentPassword,
    newPassword: passwordForm.value.newPassword
  })
  
  if (result.success) {
    passwordSuccess.value = 'Password changed successfully'
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } else {
    passwordError.value = result.data?.message || 'Failed to change password'
  }
  
  passwordLoading.value = false
}

const confirmDeactivate = () => {
  confirmUsername.value = ''
  deactivateError.value = ''
  showDeactivateModal.value = true
}

const closeDeactivateModal = () => {
  showDeactivateModal.value = false
}

const handleDeactivate = async () => {
  if (confirmUsername.value !== user.value?.username) {
    deactivateError.value = 'Username does not match'
    return
  }
  
  deactivateLoading.value = true
  const result = await deactivateAccount()
  
  if (result.success) {
    logout()
  } else {
    deactivateError.value = result.data?.message || 'Failed to deactivate account'
    deactivateLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.profile-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  color: #5C5B5A;
  font-size: 28px;
  margin: 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(92, 91, 90, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
}

.card-header i {
  font-size: 24px;
  color: #9CAF9A;
}

.card-header h3 {
  margin: 0;
  color: #5C5B5A;
  font-size: 18px;
}

.card-body {
  padding: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #9B9792;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5C5B5A;
  font-weight: 500;
}

.edit-input {
  padding: 8px 12px;
  border: 2px solid rgba(159, 175, 154, 0.3);
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.edit-input:focus {
  border-color: #9CAF9A;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn.edit:hover {
  background: rgba(159, 175, 154, 0.15);
  color: #7C9A7A;
}

.icon-btn.save:hover {
  background: rgba(159, 175, 154, 0.15);
  color: #7C9A7A;
}

.icon-btn.cancel:hover {
  background: rgba(201, 169, 166, 0.15);
  color: #C9A9A6;
}

.edit-actions {
  display: flex;
  gap: 4px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.status-badge.inactive {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #5C5B5A;
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(180, 170, 160, 0.2);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #9CAF9A;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #C0BAB2;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: rgba(201, 169, 166, 0.15);
  color: #C9A9A6;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: rgba(159, 175, 154, 0.15);
  color: #7C9A7A;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger-card {
  border: 1px solid rgba(201, 169, 166, 0.3);
}

.danger-text {
  color: #9B9792;
  font-size: 14px;
  margin-bottom: 20px;
}

.btn-danger {
  background: linear-gradient(135deg, #C9A9A6 0%, #B88A86 100%);
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}

.btn-danger:hover {
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(92, 91, 90, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 450px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #F0EAE2;
}

.modal-header h3 {
  margin: 0;
  color: #5C5B5A;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #C0BAB2;
}

.modal-body {
  padding: 24px;
}

.warning-text {
  color: #C9A9A6;
  font-size: 13px;
  margin: 12px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: rgba(180, 170, 160, 0.2);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: #5C5B5A;
  font-weight: 500;
}

.btn-confirm-danger {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #C9A9A6 0%, #B88A86 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-content {
    padding: 16px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value {
    width: 100%;
    justify-content: space-between;
  }
  
  .edit-input {
    flex: 1;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>