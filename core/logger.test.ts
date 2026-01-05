import { describe, it, expect } from 'vitest';
import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
    it('should create log entries with correct structure', () => {
        const logs = Logger.getRecentLogs();
        const initialCount = logs.length;

        Logger.info('Test action', { key: 'value' });

        const updatedLogs = Logger.getRecentLogs();
        expect(updatedLogs.length).toBe(initialCount + 1);

        const lastLog = updatedLogs[updatedLogs.length - 1];
        expect(lastLog).toMatchObject({
            level: LogLevel.INFO,
            action: 'Test action',
            context: { key: 'value' },
        });
        expect(lastLog.timestamp).toBeDefined();
    });

    it('should handle error logging with Error objects', () => {
        const error = new Error('Test error');
        Logger.error('Error occurred', error);

        const logs = Logger.getRecentLogs();
        const lastLog = logs[logs.length - 1];

        expect(lastLog.level).toBe(LogLevel.ERROR);
        expect(lastLog.error).toBeInstanceOf(Error);
        expect(lastLog.error?.message).toBe('Test error');
    });

    it('should maintain log buffer with max size', () => {
        Logger.clearBuffer();

        // Add more than buffer size
        for (let i = 0; i < 150; i++) {
            Logger.info(`Log ${i}`);
        }

        const logs = Logger.getRecentLogs();
        expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should clear buffer when requested', () => {
        Logger.info('Test');
        expect(Logger.getRecentLogs().length).toBeGreaterThan(0);

        Logger.clearBuffer();
        expect(Logger.getRecentLogs().length).toBe(0);
    });
});
