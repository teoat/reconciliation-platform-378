FROM rust:1.76-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./

# Build dependencies first to leverage caching
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release
RUN rm -rf src

COPY src ./src

# Rebuild with actual source code
RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

# Create a non-root user
RUN useradd -ms /bin/bash appuser
USER appuser

COPY --from=builder /app/target/release/reconciliation-platform-378 .

EXPOSE 8080

CMD ["./reconciliation-platform-378"]
