FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir prometheus-client requests flask

# Copy exporter script
COPY logstash_exporter.py .

# Expose metrics port
EXPOSE 9198

# Run exporter
CMD ["python", "logstash_exporter.py"]

