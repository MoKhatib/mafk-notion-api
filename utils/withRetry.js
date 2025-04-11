// utils/withRetry.js
export function withRetry(fn, retries = 3, delay = 500) {
  return (async () => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        console.warn(`Retrying (${i + 1}/${retries}) after error:`, err.message);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastError;
  })();
}
