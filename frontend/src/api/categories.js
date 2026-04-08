import fetchApi from './base'

/**
 * Get all categories for the current user
 * @returns {Promise} Categories data
 */
export const getCategories = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  const endpoint = `/categories${queryString ? `?${queryString}` : ''}`
  return fetchApi(endpoint, { method: 'GET' })
}

/**
 * Initialize default categories for the current user
 * @returns {Promise} Initialization result
 */
export const initializeCategories = async () => {
  return fetchApi('/categories/init', {
    method: 'POST'
  })
}

/**
 * Get a single category by ID
 * @param {string} id - Category ID
 * @returns {Promise} Category data
 */
export const getCategoryById = async (id) => {
  return fetchApi(`/categories/${id}`, { method: 'GET' })
}

/**
 * Create a new category
 * @param {Object} data - Category data { name, type }
 * @returns {Promise} Created category data
 */
export const createCategory = async (data) => {
  return fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Update a category
 * @param {string} id - Category ID
 * @param {Object} data - Updated category data { name, type }
 * @returns {Promise} Updated category data
 */
export const updateCategory = async (id, data) => {
  return fetchApi(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * Delete a category
 * @param {string} id - Category ID
 * @returns {Promise} Deletion result
 */
export const deleteCategory = async (id) => {
  return fetchApi(`/categories/${id}`, {
    method: 'DELETE'
  })
}
