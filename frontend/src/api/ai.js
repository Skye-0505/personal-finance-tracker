import fetchApi from './base'

/**
 * Analyze user's spending using AI
 * @returns {Promise} AI analysis result
 */
export const analyzeSpending = async () => {
  return fetchApi('/ai/analyze', {
    method: 'POST'
  })
}
