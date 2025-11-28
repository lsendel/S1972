"""
Locust load testing configuration for SaaS Boilerplate API.

This file defines user behaviors and load testing scenarios for the API endpoints.

Usage:
    # Run with web UI (recommended for development)
    locust -f load_tests/locustfile.py --host=http://localhost:8000

    # Run headless with specific user count and spawn rate
    locust -f load_tests/locustfile.py --host=http://localhost:8000 \
           --users 100 --spawn-rate 10 --run-time 5m --headless

    # Run specific user class
    locust -f load_tests/locustfile.py --host=http://localhost:8000 \
           AuthenticatedUser --users 50 --spawn-rate 5

Performance Targets:
    - Health check: < 50ms p95
    - Authentication: < 200ms p95
    - API reads: < 300ms p95
    - API writes: < 500ms p95
    - Error rate: < 1%
"""
from locust import HttpUser, task, between, SequentialTaskSet, events
import random
import logging

logger = logging.getLogger(__name__)


class UnauthenticatedUser(HttpUser):
    """
    Simulates unauthenticated users browsing public endpoints.

    Typical actions:
    - View pricing/plans
    - Health checks (from load balancers)
    - Signup attempts
    """
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks

    @task(10)
    def view_plans(self):
        """View available subscription plans."""
        self.client.get('/api/v1/subscriptions/plans/')

    @task(5)
    def health_check(self):
        """Simulate load balancer health checks."""
        with self.client.get('/api/v1/health/', catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f'Health check failed with status {response.status_code}')

    @task(2)
    def signup_attempt(self):
        """Attempt user signup."""
        # Generate random email
        random_id = random.randint(10000, 99999)
        self.client.post('/api/v1/auth/signup/', json={
            'email': f'loadtest_{random_id}@example.com',
            'password': 'LoadTest123!',
            'full_name': f'Load Test User {random_id}'
        })

    @task(1)
    def get_csrf_token(self):
        """Get CSRF token (required for authenticated requests)."""
        self.client.get('/api/v1/auth/csrf/')


class AuthenticationFlow(SequentialTaskSet):
    """
    Sequential flow for authentication testing.

    Simulates a user:
    1. Getting CSRF token
    2. Logging in
    3. Accessing protected resources
    4. Logging out
    """

    def on_start(self):
        """Setup: Create test user if needed."""
        self.user_email = 'test@example.com'
        self.user_password = 'testpassword123'
        self.csrf_token = None
        self.org_slug = 'test-org'

    @task
    def get_csrf(self):
        """Step 1: Get CSRF token."""
        response = self.client.get('/api/v1/auth/csrf/')
        if response.status_code == 200:
            self.csrf_token = response.json().get('csrfToken')

    @task
    def login(self):
        """Step 2: Login with credentials."""
        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        response = self.client.post('/api/v1/auth/login/', json={
            'email': self.user_email,
            'password': self.user_password
        }, headers=headers, catch_response=True)

        if response.status_code == 200:
            response.success()
        else:
            response.failure(f'Login failed with status {response.status_code}')

    @task
    def get_user_profile(self):
        """Step 3: Get user profile."""
        self.client.get('/api/v1/auth/me/')

    @task
    def list_organizations(self):
        """Step 4: List user's organizations."""
        self.client.get('/api/v1/organizations/')

    @task
    def get_subscription(self):
        """Step 5: Get organization subscription."""
        self.client.get(f'/api/v1/subscriptions/current/?organization={self.org_slug}')

    @task
    def logout(self):
        """Step 6: Logout."""
        self.client.post('/api/v1/auth/logout/')
        self.interrupt()  # End this sequential flow


class AuthenticatedUser(HttpUser):
    """
    Simulates authenticated users performing typical operations.

    Assumes user is already logged in (via session/cookies).
    """
    wait_time = between(2, 5)

    def on_start(self):
        """Login before starting tasks."""
        self.user_email = 'test@example.com'
        self.user_password = 'testpassword123'
        self.org_slug = 'test-org'

        # Get CSRF token
        csrf_response = self.client.get('/api/v1/auth/csrf/')
        if csrf_response.status_code == 200:
            self.csrf_token = csrf_response.json().get('csrfToken')
        else:
            self.csrf_token = None

        # Login
        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        self.client.post('/api/v1/auth/login/', json={
            'email': self.user_email,
            'password': self.user_password
        }, headers=headers)

    @task(15)
    def view_dashboard(self):
        """View dashboard (simulate typical SPA behavior)."""
        # Get user info
        self.client.get('/api/v1/auth/me/')
        # Get organizations
        self.client.get('/api/v1/organizations/')

    @task(10)
    def check_subscription(self):
        """Check subscription status."""
        self.client.get(f'/api/v1/subscriptions/current/?organization={self.org_slug}')

    @task(8)
    def view_organization_members(self):
        """View organization team members."""
        self.client.get(f'/api/v1/organizations/{self.org_slug}/members/')

    @task(3)
    def update_profile(self):
        """Update user profile."""
        headers = {}
        if hasattr(self, 'csrf_token') and self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        self.client.patch('/api/v1/auth/me/', json={
            'full_name': f'Load Test User {random.randint(1, 1000)}'
        }, headers=headers)

    @task(2)
    def invite_member(self):
        """Invite a team member."""
        headers = {}
        if hasattr(self, 'csrf_token') and self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        random_id = random.randint(10000, 99999)
        self.client.post(
            f'/api/v1/organizations/{self.org_slug}/members/invite/',
            json={
                'email': f'invite_{random_id}@example.com',
                'role': 'member'
            },
            headers=headers
        )


class SubscriptionManagementUser(HttpUser):
    """
    Simulates users managing subscriptions and billing.

    Lower frequency tasks like:
    - Viewing plans
    - Checking subscription status
    - Updating billing info
    """
    wait_time = between(5, 10)

    def on_start(self):
        """Login before starting."""
        self.org_slug = 'test-org'
        # Simulate being logged in
        self.csrf_token = None
        csrf_response = self.client.get('/api/v1/auth/csrf/')
        if csrf_response.status_code == 200:
            self.csrf_token = csrf_response.json().get('csrfToken')

        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        self.client.post('/api/v1/auth/login/', json={
            'email': 'test@example.com',
            'password': 'testpassword123'
        }, headers=headers)

    @task(10)
    def view_all_plans(self):
        """Browse available subscription plans."""
        self.client.get('/api/v1/subscriptions/plans/')

    @task(8)
    def check_current_subscription(self):
        """Check current subscription details."""
        self.client.get(f'/api/v1/subscriptions/current/?organization={self.org_slug}')

    @task(2)
    def view_invoices(self):
        """View billing invoices (if endpoint exists)."""
        # This would require implementation
        pass


# Performance monitoring hooks
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Log when load test starts."""
    logger.info('Load test starting...')
    logger.info(f'Host: {environment.host}')
    logger.info(f'Users: {environment.runner.target_user_count if hasattr(environment.runner, "target_user_count") else "N/A"}')


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Log when load test stops."""
    logger.info('Load test stopping...')
    if environment.runner.stats.total.fail_ratio > 0.01:  # > 1% error rate
        logger.warning(f'High error rate detected: {environment.runner.stats.total.fail_ratio:.2%}')


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, context, **kwargs):
    """Monitor slow requests."""
    if response_time > 1000:  # Log requests slower than 1 second
        logger.warning(f'Slow request detected: {name} took {response_time}ms')


# Default user class if none specified
if __name__ == '__main__':
    import os
    from locust import run_single_user

    # Allow running individual user classes for debugging
    run_single_user(AuthenticatedUser)
