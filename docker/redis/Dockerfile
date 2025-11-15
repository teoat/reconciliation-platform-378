FROM redis:7-alpine

# Copy Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Expose port
EXPOSE 6379

# Run Redis with configuration
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
