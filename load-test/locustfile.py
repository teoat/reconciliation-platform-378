"""
Locust Load Testing Script
===========================
Load testing configuration for the Reconciliation Platform API.
Supports configurable workload patterns and comprehensive endpoint testing.
"""

from locust import HttpUser, task, between, events
from locust.runners import MasterRunner
import json
import random
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReconciliationUser(HttpUser):
    """
    Simulates a user interacting with the Reconciliation Platform API.
    """
    
    # Wait time between tasks (1-5 seconds)
    wait_time = between(1, 5)
    
    # Default host (can be overridden via command line)
    host = "http://localhost:2000"
    
    def on_start(self):
        """Called when a simulated user starts."""
        self.auth_token = None
        self.user_id = None
        self.project_ids = []
        
        # Try to authenticate
        try:
            self._login()
        except Exception as e:
            logger.warning(f"Authentication failed: {e}")
    
    def _login(self):
        """Authenticate and get token."""
        response = self.client.post(
            "/api/v2/auth/login",
            json={
                "email": f"loadtest_{random.randint(1, 1000)}@example.com",
                "password": "testpassword123"
            },
            name="/api/v2/auth/login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
            logger.info(f"User authenticated: {self.user_id}")
        else:
            # Create user if login fails
            self._register()
    
    def _register(self):
        """Register a new user."""
        email = f"loadtest_{random.randint(1, 100000)}@example.com"
        response = self.client.post(
            "/api/v2/auth/register",
            json={
                "email": email,
                "password": "testpassword123",
                "name": f"Load Test User {random.randint(1, 1000)}"
            },
            name="/api/v2/auth/register"
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            self.auth_token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
    
    def _get_headers(self):
        """Get headers with authentication."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    # ===========================================================================
    # Health & Status Endpoints
    # ===========================================================================
    
    @task(10)
    def health_check(self):
        """Check service health - high frequency."""
        self.client.get("/health", name="/health")
    
    @task(3)
    def api_info(self):
        """Get API information."""
        self.client.get("/api", name="/api")
    
    @task(2)
    def metrics(self):
        """Get Prometheus metrics."""
        self.client.get("/metrics", name="/metrics")
    
    # ===========================================================================
    # Project Endpoints
    # ===========================================================================
    
    @task(5)
    def list_projects(self):
        """List all projects."""
        self.client.get(
            "/api/v2/projects",
            headers=self._get_headers(),
            name="/api/v2/projects"
        )
    
    @task(2)
    def get_project(self):
        """Get a specific project."""
        if self.project_ids:
            project_id = random.choice(self.project_ids)
            self.client.get(
                f"/api/v2/projects/{project_id}",
                headers=self._get_headers(),
                name="/api/v2/projects/[id]"
            )
    
    @task(1)
    def create_project(self):
        """Create a new project."""
        response = self.client.post(
            "/api/v2/projects",
            headers=self._get_headers(),
            json={
                "name": f"Load Test Project {random.randint(1, 10000)}",
                "description": "Created during load testing"
            },
            name="/api/v2/projects (POST)"
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            project_id = data.get("id")
            if project_id:
                self.project_ids.append(project_id)
    
    # ===========================================================================
    # Reconciliation Endpoints
    # ===========================================================================
    
    @task(5)
    def list_reconciliations(self):
        """List reconciliations."""
        self.client.get(
            "/api/v2/reconciliations",
            headers=self._get_headers(),
            name="/api/v2/reconciliations"
        )
    
    @task(3)
    def list_reconciliations_with_pagination(self):
        """List reconciliations with pagination."""
        page = random.randint(1, 10)
        limit = random.choice([10, 25, 50, 100])
        self.client.get(
            f"/api/v2/reconciliations?page={page}&limit={limit}",
            headers=self._get_headers(),
            name="/api/v2/reconciliations?page&limit"
        )
    
    @task(1)
    def search_reconciliations(self):
        """Search reconciliations."""
        search_terms = ["pending", "completed", "error", "review"]
        term = random.choice(search_terms)
        self.client.get(
            f"/api/v2/reconciliations/search?q={term}",
            headers=self._get_headers(),
            name="/api/v2/reconciliations/search"
        )
    
    # ===========================================================================
    # Rules Endpoints
    # ===========================================================================
    
    @task(3)
    def list_rules(self):
        """List reconciliation rules."""
        self.client.get(
            "/api/v2/rules",
            headers=self._get_headers(),
            name="/api/v2/rules"
        )
    
    # ===========================================================================
    # Dashboard & Reports
    # ===========================================================================
    
    @task(4)
    def dashboard_summary(self):
        """Get dashboard summary."""
        self.client.get(
            "/api/v2/dashboard/summary",
            headers=self._get_headers(),
            name="/api/v2/dashboard/summary"
        )
    
    @task(2)
    def dashboard_metrics(self):
        """Get dashboard metrics."""
        self.client.get(
            "/api/v2/dashboard/metrics",
            headers=self._get_headers(),
            name="/api/v2/dashboard/metrics"
        )


class AdminUser(HttpUser):
    """
    Simulates an admin user with elevated privileges.
    Lower weight than regular users.
    """
    
    weight = 1  # Less frequent than regular users
    wait_time = between(2, 10)
    host = "http://localhost:2000"
    
    def on_start(self):
        """Authenticate as admin."""
        response = self.client.post(
            "/api/v2/auth/login",
            json={
                "email": "admin@example.com",
                "password": "adminpassword123"
            }
        )
        
        if response.status_code == 200:
            self.auth_token = response.json().get("token")
        else:
            self.auth_token = None
    
    def _get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    @task(3)
    def list_users(self):
        """List all users (admin only)."""
        self.client.get(
            "/api/v2/admin/users",
            headers=self._get_headers(),
            name="/api/v2/admin/users"
        )
    
    @task(2)
    def system_health(self):
        """Get system health (admin only)."""
        self.client.get(
            "/api/v2/admin/health",
            headers=self._get_headers(),
            name="/api/v2/admin/health"
        )
    
    @task(1)
    def audit_logs(self):
        """Get audit logs (admin only)."""
        self.client.get(
            "/api/v2/admin/audit-logs",
            headers=self._get_headers(),
            name="/api/v2/admin/audit-logs"
        )


# ===========================================================================
# Event Handlers
# ===========================================================================

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when load test starts."""
    logger.info("Load test starting...")
    if isinstance(environment.runner, MasterRunner):
        logger.info("Running in distributed mode with master")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when load test stops."""
    logger.info("Load test completed")
    
    # Log summary statistics
    stats = environment.stats
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Total failures: {stats.total.num_failures}")
    logger.info(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    logger.info(f"Median response time: {stats.total.median_response_time}ms")
    logger.info(f"95th percentile: {stats.total.get_response_time_percentile(0.95)}ms")


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, context, exception, **kwargs):
    """Called for each request."""
    if exception:
        logger.warning(f"Request failed: {name} - {exception}")
    elif response.status_code >= 500:
        logger.error(f"Server error: {name} - {response.status_code}")
