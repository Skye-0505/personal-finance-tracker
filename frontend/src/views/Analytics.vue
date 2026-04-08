<template>
  <div class="analytics-container">
    <NavBar />

    <div class="analytics-content">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1><i class="bi bi-bar-chart"></i> Analytics Center</h1>
          <p class="page-subtitle">Gain insights into your spending patterns</p>
        </div>
        <button class="btn-export" @click="exportReport">
          <i class="bi bi-download"></i>
          Export Report
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading analytics data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="transactions.length === 0" class="empty-state">
        <i class="bi bi-bar-chart"></i>
        <h3>No Transaction Data</h3>
        <p>Add some transactions to see detailed analytics</p>
        <router-link to="/transactions" class="btn-primary">
          <i class="bi bi-plus-lg"></i>
          Add Transactions
        </router-link>
      </div>

      <!-- Analytics Content -->
      <div v-else class="analytics-modules">
        <!-- Global Filters -->
        <div class="filters-card">
          <div class="filter-group">
            <label><i class="bi bi-calendar3"></i> Year</label>
            <select v-model="selectedYear" @change="refreshAllData" class="filter-select">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label><i class="bi bi-arrows-angle-expand"></i> Comparison</label>
            <select v-model="comparisonMode" @change="refreshComparison" class="filter-select">
              <option value="thisVsLastMonth">This Month vs Last Month</option>
              <option value="thisQuarterVsLastQuarter">This Quarter vs Last Quarter</option>
              <option value="thisYearVsLastYear">This Year vs Last Year</option>
            </select>
          </div>
        </div>

        <!-- Module 1: Yearly Calendar Heatmap -->
        <div class="chart-card full-width">
          <div class="card-header">
            <h3><i class="bi bi-calendar3"></i> Yearly Spending Heatmap</h3>
          </div>
          <div class="card-body">
            <div ref="heatmapChartRef" class="chart-container" style="height: 300px;"></div>
          </div>
        </div>

        <!-- Module 2 & 5: Comparison and Weekly Pattern -->
        <div class="chart-row">
          <div class="chart-card half-width">
            <div class="card-header">
              <h3><i class="bi bi-bar-chart"></i> Spending Comparison</h3>
            </div>
            <div class="card-body">
              <div ref="comparisonChartRef" class="chart-container" style="height: 300px;"></div>
            </div>
          </div>

          <div class="chart-card half-width">
            <div class="card-header">
              <h3><i class="bi bi-calendar-week"></i> Weekly Spending Pattern</h3>
            </div>
            <div class="card-body">
              <div ref="weeklyChartRef" class="chart-container" style="height: 300px;"></div>
            </div>
          </div>
        </div>

        <!-- Module 3: AI Insights -->
        <div class="chart-card full-width ai-card">
          <div class="card-header">
            <h3><i class="bi bi-robot"></i> AI Spending Insights</h3>
            <button @click="generateAIReport" :disabled="isGeneratingReport" class="btn-generate">
              <i v-if="isGeneratingReport" class="bi bi-arrow-repeat spinner-icon"></i>
              <i v-else class="bi bi-magic"></i>
              {{ isGeneratingReport ? 'Generating...' : 'Generate Report' }}
            </button>
          </div>
          <div class="card-body">
            <!-- No Report State -->
            <div v-if="!aiReport" class="ai-placeholder">
              <i class="bi bi-lightbulb"></i>
              <p>Click "Generate Report" to get AI-powered spending insights and recommendations</p>
            </div>

            <!-- Report Content -->
            <div v-else class="ai-report-content" v-html="formattedAIReport"></div>

            <!-- Loading State -->
            <div v-if="isGeneratingReport" class="ai-loading">
              <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>AI is analyzing your spending data...</p>
            </div>
          </div>
        </div>

        <!-- Selected Day Transactions (shown when clicking on heatmap) -->
        <div v-if="selectedDayTransactions.length > 0" class="chart-card full-width">
          <div class="card-header">
            <h3>
              <i class="bi bi-calendar-day"></i>
              Transactions for {{ selectedDayDate }}
            </h3>
            <button @click="closeDayTransactions" class="btn-close-day">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="card-body">
            <div class="transactions-list">
              <div
                v-for="transaction in selectedDayTransactions"
                :key="transaction._id"
                class="transaction-item"
              >
                <div class="transaction-info">
                  <div class="transaction-amount" :class="transaction.type">
                    {{ transaction.type === 'income' ? '+' : '-' }} ¥{{ formatCurrency(transaction.amount) }}
                  </div>
                  <div class="transaction-description">
                    {{ transaction.description || 'No description' }}
                  </div>
                  <div class="transaction-date">
                    {{ transaction.category }}
                  </div>
                </div>
              </div>
            </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import * as echarts from 'echarts'
import { getTransactions } from '@/api/transactions'
import { analyzeSpending } from '@/api/ai'

const router = useRouter()

// State
const transactions = ref([])
const isLoading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const comparisonMode = ref('thisVsLastMonth')
const selectedDayTransactions = ref([])
const selectedDayDate = ref('')

// AI Report
const aiReport = ref('')
const isGeneratingReport = ref(false)

// Chart refs
const heatmapChartRef = ref(null)
const comparisonChartRef = ref(null)
const weeklyChartRef = ref(null)

// Chart instances
let heatmapChart = null
let comparisonChart = null
let weeklyChart = null

// Toast
const toast = ref({
  show: false,
  message: '',
  type: 'success',
  icon: 'bi bi-check-circle'
})

// Available years
const availableYears = computed(() => {
  const years = new Set()
  const currentYear = new Date().getFullYear()

  transactions.value.forEach(t => {
    const date = new Date(t.transaction_date)
    years.add(date.getFullYear())
  })

  // Add current year even if no transactions
  years.add(currentYear)

  return Array.from(years).sort((a, b) => b - a)
})

// Computed data
const yearlyExpenseData = computed(() => {
  const dailyExpenses = {}

  transactions.value
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = new Date(t.transaction_date)
      if (date.getFullYear() === selectedYear.value) {
        const dateStr = date.toISOString().split('T')[0]
        dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + t.amount
      }
    })

  return dailyExpenses
})

const comparisonData = computed(() => {
  const now = new Date()
  let periodAStart, periodAEnd, periodBStart, periodBEnd

  switch (comparisonMode.value) {
    case 'thisVsLastMonth':
      // This month
      periodAStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodAEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      // Last month
      periodBStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      periodBEnd = new Date(now.getFullYear(), now.getMonth(), 1)
      break

    case 'thisQuarterVsLastQuarter':
      // This quarter
      const currentQuarter = Math.floor(now.getMonth() / 3)
      periodAStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
      periodAEnd = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0)
      // Last quarter
      periodBStart = new Date(now.getFullYear(), currentQuarter * 3 - 3, 1)
      periodBEnd = new Date(now.getFullYear(), currentQuarter * 3, 1)
      break

    case 'thisYearVsLastYear':
      // This year
      periodAStart = new Date(now.getFullYear(), 0, 1)
      periodAEnd = new Date(now.getFullYear() + 1, 0, 1)
      // Last year
      periodBStart = new Date(now.getFullYear() - 1, 0, 1)
      periodBEnd = new Date(now.getFullYear(), 0, 1)
      break
  }

  const periodAData = getCategoryExpenses(periodAStart, periodAEnd)
  const periodBData = getCategoryExpenses(periodBStart, periodBEnd)

  const categories = [...new Set([...periodAData.keys(), ...periodBData.keys()])]

  return {
    categories,
    periodAData: categories.map(cat => periodAData.get(cat) || 0),
    periodBData: categories.map(cat => periodBData.get(cat) || 0),
    changes: categories.map(cat => {
      const a = periodAData.get(cat) || 0
      const b = periodBData.get(cat) || 0
      return b > 0 ? ((a - b) / b * 100) : 0
    })
  }
})

const weeklyPatternData = computed(() => {
  const dayExpenses = [0, 0, 0, 0, 0, 0, 0] // Mon to Sun
  const counts = [0, 0, 0, 0, 0, 0, 0]

  transactions.value
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = new Date(t.transaction_date)
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert to Mon=0, ..., Sun=6
      dayExpenses[adjustedDay] += t.amount
      counts[adjustedDay]++
    })

  // Calculate averages - if no transactions for a day, average is 0
  const averages = dayExpenses.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0)

  return {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    amounts: averages,
    counts
  }
})

// Helper function to get category expenses
const getCategoryExpenses = (startDate, endDate) => {
  const categoryExpenses = new Map()

  transactions.value
    .filter(t => {
      const date = new Date(t.transaction_date)
      return date >= startDate && date < endDate && t.type === 'expense'
    })
    .forEach(t => {
      categoryExpenses.set(
        t.category,
        (categoryExpenses.get(t.category) || 0) + t.amount
      )
    })

  return categoryExpenses
}

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

// Formatted AI report
const formattedAIReport = computed(() => {
  if (!aiReport.value) return ''

  return aiReport.value
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

// Refresh all data
const refreshAllData = async () => {
  await nextTick()
  setTimeout(() => {
    initHeatmapChart()
    initComparisonChart()
    initWeeklyChart()
  }, 50)
}

const refreshComparison = async () => {
  await nextTick()
  setTimeout(() => {
    initComparisonChart()
  }, 50)
}

// Load transactions
const loadTransactions = async () => {
  isLoading.value = true
  try {
    const response = await getTransactions()
    if (response.success && response.data) {
      transactions.value = response.data
    } else {
      showToast('Failed to load transactions', 'error')
    }
  } catch (error) {
    console.error('Error loading transactions:', error)
    showToast('Failed to load transactions', 'error')
  } finally {
    isLoading.value = false
  }
}

// Initialize Heatmap Chart
const initHeatmapChart = () => {
  if (heatmapChart) {
    heatmapChart.dispose()
  }

  if (!heatmapChartRef.value) return

  const data = yearlyExpenseData.value
  const dates = Object.keys(data).sort()

  if (dates.length === 0) {
    // Show empty state
    return
  }

  const year = selectedYear.value

  // Create heatmap data in correct format for ECharts
  // Format: ['2024-01-01', 100]
  const heatmapData = dates.map(dateStr => {
    return [dateStr, data[dateStr]]
  })

  const maxAmount = Math.max(...heatmapData.map(d => d[1]))

  heatmapChart = echarts.init(heatmapChartRef.value)
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const data = params.data
        const dateStr = data[0]
        const amount = data[1]
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${dateStr}</div>
            <div>Expenses: ¥${formatCurrency(amount)}</div>
          </div>
        `
      }
    },
    visualMap: {
      min: 0,
      max: maxAmount > 0 ? maxAmount : 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#F5F0E8', '#E8E2D9', '#D4CDC3', '#C9A9A6', '#A88A87', '#9CAF9A', '#7C9A7A']
      }
    },
    calendar: {
      top: 40,
      left: 30,
      right: 30,
      bottom: 20,
      range: year,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F0EAE2',
          width: 1
        }
      },
      dayLabel: {
        firstDay: 1,
        margin: 5,
        color: '#9B9792',
        fontSize: 12
      },
      monthLabel: {
        name: 'en',
        fontSize: 12,
        color: '#5C5B5A',
        margin: 5
      },
      yearLabel: {
        show: false
      }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData
    }]
  }

  heatmapChart.setOption(option)

  // Add click event
  heatmapChart.off('click')
  heatmapChart.on('click', (params) => {
    const dateStr = params.data[0]

    // Find transactions for this day
    selectedDayTransactions.value = transactions.value.filter(t => {
      const tDate = new Date(t.transaction_date)
      return tDate.toISOString().split('T')[0] === dateStr
    })

    selectedDayDate.value = dateStr
  })
}

// Initialize Comparison Chart
const initComparisonChart = () => {
  if (comparisonChart) {
    comparisonChart.dispose()
  }

  if (!comparisonChartRef.value) return

  const data = comparisonData.value

  comparisonChart = echarts.init(comparisonChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const category = params[0].name
        const periodA = params[0].value
        const periodB = params[1].value
        const change = data.changes[params[0].dataIndex]

        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${category}</div>
            <div>Current Period: ¥${formatCurrency(periodA)}</div>
            <div>Previous Period: ¥${formatCurrency(periodB)}</div>
            <div style="font-size: 12px; color: ${change >= 0 ? '#C9A9A6' : '#7C9A7A'}">
              ${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%
            </div>
          </div>
        `
      }
    },
    legend: {
      bottom: 0,
      left: 'center'
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        color: '#5C5B5A'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#9B9792',
        formatter: (value) => '¥' + formatCurrency(value)
      }
    },
    series: [
      {
        name: 'Current Period',
        type: 'bar',
        data: data.periodAData,
        itemStyle: {
          color: '#9CAF9A'
        }
      },
      {
        name: 'Previous Period',
        type: 'bar',
        data: data.periodBData,
        itemStyle: {
          color: '#C0BAB2'
        }
      }
    ]
  }

  comparisonChart.setOption(option)
}

// Initialize Weekly Chart
const initWeeklyChart = () => {
  if (weeklyChart) {
    weeklyChart.dispose()
  }

  if (!weeklyChartRef.value) {
    console.log('Weekly chart ref not available')
    return
  }

  const data = weeklyPatternData.value

  console.log('Initializing weekly chart with data:', data)

  weeklyChart = echarts.init(weeklyChartRef.value)

  // Check if there's any data
  const hasData = data.amounts.some(amount => amount > 0)
  const maxAmount = Math.max(...data.amounts)

  console.log('Has data:', hasData, 'Max amount:', maxAmount)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const index = params.dataIndex
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${data.days[index]}</div>
            <div>Average Spending: ¥${formatCurrency(data.amounts[index])}</div>
            <div style="font-size: 12px; color: #9B9792;">${data.counts[index]} transactions</div>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.days,
      axisLabel: {
        color: '#5C5B5A',
        interval: 0,
        rotate: 0
      },
      axisLine: {
        lineStyle: {
          color: '#F0EAE2'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: maxAmount > 0 ? undefined : 100,
      axisLabel: {
        color: '#9B9792',
        formatter: (value) => '¥' + formatCurrency(value)
      },
      axisLine: {
        lineStyle: {
          color: '#F0EAE2'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F0EAE2',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'bar',
      data: data.amounts,
      barWidth: '60%',
      itemStyle: {
        color: (params) => {
          const colors = ['#9CAF9A', '#A8BFCC', '#B7A99A', '#C0BAB2', '#C9A9A6', '#A88A87', '#7C9A7A']
          return colors[params.dataIndex % colors.length]
        },
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        }
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params) => {
          return params.value > 0 ? '¥' + formatCurrency(params.value) : '¥0.00'
        },
        color: '#5C5B5A',
        fontSize: 11
      }
    }]
  }

  weeklyChart.setOption(option)
  console.log('Weekly chart initialized successfully')
}

// Initialize Forecast Chart
// Generate AI Report
const generateAIReport = async () => {
  isGeneratingReport.value = true
  try {
    const response = await analyzeSpending()

    if (response.success && response.data && response.data.hasData) {
      aiReport.value = response.data.analysis
      showToast('AI report generated successfully', 'success')
    } else {
      showToast(response.message || 'Unable to generate AI report', 'error')
    }
  } catch (error) {
    console.error('Error generating AI report:', error)
    showToast('Failed to generate AI report', 'error')
  } finally {
    isGeneratingReport.value = false
  }
}

// Close day transactions
const closeDayTransactions = () => {
  selectedDayTransactions.value = []
  selectedDayDate.value = ''
}

// Export report
const exportReport = () => {
  showToast('Export feature coming soon...', 'error')
}

onMounted(async () => {
  await loadTransactions()

  if (transactions.value.length > 0) {
    await nextTick()
    setTimeout(() => {
      initHeatmapChart()
      initComparisonChart()
      initWeeklyChart()
    }, 150)
  }

  // Add window resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Remove resize listener
  window.removeEventListener('resize', handleResize)

  // Dispose charts
  if (heatmapChart) heatmapChart.dispose()
  if (comparisonChart) comparisonChart.dispose()
  if (weeklyChart) weeklyChart.dispose()
})

// Handle window resize
const handleResize = () => {
  if (heatmapChart) heatmapChart.resize()
  if (comparisonChart) comparisonChart.resize()
  if (weeklyChart) weeklyChart.resize()
}
</script>

<style scoped>
.analytics-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F0E8 0%, #E8E2D9 100%);
}

.analytics-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  color: #5C5B5A;
  font-size: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #9B9792;
  font-size: 16px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border: 2px solid #9CAF9A;
  border-radius: 12px;
  color: #7C9A7A;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export:hover {
  background: rgba(159, 175, 154, 0.1);
}

/* Loading and Empty States */
.loading-state,
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
  text-decoration: none;
  transition: transform 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

/* Filters Card */
.filters-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #5C5B5A;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid #F0EAE2;
  border-radius: 12px;
  font-size: 14px;
  color: #5C5B5A;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #9CAF9A;
}

/* Chart Cards */
.analytics-modules {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(92, 91, 90, 0.05);
}

.full-width {
  width: 100%;
}

.half-width {
  flex: 1;
  min-width: 300px;
}

.chart-row {
  display: flex;
  gap: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #5C5B5A;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  position: relative;
}

.chart-container {
  width: 100%;
}

/* AI Card */
.ai-card {
  border: 2px solid rgba(159, 175, 154, 0.2);
}

.btn-generate {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #9CAF9A 0%, #7C9A7A 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(159, 175, 154, 0.3);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.ai-report-content {
  color: #5C5B5A;
  line-height: 1.8;
}

.ai-report-content :deep(p) {
  margin-bottom: 12px;
}

.ai-report-content :deep(strong) {
  color: #7C9A7A;
  font-weight: 600;
}

.ai-report-content :deep(em) {
  color: #9B9792;
  font-style: italic;
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

.btn-close-day {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #C0BAB2;
  padding: 4px;
}

.btn-close-day:hover {
  color: #5C5B5A;
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

.transaction-info {
  flex: 1;
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
  margin-bottom: 4px;
}

.transaction-date {
  font-size: 12px;
  color: #C0BAB2;
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
  .analytics-content {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left h1 {
    font-size: 24px;
  }

  .chart-row {
    flex-direction: column;
  }

  .filters-card {
    flex-direction: column;
    gap: 12px;
  }

  .filter-group {
    width: 100%;
  }

  .toast {
    left: 20px;
    right: 20px;
  }
}
</style>
