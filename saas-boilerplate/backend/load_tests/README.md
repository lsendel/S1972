# Load Testing with Locust

This directory contains load testing scripts using [Locust](https://locust.io/), a Python-based load testing framework.

## Installation

```bash
pip install locust
```

Or add to `pyproject.toml`:
```toml
[project.optional-dependencies]
dev = [
    # ... other dependencies
    "locust>=2.20.0",
]
```

## Quick Start

### 1. Start your backend

```bash
# Using Docker Compose (recommended)
cd saas-boilerplate
make up

# Or run locally
cd backend
python manage.py runserver
```

### 2. Create test data

```bash
# Create test user and organization
python manage.py create_test_user
```

### 3. Run load tests

#### With Web UI (Recommended for Development)

```bash
cd backend
locust -f load_tests/locustfile.py --host=http://localhost:8000
```

Then open http://localhost:8089 in your browser and configure:
- **Number of users**: Start with 10, gradually increase
- **Spawn rate**: 1-2 users per second
- **Host**: http://localhost:8000 (or your backend URL)

#### Headless Mode (CI/CD)

```bash
locust -f load_tests/locustfile.py \
  --host=http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless \
  --html=load_test_report.html
```

## User Classes

The load test defines several user types simulating different usage patterns:

### UnauthenticatedUser
Simulates anonymous users:
- Viewing pricing/plans (70% of traffic)
- Health checks (30%)
- Signup attempts (15%)
- CSRF token requests (5%)

**Weight**: High (most traffic)

### AuthenticatedUser
Simulates logged-in users performing typical operations:
- Viewing dashboard (50%)
- Checking subscription (30%)
- Managing team members (25%)
- Updating profile (10%)
- Inviting members (5%)

**Weight**: Medium

### AuthenticationFlow
Sequential test of complete authentication flow:
1. Get CSRF token
2. Login
3. Access protected resources
4. Logout

**Weight**: Low (occasional)

### SubscriptionManagementUser
Simulates users managing billing:
- Viewing plans (50%)
- Checking subscription details (40%)
- Managing billing (10%)

**Weight**: Low (infrequent)

## Running Specific User Classes

Test only one user type:

```bash
# Test only authenticated users
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  AuthenticatedUser --users 50

# Test authentication flow
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  AuthenticationFlow --users 10
```

## Performance Targets

| Endpoint Type | Target p95 | Target p99 |
|---------------|------------|------------|
| Health checks | < 50ms     | < 100ms    |
| Authentication | < 200ms   | < 400ms    |
| API reads (GET) | < 300ms  | < 600ms    |
| API writes (POST/PUT) | < 500ms | < 1000ms |

**Error rate target**: < 1%

## Load Test Scenarios

### Scenario 1: Normal Traffic
Simulates typical daily usage:
```bash
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  --users 50 --spawn-rate 5 --run-time 10m
```

### Scenario 2: Peak Traffic
Simulates peak usage (e.g., Monday morning):
```bash
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  --users 200 --spawn-rate 20 --run-time 15m
```

### Scenario 3: Stress Test
Find breaking point:
```bash
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  --users 500 --spawn-rate 50 --run-time 20m
```

### Scenario 4: Spike Test
Sudden traffic spike:
```bash
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  --users 300 --spawn-rate 100 --run-time 5m
```

### Scenario 5: Endurance Test
Long-running test for memory leaks:
```bash
locust -f load_tests/locustfile.py --host=http://localhost:8000 \
  --users 100 --spawn-rate 10 --run-time 2h
```

## Monitoring During Load Tests

### Backend Metrics

Monitor these while testing:

```bash
# CPU and memory usage
docker stats

# Database connections
docker-compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Django logs
docker-compose logs -f backend

# Redis connections
docker-compose exec redis redis-cli CLIENT LIST
```

### Key Metrics to Watch

1. **Response Times**
   - p50 (median)
   - p95 (95th percentile)
   - p99 (99th percentile)
   - Max

2. **Throughput**
   - Requests per second (RPS)
   - Failures per second

3. **Error Rates**
   - HTTP 4xx errors
   - HTTP 5xx errors
   - Connection errors
   - Timeouts

4. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Database connections
   - Redis memory

## Interpreting Results

### Good Performance
```
Total requests: 10000
Failures: 0 (0%)
p95 response time: 250ms
p99 response time: 500ms
Requests/s: 100
```

### Warning Signs
```
Failures: 50 (0.5%)  ⚠️ Approaching threshold
p95 response time: 800ms  ⚠️ Slow
Requests/s: dropping over time  ⚠️ Resource exhaustion
```

### Critical Issues
```
Failures: 150 (1.5%)  ❌ Above 1% threshold
p95 response time: 2000ms  ❌ Unacceptable
HTTP 500 errors  ❌ Server errors
Connection timeouts  ❌ Service unavailable
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start services
        run: docker-compose up -d

      - name: Wait for backend
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8000/api/v1/health/; do sleep 2; done'

      - name: Create test data
        run: docker-compose exec -T backend python manage.py create_test_user

      - name: Install Locust
        run: pip install locust

      - name: Run load test
        run: |
          cd backend
          locust -f load_tests/locustfile.py \
            --host=http://localhost:8000 \
            --users 100 \
            --spawn-rate 10 \
            --run-time 5m \
            --headless \
            --html=load_test_report.html \
            --csv=load_test_results

      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: load-test-results
          path: |
            backend/load_test_report.html
            backend/load_test_results*.csv
```

## Best Practices

1. **Start Small**: Begin with 10 users, gradually increase
2. **Monitor Resources**: Watch CPU, memory, database connections
3. **Test Realistic Scenarios**: Match actual user behavior patterns
4. **Use Production-Like Environment**: Test on staging that mirrors prod
5. **Test Regularly**: Run load tests weekly or after major changes
6. **Document Baseline**: Record baseline performance metrics
7. **Fix Issues Gradually**: Optimize bottlenecks one at a time
8. **Test Edge Cases**: Include error scenarios, large payloads

## Troubleshooting

### Issue: High failure rate

**Causes**:
- Backend not running
- Rate limiting enabled
- Database connection pool exhausted
- CSRF token issues

**Solutions**:
```bash
# Check backend is running
curl http://localhost:8000/api/v1/health/

# Increase database connections in settings
# Check DATABASES['default']['CONN_MAX_AGE']

# Disable rate limiting for load tests
# Set RATELIMIT_ENABLE=False in test settings
```

### Issue: Slow response times

**Causes**:
- Database queries not optimized
- Missing database indexes
- N+1 query problems
- Celery tasks blocking

**Solutions**:
```bash
# Enable Django Debug Toolbar in development
# Use django-silk for profiling
# Check slow query logs
# Add database indexes
```

### Issue: Memory leaks

**Causes**:
- Django connections not closing
- Celery tasks accumulating
- Cache not expiring

**Solutions**:
```bash
# Run endurance test
locust --run-time 2h

# Monitor memory over time
docker stats --format "{{.Name}}: {{.MemUsage}}"
```

## Resources

- [Locust Documentation](https://docs.locust.io/)
- [Performance Testing Best Practices](https://www.blazemeter.com/blog/performance-testing-best-practices)
- [Django Performance Tips](https://docs.djangoproject.com/en/stable/topics/performance/)
