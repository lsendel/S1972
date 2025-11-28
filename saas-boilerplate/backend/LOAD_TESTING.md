# Load Testing Guide

This guide explains how to run load tests using Locust to validate the performance and scalability of the SaaS Boilerplate.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Test Scenarios](#test-scenarios)
- [Performance Baselines](#performance-baselines)
- [Interpreting Results](#interpreting-results)
- [Troubleshooting](#troubleshooting)
- [CI Integration](#ci-integration)

## Prerequisites

**1. Install Locust** (if not already installed):

```bash
cd backend
pip install -e ".[dev]"  # Installs Locust and other dev dependencies
```

**2. Start the Application**:

```bash
# From the saas-boilerplate/ directory
docker-compose up -d

# Verify services are running
curl http://localhost:8000/api/v1/health/
```

## Quick Start

### Interactive Mode (Web UI)

```bash
cd backend
locust -f locustfile.py --host=http://localhost:8000
```

Then open http://localhost:8089 in your browser.

**Configuration in Web UI**:
- **Number of users**: Start with 10-50 for initial tests
- **Spawn rate**: 1-5 users/second
- **Host**: http://localhost:8000 (pre-filled)

Click "Start swarming" to begin the test.

###Headless Mode (Automated)

```bash
# Run for 5 minutes with 50 users
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 5m \
  --headless

# Generate HTML report
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 5m \
  --headless \
  --html=reports/load_test_report.html
```

## Test Scenarios

The `locustfile.py` includes three user types that simulate realistic traffic patterns:

### 1. Authenticated User (40% of traffic)

Simulates logged-in users performing authenticated operations:

- **Tasks**:
  - View profile (GET /api/v1/auth/me/) - 50%
  - Update profile (PATCH /api/v1/auth/me/) - 20%
  - List organizations (GET /api/v1/organizations/) - 50%
  - View organization details (GET /api/v1/organizations/:slug/) - 25%
  - List members (GET /api/v1/organizations/:slug/members/) - 15%
  - Update organization (PATCH /api/v1/organizations/:slug/) - 10%

- **Behavior**: 1-5 second wait between tasks

### 2. Anonymous User (60% of traffic)

Simulates public visitors browsing without authentication:

- **Tasks**:
  - Health check (GET /api/v1/health/) - 55%
  - Get CSRF token (GET /api/v1/auth/csrf/) - 25%
  - Browse plans (GET /api/v1/subscriptions/plans/) - 15%

- **Behavior**: 2-10 second wait between tasks (slower browsing)

### 3. Subscription Browser (20% of traffic)

Simulates potential customers evaluating pricing:

- **Tasks**:
  - Browse plans (GET /api/v1/subscriptions/plans/) - 100%

- **Behavior**: 5-15 second wait between tasks (longer consideration time)

## Running Different Test Scenarios

### Scenario 1: Normal Load (Baseline)

**Purpose**: Establish performance baseline under typical usage

```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 5m \
  --headless \
  --html=reports/baseline_test.html
```

**Expected Results**:
- P95 response time: <200ms
- Error rate: <1%
- Requests/second: 100-200

### Scenario 2: Peak Load

**Purpose**: Verify system handles traffic spikes

```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 200 \
  --spawn-rate 20 \
  --run-time 3m \
  --headless \
  --html=reports/peak_load_test.html
```

**Expected Results**:
- P95 response time: <400ms
- Error rate: <2%
- Requests/second: 300-500

### Scenario 3: Stress Test

**Purpose**: Find breaking point and maximum capacity

```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 500 \
  --spawn-rate 50 \
  --run-time 10m \
  --headless \
  --html=reports/stress_test.html
```

**Expected Results**:
- Identify maximum sustainable user count
- Document degradation patterns
- Find resource bottlenecks

### Scenario 4: Endurance Test

**Purpose**: Verify stability over extended period

```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 30m \
  --headless \
  --html=reports/endurance_test.html
```

**Expected Results**:
- No memory leaks
- Stable response times over duration
- Error rate remains <1%

## Performance Baselines

### Target Response Times (P95)

| Endpoint | Target | Current | Status |
|----------|--------|---------|--------|
| GET /api/v1/health/ | <50ms | TBD | 📊 Pending |
| GET /api/v1/auth/csrf/ | <50ms | TBD | 📊 Pending |
| GET /api/v1/auth/me/ | <100ms | TBD | 📊 Pending |
| PATCH /api/v1/auth/me/ | <150ms | TBD | 📊 Pending |
| POST /api/v1/auth/login/ | <200ms | TBD | 📊 Pending |
| POST /api/v1/auth/signup/ | <300ms | TBD | 📊 Pending |
| GET /api/v1/organizations/ | <150ms | TBD | 📊 Pending |
| POST /api/v1/organizations/ | <250ms | TBD | 📊 Pending |
| GET /api/v1/subscriptions/plans/ | <100ms | TBD | 📊 Pending |

### Throughput Targets

- **Normal Load**: 100-200 requests/second
- **Peak Load**: 300-500 requests/second
- **Maximum Capacity**: TBD (to be determined via stress testing)

### Error Rate Targets

- **Normal Load**: <1%
- **Peak Load**: <2%
- **Stress Test**: <5% (acceptable during extreme load)

## Interpreting Results

### Key Metrics

**1. Response Time Percentiles**:
- **P50 (Median)**: Half of requests complete faster than this
- **P95**: 95% of requests complete faster than this
- **P99**: 99% of requests complete faster than this

**2. Requests Per Second (RPS)**:
- Current throughput
- Higher is better (within acceptable response times)

**3. Failure Rate**:
- Percentage of failed requests (4xx, 5xx errors, timeouts)
- Should be <1% under normal load

**4. Total Requests**:
- Total number of requests completed during the test

### Good Signs ✅

- Response times remain stable throughout test duration
- P95 response time < 200ms
- Error rate < 1%
- No memory leaks (check with `docker stats`)
- CPU usage < 80%
- Database connection pool not exhausted

### Warning Signs ⚠️

- Response times increasing over test duration
- P95 response time > 200ms
- Error rate 1-5%
- High CPU usage (85-95%)
- Database connection pool nearing limit
- Increasing memory usage

### Critical Issues 🔴

- Error rate > 5%
- P95 response time > 1 second
- 500 Internal Server Errors
- Database connection failures
- Service crashes
- Memory exhaustion

## Troubleshooting

### High Error Rates

**Symptoms**: Many 4xx or 5xx errors

**Investigation**:
```bash
# Check backend logs
docker-compose logs backend --tail=100

# Check for database issues
docker-compose logs db --tail=50

# Check Redis
docker-compose logs redis --tail=50
```

**Common Causes**:
- Rate limiting too aggressive (429 errors)
- CSRF token issues (403 errors)
- Database connection pool exhausted
- Memory exhaustion

**Solutions**:
1. Increase database connection pool size
2. Add Redis connection pooling
3. Adjust rate limiting thresholds
4. Scale backend horizontally

### Slow Response Times

**Symptoms**: P95 > 500ms, increasing over time

**Investigation**:
```bash
# Enable Django debug toolbar in development
# Check query counts and execution times

# Use django-silk for profiling
pip install django-silk

# Check for N+1 queries
python manage.py shell
from django.db import connection
connection.queries  # After making requests
```

**Common Causes**:
- N+1 query problems
- Missing database indexes
- Slow external API calls
- Inefficient serializers

**Solutions**:
1. Add `select_related()` and `prefetch_related()`
2. Add database indexes
3. Cache frequently accessed data
4. Optimize serializers

### Memory Leaks

**Symptoms**: Memory usage continuously increases

**Investigation**:
```bash
# Monitor memory usage
docker stats

# Check for unclosed connections
# Check for large object retention
```

**Common Causes**:
- Unclosed database connections
- Large objects held in memory
- Circular references

**Solutions**:
1. Use connection pooling
2. Implement pagination
3. Clear caches appropriately

### Database Connection Exhaustion

**Symptoms**: Connection errors, SQLSTATE errors

**Investigation**:
```bash
# Check current connections
docker-compose exec db psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='your_db';"
```

**Solutions**:
```python
# In settings.py, increase connection pool
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 600,  # 10 minutes
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',  # 30 seconds
        }
    }
}
```

## Best Practices

### Before Load Testing

1. **Use Production-Like Environment**
   - Same database size
   - Same data volume
   - Similar resource constraints

2. **Prepare Test Data**
   - Seed database with realistic data
   - Create test organizations and users
   - Ensure data distribution matches production

3. **Monitor System Resources**
   ```bash
   # Terminal 1: Monitor containers
   docker stats

   # Terminal 2: Monitor database
   docker-compose exec db psql -U postgres -c \
     "SELECT * FROM pg_stat_activity;"

   # Terminal 3: Run load test
   locust -f locustfile.py --host=http://localhost:8000
   ```

### During Load Testing

1. **Start Small**: Begin with 10-20 users, gradually increase
2. **Monitor Logs**: Watch for errors in real-time
3. **Check Metrics**: Use Locust web UI to monitor performance
4. **Document Issues**: Note any anomalies or errors

### After Load Testing

1. **Review Reports**: Analyze HTML reports
2. **Identify Bottlenecks**: Find slowest endpoints
3. **Document Findings**: Record baseline metrics
4. **Plan Optimizations**: Prioritize improvements

## CI Integration

### GitHub Actions Workflow

Create `.github/workflows/load-test.yml`:

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432

      redis:
        image: redis:8-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -e .
          pip install -e ".[dev]"

      - name: Run migrations
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
          DJANGO_SETTINGS_MODULE: config.settings.development
          DJANGO_SECRET_KEY: test-secret-key
        run: python manage.py migrate

      - name: Start backend
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
          DJANGO_SETTINGS_MODULE: config.settings.development
          DJANGO_SECRET_KEY: test-secret-key
        run: |
          python manage.py runserver 0.0.0.0:8000 &
          sleep 10

      - name: Run load test
        working-directory: ./backend
        run: |
          locust -f locustfile.py \
            --host=http://localhost:8000 \
            --users 50 \
            --spawn-rate 5 \
            --run-time 3m \
            --headless \
            --html=load_test_report.html \
            --exit-code-on-error 1

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: load-test-report
          path: backend/load_test_report.html
          retention-days: 30
```

## Advanced Usage

### Custom User Distribution

```bash
# 60% AuthenticatedUser, 30% AnonymousUser, 10% SubscriptionBrowser
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  AuthenticatedUser:60 AnonymousUser:30 SubscriptionBrowser:10
```

### Distributed Load Testing

```bash
# Master node
locust -f locustfile.py --master --expect-workers=3

# Worker nodes (run on separate machines)
locust -f locustfile.py --worker --master-host=<master-ip>
```

### Custom Reporting

```bash
# JSON output for custom processing
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 5m \
  --headless \
  --json > load_test_results.json
```

## Resources

- [Locust Documentation](https://docs.locust.io/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing/)
- [Performance Testing Guide](https://github.com/mfaerevaag/load-testing-playbook)

## Questions?

For questions about load testing:
1. Review this documentation
2. Check Locust documentation
3. Open an issue in the repository
