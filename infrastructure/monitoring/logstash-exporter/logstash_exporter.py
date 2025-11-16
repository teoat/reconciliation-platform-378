#!/usr/bin/env python3
"""
Logstash Prometheus Exporter
Exposes Logstash metrics in Prometheus format by querying the Logstash HTTP API
"""
import os
import time
import json
import requests
from flask import Flask, Response
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)

# Logstash endpoint
LOGSTASH_ENDPOINT = os.getenv('LOGSTASH_ENDPOINT', 'http://logstash:9600')
SCRAPE_INTERVAL = int(os.getenv('SCRAPE_INTERVAL', '15'))

# Prometheus metrics
logstash_up = Gauge('logstash_up', 'Whether Logstash is up')
logstash_events_in_total = Counter('logstash_pipeline_events_in_total', 'Total events in')
logstash_events_out_total = Counter('logstash_pipeline_events_out_total', 'Total events out')
logstash_events_filtered_total = Counter('logstash_pipeline_events_filtered_total', 'Total events filtered')
logstash_queue_events_count = Gauge('logstash_pipeline_queue_events_count', 'Current queue size')
logstash_jvm_memory_used_bytes = Gauge('logstash_jvm_memory_used_bytes', 'JVM memory used in bytes', ['area'])
logstash_jvm_memory_max_bytes = Gauge('logstash_jvm_memory_max_bytes', 'JVM memory max in bytes', ['area'])
logstash_jvm_memory_used_percent = Gauge('logstash_jvm_memory_used_percent', 'JVM memory used percentage', ['area'])

def scrape_logstash():
    """Scrape metrics from Logstash HTTP API"""
    try:
        response = requests.get(f"{LOGSTASH_ENDPOINT}/_node/stats", timeout=5)
        response.raise_for_status()
        stats = response.json()
        
        # Set up status
        logstash_up.set(1)
        
        # Pipeline events
        pipeline = stats.get('pipelines', {}).get('main', {})
        events = pipeline.get('events', {})
        
        # Update counters (using set to current value since they're counters)
        logstash_events_in_total._value._value = events.get('in', 0)
        logstash_events_out_total._value._value = events.get('out', 0)
        logstash_events_filtered_total._value._value = events.get('filtered', 0)
        
        # Queue metrics
        queue = pipeline.get('queue', {})
        logstash_queue_events_count.set(queue.get('events_count', 0))
        
        # JVM metrics
        jvm = stats.get('jvm', {})
        mem = jvm.get('mem', {})
        heap = mem.get('heap_used_in_bytes', 0)
        heap_max = mem.get('heap_max_in_bytes', 0)
        heap_percent = mem.get('heap_used_percent', 0)
        
        logstash_jvm_memory_used_bytes.labels(area='heap').set(heap)
        logstash_jvm_memory_max_bytes.labels(area='heap').set(heap_max)
        logstash_jvm_memory_used_percent.labels(area='heap').set(heap_percent)
        
        return True
    except Exception as e:
        print(f"Error scraping Logstash: {e}")
        logstash_up.set(0)
        return False

@app.route('/metrics')
def metrics():
    """Expose Prometheus metrics"""
    scrape_logstash()
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

@app.route('/health')
def health():
    """Health check endpoint"""
    if scrape_logstash():
        return {'status': 'healthy'}, 200
    return {'status': 'unhealthy'}, 503

@app.route('/')
def index():
    """Index page"""
    return '''
    <html>
        <head><title>Logstash Exporter</title></head>
        <body>
            <h1>Logstash Prometheus Exporter</h1>
            <p><a href="/metrics">Metrics</a></p>
            <p><a href="/health">Health</a></p>
        </body>
    </html>
    '''

if __name__ == '__main__':
    # Initial scrape
    scrape_logstash()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=9198)

