"""
Load testing scenarios for SaaS Boilerplate.

Run with:
    locust -f locustfile.py --host=http://localhost:8000

Web UI: http://localhost:8089

Headless mode:
    locust -f locustfile.py --host=http://localhost:8000 \
        --users 50 --spawn-rate 5 --run-time 5m --headless
"""
from locust import HttpUser, TaskSet, task, between, events
import random
import string
import json


def generate_random_email():
    """Generate a random email for test users."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"loadtest_{random_str}@example.com"


def generate_random_password():
    """Generate a secure random password."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16)) + '!@#'


class AuthenticationTasks(TaskSet):
    """Authentication-related load tests."""

    def on_start(self):
        """Setup: Create test user and login."""
        self.email = generate_random_email()
        self.password = generate_random_password()
        self.csrf_token = None

        # Get CSRF token
        csrf_response = self.client.get("/api/v1/auth/csrf/", name="/api/v1/auth/csrf/")
        if csrf_response.status_code == 200:
            self.csrf_token = csrf_response.json().get('csrfToken')

        # Signup
        signup_data = {
            "email": self.email,
            "password": self.password,
            "full_name": f"Load Test User {random.randint(1000, 9999)}"
        }

        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        signup_response = self.client.post(
            "/api/v1/auth/signup/",
            json=signup_data,
            headers=headers,
            name="/api/v1/auth/signup/"
        )

        if signup_response.status_code == 201:
            # Login
            login_data = {
                "email": self.email,
                "password": self.password
            }
            self.client.post(
                "/api/v1/auth/login/",
                json=login_data,
                headers=headers,
                name="/api/v1/auth/login/"
            )

    @task(5)
    def get_user_profile(self):
        """GET /api/v1/auth/me/ - 50% of traffic."""
        self.client.get("/api/v1/auth/me/", name="/api/v1/auth/me/")

    @task(2)
    def update_profile(self):
        """PATCH /api/v1/auth/me/ - 20% of traffic."""
        update_data = {
            "full_name": f"Updated User {random.randint(1, 100)}"
        }
        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        self.client.patch(
            "/api/v1/auth/me/",
            json=update_data,
            headers=headers,
            name="/api/v1/auth/me/ [PATCH]"
        )

    @task(1)
    def get_csrf_token(self):
        """GET /api/v1/auth/csrf/ - 10% of traffic."""
        self.client.get("/api/v1/auth/csrf/", name="/api/v1/auth/csrf/")


class OrganizationTasks(TaskSet):
    """Organization-related load tests."""

    def on_start(self):
        """Setup: Login and create organization."""
        self.email = generate_random_email()
        self.password = generate_random_password()
        self.csrf_token = None
        self.org_slug = None

        # Get CSRF token
        csrf_response = self.client.get("/api/v1/auth/csrf/")
        if csrf_response.status_code == 200:
            self.csrf_token = csrf_response.json().get('csrfToken')

        headers = {}
        if self.csrf_token:
            headers['X-CSRFToken'] = self.csrf_token

        # Signup
        signup_data = {
            "email": self.email,
            "password": self.password,
            "full_name": f"Org Test User {random.randint(1000, 9999)}"
        }
        self.client.post("/api/v1/auth/signup/", json=signup_data, headers=headers)

        # Login
        login_data = {
            "email": self.email,
            "password": self.password
        }
        self.client.post("/api/v1/auth/login/", json=login_data, headers=headers)

        # Create organization
        org_data = {
            "name": f"Load Test Org {random.randint(1000, 9999)}"
        }
        org_response = self.client.post(
            "/api/v1/organizations/",
            json=org_data,
            headers=headers,
            name="/api/v1/organizations/ [POST]"
        )

        if org_response.status_code == 201:
            self.org_slug = org_response.json().get('slug')

    @task(10)
    def list_organizations(self):
        """GET /api/v1/organizations/ - 50% of traffic."""
        self.client.get("/api/v1/organizations/", name="/api/v1/organizations/")

    @task(5)
    def get_organization_detail(self):
        """GET /api/v1/organizations/:slug/ - 25% of traffic."""
        if self.org_slug:
            self.client.get(
                f"/api/v1/organizations/{self.org_slug}/",
                name="/api/v1/organizations/:slug/"
            )

    @task(3)
    def list_members(self):
        """GET /api/v1/organizations/:slug/members/ - 15% of traffic."""
        if self.org_slug:
            self.client.get(
                f"/api/v1/organizations/{self.org_slug}/members/",
                name="/api/v1/organizations/:slug/members/"
            )

    @task(2)
    def update_organization(self):
        """PATCH /api/v1/organizations/:slug/ - 10% of traffic."""
        if self.org_slug:
            update_data = {
                "name": f"Updated Org {random.randint(1, 100)}"
            }
            headers = {}
            if self.csrf_token:
                headers['X-CSRFToken'] = self.csrf_token

            self.client.patch(
                f"/api/v1/organizations/{self.org_slug}/",
                json=update_data,
                headers=headers,
                name="/api/v1/organizations/:slug/ [PATCH]"
            )


class SubscriptionTasks(TaskSet):
    """Subscription-related load tests."""

    @task(10)
    def list_plans(self):
        """GET /api/v1/subscriptions/plans/ - Public endpoint."""
        self.client.get("/api/v1/subscriptions/plans/", name="/api/v1/subscriptions/plans/")


class PublicEndpointsTasks(TaskSet):
    """Public endpoint load tests."""

    @task(10)
    def health_check(self):
        """GET /api/v1/health/ - Health check endpoint."""
        self.client.get("/api/v1/health/", name="/api/v1/health/")

    @task(5)
    def csrf_token(self):
        """GET /api/v1/auth/csrf/ - CSRF token endpoint."""
        self.client.get("/api/v1/auth/csrf/", name="/api/v1/auth/csrf/")

    @task(3)
    def list_plans(self):
        """GET /api/v1/subscriptions/plans/ - Public plans."""
        self.client.get("/api/v1/subscriptions/plans/", name="/api/v1/subscriptions/plans/")


class AuthenticatedUser(HttpUser):
    """
    Simulates authenticated user behavior.

    This user type represents logged-in users performing various tasks
    like viewing their profile, updating info, and managing organizations.
    """
    tasks = [AuthenticationTasks, OrganizationTasks]
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    weight = 2  # 2x weight compared to base (40% of users)


class AnonymousUser(HttpUser):
    """
    Simulates anonymous/public user behavior.

    This user type represents visitors browsing public pages without logging in.
    """
    tasks = [PublicEndpointsTasks]
    wait_time = between(2, 10)  # Slower browsing pace
    weight = 3  # 3x weight (60% of users)


class SubscriptionBrowser(HttpUser):
    """
    Simulates users browsing subscription plans.

    This user type represents potential customers evaluating pricing plans.
    """
    tasks = [SubscriptionTasks]
    wait_time = between(5, 15)  # Longer consideration time
    weight = 1  # 1x weight (20% of users)


# Custom event hooks for better reporting
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when a load test is started."""
    print("\n" + "="*60)
    print("🚀 Load Test Started")
    print("="*60)
    print(f"Host: {environment.host}")
    print(f"Target users: {environment.runner.target_user_count if hasattr(environment.runner, 'target_user_count') else 'N/A'}")
    print("="*60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when a load test is stopped."""
    print("\n" + "="*60)
    print("🏁 Load Test Completed")
    print("="*60)

    stats = environment.stats
    print(f"Total requests: {stats.total.num_requests}")
    print(f"Total failures: {stats.total.num_failures}")
    print(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    print(f"Min response time: {stats.total.min_response_time}ms")
    print(f"Max response time: {stats.total.max_response_time}ms")
    print(f"Requests per second: {stats.total.current_rps:.2f}")
    print(f"Failure rate: {(stats.total.num_failures / max(stats.total.num_requests, 1) * 100):.2f}%")
    print("="*60 + "\n")


# Usage examples:
"""
# Basic run with web UI:
locust -f locustfile.py --host=http://localhost:8000

# Headless run (5 minutes, 50 users):
locust -f locustfile.py --host=http://localhost:8000 \\
    --users 50 --spawn-rate 5 --run-time 5m --headless

# Generate HTML report:
locust -f locustfile.py --host=http://localhost:8000 \\
    --users 100 --spawn-rate 10 --run-time 10m \\
    --headless --html=load_test_report.html

# Stress test (high load):
locust -f locustfile.py --host=http://localhost:8000 \\
    --users 500 --spawn-rate 50 --run-time 5m --headless

# Custom user distribution:
locust -f locustfile.py --host=http://localhost:8000 \\
    --users 100 --spawn-rate 10 \\
    AuthenticatedUser:60 AnonymousUser:30 SubscriptionBrowser:10
"""
