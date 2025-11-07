// Global error handler for unhandled promise rejections
const includesMessage = (value, substring) =>
  typeof value === 'string' && value.includes(substring);

export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Check if it's related to message channels or async listeners
    if (includesMessage(event.reason?.message, 'message channel closed')) {
      console.warn(
        'Message channel error detected - this is likely a browser extension or async listener issue'
      );
      event.preventDefault(); // Prevent the error from showing in console
      return;
    }

    // Check if it's an abort error (expected behavior)
    if (event.reason?.name === 'AbortError') {
      console.warn(
        'Request aborted - this is expected behavior for cancelled requests'
      );
      event.preventDefault();
      return;
    }

    // For other errors, log them but don't prevent default behavior
    console.error('Unhandled promise rejection details:', {
      reason: event.reason,
      promise: event.promise,
      type: event.type,
    });
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Check if it's related to message channels
    if (includesMessage(event.error?.message, 'message channel closed')) {
      console.warn(
        'Message channel error detected - preventing default behavior'
      );
      event.preventDefault();
      return;
    }
  });

  console.log('Global error handlers initialized');
};

// Helper function to safely handle async operations
export const safeAsyncOperation = async (
  operation,
  errorMessage = 'Operation failed'
) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Operation was aborted');
      return null;
    }

    if (includesMessage(error.message, 'message channel closed')) {
      console.warn('Message channel closed during operation');
      return null;
    }

    console.error(errorMessage, error);
    throw error;
  }
};

// Helper function to create a cancellable promise
export const createCancellablePromise = (promise, signal) => {
  return new Promise((resolve, reject) => {
    // Handle abort signal
    if (signal?.aborted) {
      reject(new Error('Operation was cancelled'));
      return;
    }

    signal?.addEventListener('abort', () => {
      reject(new Error('Operation was cancelled'));
    });

    // Handle the original promise
    promise.then(resolve).catch(reject);
  });
};
