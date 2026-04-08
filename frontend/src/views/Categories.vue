<template>
  <div class="categories-container">
    <NavBar />

    <div class="categories-content">
      <div class="page-header">
        <h2><i class="bi bi-tags"></i> Categories Management</h2>
        <button class="btn-add" @click="openAddModal">
          <i class="bi bi-plus-lg"></i>
          Add Category
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading categories...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="categories.length === 0" class="empty-state">
        <i class="bi bi-tags"></i>
        <h3>No Categories Found</h3>
        <p>Get started by adding default categories or create your own</p>
        <div class="empty-state-actions">
          <button class="btn-primary" @click="initializeDefaultCategories" :disabled="isInitializing">
            <i v-if="isInitializing" class="bi bi-arrow-repeat spinner-icon"></i>
            <i v-else class="bi bi-magic"></i>
            {{ isInitializing ? 'Initializing...' : 'Initialize Default Categories' }}
          </button>
          <button class="btn-secondary" @click="openAddModal">
            <i class="bi bi-plus-lg"></i>
            Create Custom Category
          </button>
        </div>
      </div>

      <!-- Categories List -->
      <div v-else class="categories-list">
        <div class="table-responsive">
          <table class="categories-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Icon</th>
                <th>Category Name</th>
                <th>Type</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(category, index) in categories" :key="category._id">
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="category-icon" :style="{ backgroundColor: category.color }">
                    <i :class="category.icon || 'bi-tag'"></i>
                  </div>
                </td>
                <td>
                  <router-link :to="`/categories/${category._id}`" class="category-name">
                    {{ category.name }}
                  </router-link>
                </td>
                <td>
                  <span :class="['type-badge', category.type]">
                    <i :class="category.type === 'income' ? 'bi bi-arrow-down' : 'bi bi-arrow-up'"></i>
                    {{ category.type === 'income' ? 'Income' : 'Expense' }}
                  </span>
                </td>
                <td>{{ formatDate(category.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn-edit"
                      @click="openEditModal(category)"
                      title="Edit"
                      :disabled="category.isDefault"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn-delete"
                      @click="confirmDelete(category)"
                      title="Delete"
                      :disabled="category.isDefault"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Category' : 'Add New Category' }}</h3>
          <button class="close-btn" @click="closeModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="categoryName">Category Name *</label>
              <input
                id="categoryName"
                v-model="formData.name"
                type="text"
                class="form-control"
                placeholder="Enter category name"
                required
                maxlength="50"
                :disabled="isEditing && formData.isDefault"
              />
            </div>

            <div class="form-group">
              <label for="categoryType">Type *</label>
              <select
                id="categoryType"
                v-model="formData.type"
                class="form-control"
                required
                :disabled="isEditing && formData.isDefault"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div class="form-group">
              <label>Icon</label>
              <div class="icon-selector">
                <div
                  v-for="icon in availableIcons"
                  :key="icon"
                  :class="['icon-option', { active: formData.icon === icon }]"
                  @click="formData.icon = icon"
                >
                  <i :class="icon"></i>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Color</label>
              <div class="color-selector">
                <div
                  v-for="color in availableColors"
                  :key="color"
                  :class="['color-option', { active: formData.color === color }]"
                  :style="{ backgroundColor: color }"
                  @click="formData.color = color"
                >
                  <i v-if="formData.color === color" class="bi bi-check-lg"></i>
                </div>
              </div>
            </div>

            <div v-if="errorMessage" class="error-message">
              <i class="bi bi-exclamation-circle"></i>
              {{ errorMessage }}
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn-submit" :disabled="isSubmitting">
                <span v-if="isSubmitting">
                  <i class="bi bi-arrow-repeat spinner-icon"></i>
                  {{ isEditing ? 'Updating...' : 'Creating...' }}
                </span>
                <span v-else>
                  <i class="bi bi-check-lg"></i>
                  {{ isEditing ? 'Update' : 'Create' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Delete Category</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-confirmation">
            <i class="bi bi-exclamation-triangle"></i>
            <p>Are you sure you want to delete this category?</p>
            <p class="category-name-display">
              <strong>{{ categoryToDelete?.name }}</strong>
            </p>
            <p class="warning-text">
              This action cannot be undone. If this category is associated with any transactions, the deletion will fail.
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeDeleteModal">
              Cancel
            </button>
            <button type="button" class="btn-delete-confirm" @click="handleDelete" :disabled="isDeleting">
              <span v-if="isDeleting">
                <i class="bi bi-arrow-repeat spinner-icon"></i>
                Deleting...
              </span>
              <span v-else>
                <i class="bi bi-trash"></i>
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      <i :class="toast.icon"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import { getCategories, initializeCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'

// State
const categories = ref([])
const isLoading = ref(true)
const isInitializing = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const categoryToDelete = ref(null)
const editingCategoryId = ref(null)

// Form data
const formData = ref({
  name: '',
  type: 'expense',
  icon: 'bi-tag',
  color: '#9CAF9A',
  isDefault: false
})

// Available icons
const availableIcons = [
  'bi-tag',
  'bi-credit-card',
  'bi-basket',
  'bi-cart',
  'bi-house',
  'bi-car',
  'bi-airplane',
  'bi-heart',
  'bi-book',
  'bi-gift',
  'bi-lightbulb',
  'bi-phone',
  'bi-telephone',
  'bi-envelope',
  'bi-gear',
  'bi-briefcase',
  'bi-cash',
  'bi-wallet',
  'bi-piggy-bank',
  'bi-star',
  'bi-sun',
  'bi-cloud',
  'bi-music',
  'bi-film'
]

// Available colors
const availableColors = [
  '#9CAF9A',
  '#C9A9A6',
  '#A8BFCC',
  '#D4CDC3',
  '#B7A99A',
  '#E68A5E',
  '#7C9A7A',
  '#8FBCAA',
  '#C0BAB2',
  '#9B9792'
]

// Toast notification
const toast = ref({
  show: false,
  message: '',
  type: 'success',
  icon: 'bi bi-check-circle'
})

// Show toast notification
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type,
    icon: type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-circle'
  }

  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Load categories
const loadCategories = async () => {
  isLoading.value = true
  try {
    const response = await getCategories()
    if (response.success && response.data) {
      categories.value = response.data
    } else {
      showToast('Failed to load categories', 'error')
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    showToast('Failed to load categories', 'error')
  } finally {
    isLoading.value = false
  }
}

const initializeDefaultCategories = async () => {
  isInitializing.value = true
  try {
    const response = await initializeCategories()

    if (response.success) {
      const message = response.data?.alreadyExists
        ? 'Categories already exist'
        : `Successfully created ${response.data?.count || 24} default categories`

      showToast(message, 'success')
      await loadCategories()
    } else {
      showToast(response.message || 'Failed to initialize categories', 'error')
    }
  } catch (error) {
    console.error('Error initializing categories:', error)
    showToast('Failed to initialize categories', 'error')
  } finally {
    isInitializing.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Open add modal
const openAddModal = () => {
  isEditing.value = false
  errorMessage.value = ''
  formData.value = {
    name: '',
    type: 'expense',
    icon: 'bi-tag',
    color: '#9CAF9A',
    isDefault: false
  }
  showModal.value = true
}

// Open edit modal
const openEditModal = (category) => {
  isEditing.value = true
  errorMessage.value = ''
  editingCategoryId.value = category._id
  formData.value = {
    name: category.name,
    type: category.type,
    icon: category.icon || 'bi-tag',
    color: category.color || '#9CAF9A',
    isDefault: category.isDefault || false
  }
  showModal.value = true
}

// Close modal
const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  errorMessage.value = ''
  formData.value = {
    name: '',
    type: 'expense',
    icon: 'bi-tag',
    color: '#9CAF9A',
    isDefault: false
  }
  editingCategoryId.value = null
}

// Handle form submit
const handleSubmit = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    let response
    const dataToSubmit = {
      name: formData.value.name,
      type: formData.value.type,
      icon: formData.value.icon,
      color: formData.value.color
    }

    if (isEditing.value) {
      response = await updateCategory(editingCategoryId.value, dataToSubmit)
    } else {
      response = await createCategory(dataToSubmit)
    }

    if (response.success) {
      showToast(
        isEditing.value ? 'Category updated successfully' : 'Category created successfully',
        'success'
      )
      closeModal()
      await loadCategories()
    } else {
      errorMessage.value = response.message || 'Operation failed'
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Confirm delete
const confirmDelete = (category) => {
  if (category.isDefault) {
    showToast('Cannot delete default category', 'error')
    return
  }
  categoryToDelete.value = category
  showDeleteModal.value = true
}

// Close delete modal
const closeDeleteModal = () => {
  showDeleteModal.value = false
  categoryToDelete.value = null
}

// Handle delete
const handleDelete = async () => {
  isDeleting.value = true

  try {
    const response = await deleteCategory(categoryToDelete.value._id)

    if (response.success) {
      showToast('Category deleted successfully', 'success')
      closeDeleteModal()
      await loadCategories()
    } else {
      showToast(response.message || 'Failed to delete category', 'error')
      closeDeleteModal()
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    showToast('Failed to delete category. It may be associated with transactions.', 'error')
    closeDeleteModal()
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.categories-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  color: #5C5B5A;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
}

.page-header h2 i {
  color: #9CAF9A;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-size: 14px;
}

.btn-add:hover {
  transform: translateY(-2px);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9B9792;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(159, 175, 154, 0.2);
  border-top-color: #9CAF9A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  text-align: center;
}

.empty-state i {
  font-size: 64px;
  color: #9CAF9A;
  margin-bottom: 24px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #5C5B5A;
  font-size: 24px;
}

.empty-state p {
  margin: 0 0 32px;
  color: #9B9792;
  font-size: 16px;
}

.empty-state-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-size: 14px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(159, 175, 154, 0.2);
  border: 2px solid #9CAF9A;
  border-radius: 12px;
  color: #7C9A7A;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-secondary:hover {
  background: rgba(159, 175, 154, 0.3);
}

/* Categories List */
.categories-list {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
}

.categories-table thead {
  background: rgba(245, 240, 232, 0.5);
}

.categories-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #5C5B5A;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.categories-table td {
  padding: 16px;
  border-top: 1px solid rgba(180, 170, 160, 0.1);
  color: #5C5B5A;
}

.categories-table tbody tr {
  transition: background 0.2s ease;
}

.categories-table tbody tr:hover {
  background: rgba(245, 240, 232, 0.3);
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.category-name {
  font-weight: 600;
  color: #5C5B5A;
  text-decoration: none;
  transition: color 0.2s ease;
}

.category-name:hover {
  color: #7C9A7A;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.income {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.type-badge.expense {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.btn-edit {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.btn-edit:hover:not(:disabled) {
  background: rgba(159, 175, 154, 0.3);
}

.btn-edit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(201, 169, 166, 0.3);
}

.btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Modal */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-content.modal-sm {
  max-width: 400px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #C0BAB2;
  transition: color 0.2s ease;
  padding: 4px;
}

.close-btn:hover {
  color: #5C5B5A;
}

.modal-body {
  padding: 24px;
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
  border: 2px solid #F0EAE2;
  border-radius: 12px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #9CAF9A;
}

.form-control:disabled {
  background: #F5F0E8;
  cursor: not-allowed;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.icon-option {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #F0EAE2;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;
  color: #9CAF9A;
}

.icon-option:hover {
  border-color: #9CAF9A;
  background: rgba(159, 175, 154, 0.1);
}

.icon-option.active {
  border-color: #7C9A7A;
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.color-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 3px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #5C5B5A;
}

.color-option i {
  color: white;
  font-size: 16px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(201, 169, 166, 0.2);
  border-radius: 12px;
  color: #C9A9A6;
  font-size: 14px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-submit,
.btn-delete-confirm {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #F5F0E8;
  color: #5C5B5A;
}

.btn-cancel:hover {
  background: #E8E2D9;
}

.btn-submit {
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  background: linear-gradient(135deg, #C9A9A6 0%, #A88A87 100%);
  color: white;
}

.btn-delete-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-icon {
  animation: spin 0.8s linear infinite;
}

.delete-confirmation {
  text-align: center;
  padding: 20px 0;
}

.delete-confirmation > i {
  font-size: 48px;
  color: #C9A9A6;
  margin-bottom: 16px;
}

.delete-confirmation p {
  color: #5C5B5A;
  margin: 8px 0;
}

.category-name-display {
  font-size: 18px;
  padding: 12px;
  background: rgba(245, 240, 232, 0.5);
  border-radius: 12px;
  margin: 16px 0;
}

.warning-text {
  font-size: 13px;
  color: #9B9792;
  line-height: 1.5;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(92, 91, 90, 0.15);
  animation: slideIn 0.3s ease;
  z-index: 1001;
}

.toast.success {
  border-left: 4px solid #7C9A7A;
}

.toast.success i {
  color: #7C9A7A;
}

.toast.error {
  border-left: 4px solid #C9A9A6;
}

.toast.error i {
  color: #C9A9A6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .categories-content {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header h2 {
    font-size: 24px;
  }

  .btn-add {
    justify-content: center;
  }

  .categories-table th,
  .categories-table td {
    padding: 12px;
    font-size: 13px;
  }

  .modal-content {
    margin: 20px;
  }

  .icon-selector {
    grid-template-columns: repeat(5, 1fr);
  }

  .toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
  }

  .icon-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
