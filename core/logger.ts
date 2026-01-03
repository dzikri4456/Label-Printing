/**
 * CENTRALIZED LOGGER UTILITY
 * Provides consistent formatting for application logs.
 */

const formatMessage = (level: string, action: string, details?: any) => {
    const timestamp = new Date().toISOString();
    return `[${level}] [${timestamp}] [${action}]`;
  };
  
  export const Logger = {
    info: (action: string, details?: any) => {
      console.log(formatMessage('INFO', action), details || '');
    },
  
    warn: (action: string, details?: any) => {
      console.warn(formatMessage('WARN', action), details || '');
    },
  
    error: (action: string, error: any) => {
      console.error(formatMessage('ERROR', action), error);
    },
  
    debug: (action: string, details?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatMessage('DEBUG', action), details || '');
      }
    }
  };