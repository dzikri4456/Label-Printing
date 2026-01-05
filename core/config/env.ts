/**
 * Environment Configuration
 * 
 * Validates and provides type-safe access to environment variables.
 * Fails fast on startup if required variables are missing.
 */

interface EnvironmentConfig {
    nodeEnv: 'development' | 'production' | 'test';
    appName: string;
    appVersion: string;
    enableDebugLogging: boolean;
}

class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

function getEnvVar(key: string, required: boolean = true): string {
    const value = (import.meta as any).env?.[key];

    if (required && !value) {
        throw new ConfigurationError(
            `Missing required environment variable: ${key}\n` +
            `Please check your .env.local file and ensure ${key} is set.\n` +
            `See .env.example for reference.`
        );
    }

    return value || '';
}

function validateEnvironment(): EnvironmentConfig {
    const config: EnvironmentConfig = {
        nodeEnv:
            ((import.meta as any).env?.MODE as EnvironmentConfig['nodeEnv']) || 'development',
        appName: getEnvVar('VITE_APP_NAME', false) || 'Precision Label Architect',
        appVersion: getEnvVar('VITE_APP_VERSION', false) || '1.0.0',
        enableDebugLogging: getEnvVar('VITE_ENABLE_DEBUG_LOGGING', false) === 'true',
    };

    return config;
}

// Validate on module load (fail fast)
export const env = validateEnvironment();

// Log configuration in development
if (env.nodeEnv === 'development') {
    console.log('[Config] Environment loaded:', {
        nodeEnv: env.nodeEnv,
        appName: env.appName,
        appVersion: env.appVersion,
        enableDebugLogging: env.enableDebugLogging,
    });
}
