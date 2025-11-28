# Phase 6: Admin Dashboard & Analytics System

**Completion Date:** 2024
**Git Commit:** 300f21a

---

## Overview

Phase 6 implemented a comprehensive admin dashboard and analytics system that provides platform owners with real-time insights into user activity, revenue metrics, subscription data, and system health. This phase enables data-driven decision making through detailed analytics, activity logging, and visual dashboards.

---

## What Was Implemented

### 1. Analytics Backend Infrastructure

#### Models (`apps/analytics/models.py`)

**ActivityLog Model:**
```python
- 30+ predefined action types
- User actions (login, logout, registration, password changes, 2FA)
- Organization actions (created, updated, member management)
- Subscription actions (created, upgraded, cancelled, payments)
- Admin actions (impersonation, suspension, data exports)
- IP address and user agent tracking
- JSON metadata for flexible data storage
- Optimized indexes for fast querying
```

**DailyMetric Model:**
```python
- Aggregated daily metrics for:
  - User metrics (new, active, total)
  - Organization metrics (new, active, total)
  - Subscription metrics (new, active, cancelled)
  - Revenue metrics (MRR, ARR, new revenue)
- Unique constraint on date + metric_type
- Indexed for efficient time series queries
```

**UserSession Model:**
```python
- Session tracking with duration calculation
- Active session management
- IP address and user agent logging
- Last activity timestamp
- Session end time tracking
```

#### Service Layer (`apps/analytics/services.py`)

**ActivityLogger Service:**
- Centralized activity logging
- Automatic IP address extraction
- User agent capture
- Metadata support for contextual information
- Simple API: `ActivityLogger.log(action, user, request, **metadata)`

**MetricsAggregator Service:**
- Automated daily metrics aggregation
- User growth calculations
- Organization metrics
- Subscription analytics
- Revenue calculations:
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - New revenue tracking
- Handles monthly vs annual subscription conversions

**AnalyticsService:**
- Dashboard statistics retrieval
- Time series data generation
- Recent activity queries
- ARPU (Average Revenue Per User) calculation

#### API Endpoints (`apps/analytics/views.py`)

**Analytics ViewSet:**
```
GET  /api/v1/admin/analytics/dashboard/   - Dashboard statistics
GET  /api/v1/admin/analytics/time_series/ - Time series data
POST /api/v1/admin/analytics/aggregate/   - Manual aggregation trigger
```

**ActivityLog ViewSet:**
```
GET /api/v1/admin/activity-logs/      - List activity logs
GET /api/v1/admin/activity-logs/{id}/ - Activity log details
Filters: action, user
Search: description, user email
```

**UserSession ViewSet:**
```
GET /api/v1/admin/sessions/        - List sessions
GET /api/v1/admin/sessions/active/ - Active sessions only
Filters: user, is_active
```

#### Celery Tasks (`apps/analytics/tasks.py`)

**Automated Tasks:**
1. `aggregate_daily_metrics()` - Runs daily at 1 AM
2. `cleanup_old_activity_logs(days=90)` - 90-day retention
3. `cleanup_old_sessions(days=30)` - 30-day retention
4. `close_inactive_sessions(hours=24)` - Close stale sessions

#### Permissions (`apps/analytics/permissions.py`)

- **IsSuperUser**: Superuser-only access to admin endpoints
- **IsSuperUserOrReadOnly**: Read for authenticated, write for superusers

---

### 2. Frontend Admin Dashboard

#### Admin Layout (`pages/admin/AdminLayout.tsx`)

**Features:**
- Sidebar navigation with icons
- Superuser access verification
- Redirect non-superusers to login
- Consistent admin UI across pages
- "Back to App" link

**Navigation Items:**
- Dashboard (📊)
- Activity Logs (📝)
- Users (👥)
- Organizations (🏢)

#### Dashboard (`pages/admin/Dashboard.tsx`)

**Stats Cards:**
1. **Total Users**
   - Current total with growth indicator
   - New users this week
   - Indigo theme

2. **Active Subscriptions**
   - Active subscription count
   - New subscriptions today
   - Green theme

3. **MRR (Monthly Recurring Revenue)**
   - Current MRR display
   - Monthly recurring label
   - Yellow theme

4. **Total Organizations**
   - Organization count
   - New organizations this week
   - Purple theme

**Charts (Chart.js):**
- **User Growth Chart**: 30-day line chart of new users
- **Revenue Trend Chart**: 30-day line chart of MRR
- Smooth curves with tension: 0.4
- Color-coded datasets
- Interactive tooltips

**Breakdown Cards:**
1. **User Activity**
   - Active today
   - New today
   - New this week

2. **Subscription Status**
   - Active (green)
   - Trial (yellow)
   - Cancelled (red)

3. **Revenue**
   - MRR
   - ARR
   - ARPU (calculated)

#### Activity Logs (`pages/admin/ActivityLogs.tsx`)

**Features:**
- Paginated table view
- Action type dropdown filter
- User information display
- IP address logging
- Timestamp display
- Responsive pagination
- Search and filtering

**Table Columns:**
- User (name + email)
- Action (color-coded badge)
- Description
- IP Address
- Timestamp (localized)

**Filtering:**
- All Actions
- User Login
- User Registration
- Password Changed
- 2FA Enabled
- Organization Created
- Member Invited
- Subscription Created
- Subscription Cancelled

---

## Key Metrics Tracked

### User Metrics
- **Total Users**: All active users
- **New Users Today**: Daily signups
- **New Users This Week**: Weekly growth
- **Active Users Today**: Daily active users (DAU)
- **User Growth Trend**: 30-day time series

### Organization Metrics
- **Total Organizations**: All organizations
- **New Organizations Today**: Daily org creation
- **New Organizations This Week**: Weekly org growth
- **Active Organizations**: Organizations with recent activity

### Subscription Metrics
- **Active Subscriptions**: Currently active
- **Trial Subscriptions**: In trial period
- **Cancelled Subscriptions**: Churned customers
- **New Subscriptions Today**: Daily conversions
- **Subscription Trend**: Time series data

### Revenue Metrics
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue (MRR × 12)
- **ARPU**: Average Revenue Per User
- **New Revenue**: Revenue from new subscriptions
- **Revenue Trend**: 30-day MRR trend

---

## Technical Implementation

### Database Indexes
```python
# ActivityLog
- Index on (created_at DESC)
- Index on (user, created_at DESC)
- Index on (action, created_at DESC)

# DailyMetric
- Index on (date, metric_type)
- Unique constraint on (date, metric_type)

# UserSession
- Index on (user, started_at DESC)
- Index on (is_active, last_activity DESC)
```

### Performance Optimizations
- **Aggregated Metrics**: Pre-calculated daily to avoid expensive queries
- **Indexed Queries**: Strategic indexes for common queries
- **Query Optimization**: select_related() for foreign keys
- **Pagination**: 20 results per page by default
- **Caching**: React Query caching on frontend

### Security Features
- **Superuser-only Access**: All admin endpoints require is_superuser
- **Activity Logging**: Full audit trail of actions
- **IP Tracking**: Security monitoring
- **User Agent Logging**: Device/browser tracking
- **Session Management**: Automatic cleanup of old sessions

---

## File Structure

```
Backend:
saas-boilerplate/backend/apps/analytics/
├── __init__.py
├── admin.py              # Django admin config
├── models.py             # ActivityLog, DailyMetric, UserSession
├── serializers.py        # API serializers
├── services.py           # Business logic (3 services)
├── views.py              # API viewsets (3 viewsets)
├── permissions.py        # Permission classes
├── tasks.py              # Celery tasks (4 tasks)
└── urls.py               # API routing

Frontend:
saas-boilerplate/frontend/src/pages/admin/
├── AdminLayout.tsx       # Admin shell with navigation
├── Dashboard.tsx         # Main analytics dashboard
└── ActivityLogs.tsx      # Activity log viewer
```

---

## Dependencies Added

### Backend
- None (uses existing dependencies)

### Frontend
```json
"chart.js": "^4.4.1"           // Chart rendering engine
"react-chartjs-2": "^5.2.0"    // React wrapper for Chart.js
```

---

## Usage Examples

### Logging Activities

```python
from apps.analytics.services import ActivityLogger

# Log user login
ActivityLogger.log(
    'user.login',
    user=user,
    request=request,
    description='User logged in successfully'
)

# Log organization creation
ActivityLogger.log(
    'org.created',
    user=user,
    request=request,
    organization_id=org.id,
    organization_name=org.name
)

# Log subscription upgrade
ActivityLogger.log(
    'sub.upgraded',
    user=user,
    request=request,
    old_plan='Starter',
    new_plan='Professional'
)
```

### Aggregating Metrics

```python
from apps.analytics.services import MetricsAggregator
from datetime import date

# Aggregate metrics for yesterday
MetricsAggregator.aggregate_daily_metrics()

# Aggregate for specific date
MetricsAggregator.aggregate_daily_metrics(date(2024, 1, 15))
```

### Retrieving Dashboard Stats

```python
from apps.analytics.services import AnalyticsService

# Get dashboard statistics
stats = AnalyticsService.get_dashboard_stats()
# Returns: { users: {...}, organizations: {...}, subscriptions: {...}, revenue: {...} }

# Get time series data
user_growth = AnalyticsService.get_time_series_data('users.new', days=30)
revenue_trend = AnalyticsService.get_time_series_data('revenue.mrr', days=90)
```

### Accessing Admin Dashboard

1. Login as superuser
2. Navigate to `/admin`
3. View real-time metrics and charts
4. Access activity logs at `/admin/activity`
5. Filter and search activity logs
6. View time series charts

---

## Configuration

### Django Settings
```python
# settings/base.py
INSTALLED_APPS = [
    ...
    'apps.analytics',  # Added
]
```

### URL Configuration
```python
# config/urls.py
urlpatterns = [
    ...
    path('api/v1/admin/', include('apps.analytics.urls')),
]
```

### Celery Schedule (Optional)
```python
# config/celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'aggregate-daily-metrics': {
        'task': 'apps.analytics.tasks.aggregate_daily_metrics',
        'schedule': crontab(hour=1, minute=0),  # Run daily at 1 AM
    },
    'cleanup-old-activity-logs': {
        'task': 'apps.analytics.tasks.cleanup_old_activity_logs',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Weekly
    },
    'close-inactive-sessions': {
        'task': 'apps.analytics.tasks.close_inactive_sessions',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
}
```

---

## API Documentation

### Dashboard Endpoint

**Request:**
```bash
GET /api/v1/admin/analytics/dashboard/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": {
    "total": 1543,
    "new_today": 12,
    "new_this_week": 87,
    "active_today": 423
  },
  "organizations": {
    "total": 324,
    "new_today": 3,
    "new_this_week": 21
  },
  "subscriptions": {
    "active": 289,
    "trial": 35,
    "cancelled": 45,
    "new_today": 2
  },
  "revenue": {
    "mrr": 14350.00,
    "arr": 172200.00
  }
}
```

### Time Series Endpoint

**Request:**
```bash
GET /api/v1/admin/analytics/time_series/?metric_type=users.new&days=30
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "value": 45
  },
  {
    "date": "2024-01-02",
    "value": 52
  },
  ...
]
```

### Activity Logs Endpoint

**Request:**
```bash
GET /api/v1/admin/activity-logs/?action=user.login&page=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 1543,
  "next": "http://api.example.com/api/v1/admin/activity-logs/?page=2",
  "previous": null,
  "results": [
    {
      "id": "123",
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "action": "user.login",
      "action_display": "User Login",
      "description": "User logged in successfully",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z",
      "metadata": {}
    },
    ...
  ]
}
```

---

## Benefits

### For Platform Owners
- **Real-time Insights**: Live dashboard with key metrics
- **Data-Driven Decisions**: Historical trends and patterns
- **Revenue Tracking**: MRR, ARR, and growth metrics
- **User Behavior**: Activity patterns and engagement
- **Audit Trail**: Complete activity history for compliance

### For Operations
- **Session Monitoring**: Track active users and sessions
- **Activity Logging**: Debugging and support
- **Automated Cleanup**: Old data retention management
- **Performance Metrics**: System health indicators

### For Security
- **IP Tracking**: Security monitoring
- **Activity Audit**: Suspicious activity detection
- **Session Management**: Stale session cleanup
- **User Agent Logging**: Device/browser tracking

---

## Future Enhancements

1. **Advanced Charts**:
   - Cohort analysis
   - Retention curves
   - Churn prediction
   - Funnel analytics

2. **Exports**:
   - CSV export of metrics
   - PDF reports
   - Email digests
   - Scheduled reports

3. **Real-time Updates**:
   - WebSocket integration
   - Live dashboard updates
   - Real-time alerts

4. **Advanced Filtering**:
   - Date range selector
   - Multiple filter combination
   - Saved filter presets
   - Custom metric definitions

5. **User Management**:
   - User list view
   - User detail page
   - Impersonation feature
   - Bulk actions

6. **A/B Testing**:
   - Experiment tracking
   - Variant performance
   - Statistical significance
   - Feature flags integration

---

## Testing

### Backend Tests
```bash
# Test analytics services
pytest apps/analytics/tests/

# Test activity logging
pytest apps/analytics/tests/test_services.py -k test_activity_logger

# Test metrics aggregation
pytest apps/analytics/tests/test_services.py -k test_metrics_aggregator
```

### Frontend Tests
```bash
# Test admin dashboard
npm run test -- AdminDashboard

# Test activity logs
npm run test -- ActivityLogs
```

---

## Performance Considerations

### Query Optimization
- Pre-aggregated metrics reduce query complexity
- Indexed fields for common filters
- Pagination for large datasets
- select_related() for foreign keys

### Data Retention
- Activity logs: 90 days (configurable)
- User sessions: 30 days (configurable)
- Daily metrics: Indefinite (small data size)

### Scalability
- Time series data stored efficiently
- Aggregation runs during off-peak hours
- Horizontal scaling ready (stateless API)
- Cache-friendly dashboard stats

---

## Security Considerations

- **Authentication**: JWT tokens required
- **Authorization**: Superuser-only access
- **Rate Limiting**: Applied to all endpoints
- **Input Validation**: Serializer validation
- **SQL Injection**: ORM prevents injection
- **XSS Protection**: React auto-escaping
- **Audit Trail**: All admin actions logged

---

## Summary

Phase 6 successfully implemented a comprehensive admin dashboard and analytics system that provides:

- ✅ **Real-time platform metrics** with visual dashboards
- ✅ **Complete activity audit trail** for compliance
- ✅ **Automated metrics aggregation** via Celery
- ✅ **Revenue tracking** (MRR, ARR, ARPU)
- ✅ **User and session analytics**
- ✅ **Time series data** for trend analysis
- ✅ **Superuser-only access** for security
- ✅ **Interactive charts** with Chart.js
- ✅ **Filtering and search** capabilities
- ✅ **Optimized performance** with indexes and caching

**Total Files Changed:** 54 files
**Backend:** 15 new files (analytics app)
**Frontend:** 3 new admin pages
**Commit:** 300f21a

---

**Phase 6 Complete! 📊**

The platform now has a powerful admin dashboard for monitoring and analytics, enabling data-driven decision making and platform oversight.
