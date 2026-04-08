<template>
  <div class="dashboard-container">
    <!-- Navigation Bar -->
    <NavBar />

    <!-- Main Content -->
    <div class="dashboard-content">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-text">
          <h2>Welcome back, <span class="username">{{ displayName }}!</span></h2>
          <p>Here's your financial overview</p>
        </div>
        <div class="date-badge">
          <i class="bi bi-calendar3"></i>
          <span>{{ currentDate }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your financial data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="transactions.length === 0" class="empty-state">
        <i class="bi bi-receipt"></i>
        <h3>No Transactions Yet</h3>
        <p>Start tracking your finances by adding your first transaction</p>
        <router-link to="/transactions" class="btn-add">
          <i class="bi bi-plus-lg"></i>
          Add First Transaction
        </router-link>
      </div>

      <!-- Dashboard Content -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card income-card">
            <div class="stat-icon">
              <i class="bi bi-arrow-down-circle-fill"></i>
            </div>
            <div class="stat-info">
              <h3>Total Income</h3>
              <p class="stat-value">¥{{ formatCurrency(stats.totalIncome) }}</p>
              <span class="stat-trend positive">
                <i class="bi bi-graph-up"></i> {{ stats.incomeCount }} transactions
              </span>
            </div>
          </div>

          <div class="stat-card expense-card">
            <div class="stat-icon">
              <i class="bi bi-arrow-up-circle-fill"></i>
            </div>
            <div class="stat-info">
              <h3>Total Expense</h3>
              <p class="stat-value">¥{{ formatCurrency(stats.totalExpense) }}</p>
              <span class="stat-trend negative">
                <i class="bi bi-graph-down"></i> {{ stats.expenseCount }} transactions
              </span>
            </div>
          </div>

          <div class="stat-card balance-card">
            <div class="stat-icon">
              <i class="bi bi-wallet2"></i>
            </div>
            <div class="stat-info">
              <h3>Balance</h3>
              <p class="stat-value">¥{{ formatCurrency(stats.balance) }}</p>
              <span :class="['stat-trend', stats.balance >= 0 ? 'positive' : 'negative']">
                <i :class="stats.balance >= 0 ? 'bi bi-arrow-up-short' : 'bi bi-arrow-down-short'"></i>
                {{ stats.balance >= 0 ? 'Positive' : 'Negative' }}
              </span>
            </div>
          </div>

          <div class="stat-card transaction-card">
            <div class="stat-icon">
              <i class="bi bi-receipt"></i>
            </div>
            <div class="stat-info">
              <h3>Transactions</h3>
              <p class="stat-value">{{ transactions.length }}</p>
              <span class="stat-trend neutral">
                <i class="bi bi-calendar3"></i> All time
              </span>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <!-- Category Distribution Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h4><i class="bi bi-pie-chart"></i> Spending by Category</h4>
              <span class="chart-subtitle">Expense distribution</span>
            </div>
            <div class="chart-body">
              <div v-if="categoryData.labels.length === 0" class="no-data">
                <i class="bi bi-inbox"></i>
                <p>No expense data yet</p>
              </div>
              <canvas v-else ref="pieChartRef"></canvas>
            </div>
          </div>

          <!-- Monthly Trend Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h4><i class="bi bi-graph-up"></i> Monthly Trend</h4>
              <span class="chart-subtitle">Last 6 months</span>
            </div>
            <div class="chart-body">
              <div v-if="monthlyData.months.length === 0" class="no-data">
                <i class="bi bi-inbox"></i>
                <p>No data available</p>
              </div>
              <canvas v-else ref="trendChartRef"></canvas>
            </div>
          </div>
        </div>

        <!-- AI Analysis Section -->
        <div class="ai-analysis-section">
          <div class="ai-card">
            <div class="ai-header">
              <div class="ai-title">
                <i class="bi bi-robot"></i>
                <div>
                  <h4>AI Spending Analysis</h4>
                  <span class="ai-subtitle">Get personalized insights powered by AI</span>
                </div>
              </div>
              <button
                @click="analyzeWithAI"
                :disabled="isAnalyzing"
                class="btn-analyze"
              >
                <i v-if="isAnalyzing" class="bi bi-arrow-repeat spinner-icon"></i>
                <i v-else class="bi bi-magic"></i>
                {{ isAnalyzing ? 'Analyzing...' : 'Analyze My Spending' }}
              </button>
            </div>
            <div class="ai-body">
              <!-- No Analysis State -->
              <div v-if="!aiAnalysis && !aiError" class="ai-placeholder">
                <i class="bi bi-lightbulb"></i>
                <p>Click the button above to get AI-powered insights about your spending habits</p>
              </div>

              <!-- Error State -->
              <div v-else-if="aiError" class="ai-error">
                <i class="bi bi-exclamation-triangle"></i>
                <p>{{ aiError }}</p>
                <button @click="analyzeWithAI" class="btn-retry">Try Again</button>
              </div>

              <!-- Analysis Result -->
              <div v-else-if="aiAnalysis" class="ai-result">
                <div class="ai-content" v-html="formatAIResponse(aiAnalysis)"></div>
                <button @click="analyzeWithAI" class="btn-refresh" :disabled="isAnalyzing">
                  <i class="bi bi-arrow-clockwise"></i>
                  Refresh Analysis
                </button>
              </div>

              <!-- Loading State -->
              <div v-if="isAnalyzing" class="ai-loading">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>AI is analyzing your spending patterns...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="recent-section">
          <div class="section-header">
            <h4><i class="bi bi-clock-history"></i> Recent Transactions</h4>
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
              <div class="transaction-icon" :class="transaction.type">
                <i :class="transaction.type === 'income' ? 'bi bi-arrow-down' : 'bi bi-arrow-up'"></i>
              </div>
              <div class="transaction-info">
                <div class="transaction-category">{{ transaction.category }}</div>
                <div class="transaction-description">{{ transaction.description || 'No description' }}</div>
                <div class="transaction-date">{{ formatDate(transaction.transaction_date) }}</div>
              </div>
              <div class="transaction-amount" :class="transaction.type">
                {{ transaction.type === 'income' ? '+' : '-' }} ¥{{ formatCurrency(transaction.amount) }}
              </div>
            </div>

            <div v-if="recentTransactions.length === 0" class="no-transactions">
              <i class="bi bi-inbox"></i>
              <p>No recent transactions</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <router-link to="/transactions" class="action-card">
            <i class="bi bi-plus-circle"></i>
            <span>Add Transaction</span>
          </router-link>
          <a href="#" class="action-card ai-report" @click.prevent="scrollToCharts">
            <i class="bi bi-bar-chart-steps"></i>
            <span>View Reports</span>
          </a>
          <router-link to="/categories" class="action-card">
            <i class="bi bi-tags"></i>
            <span>Categories</span>
          </router-link>
          <router-link to="/profile" class="action-card">
            <i class="bi bi-person-circle"></i>
            <span>Profile</span>
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import NavBar from '../components/NavBar.vue'
import { getTransactions } from '@/api/transactions'
import { analyzeSpending } from '@/api/ai'
import { getCurrentUser } from '../router'

const router = useRouter()

// State
const transactions = ref([])
const isLoading = ref(true)
const pieChartRef = ref(null)
const trendChartRef = ref(null)
let pieChart = null
let trendChart = null

// User
const currentUser = ref(null)

// AI Analysis
const aiAnalysis = ref('')
const isAnalyzing = ref(false)
const aiError = ref('')

// Computed
const displayName = computed(() => {
  return currentUser.value?.username || 'User'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Statistics
const stats = computed(() => {
  const income = transactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = transactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const incomeCount = transactions.value.filter(t => t.type === 'income').length
  const expenseCount = transactions.value.filter(t => t.type === 'expense').length

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    incomeCount,
    expenseCount
  }
})

// Recent transactions (last 5)
const recentTransactions = computed(() => {
  return [...transactions.value]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5)
})

// Category data for pie chart (expenses only)
const categoryData = computed(() => {
  const expenses = transactions.value.filter(t => t.type === 'expense')

  if (expenses.length === 0) {
    return { labels: [], values: [] }
  }

  const categoryMap = new Map()

  expenses.forEach(transaction => {
    const amount = transaction.amount
    categoryMap.set(
      transaction.category,
      (categoryMap.get(transaction.category) || 0) + amount
    )
  })

  // Sort by amount (descending) and take top 5
  const sorted = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    labels: sorted.map(([name]) => name),
    values: sorted.map(([, amount]) => amount)
  }
})

// Monthly data for trend chart
const monthlyData = computed(() => {
  if (transactions.value.length === 0) {
    return { months: [], income: [], expense: [] }
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const last6Months = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: monthNames[date.getMonth()]
    })
  }

  const monthlyIncome = []
  const monthlyExpense = []

  last6Months.forEach(({ year, month }) => {
    const monthTransactions = transactions.value.filter(t => {
      const transactionDate = new Date(t.transaction_date)
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month
    })

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    monthlyIncome.push(income)
    monthlyExpense.push(expense)
  })

  return {
    months: last6Months.map(m => m.label),
    income: monthlyIncome,
    expense: monthlyExpense
  }
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

// Scroll to charts
const scrollToCharts = () => {
  document.querySelector('.charts-grid')?.scrollIntoView({ behavior: 'smooth' })
}

// Load data
const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getTransactions()
    console.log('API Response:', response)

    if (response.success && response.data) {
      // Ensure data is an array
      if (Array.isArray(response.data)) {
        transactions.value = response.data
      } else {
        console.error('Response data is not an array:', response.data)
        transactions.value = []
      }
    } else {
      console.error('Failed to load transactions:', response)
      transactions.value = []
    }
  } catch (error) {
    console.error('Error loading transactions:', error)
    transactions.value = []
  } finally {
    isLoading.value = false
  }
}

// AI Analysis functions
const analyzeWithAI = async () => {
  isAnalyzing.value = true
  aiError.value = ''

  try {
    const response = await analyzeSpending()
    console.log('AI Analysis Response:', response)

    if (response.success) {
      // Check if response.data has the actual data
      const aiData = response.data

      if (aiData && aiData.hasData && aiData.analysis) {
        aiAnalysis.value = aiData.analysis
      } else {
        aiError.value = aiData?.message || response.message || 'No transaction data available for analysis'
        console.log('No data available:', aiData?.message || response.message)
      }
    } else {
      aiError.value = response.message || 'Failed to analyze spending. Please try again.'
    }
  } catch (error) {
    console.error('Error analyzing with AI:', error)
    aiError.value = 'Failed to connect to AI service. Please try again later.'
  } finally {
    isAnalyzing.value = false
  }
}

const formatAIResponse = (text) => {
  // Convert plain text to formatted HTML
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

// Initialize charts
const initCharts = () => {
  // Destroy existing charts
  if (pieChart) {
    pieChart.destroy()
  }
  if (trendChart) {
    trendChart.destroy()
  }

  // Initialize pie chart
  if (pieChartRef.value && categoryData.value.labels.length > 0) {
    pieChart = new Chart(pieChartRef.value, {
      type: 'doughnut',
      data: {
        labels: categoryData.value.labels,
        datasets: [{
          data: categoryData.value.values,
          backgroundColor: [
            '#9CAF9A',
            '#C9A9A6',
            '#A8BFCC',
            '#D4CDC3',
            '#B7A99A'
          ],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ¥${formatCurrency(value)} (${percentage}%)`
              }
            }
          }
        }
      }
    })
  }

  // Initialize trend chart
  if (trendChartRef.value && monthlyData.value.months.length > 0) {
    trendChart = new Chart(trendChartRef.value, {
      type: 'line',
      data: {
        labels: monthlyData.value.months,
        datasets: [
          {
            label: 'Income',
            data: monthlyData.value.income,
            borderColor: '#7C9A7A',
            backgroundColor: 'rgba(124, 154, 122, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#7C9A7A',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Expense',
            data: monthlyData.value.expense,
            borderColor: '#C9A9A6',
            backgroundColor: 'rgba(201, 169, 166, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#C9A9A6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || ''
                const value = context.raw || 0
                return `${label}: ¥${formatCurrency(value)}`
              }
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
    })
  }
}

onMounted(async () => {
  currentUser.value = getCurrentUser()
  await loadData()

  // Initialize charts after data is loaded
  if (!isLoading.value && transactions.value.length > 0) {
    setTimeout(() => {
      initCharts()
    }, 100)
  }
})

onUnmounted(() => {
  if (pieChart) {
    pieChart.destroy()
  }
  if (trendChart) {
    trendChart.destroy()
  }
})
</script>

<style scoped>
/* ==================== Dashboard Styles ==================== */
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Welcome Section */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.welcome-text h2 {
  font-size: 28px;
  color: #5C5B5A;
  margin: 0;
}

.welcome-text .username {
  background: linear-gradient(135deg, #5C5B5A 0%, #9CAF9A 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

.welcome-text p {
  color: #9B9792;
  margin: 4px 0 0;
}

.date-badge {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 14px;
  color: #5C5B5A;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
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

.btn-add {
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
  text-decoration: none;
  transition: transform 0.2s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(92, 91, 90, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.income-card .stat-icon {
  background: rgba(159, 175, 154, 0.2);
  color: #7C9A7A;
}

.expense-card .stat-icon {
  background: rgba(201, 169, 166, 0.2);
  color: #C9A9A6;
}

.balance-card .stat-icon {
  background: rgba(168, 191, 204, 0.2);
  color: #8FBCAA;
}

.transaction-card .stat-icon {
  background: rgba(212, 205, 195, 0.2);
  color: #B7A99A;
}

.stat-info h3 {
  font-size: 14px;
  font-weight: 500;
  color: #9B9792;
  margin: 0 0 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #5C5B5A;
  margin: 0;
}

.stat-trend {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.positive {
  color: #7C9A7A;
}

.stat-trend.negative {
  color: #C9A9A6;
}

.stat-trend.neutral {
  color: #B7A99A;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-header h4 {
  margin: 0;
  color: #5C5B5A;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-subtitle {
  font-size: 12px;
  color: #9B9792;
}

.chart-body {
  height: 280px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #C0BAB2;
  text-align: center;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-data p {
  margin: 0;
  font-size: 14px;
}

/* AI Analysis Section */
.ai-analysis-section {
  margin-bottom: 32px;
}

.ai-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
  flex-wrap: wrap;
  gap: 16px;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-title i {
  font-size: 28px;
  color: #9CAF9A;
}

.ai-title h4 {
  margin: 0;
  color: #5C5B5A;
  font-size: 18px;
}

.ai-subtitle {
  font-size: 13px;
  color: #9B9792;
}

.btn-analyze {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #9CAF9A 0%, #7C9A7A 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  white-space: nowrap;
}

.btn-analyze:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(159, 175, 154, 0.3);
}

.btn-analyze:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ai-body {
  padding: 24px;
  position: relative;
  min-height: 150px;
}

.ai-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #9B9792;
}

.ai-placeholder i {
  font-size: 48px;
  color: #C0BAB2;
  margin-bottom: 16px;
}

.ai-placeholder p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
}

.ai-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  text-align: center;
  background: rgba(201, 169, 166, 0.1);
  border-radius: 16px;
}

.ai-error i {
  font-size: 40px;
  color: #C9A9A6;
  margin-bottom: 12px;
}

.ai-error p {
  margin: 0 0 16px;
  color: #5C5B5A;
  font-size: 14px;
}

.btn-retry {
  padding: 10px 20px;
  background: #C9A9A6;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.btn-retry:hover {
  background: #A88A87;
}

.ai-result {
  position: relative;
}

.ai-content {
  color: #5C5B5A;
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 20px;
}

.ai-content :deep(p) {
  margin-bottom: 12px;
}

.ai-content :deep(strong) {
  color: #7C9A7A;
  font-weight: 600;
}

.ai-content :deep(em) {
  color: #9B9792;
  font-style: italic;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(159, 175, 154, 0.2);
  border: none;
  border-radius: 10px;
  color: #7C9A7A;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(159, 175, 154, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: #9CAF9A;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ai-loading p {
  margin: 0;
  color: #9B9792;
  font-size: 14px;
}

/* Recent Section */
.recent-section {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h4 {
  margin: 0;
  color: #5C5B5A;
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

/* Transactions List */
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

.transaction-category {
  font-weight: 600;
  color: #5C5B5A;
}

.transaction-description {
  font-size: 12px;
  color: #9B9792;
  margin-top: 2px;
}

.transaction-date {
  font-size: 11px;
  color: #C0BAB2;
  margin-top: 4px;
}

.transaction-amount {
  font-weight: 700;
  font-size: 18px;
}

.transaction-amount.income {
  color: #7C9A7A;
}

.transaction-amount.expense {
  color: #C9A9A6;
}

.no-transactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #C0BAB2;
  text-align: center;
}

.no-transactions i {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-transactions p {
  margin: 0;
  font-size: 14px;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #5C5B5A;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(92, 91, 90, 0.1);
}

.action-card i {
  font-size: 28px;
  color: #9CAF9A;
}

.action-card span {
  font-size: 14px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 16px;
  }

  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-text h2 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .transaction-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .dashboard-content {
    padding: 12px;
  }

  .chart-body {
    height: 220px;
  }

  .transaction-item {
    padding: 12px;
  }

  .transaction-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .transaction-amount {
    font-size: 16px;
  }
}
</style>
