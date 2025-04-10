// utils.js

/**
 * Retry wrapper for async functions (like Notion API calls)
 * @param {Function} fn - Async function to retry
 * @param {number} attempts - Number of retry attempts (default: 2)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise<*>}
 */
async function withRetry(fn, attempts = 2, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.warn(`Retrying after error: ${error.message}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

module.exports = {
  withRetry
};
