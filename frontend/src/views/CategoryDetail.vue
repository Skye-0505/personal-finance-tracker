<template>
  <div class="category-detail-container">
    <NavBar />

    <div class="category-detail-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading category details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <h3>{{ error }}</h3>
        <router-link to="/categories" class="btn-back">
          <i class="bi bi-arrow-left"></i>
          Back to Categories
        </router-link>
      </div>

      <!-- Category Not Found -->
      <div v-else-if="!category" class="error-state">
        <i class="bi bi-tag-x"></i>
        <h3>Category Not Found</h3>
        <p>The category you're looking for doesn't exist.</p>
        <router-link to="/categories" class="btn-back">
          <i class="bi bi-arrow-left"></i>
          Back to Categories
        </router-link>
      </div>

      <!-- Detail Content -->
      <div v-else class="detail-content">
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <router-link to="/categories" class="btn-back-link">
              <i class="bi bi-arrow-left"></i>
              Back
            </router-link>
            <div class="category-title">
              <div class="category-icon-large" :style="{ backgroundColor: category.color }">
                <i :class="category.icon || 'bi-tag'"></i>
              </div>
              <div class="category-info">
                <h1>{{ category.name }}</h1>
                <span :class="['category-type', category.type]">
                  <i :class="category.type === 'income' ? 'bi bi-arrow-down' : 'bi bi-arrow-up'"></i>
                  {{ category.type === 'income' ? 'Income' : 'Expense' }}
                </span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-action" @click="editCategory">
              <i class="bi bi-pencil"></i>
              Edit
            </button>
            <button class="btn-action btn-primary" @click="addTransaction">
              <i class="bi bi-plus-lg"></i>
              Add Transaction
            </button>
          </div>
        </div>

        <!-- Empty State (No Transactions) -->
        <div v-if="categoryTransactions.length === 0" class="empty-transactions">
          <i class="bi bi-inbox"></i>
          <h3>No Transactions Yet</h3>
          <p>This category has no transactions. Start tracking your expenses by adding one.</p>
          <button class="btn-primary" @click="addTransaction">
            <i class="bi bi-plus-lg"></i>
            Add First Transaction
          </button>
        </div>

        <!-- Statistics and Charts -->
        <template v-else>
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon total">
                <i class="bi bi-wallet2"></i>
              </div>
              <div class="stat-info">
                <h3>Total {{ category.type === 'income' ? 'Income' : 'Expense' }}</h3>
                <p class="stat-value">¥{{ formatCurrency(stats.totalAmount) }}</p>
                <span class="stat-subtitle">{{ stats.transactionCount }} transactions</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon month">
                <i class="bi bi-calendar3"></i>
              </div>
              <div class="stat-info">
                <h3>This Month</h3>
                <p class="stat-value">¥{{ formatCurrency(stats.thisMonth) }}</p>
                <span class="stat-subtitle">{{ getCurrentMonthName() }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" :class="stats.monthOverMonth >= 0 ? 'up' : 'down'">
                <i :class="stats.monthOverMonth >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
              </div>
              <div class="stat-info">
                <h3>vs Last Month</h3>
                <p class="stat-value" :class="stats.monthOverMonth >= 0 ? 'negative' : 'positive'">
                  {{ stats.monthOverMonth >= 0 ? '+' : '' }}{{ Math.abs(stats.monthOverMonth).toFixed(1) }}%
                </p>
                <span class="stat-subtitle">Month over Month</span>
              </div>
            </div>
          </div>

          <!-- Percentage Card -->
          <div class="percentage-card">
            <div class="percentage-header">
              <h3>
                <i class="bi bi-pie-chart"></i>
                Share of Total {{ category.type === 'income' ? 'Income' : 'Expense' }}
              </h3>
            </div>
            <div class="percentage-body">
              <div class="percentage-info">
                <span class="percentage-value">{{ stats.percentage.toFixed(1) }}%</span>
                <span class="percentage-label">
                  of total {{ category.type === 'income' ? 'income' : 'expenses' }}
                </span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: Math.min(stats.percentage, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trend Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>
                <i class="bi bi-graph-up"></i>
                6-Month Trend
              </h3>
            </div>
            <div class="chart-body">
              <canvas ref="trendChartRef"></canvas>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="transactions-card">
            <div class="transactions-header">
              <h3>
                <i class="bi bi-clock-history"></i>
                Recent Transactions
              </h3>
              <router-link to="/transactions" class="view-all-link">
                View All <i class="bi bi-arrow-right-short"></i>
              </router-link>
            </div>
            <div class="transactions-list">
              <div
                v-for="transaction in recentTransactions"
                :key="transaction._id"
                class="transaction-item"
              >
                <div class="transaction-icon" :class="category.type">
                  <i :class="category.icon || 'bi-tag'"></i>
                </div>
                <div class="transaction-info">
                  <div class="transaction-date">{{ formatDate(transaction.transaction_date) }}</div>
                  <div class="transaction-amount" :class="category.type">
                    {{ category.type === 'income' ? '+' : '-' }} ¥{{ formatCurrency(transaction.amount) }}
                  </div>
                  <div class="transaction-description">
                    {{ transaction.description || 'No description' }}
                  </div>
                </div>
                <div class="transaction-actions">
                  <button class="action-btn edit" @click="editTransaction(transaction)" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="action-btn delete" @click="confirmDeleteTransaction(transaction)" title="Delete">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Category</h3>
          <button class="close-btn" @click="closeEditModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleUpdateCategory">
            <div class="form-group">
              <label>Category Name</label>
              <input
                v-model="editFormData.name"
                type="text"
                class="form-control"
                placeholder="Enter category name"
                required
                maxlength="50"
              />
            </div>
            <div class="form-group">
              <label>Icon</label>
              <div class="icon-selector">
                <div
                  v-for="icon in availableIcons"
                  :key="icon"
                  :class="['icon-option', { active: editFormData.icon === icon }]"
                  @click="editFormData.icon = icon"
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
                  :class="['color-option', { active: editFormData.color === color }]"
                  :style="{ backgroundColor: color }"
                  @click="editFormData.color = color"
                >
                  <i v-if="editFormData.color === color" class="bi bi-check-lg"></i>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeEditModal">
                Cancel
              </button>
              <button type="submit" class="btn-submit" :disabled="isSubmitting">
                <span v-if="isSubmitting">
                  <i class="bi bi-arrow-repeat spinner-icon"></i>
                  Updating...
                </span>
                <span v-else>
                  <i class="bi bi-check-lg"></i>
                  Update
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Transaction Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Delete Transaction</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-confirmation">
            <i class="bi bi-exclamation-triangle"></i>
            <p>Are you sure you want to delete this transaction?</p>
            <p class="transaction-amount-display">
              <strong>{{ transactionToDelete?.description || transactionToDelete?.category }}</strong>
              <br>
              {{ category.type === 'income' ? '+' : '-' }} ¥{{ formatCurrency(transactionToDelete?.amount || 0) }}
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeDeleteModal">
              Cancel
            </button>
            <button type="button" class="btn-delete-confirm" @click="handleDeleteTransaction" :disabled="isDeleting">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import Chart from 'chart.js/auto'
import { getCategoryById, updateCategory } from '../api/categories'
import { getTransactions, deleteTransaction } from '../api/transactions'

const route = useRoute()
const router = useRouter()

// State
const category = ref(null)
const categoryTransactions = ref([])
const allTransactions = ref([])
const isLoading = ref(true)
const error = ref('')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const transactionToDelete = ref(null)
const trendChartRef = ref(null)
let trendChart = null

// Edit form data
const editFormData = ref({
  name: '',
  icon: '',
  color: ''
})

// Available icons and colors (same as Categories.vue)
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

// Statistics
const stats = computed(() => {
  if (categoryTransactions.value.length === 0) {
    return {
      totalAmount: 0,
      transactionCount: 0,
      thisMonth: 0,
      lastMonth: 0,
      monthOverMonth: 0,
      percentage: 0
    }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Total amount
  const totalAmount = categoryTransactions.value
    .reduce((sum, t) => sum + t.amount, 0)

  // This month
  const thisMonthTransactions = categoryTransactions.value.filter(t => {
    const date = new Date(t.transaction_date)
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  })
  const thisMonth = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Last month
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const lastMonthTransactions = categoryTransactions.value.filter(t => {
    const date = new Date(t.transaction_date)
    return date.getFullYear() === lastMonthDate.getFullYear() && date.getMonth() === lastMonthDate.getMonth()
  })
  const lastMonth = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Month over month
  let monthOverMonth = 0
  if (lastMonth > 0) {
    monthOverMonth = ((thisMonth - lastMonth) / lastMonth) * 100
  }

  // Percentage of total
  const sameTypeTransactions = allTransactions.value.filter(t => t.type === category.value.type)
  const totalTypeAmount = sameTypeTransactions.reduce((sum, t) => sum + t.amount, 0)
  const percentage = totalTypeAmount > 0 ? (totalAmount / totalTypeAmount) * 100 : 0

  return {
    totalAmount,
    transactionCount: categoryTransactions.value.length,
    thisMonth,
    lastMonth,
    monthOverMonth,
    percentage
  }
})

// Recent transactions (last 10)
const recentTransactions = computed(() => {
  return [...categoryTransactions.value]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 10)
})

// Monthly trend data
const monthlyTrend = computed(() => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const last6Months = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`
    })
  }

  const monthlyData = last6Months.map(({ year, month, label }) => {
    const monthTransactions = categoryTransactions.value.filter(t => {
      const date = new Date(t.transaction_date)
      return date.getFullYear() === year && date.getMonth() === month
    })

    const amount = monthTransactions.reduce((sum, t) => sum + t.amount, 0)

    return {
      month: label,
      amount
    }
  })

  return monthlyData
})

// Format currency
const formatCurrency = (amount) => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Get current month name
const getCurrentMonthName = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
}

// Show toast
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

// Load category data
const loadCategory = async () => {
  try {
    const response = await getCategoryById(route.params.id)
    if (response.success && response.data) {
      category.value = response.data
    } else {
      error.value = 'Failed to load category'
    }
  } catch (err) {
    console.error('Error loading category:', err)
    error.value = 'Failed to load category'
  }
}

// Load transactions
const loadTransactions = async () => {
  try {
    const response = await getTransactions()
    if (response.success && response.data) {
      allTransactions.value = response.data
      // Filter transactions for this category
      categoryTransactions.value = response.data.filter(t => t.category === category.value?.name)
    }
  } catch (err) {
    console.error('Error loading transactions:', err)
  }
}

// Initialize chart
const initChart = () => {
  if (trendChart) {
    trendChart.destroy()
  }

  if (trendChartRef.value && monthlyTrend.value.length > 0) {
    trendChart = new Chart(trendChartRef.value, {
      type: 'line',
      data: {
        labels: monthlyTrend.value.map(d => d.month),
        datasets: [{
          label: category.value.name,
          data: monthlyTrend.value.map(d => d.amount),
          borderColor: category.value.color || '#9CAF9A',
          backgroundColor: (category.value.color || '#9CAF9A') + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: category.value.color || '#9CAF9A',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `¥${formatCurrency(context.raw)}`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(180, 170, 160, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return '¥' + formatCurrency(value)
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    })
  }
}

// Edit category
const editCategory = () => {
  editFormData.value = {
    name: category.value.name,
    icon: category.value.icon || 'bi-tag',
    color: category.value.color || '#9CAF9A'
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const handleUpdateCategory = async () => {
  isSubmitting.value = true
  try {
    const response = await updateCategory(category.value._id, {
      name: editFormData.value.name,
      icon: editFormData.value.icon,
      color: editFormData.value.color
    })

    if (response.success) {
      showToast('Category updated successfully')
      await loadCategory()
      closeEditModal()
    } else {
      showToast(response.message || 'Failed to update category', 'error')
    }
  } catch (err) {
    console.error('Error updating category:', err)
    showToast('Failed to update category', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Add transaction
const addTransaction = () => {
  router.push({
    path: '/transactions',
    query: { categoryId: category.value._id, categoryName: category.value.name }
  })
}

// Edit transaction
const editTransaction = (transaction) => {
  router.push({
    path: '/transactions',
    query: { editId: transaction._id }
  })
}

// Confirm delete transaction
const confirmDeleteTransaction = (transaction) => {
  transactionToDelete.value = transaction
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  transactionToDelete.value = null
}

const handleDeleteTransaction = async () => {
  isDeleting.value = true
  try {
    const response = await deleteTransaction(transactionToDelete.value._id)
    if (response.success) {
      showToast('Transaction deleted successfully')
      closeDeleteModal()
      await loadTransactions()
      initChart()
    } else {
      showToast(response.message || 'Failed to delete transaction', 'error')
      closeDeleteModal()
    }
  } catch (err) {
    console.error('Error deleting transaction:', err)
    showToast('Failed to delete transaction', 'error')
    closeDeleteModal()
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await loadCategory()
  if (category.value) {
    await loadTransactions()
    isLoading.value = false
    setTimeout(() => {
      initChart()
    }, 100)
  } else {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.destroy()
  }
})
</script>

<style scoped>
.category-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.category-detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
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

.error-state i {
  font-size: 64px;
  color: #C9A9A6;
  margin-bottom: 24px;
}

.error-state h3 {
  margin: 0 0 8px;
  color: #5C5B5A;
  font-size: 24px;
}

.error-state p {
  margin: 0 0 32px;
  color: #9B9792;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9CAF9A;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.btn-back-link:hover {
  color: #7C9A7A;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-info h1 {
  margin: 0;
  color: #5C5B5A;
  font-size: 32px;
}

.category-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.category-type.income {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.category-type.expense {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px solid #F0EAE2;
  background: white;
  border-radius: 12px;
  color: #5C5B5A;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-action:hover {
  border-color: #9CAF9A;
  background: rgba(159, 175, 154, 0.1);
}

.btn-action.btn-primary {
  background: linear-gradient(135deg, #7C9A7A 0%, #5B7A59 100%);
  border-color: transparent;
  color: white;
}

.btn-action.btn-primary:hover {
  transform: translateY(-1px);
}

/* Empty Transactions State */
.empty-transactions {
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

.empty-transactions i {
  font-size: 64px;
  color: #9CAF9A;
  margin-bottom: 24px;
}

.empty-transactions h3 {
  margin: 0 0 8px;
  color: #5C5B5A;
  font-size: 24px;
}

.empty-transactions p {
  margin: 0 0 32px;
  color: #9B9792;
  font-size: 16px;
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

.btn-primary:hover {
  transform: translateY(-2px);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.stat-icon.month {
  background: rgba(168, 191, 204, 0.2);
  color: #8FBCAA;
}

.stat-icon.up {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.stat-icon.down {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.stat-info h3 {
  margin: 0;
  font-size: 14px;
  color: #9B9792;
  font-weight: 500;
}

.stat-value {
  margin: 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: #5C5B5A;
}

.stat-value.positive {
  color: #7C9A7A;
}

.stat-value.negative {
  color: #C9A9A6;
}

.stat-subtitle {
  font-size: 12px;
  color: #C0BAB2;
}

/* Percentage Card */
.percentage-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.percentage-header h3 {
  margin: 0;
  color: #5C5B5A;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage-body {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.percentage-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.percentage-value {
  font-size: 36px;
  font-weight: 700;
  color: #5C5B5A;
}

.percentage-label {
  font-size: 14px;
  color: #9B9792;
}

.progress-bar-container {
  flex: 1;
  min-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(245, 240, 232, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7C9A7A 0%, #5B7A59 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

/* Chart Card */
.chart-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0 0 20px;
  color: #5C5B5A;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-body {
  height: 300px;
  position: relative;
}

/* Transactions Card */
.transactions-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
}

.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.transactions-header h3 {
  margin: 0;
  color: #5C5B5A;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-all-link {
  color: #9CAF9A;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  transition: color 0.2s ease;
}

.view-all-link:hover {
  color: #7C9A7A;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(245, 240, 232, 0.5);
  border-radius: 16px;
  transition: background 0.2s ease;
}

.transaction-item:hover {
  background: rgba(245, 240, 232, 0.8);
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.transaction-icon.income {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.transaction-icon.expense {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.transaction-info {
  flex: 1;
}

.transaction-date {
  font-size: 12px;
  color: #C0BAB2;
  margin-bottom: 4px;
}

.transaction-amount {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.transaction-amount.income {
  color: #7C9A7A;
}

.transaction-amount.expense {
  color: #C9A9A6;
}

.transaction-description {
  font-size: 14px;
  color: #5C5B5A;
}

.transaction-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 16px;
}

.action-btn.edit {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.action-btn.edit:hover {
  background: rgba(159, 175, 154, 0.3);
}

.action-btn.delete {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.action-btn.delete:hover {
  background: rgba(201, 169, 166, 0.3);
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  background: linear-gradient(135deg, #C9A9A6 0%, #A88A87 100%);
  color: white;
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

.transaction-amount-display {
  padding: 12px;
  background: rgba(245, 240, 232, 0.5);
  border-radius: 12px;
  margin: 16px 0;
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
  .category-detail-content {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .percentage-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .progress-bar-container {
    width: 100%;
  }

  .category-icon-large {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }

  .category-info h1 {
    font-size: 24px;
  }

  .transaction-item {
    flex-wrap: wrap;
  }

  .transaction-actions {
    margin-left: auto;
  }

  .toast {
    left: 20px;
    right: 20px;
  }
}
</style>
