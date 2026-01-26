/**
 * Connectivity Test Utility for VitalScan AI
 * Test backend connection and diagnose issues
 */

import { checkHealth, API_BASE_URL } from './apiService';

/**
 * Test backend connectivity and log results
 */
export async function testBackendConnection() {
    console.group('🔌 Backend Connectivity Test');
    console.log('API Base URL:', API_BASE_URL);

    try {
        const startTime = performance.now();
        const result = await checkHealth();
        const duration = performance.now() - startTime;

        console.log('✅ Connection Successful!');
        console.log('Response:', result);
        console.log(`Response Time: ${duration.toFixed(2)}ms`);
        console.groupEnd();

        return {
            success: true,
            status: result.status,
            mode: result.mode,
            responseTime: duration,
        };
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error:', error);
        console.error('Possible causes:');
        console.error('  1. Backend server is not running');
        console.error('  2. Incorrect API_BASE_URL:', API_BASE_URL);
        console.error('  3. CORS configuration issue');
        console.error('  4. Network/firewall blocking connection');
        console.groupEnd();

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Expose to window for browser console testing
 */
if (typeof window !== 'undefined') {
    (window as any).testBackendConnection = testBackendConnection;
    console.log('💡 Tip: Run testBackendConnection() in console to test API connection');
}

export default testBackendConnection;
