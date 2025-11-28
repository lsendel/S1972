import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
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
import { Line, Bar } from 'react-chartjs-2';
import { DashboardSkeleton } from '@/components/LoadingSkeletons';

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

interface DashboardStats {
  users: {
    total: number;
    new_today: number;
    new_this_week: number;
    active_today: number;
  };
  organizations: {
    total: number;
    new_today: number;
    new_this_week: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    cancelled: number;
    new_today: number;
  };
  revenue: {
    mrr: number;
    arr: number;
  };
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await client.get('/api/v1/admin/analytics/dashboard/');
      return response.data;
    },
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['admin', 'timeseries', 'users.new'],
    queryFn: async () => {
      const response = await client.get('/api/v1/admin/analytics/time_series/', {
        params: { metric_type: 'users.new', days: 30 },
      });
      return response.data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin', 'timeseries', 'revenue.mrr'],
    queryFn: async () => {
      const response = await client.get('/api/v1/admin/analytics/time_series/', {
        params: { metric_type: 'revenue.mrr', days: 30 },
      });
      return response.data;
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  const userGrowthChartData = {
    labels: userGrowth?.map((d: any) => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'New Users',
        data: userGrowth?.map((d: any) => d.value) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: revenueData?.map((d: any) => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'MRR ($)',
        data: revenueData?.map((d: any) => d.value) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform analytics and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.total.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">+{stats.users.new_this_week} this week</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.subscriptions.active.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">+{stats.subscriptions.new_today} today</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MRR</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.revenue.mrr.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-2">Monthly Recurring</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Organizations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.organizations.total.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">+{stats.organizations.new_this_week} this week</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 30 Days)</h2>
          {userGrowth && <Line data={userGrowthChartData} options={chartOptions} />}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">MRR Trend (Last 30 Days)</h2>
          {revenueData && <Line data={revenueChartData} options={chartOptions} />}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Today</span>
              <span className="font-semibold text-gray-900">{stats.users.active_today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Today</span>
              <span className="font-semibold text-gray-900">{stats.users.new_today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New This Week</span>
              <span className="font-semibold text-gray-900">{stats.users.new_this_week}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold text-green-600">{stats.subscriptions.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trial</span>
              <span className="font-semibold text-yellow-600">{stats.subscriptions.trial}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold text-red-600">{stats.subscriptions.cancelled}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">MRR</span>
              <span className="font-semibold text-gray-900">${stats.revenue.mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ARR</span>
              <span className="font-semibold text-gray-900">${stats.revenue.arr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ARPU</span>
              <span className="font-semibold text-gray-900">
                ${stats.subscriptions.active > 0 ? (stats.revenue.mrr / stats.subscriptions.active).toFixed(2) : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
