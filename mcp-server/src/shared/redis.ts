import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;
const CONNECT_TIMEOUT = 5000;

export async function getRedis(url: string): Promise<RedisClientType> {
  if (client?.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const redis = createClient({
      url,
      socket: {
        connectTimeout: CONNECT_TIMEOUT,
        reconnectStrategy: (retries) => (retries > 3 ? new Error('Redis connection failed after 3 retries') : Math.min(retries * 100, 1000)),
      },
    });

    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), CONNECT_TIMEOUT)),
    ]);

    client = redis;
    connecting = null;
    return redis;
  })();

  return connecting;
}

export async function scanKeys(pattern: string, limit = 1000): Promise<string[]> {
  if (!client?.isOpen) return [];
  const keys: string[] = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
    if (keys.length >= limit) break;
  }
  return keys;
}
