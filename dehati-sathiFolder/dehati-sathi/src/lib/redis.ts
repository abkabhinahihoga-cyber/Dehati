import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    family: 4, // Force IPv4. Fixes "Reached the max retries per request limit" on Windows
});

// Suppress unhandled error events so they don't crash the process
redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Redis connection error (non-fatal):', err.message);
    }
});

export default redis;