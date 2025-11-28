# Monitoring and Alerting Guide

This guide covers monitoring, logging, and alerting setup for the SaaS Boilerplate.

**Goal**: Detect and resolve issues before users are affected

---

## Table of Contents

- [Monitoring Stack](#monitoring-stack)
- [Error Tracking (Sentry)](#error-tracking-sentry)
- [Uptime Monitoring](#uptime-monitoring)
- [Application Performance](#application-performance)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Log Aggregation](#log-aggregation)
- [Alerting Rules](#alerting-rules)

---

## Monitoring Stack

### Recommended Tools

| Category | Tool | Cost | Why |
|----------|------|------|-----|
| Error Tracking | Sentry | Free tier available | Best-in-class error tracking |
| Uptime | UptimeRobot | Free tier available | Simple, reliable uptime checks |
| APM | New Relic / DataDog | Paid | Application performance insights |
| Logs | Better Stack / Papertrail | Free tier available | Centralized log management |
| Infrastructure | CloudWatch / DigitalOcean | Included | Server metrics |

### Quick Start (Free Tier)

1. **Sentry** - Error tracking (Required)
2. **UptimeRobot** - Uptime monitoring (Required)
3. **Better Stack** - Log aggregation (Optional)

Total cost: $0/month for small projects

---

## Error Tracking (Sentry)

### Setup Sentry

1. **Create Sentry Account**
   - Go to: https://sentry.io/signup/
   - Create organization
   - Create project: "saas-boilerplate-backend"
   - Create project: "saas-boilerplate-frontend"

2. **Get DSN Keys**
   - Backend DSN: `https://...@sentry.io/123456`
   - Frontend DSN: `https://...@sentry.io/789012`

3. **Add to GitHub Secrets**
   ```bash
   # Staging environment
   SENTRY_DSN=https://...@sentry.io/123456
   SENTRY_ENVIRONMENT=staging

   # Production environment
   SENTRY_DSN=https://...@sentry.io/123456
   SENTRY_ENVIRONMENT=production
   ```

### Backend Configuration (Django)

Already configured in `backend/config/settings/base.py`:

```python
# Sentry configuration
if os.environ.get('SENTRY_DSN'):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN'),
        environment=os.environ.get('SENTRY_ENVIRONMENT', 'development'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        send_default_pii=False,  # Don't send user data by default
    )
```

### Frontend Configuration (React)

Already configured in `frontend/src/main.tsx`:

```typescript
// Sentry initialization
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
  });
}
```

### Sentry Alerts

**Recommended Alerts**:

1. **Error Spike** (Critical)
   - Condition: Error rate > 10 errors/minute
   - Action: Page on-call engineer

2. **New Error** (High)
   - Condition: New error type detected
   - Action: Slack notification

3. **Regression** (Medium)
   - Condition: Previously resolved error reoccurs
   - Action: Slack notification

4. **Performance Degradation** (Medium)
   - Condition: P95 response time > 2 seconds
   - Action: Email notification

**Setup**:
1. Go to Sentry → Settings → Alerts
2. Create alert rule for each condition
3. Configure notification channels (Slack, email, PagerDuty)

---

## Uptime Monitoring

### UptimeRobot Setup

1. **Create Account**
   - Go to: https://uptimerobot.com/signUp
   - Free tier: 50 monitors, 5-minute checks

2. **Add Monitors**

   **Production Monitors**:
   ```
   Name: Production - Homepage
   URL: https://example.com
   Type: HTTPS
   Interval: 5 minutes
   ```

   ```
   Name: Production - API Health
   URL: https://example.com/api/v1/health/
   Type: HTTPS
   Interval: 5 minutes
   Expected: 200 status, contains "healthy"
   ```

   ```
   Name: Production - API Readiness
   URL: https://example.com/api/v1/ready/
   Type: HTTPS
   Interval: 5 minutes
   ```

   **Staging Monitors**:
   ```
   Name: Staging - API Health
   URL: https://staging.example.com/api/v1/health/
   Type: HTTPS
   Interval: 15 minutes
   ```

3. **Configure Alerts**
   - Add email notification
   - Add Slack webhook (recommended)
   - Add SMS notification (for critical production)

4. **Status Page** (Optional)
   - Create public status page
   - Share with customers: `https://status.example.com`

### Alternative: Better Uptime

**Advantages**:
- More detailed checks
- Incident management
- Status page included

**Setup**: https://betteruptime.com

---

## Application Performance (APM)

### New Relic Setup (Recommended for Production)

1. **Sign Up**
   - Go to: https://newrelic.com/signup
   - Free tier: 100GB data/month

2. **Install APM Agent**

   **Backend (Python)**:
   ```bash
   pip install newrelic
   ```

   Add to `backend/pyproject.toml`:
   ```toml
   dependencies = [
       "newrelic>=9.0.0",
   ]
   ```

   Configure in `backend/config/settings/production.py`:
   ```python
   # New Relic APM
   if os.environ.get('NEW_RELIC_LICENSE_KEY'):
       import newrelic.agent
       newrelic.agent.initialize()
   ```

   **Frontend (Browser)**:
   Add to `frontend/src/main.tsx`:
   ```typescript
   // New Relic Browser
   if (import.meta.env.VITE_NEW_RELIC_LICENSE_KEY) {
     // Load New Relic browser agent
   }
   ```

3. **Key Metrics to Monitor**
   - Response time (target: < 500ms p95)
   - Error rate (target: < 0.5%)
   - Apdex score (target: > 0.9)
   - Database query time (target: < 100ms)
   - External service calls

### Alternative: DataDog

**Advantages**:
- Unified infrastructure + APM
- Better Kubernetes support

**Setup**: https://docs.datadoghq.com/getting_started/

---

## Infrastructure Monitoring

### Server Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | > 70% | > 90% | Scale up or optimize |
| Memory Usage | > 80% | > 95% | Investigate memory leaks |
| Disk Usage | > 80% | > 90% | Clean up or add storage |
| Disk I/O | > 80% | > 95% | Optimize queries or scale |
| Network | > 80% | > 95% | Check for DDoS or scale |

### AWS CloudWatch

**Already configured** if using AWS:

**Key Dashboards**:
1. EC2 Instance Metrics
2. RDS Database Metrics
3. Load Balancer Metrics
4. Application Load

**Alarms**:
```bash
# Example: High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### DigitalOcean Monitoring

**Included free** with droplets:

1. Go to: Manage → Monitoring
2. Enable monitoring for droplets
3. Create alert policies:
   - CPU > 80% for 5 minutes
   - Disk > 90%
   - Memory > 90%

### Docker Metrics

**Monitor container health**:

```bash
# Container stats
docker stats

# Check container health
docker inspect --format='{{.State.Health.Status}}' backend

# Memory usage
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

---

## Log Aggregation

### Better Stack (Logtail)

1. **Setup**
   - Go to: https://betterstack.com/logtail
   - Create source: "Production Backend"
   - Get source token

2. **Configure Docker Logging**

   Update `docker-compose.prod.yml`:
   ```yaml
   services:
     backend:
       logging:
         driver: "syslog"
         options:
           syslog-address: "tcp://logs.betterstack.com:6514"
           syslog-format: "rfc5424"
           tag: "backend"
   ```

3. **Configure Application Logging**

   Backend `config/settings/production.py`:
   ```python
   LOGGING = {
       'handlers': {
           'logtail': {
               'class': 'logging.handlers.HTTPHandler',
               'host': 'in.logtail.com',
               'url': '/your-source-token',
               'method': 'POST',
           },
       },
   }
   ```

### Alternative: Papertrail

**Advantages**:
- Simple setup
- Great search
- Slack integration

**Setup**: https://papertrailapp.com/

---

## Alerting Rules

### Critical Alerts (Page immediately)

1. **Service Down**
   - Trigger: Health check fails
   - Channel: PagerDuty + SMS
   - Response: < 15 minutes

2. **Database Connection Lost**
   - Trigger: Cannot connect to database
   - Channel: PagerDuty + SMS
   - Response: < 15 minutes

3. **Error Rate Spike**
   - Trigger: > 50 errors/minute
   - Channel: PagerDuty
   - Response: < 30 minutes

### High Priority (Slack immediately)

1. **High Memory Usage**
   - Trigger: Memory > 90% for 5 minutes
   - Channel: Slack #alerts

2. **Slow Response Time**
   - Trigger: P95 > 2 seconds
   - Channel: Slack #alerts

3. **High Error Rate**
   - Trigger: > 10 errors/minute
   - Channel: Slack #alerts

### Medium Priority (Slack, non-urgent)

1. **High CPU**
   - Trigger: CPU > 70% for 10 minutes
   - Channel: Slack #monitoring

2. **Disk Space Low**
   - Trigger: Disk > 80%
   - Channel: Slack #monitoring

3. **New Error Type**
   - Trigger: New Sentry error
   - Channel: Slack #errors

---

## Notification Channels

### Slack Integration

1. **Create Incoming Webhook**
   - Go to: https://api.slack.com/apps
   - Create app → Incoming Webhooks
   - Add to workspace
   - Create webhook for #alerts channel

2. **Configure Services**
   ```bash
   # Add to GitHub Secrets
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

3. **Test**
   ```bash
   curl -X POST \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test alert from monitoring"}' \
     $SLACK_WEBHOOK_URL
   ```

### PagerDuty Integration (Production)

1. **Create Account**: https://pagerduty.com
2. **Create Service**: "Production Incidents"
3. **Get Integration Key**
4. **Configure in monitoring tools**:
   - Sentry → Integrations → PagerDuty
   - UptimeRobot → Alert Contacts → Add PagerDuty

---

## Monitoring Dashboard

### Create Custom Dashboard

**Tools**:
- Grafana (self-hosted)
- Datadog Dashboard
- New Relic Dashboard

**Key Metrics to Display**:

1. **System Health**
   - Uptime percentage (target: 99.9%)
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate

2. **Application Metrics**
   - Active users
   - API requests/minute
   - Database query time
   - Cache hit rate

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network traffic

4. **Business Metrics**
   - Signups/day
   - Active subscriptions
   - Revenue (if applicable)
   - Feature usage

---

## Health Check Endpoints

### Backend Health Endpoints

**Already implemented**:

```python
# /api/v1/health/ - Basic health check
# Returns: {"status": "healthy", "timestamp": "..."}

# /api/v1/ready/ - Readiness check (includes DB, cache)
# Returns: {"status": "ready", "checks": {...}}

# /api/v1/live/ - Liveness check
# Returns: {"status": "alive"}
```

### Monitor These Endpoints

```bash
# Add to UptimeRobot/monitoring service
GET /api/v1/health/    # Every 5 minutes
GET /api/v1/ready/     # Every 5 minutes
GET /api/v1/live/      # Every 5 minutes
```

---

## Monitoring Checklist

### Initial Setup

- [ ] Sentry configured for backend
- [ ] Sentry configured for frontend
- [ ] UptimeRobot monitors created
- [ ] Slack webhooks configured
- [ ] Health check endpoints monitored
- [ ] Alert rules configured

### Production Requirements

- [ ] APM installed (New Relic/DataDog)
- [ ] Log aggregation configured
- [ ] Infrastructure monitoring enabled
- [ ] PagerDuty integration (if 24/7 support)
- [ ] Status page created
- [ ] On-call schedule defined

### Weekly Reviews

- [ ] Review error trends in Sentry
- [ ] Check uptime statistics
- [ ] Review performance metrics
- [ ] Check disk space trends
- [ ] Review alert noise (too many?)

### Monthly Reviews

- [ ] Review incident response times
- [ ] Update alerting thresholds
- [ ] Archive old logs
- [ ] Review and optimize costs
- [ ] Update documentation

---

## Cost Optimization

### Free Tier Options

| Service | Free Tier | Upgrade Needed |
|---------|-----------|----------------|
| Sentry | 5K errors/month | > 5K errors/month |
| UptimeRobot | 50 monitors | > 50 monitors |
| Better Stack | 1GB logs/month | > 1GB logs/month |
| New Relic | 100GB data/month | Rarely |

**Estimated Monthly Cost**:
- Small project: $0-50/month
- Medium project: $50-200/month
- Large project: $200-500/month

---

## Troubleshooting

### No Errors in Sentry

**Possible Causes**:
1. DSN not configured correctly
2. Sentry not initialized
3. Network blocking Sentry

**Solution**:
```python
# Test Sentry manually
from sentry_sdk import capture_exception
try:
    1 / 0
except Exception as e:
    capture_exception(e)
```

### False Positive Alerts

**Solution**:
1. Adjust alert thresholds
2. Add alert conditions (e.g., "for 5 minutes")
3. Add ignore rules for known issues

### Too Many Alerts

**Solution**:
1. Review and consolidate alerts
2. Increase thresholds for non-critical alerts
3. Use alert grouping
4. Schedule quiet hours for non-critical alerts

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [New Relic Documentation](https://docs.newrelic.com/)
- [Better Stack Documentation](https://betterstack.com/docs)
- [SRE Handbook](https://sre.google/sre-book/monitoring-distributed-systems/)

---

**Last Updated**: [Date]
**Next Review**: [Date + 3 months]
