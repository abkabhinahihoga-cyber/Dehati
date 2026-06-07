const Redis = require('ioredis');
const redisUrl = "rediss://default:AX4rAAIncDE3NzNhMzQ4Y2YxMTI0YjY2YTM1ZGU3NGExNWI4NzdlZXAxMzIyOTk@smart-chow-32299.upstash.io:6379";

console.log("Connecting to Redis...");
const redis = new Redis(redisUrl, {
    tls: { rejectUnauthorized: false },
    family: 4
});

redis.on('error', (err) => {
    console.error('Redis Error:', err);
});

async function run() {
    try {
        await redis.set('test', '123');
        const val = await redis.get('test');
        console.log("Redis connected and working! test =", val);
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        redis.quit();
    }
}
run();
