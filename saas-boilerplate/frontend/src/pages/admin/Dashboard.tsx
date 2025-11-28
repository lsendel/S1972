
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DashboardSkeleton } from '@/components/LoadingSkeletons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CreditCard, DollarSign, Building2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TimeSeriesData {
  date: string
  value: number
}

interface TypedDashboardStats {
  users: {
    total: number
    new_this_week: number
    active_today: number
    new_today: number
  }
  organizations: {
    total: number
    new_this_week: number
  }
  subscriptions: {
    active: number
    new_today: number
    trial: number
    cancelled: number
  }
  revenue: {
    mrr: number
    arr: number
  }
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<TypedDashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await api.analytics.adminAnalyticsDashboardRetrieve();
      return response as unknown as TypedDashboardStats;
    },
  });

  const { data: userGrowth } = useQuery<TimeSeriesData[]>({
    queryKey: ['admin', 'timeseries', 'users.new'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await api.analytics.adminAnalyticsTimeSeriesRetrieve({
        metricType: 'users.new',
        days: 30,
      });
      return response as unknown as TimeSeriesData[];
    },
  });

  const { data: revenueData } = useQuery<TimeSeriesData[]>({
    queryKey: ['admin', 'timeseries', 'revenue.mrr'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await api.analytics.adminAnalyticsTimeSeriesRetrieve({
        metricType: 'revenue.mrr',
        days: 30,
      });
      return response as unknown as TimeSeriesData[];
    },
  });

  const { data: churnData } = useQuery<TimeSeriesData[]>({
    queryKey: ['admin', 'timeseries', 'subs.cancelled'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await api.analytics.adminAnalyticsTimeSeriesRetrieve({
        metricType: 'subs.cancelled',
        days: 30,
      });
      return response as unknown as TimeSeriesData[];
    },
  });

  const { data: activeUsersData } = useQuery<TimeSeriesData[]>({
    queryKey: ['admin', 'timeseries', 'users.active'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await api.analytics.adminAnalyticsTimeSeriesRetrieve({
        metricType: 'users.active',
        days: 30,
      });
      return response as unknown as TimeSeriesData[];
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  const userGrowthChartData = {
    labels: userGrowth?.map((d) => new Date(d.date).toLocaleDateString()) ?? [],
    datasets: [
      {
        label: 'New Users',
        data: userGrowth?.map((d) => d.value) ?? [],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: revenueData?.map((d) => new Date(d.date).toLocaleDateString()) ?? [],
    datasets: [
      {
        label: 'MRR ($)',
        data: revenueData?.map((d) => d.value) ?? [],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const churnChartData = {
    labels: churnData?.map((d) => new Date(d.date).toLocaleDateString()) ?? [],
    datasets: [
      {
        label: 'Cancellations',
        data: churnData?.map((d) => d.value) ?? [],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const activeUsersChartData = {
    labels: activeUsersData?.map((d) => new Date(d.date).toLocaleDateString()) ?? [],
    datasets: [
      {
        label: 'Active Users',
        data: activeUsersData?.map((d) => d.value) ?? [],
        borderColor: 'hsl(var(--chart-2))',
        backgroundColor: 'hsl(var(--chart-2) / 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform analytics and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.users.new_this_week} this week</p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.subscriptions.new_today} today</p>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly Recurring</p>
          </CardContent>
        </Card>

        {/* Total Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.organizations.new_this_week} this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {userGrowth && <Line data={userGrowthChartData} options={chartOptions} />}
          </CardContent>
        </Card>

        {/* Active Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Daily active users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {activeUsersData && <Line data={activeUsersChartData} options={chartOptions} />}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Trend</CardTitle>
            <CardDescription>Monthly Recurring Revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {revenueData && <Line data={revenueChartData} options={chartOptions} />}
          </CardContent>
        </Card>

        {/* Churn Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Churn</CardTitle>
            <CardDescription>Cancellations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {churnData && <Line data={churnChartData} options={chartOptions} />}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Today</span>
                <span className="font-bold">{stats.users.active_today}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Today</span>
                <span className="font-bold">{stats.users.new_today}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New This Week</span>
                <span className="font-bold">{stats.users.new_this_week}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="font-bold text-green-600">{stats.subscriptions.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trial</span>
                <span className="font-bold text-yellow-600">{stats.subscriptions.trial}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <span className="font-bold text-red-600">{stats.subscriptions.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MRR</span>
                <span className="font-bold">${stats.revenue.mrr.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ARR</span>
                <span className="font-bold">${stats.revenue.arr.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ARPU</span>
                <span className="font-bold">
                  ${stats.subscriptions.active > 0 ? (stats.revenue.mrr / stats.subscriptions.active).toFixed(2) : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
