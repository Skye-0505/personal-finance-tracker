<template>
  <div class="transactions-container">
    <NavBar />

    <div class="transactions-content">
      <div class="page-header">
        <h2>Transactions</h2>
        <button class="btn-add" @click="openAddModal">
          <i class="bi bi-plus-circle"></i> Add Transaction
        </button>
      </div>

      <div class="filters-section">
        <div class="filters-row">
          <select v-model="filters.type" class="filter-select">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select v-model="filters.category" class="filter-select">
            <option value="">All Categories</option>
            <option v-for="cat in filterCategories" :key="cat._id" :value="cat.name">
              {{ cat.name }}
            </option>
          </select>

          <input type="date" v-model="filters.startDate" class="filter-date" placeholder="Start Date">
          <input type="date" v-model="filters.endDate" class="filter-date" placeholder="End Date">

          <button class="btn-reset" @click="resetFilters">
            <i class="bi bi-arrow-repeat"></i> Reset
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <i class="bi bi-receipt"></i>
        <p>No transactions found</p>
        <button class="btn-add-first" @click="openAddModal">
          <i class="bi bi-plus-circle"></i> Add your first transaction
        </button>
      </div>

      <div v-else>
        <div class="transactions-table desktop-view">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in paginatedTransactions" :key="transaction._id">
                <td>{{ formatDate(transaction.transaction_date) }}</td>
                <td>
                  <span v-if="getCategoryByName(transaction.category)" class="category-badge" :style="{ backgroundColor: getCategoryByName(transaction.category)?.color + '20', color: getCategoryByName(transaction.category)?.color }">
                    <i :class="getCategoryByName(transaction.category)?.icon || 'bi-tag'" v-if="getCategoryByName(transaction.category)?.icon"></i>
                    {{ transaction.category }}
                  </span>
                  <span v-else class="category-badge">
                    {{ transaction.category }}
                  </span>
                </td>
                <td>{{ transaction.description || '-' }}</td>
                <td :class="transaction.type">
                  {{ transaction.type === 'income' ? '+' : '-' }} ¥{{ formatNumber(transaction.amount) }}
                </td>
                <td class="actions">
                  <button class="action-btn edit" @click="openEditModal(transaction)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(transaction._id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="transactions-card mobile-view">
          <div v-for="transaction in paginatedTransactions" :key="transaction._id" class="transaction-card">
            <div class="card-header">
              <span v-if="getCategoryByName(transaction.category)" class="category" :style="{ backgroundColor: getCategoryByName(transaction.category)?.color + '20', color: getCategoryByName(transaction.category)?.color }">
                <i :class="getCategoryByName(transaction.category)?.icon || 'bi-tag'" v-if="getCategoryByName(transaction.category)?.icon"></i>
                {{ transaction.category }}
              </span>
              <span v-else class="category">
                {{ transaction.category }}
              </span>
              <span :class="['amount', transaction.type]">
                {{ transaction.type === 'income' ? '+' : '-' }} ¥{{ formatNumber(transaction.amount) }}
              </span>
            </div>
            <div class="card-body">
              <div class="description">{{ transaction.description || 'No description' }}</div>
              <div class="date">{{ formatDate(transaction.transaction_date) }}</div>
            </div>
            <div class="card-actions">
              <button class="action-btn edit" @click="openEditModal(transaction)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="action-btn delete" @click="confirmDelete(transaction._id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="pagination" v-if="totalPages > 1">
          <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Transaction' : 'Add Transaction' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Type</label>
              <div class="type-selector">
                <button
                  type="button"
                  :class="['type-btn', { active: formData.type === 'expense' }]"
                  @click="setTransactionType('expense')"
                >
                  <i class="bi bi-arrow-up"></i> Expense
                </button>
                <button
                  type="button"
                  :class="['type-btn', { active: formData.type === 'income' }]"
                  @click="setTransactionType('income')"
                >
                  <i class="bi bi-arrow-down"></i> Income
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Amount</label>
              <input 
                type="number" 
                v-model="formData.amount" 
                class="form-control" 
                placeholder="0.00"
                step="0.01"
                required
              >
            </div>

            <div class="form-group">
              <label>Category</label>
              <select v-model="formData.category" class="form-control" required>
                <option value="" disabled>Select category</option>
                <option v-for="cat in categories" :key="cat._id" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
              <div v-if="getCategoryByName(formData.category)" class="selected-category-preview">
                <div class="category-icon-small" :style="{ backgroundColor: getCategoryByName(formData.category)?.color }">
                  <i :class="getCategoryByName(formData.category)?.icon || 'bi-tag'"></i>
                </div>
                <span>{{ getCategoryByName(formData.category)?.name }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <input 
                type="text" 
                v-model="formData.description" 
                class="form-control" 
                placeholder="What was this for?"
              >
            </div>

            <div class="form-group">
              <label>Date</label>
              <input 
                type="date" 
                v-model="formData.transaction_date" 
                class="form-control" 
                required
              >
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions'
import { getCategories } from '../api/categories'

const transactions = ref([])
const categoriesList = ref([]) // Store categories from backend
const isLoading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const isSubmitting = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

const filters = ref({
  type: '',
  category: '',
  startDate: '',
  endDate: ''
})

const formData = ref({
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  transaction_date: new Date().toISOString().slice(0, 10)
})

// Computed property for categories based on type
const categories = computed(() => {
  if (formData.value.type === 'income') {
    return categoriesList.value.filter(cat => cat.type === 'income')
  } else {
    return categoriesList.value.filter(cat => cat.type === 'expense')
  }
})

// Computed property for filter categories (all categories)
const filterCategories = computed(() => {
  return categoriesList.value
})

// Helper function to get category by name
const getCategoryByName = (categoryName) => {
  return categoriesList.value.find(cat => cat.name === categoryName)
}

const filteredTransactions = computed(() => {
  let result = [...transactions.value]
  
  if (filters.value.type) {
    result = result.filter(t => t.type === filters.value.type)
  }
  
  if (filters.value.category) {
    result = result.filter(t => t.category === filters.value.category)
  }
  
  if (filters.value.startDate) {
    const startDate = new Date(filters.value.startDate)
    startDate.setHours(0, 0, 0, 0)
    result = result.filter(t => {
      const transDate = new Date(t.transaction_date)
      return transDate >= startDate
    })
  }
  
  if (filters.value.endDate) {
    const endDate = new Date(filters.value.endDate)
    endDate.setHours(23, 59, 59, 999)
    result = result.filter(t => {
      const transDate = new Date(t.transaction_date)
      return transDate <= endDate
    })
  }
  
  return result.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage)
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTransactions.value.slice(start, end)
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatNumber = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadTransactions = async () => {
  isLoading.value = true
  const result = await getTransactions()
  if (result.success && result.data) {
    transactions.value = Array.isArray(result.data) ? result.data : []
  }
  isLoading.value = false
}

const loadCategories = async () => {
  try {
    const result = await getCategories()
    if (result.success && result.data) {
      categoriesList.value = result.data
    }
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const setTransactionType = (type) => {
  formData.value.type = type
  // Reset category when type changes
  formData.value.category = ''
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().slice(0, 10)
  }
  showModal.value = true
}

const openEditModal = (transaction) => {
  isEditing.value = true
  editingId.value = transaction._id
  formData.value = {
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description || '',
    transaction_date: transaction.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  if (!formData.value.amount || formData.value.amount <= 0) {
    alert('Please enter a valid amount')
    return
  }
  
  if (!formData.value.category) {
    alert('Please select a category')
    return
  }
  
  isSubmitting.value = true
  
  const submitData = {
    type: formData.value.type,
    amount: parseFloat(formData.value.amount),
    category: formData.value.category,
    description: formData.value.description,
    transaction_date: formData.value.transaction_date
  }
  
  let result
  
  if (isEditing.value && editingId.value) {
    result = await updateTransaction(editingId.value, submitData)
  } else {
    result = await createTransaction(submitData)
  }
  
  if (result.success) {
    await loadTransactions()
    closeModal()
  } else {
    alert(result.data?.message || 'Operation failed')
  }
  
  isSubmitting.value = false
}

const confirmDelete = async (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    const result = await deleteTransaction(id)
    if (result.success) {
      await loadTransactions()
      if (paginatedTransactions.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
    } else {
      alert(result.data?.message || 'Delete failed')
    }
  }
}

const resetFilters = () => {
  filters.value = {
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  }
  currentPage.value = 1
}

onMounted(() => {
  loadTransactions()
  loadCategories()
})
</script>

<style scoped>
.transactions-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.transactions-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  color: #5C5B5A;
  margin: 0;
  font-size: 28px;
}

.btn-add {
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  padding: 10px 20px;
  border-radius: 40px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
}

.filters-section {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-select, .filter-date {
  padding: 10px 16px;
  border: 2px solid rgba(180, 170, 160, 0.2);
  border-radius: 40px;
  background: white;
  font-size: 14px;
  color: #5C5B5A;
  cursor: pointer;
}

.filter-select:focus, .filter-date:focus {
  outline: none;
  border-color: #9CAF9A;
}

.btn-reset {
  background: rgba(159, 175, 154, 0.1);
  border: 2px solid rgba(180, 170, 160, 0.2);
  padding: 10px 20px;
  border-radius: 40px;
  color: #5C5B5A;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: rgba(159, 175, 154, 0.2);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #C0BAB2;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
}

.btn-add-first {
  margin-top: 16px;
  background: linear-gradient(135deg, #9CAF9A 0%, #7C9A7A 100%);
  border: none;
  border-radius: 40px;
  padding: 10px 20px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.transactions-table {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

th, td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
}

th {
  color: #9B9792;
  font-weight: 500;
  font-size: 14px;
}

td {
  color: #5C5B5A;
}

td.income {
  color: #7C9A7A;
  font-weight: 600;
}

td.expense {
  color: #C9A9A6;
  font-weight: 600;
}

.category-badge {
  background: rgba(159, 175, 154, 0.15);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.category-badge i {
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  color: #C0BAB2;
}

.action-btn.edit:hover {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.action-btn.delete:hover {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.page-btn {
  background: white;
  border: 2px solid rgba(180, 170, 160, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: rgba(159, 175, 154, 0.1);
  border-color: #9CAF9A;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #5C5B5A;
}

.mobile-view {
  display: none;
}

.transaction-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header .category {
  background: rgba(159, 175, 154, 0.15);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-header .category i {
  font-size: 14px;
}

.card-header .amount {
  font-size: 18px;
  font-weight: 600;
}

.card-header .amount.income {
  color: #7C9A7A;
}

.card-header .amount.expense {
  color: #C9A9A6;
}

.card-body .description {
  color: #5C5B5A;
  margin-bottom: 8px;
}

.card-body .date {
  font-size: 12px;
  color: #C0BAB2;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(180, 170, 160, 0.1);
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
  font-size: 24px;
  cursor: pointer;
  color: #C0BAB2;
  transition: color 0.2s ease;
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
}

.form-control:focus {
  outline: none;
  border-color: #9CAF9A;
}

.selected-category-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(245, 240, 232, 0.5);
  border-radius: 12px;
  font-size: 14px;
  color: #5C5B5A;
}

.category-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.type-selector {
  display: flex;
  gap: 12px;
}

.type-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #F0EAE2;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #5C5B5A;
}

.type-btn.active {
  border-color: #9CAF9A;
  background: rgba(159, 175, 154, 0.1);
  color: #7C9A7A;
}

.type-btn i {
  font-size: 16px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-top: 8px;
  font-size: 16px;
}

.submit-btn:hover {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .transactions-content {
    padding: 16px;
  }
  
  .desktop-view {
    display: none;
  }
  
  .mobile-view {
    display: block;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select, .filter-date, .btn-reset {
    width: 100%;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .btn-add {
    justify-content: center;
  }
}
</style>