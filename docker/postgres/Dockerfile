FROM postgres:15-alpine

# Install additional extensions
RUN apk add --no-cache \
    postgresql-contrib \
    postgresql-dev

# Copy initialization scripts
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_DB=reconciliation_db
ENV POSTGRES_USER=reconciliation_user
ENV POSTGRES_PASSWORD=reconciliation_password

# Expose port
EXPOSE 5432
