import axios from 'axios';

/**
 * Extracts a user-friendly error message from an API response.
 *
 * Handles:
 * - 400: Bad Request
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 404: Not Found
 * - 409: Conflict (e.g., email already exists)
 * - 422: Unprocessable Entity (Validation Errors)
 * - 500: Internal Server Error
 *
 * @param err The caught error from a try-catch block
 * @param fallbackMessage A generic message to display if no specific error can be extracted
 * @returns A string containing the user-friendly error message
 */
export const extractApiError = (err: unknown, fallbackMessage: string = 'An unexpected error occurred. Please try again.'): string => {
  if (axios.isAxiosError(err) && err.response) {
    const status = err.response.status;
    const detail = err.response.data?.detail || err.response.data?.details || err.response.data?.error;

    // Handle FastAPI / Pydantic validation arrays (422)
    if (status === 422 && Array.isArray(detail)) {
      const messages = detail.map((d: any) => {
        let msg = d.msg || 'Invalid field';
        msg = msg.replace(/^Value error, /i, '');
        
        // Custom overrides for generic Pydantic messages
        if (d.loc?.includes('email') && (msg.includes('valid email') || msg.includes('format'))) {
          msg = 'Please enter a valid email address.';
        }
        if (d.loc?.includes('full_name') && (msg.includes('at least 2') || msg.includes('short') || msg.includes('missing'))) {
          msg = 'Please enter your full name.';
        }
        if (d.loc?.includes('password') && (msg.includes('at least 8') || msg.includes('short'))) {
          msg = 'Password must be at least 8 characters long.';
        }
        return msg;
      });

      const flatMessages = messages.flatMap((m: string) => m.split('\n'));
      
      if (flatMessages.length > 0) {
        if (flatMessages.length === 1) {
          return `❌ ${flatMessages[0]}`;
        }
        const listItems = flatMessages.map((m: string) => `• ${m}`).join('\n');
        return `❌ Please fix the following:\n${listItems}`;
      }
    }

    // Handle generic JSON messages
    if (typeof detail === 'string') {
      if (status === 401) {
        return '❌ Incorrect email or password.';
      }
      if (status === 404) {
        return '❌ User does not exist. Please create an account.';
      }
      return detail.startsWith('❌') ? detail : `❌ ${detail}`;
    }

    // Fallbacks based on status code if no detail string is provided
    switch (status) {
      case 400:
        return '❌ Invalid request. Please check your inputs.';
      case 401:
        return '❌ Incorrect email or password.';
      case 403:
        return '❌ You do not have permission to perform this action.';
      case 404:
        return '❌ User does not exist. Please create an account.';
      case 409:
        return '❌ This email is already registered. Please sign in or use a different email.';
      case 422:
        return '❌ Please check your inputs. Some fields are invalid.';
      case 500:
        return '❌ The server encountered an internal error. Please try again later.';
      default:
        return fallbackMessage.startsWith('❌') ? fallbackMessage : `❌ ${fallbackMessage}`;
    }
  }

  // Network errors or unexpected issues
  if (err instanceof Error) {
    if (err.message === 'Network Error' || (axios.isAxiosError(err) && err.code === 'ERR_NETWORK')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      return 'The server took too long to respond. Please try again later.';
    }
    if (axios.isAxiosError(err) && err.message.includes('timeout')) {
      return 'The server took too long to respond. Please try again later.';
    }
  }

  return fallbackMessage;
};
