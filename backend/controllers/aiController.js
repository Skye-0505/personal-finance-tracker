const axios = require('axios');
const Transaction = require('../models/Transaction');

/**
 * Build analysis prompt based on user's transaction data
 * @param {Array} transactions - User's transactions
 * @param {Boolean} isAllTime - Whether to use all time data or last 30 days
 * @returns {String} - Formatted prompt for AI
 */
const buildAnalysisPrompt = (transactions, isAllTime = false) => {
  if (!transactions || transactions.length === 0) {
    return "The user has no transaction data yet. Please tell them to add some transactions first.";
  }

  // Use the provided transactions (already filtered by caller)
  const recentTransactions = transactions;

  const timePeriodText = isAllTime ? 'all time' : 'the last 30 days';

  // Calculate statistics
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Group expenses by category
  const expenseCategories = new Map();
  recentTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const amount = t.amount;
      expenseCategories.set(t.category, (expenseCategories.get(t.category) || 0) + amount);
    });

  // Sort categories by amount
  const topCategories = [...expenseCategories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Build the prompt
  let prompt = `Please analyze the following personal finance data from ${timePeriodText}:\n\n`;
  prompt += `📊 Financial Summary:\n`;
  prompt += `- Total Income: ¥${totalIncome.toFixed(2)}\n`;
  prompt += `- Total Expense: ¥${totalExpense.toFixed(2)}\n`;
  prompt += `- Balance: ¥${balance.toFixed(2)}\n`;
  prompt += `- Total Transactions: ${recentTransactions.length}\n\n`;

  if (topCategories.length > 0) {
    prompt += `💰 Top Expense Categories:\n`;
    topCategories.forEach(([category, amount], index) => {
      const percentage = ((amount / totalExpense) * 100).toFixed(1);
      prompt += `${index + 1}. ${category}: ¥${amount.toFixed(2)} (${percentage}%)\n`;
    });
  } else {
    prompt += `💰 No expense categories found.\n`;
  }

  prompt += `\nPlease provide a friendly and concise analysis (under 200 words) that includes:\n`;
  prompt += `1. A brief summary of their spending habits\n`;
  prompt += `2. 2-3 specific money-saving suggestions\n`;
  prompt += `3. An encouraging closing statement\n\n`;
  prompt += `Make the response warm, conversational, and easy to understand. Use emojis to make it more engaging!`;

  return prompt;
};

/**
 * Call AI API for analysis
 * @param {String} prompt - The prompt to send to AI
 * @returns {Object} - AI response
 */
const callAIAnalysis = async (prompt) => {
  try {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL;
    const modelName = process.env.AI_MODEL_NAME;
    const apiVersion = process.env.AI_API_VERSION;

    if (!apiKey || !baseUrl || !modelName) {
      throw new Error('AI configuration is missing');
    }

    const url = `${baseUrl}/deployments/${modelName}/chat/completions?api-version=${apiVersion}`;

    const headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const payload = {
      messages: [
        {
          role: 'system',
          content: 'You are a friendly and helpful personal finance advisor. You provide concise, practical advice in a warm and encouraging manner. Keep your responses under 200 words and use emojis to make the conversation more engaging.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false
    };

    const response = await axios.post(url, payload, { headers });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return {
        success: true,
        analysis: response.data.choices[0].message.content
      };
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('Error calling AI API:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Analyze user's expenses
 * @route POST /api/ai/analyze
 */
const analyzeExpenses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let transactions = await Transaction.find({
      user_id: userId,
      transaction_date: { $gte: thirtyDaysAgo }
    }).sort({ transaction_date: -1 });

    let dateRange = 'Last 30 days';

    // If no recent transactions, get all transactions
    if (!transactions || transactions.length === 0) {
      transactions = await Transaction.find({
        user_id: userId
      }).sort({ transaction_date: -1 });

      dateRange = 'All time';
    }

    // Check if user has any transactions
    if (!transactions || transactions.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        message: 'No transaction data found. Please add some transactions first.',
        analysis: null
      });
    }

    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(transactions, dateRange === 'All time');

    // Call AI API
    const aiResponse = await callAIAnalysis(prompt);

    res.json({
      success: true,
      hasData: true,
      analysis: aiResponse.analysis,
      summary: {
        transactionCount: transactions.length,
        dateRange: dateRange
      }
    });
  } catch (error) {
    console.error('Error in analyzeExpenses:', error);

    // Check if it's an AI API error
    if (error.response?.status || error.code === 'ECONNREFUSED') {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to AI service. Please try again later.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to analyze expenses',
      error: error.message
    });
  }
};

module.exports = {
  analyzeExpenses
};
