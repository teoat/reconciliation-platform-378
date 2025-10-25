# User Acceptance Testing Execution Framework

## Overview

This framework provides automated and manual testing tools for conducting comprehensive User Acceptance Testing of the Reconciliation Platform.

## Test Automation Framework

### Test Structure

```
tests/
├── uat/
│   ├── test_cases/
│   │   ├── authentication/
│   │   ├── project_management/
│   │   ├── file_upload/
│   │   ├── reconciliation/
│   │   ├── collaboration/
│   │   ├── reporting/
│   │   ├── admin/
│   │   ├── performance/
│   │   ├── security/
│   │   └── compatibility/
│   ├── fixtures/
│   │   ├── test_data/
│   │   ├── sample_files/
│   │   └── user_accounts/
│   ├── utils/
│   │   ├── test_helpers/
│   │   ├── api_client/
│   │   └── database_utils/
│   └── config/
│       ├── test_config.yaml
│       └── environment.yaml
```

### Test Configuration

```yaml
# test_config.yaml
test_suite:
  name: "Reconciliation Platform UAT"
  version: "1.0.0"
  environment: "UAT"

environments:
  uat:
    base_url: "https://uat.reconciliation.example.com"
    api_url: "https://api-uat.reconciliation.example.com"
    ws_url: "wss://ws-uat.reconciliation.example.com"
    database_url: "postgresql://uat_user:uat_password@uat-db:5432/reconciliation_uat"
    redis_url: "redis://uat-redis:6379"

test_data:
  users:
    admin:
      username: "admin@example.com"
      password: "Admin123!"
      role: "admin"
    user1:
      username: "user1@example.com"
      password: "User123!"
      role: "user"
    user2:
      username: "user2@example.com"
      password: "User123!"
      role: "user"

  files:
    csv_valid: "fixtures/sample_files/valid_data.csv"
    csv_invalid: "fixtures/sample_files/invalid_data.csv"
    json_valid: "fixtures/sample_files/valid_data.json"
    json_invalid: "fixtures/sample_files/invalid_data.json"

browser_config:
  headless: false
  window_size: [1920, 1080]
  timeout: 30
  implicit_wait: 10

reporting:
  format: ["html", "json", "xml"]
  output_dir: "reports/uat"
  screenshots: true
  videos: false
```

### Test Execution Script

```python
#!/usr/bin/env python3
"""
UAT Test Execution Script
Executes comprehensive User Acceptance Testing for the Reconciliation Platform
"""

import os
import sys
import yaml
import pytest
import logging
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tests.uat.utils.test_helpers import TestHelper
from tests.uat.utils.api_client import APIClient
from tests.uat.utils.database_utils import DatabaseUtils

class UATExecutor:
    def __init__(self, config_file="tests/uat/config/test_config.yaml"):
        self.config = self.load_config(config_file)
        self.test_helper = TestHelper(self.config)
        self.api_client = APIClient(self.config)
        self.db_utils = DatabaseUtils(self.config)
        self.setup_logging()
        
    def load_config(self, config_file):
        """Load test configuration from YAML file"""
        with open(config_file, 'r') as f:
            return yaml.safe_load(f)
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'reports/uat/uat_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def run_test_suite(self, test_suite="all"):
        """Run specified test suite"""
        self.logger.info(f"Starting UAT execution for suite: {test_suite}")
        
        # Setup test environment
        self.setup_test_environment()
        
        # Run tests based on suite
        if test_suite == "all":
            self.run_all_tests()
        elif test_suite == "smoke":
            self.run_smoke_tests()
        elif test_suite == "regression":
            self.run_regression_tests()
        else:
            self.run_specific_tests(test_suite)
        
        # Generate reports
        self.generate_reports()
        
        # Cleanup
        self.cleanup_test_environment()
        
        self.logger.info("UAT execution completed")
    
    def setup_test_environment(self):
        """Setup test environment"""
        self.logger.info("Setting up test environment...")
        
        # Create test data
        self.create_test_data()
        
        # Setup test users
        self.setup_test_users()
        
        # Verify environment health
        self.verify_environment_health()
        
        self.logger.info("Test environment setup completed")
    
    def create_test_data(self):
        """Create test data"""
        self.logger.info("Creating test data...")
        
        # Create test projects
        self.db_utils.create_test_projects()
        
        # Create test files
        self.db_utils.create_test_files()
        
        # Create test reconciliations
        self.db_utils.create_test_reconciliations()
        
        self.logger.info("Test data created successfully")
    
    def setup_test_users(self):
        """Setup test users"""
        self.logger.info("Setting up test users...")
        
        for user_type, user_data in self.config['test_data']['users'].items():
            self.api_client.create_user(user_data)
            self.logger.info(f"Created test user: {user_type}")
        
        self.logger.info("Test users setup completed")
    
    def verify_environment_health(self):
        """Verify test environment health"""
        self.logger.info("Verifying environment health...")
        
        # Check API health
        health_response = self.api_client.health_check()
        if health_response['status'] != 'healthy':
            raise Exception("API health check failed")
        
        # Check database connectivity
        if not self.db_utils.test_connection():
            raise Exception("Database connection test failed")
        
        # Check Redis connectivity
        if not self.api_client.test_redis_connection():
            raise Exception("Redis connection test failed")
        
        self.logger.info("Environment health verified")
    
    def run_all_tests(self):
        """Run all test suites"""
        self.logger.info("Running all test suites...")
        
        test_suites = [
            "tests/uat/test_cases/authentication",
            "tests/uat/test_cases/project_management",
            "tests/uat/test_cases/file_upload",
            "tests/uat/test_cases/reconciliation",
            "tests/uat/test_cases/collaboration",
            "tests/uat/test_cases/reporting",
            "tests/uat/test_cases/admin",
            "tests/uat/test_cases/performance",
            "tests/uat/test_cases/security",
            "tests/uat/test_cases/compatibility"
        ]
        
        for suite in test_suites:
            self.run_test_suite(suite)
    
    def run_smoke_tests(self):
        """Run smoke tests"""
        self.logger.info("Running smoke tests...")
        
        smoke_tests = [
            "tests/uat/test_cases/authentication/test_login.py",
            "tests/uat/test_cases/project_management/test_create_project.py",
            "tests/uat/test_cases/file_upload/test_upload_csv.py",
            "tests/uat/test_cases/reconciliation/test_exact_match.py"
        ]
        
        for test in smoke_tests:
            self.run_test_file(test)
    
    def run_regression_tests(self):
        """Run regression tests"""
        self.logger.info("Running regression tests...")
        
        regression_tests = [
            "tests/uat/test_cases/authentication",
            "tests/uat/test_cases/project_management",
            "tests/uat/test_cases/file_upload",
            "tests/uat/test_cases/reconciliation"
        ]
        
        for suite in regression_tests:
            self.run_test_suite(suite)
    
    def run_specific_tests(self, test_path):
        """Run specific tests"""
        self.logger.info(f"Running specific tests: {test_path}")
        
        if os.path.isfile(test_path):
            self.run_test_file(test_path)
        elif os.path.isdir(test_path):
            self.run_test_suite(test_path)
        else:
            raise Exception(f"Test path not found: {test_path}")
    
    def run_test_suite(self, suite_path):
        """Run test suite using pytest"""
        self.logger.info(f"Running test suite: {suite_path}")
        
        pytest_args = [
            suite_path,
            "-v",
            "--tb=short",
            f"--html=reports/uat/{os.path.basename(suite_path)}_report.html",
            "--self-contained-html"
        ]
        
        result = pytest.main(pytest_args)
        
        if result == 0:
            self.logger.info(f"Test suite {suite_path} passed")
        else:
            self.logger.error(f"Test suite {suite_path} failed")
        
        return result
    
    def run_test_file(self, test_file):
        """Run specific test file"""
        self.logger.info(f"Running test file: {test_file}")
        
        pytest_args = [
            test_file,
            "-v",
            "--tb=short",
            f"--html=reports/uat/{os.path.basename(test_file)}_report.html",
            "--self-contained-html"
        ]
        
        result = pytest.main(pytest_args)
        
        if result == 0:
            self.logger.info(f"Test file {test_file} passed")
        else:
            self.logger.error(f"Test file {test_file} failed")
        
        return result
    
    def generate_reports(self):
        """Generate comprehensive test reports"""
        self.logger.info("Generating test reports...")
        
        # Generate HTML report
        self.generate_html_report()
        
        # Generate JSON report
        self.generate_json_report()
        
        # Generate summary report
        self.generate_summary_report()
        
        self.logger.info("Test reports generated successfully")
    
    def generate_html_report(self):
        """Generate HTML test report"""
        # Implementation for HTML report generation
        pass
    
    def generate_json_report(self):
        """Generate JSON test report"""
        # Implementation for JSON report generation
        pass
    
    def generate_summary_report(self):
        """Generate test summary report"""
        # Implementation for summary report generation
        pass
    
    def cleanup_test_environment(self):
        """Cleanup test environment"""
        self.logger.info("Cleaning up test environment...")
        
        # Cleanup test data
        self.db_utils.cleanup_test_data()
        
        # Cleanup test users
        self.api_client.cleanup_test_users()
        
        self.logger.info("Test environment cleanup completed")

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="UAT Test Execution Script")
    parser.add_argument("--suite", default="all", help="Test suite to run")
    parser.add_argument("--config", default="tests/uat/config/test_config.yaml", help="Config file path")
    
    args = parser.parse_args()
    
    # Create UAT executor
    executor = UATExecutor(args.config)
    
    # Run test suite
    executor.run_test_suite(args.suite)

if __name__ == "__main__":
    main()
