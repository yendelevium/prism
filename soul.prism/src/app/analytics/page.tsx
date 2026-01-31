'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, TrendingUp, AlertCircle, Clock, Users, Zap, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

//  Replace with real API call when backend is ready
const analyticsService = {
  async fetchDashboard(timeRange = '24h', endpoint = 'all') {
    try {
      // const data = await response.json();
      // return data;
      
      // using mock data for now
      return getMockData();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }
};

// Mock data - remove this when API is ready
function getMockData() {
  return {
    summary: {
      totalRequests: 15847,
      successRate: 97.3,
      avgResponseTime: 247,
      activeUsers: 142,
      peakHour: '14:00'
    },
    requestVolume: [
      { time: '00:00', requests: 120 },
      { time: '04:00', requests: 85 },
      { time: '08:00', requests: 450 },
      { time: '12:00', requests: 780 },
      { time: '16:00', requests: 890 },
      { time: '20:00', requests: 520 }
    ],
    statusCodes: [
      { name: '2xx Success', value: 15423, color: '#A3BE8C' },
      { name: '4xx Client Error', value: 312, color: '#EBCB8B' },
      { name: '5xx Server Error', value: 112, color: '#BF616A' }
    ],
    latencyData: [
      { time: '00:00', p50: 120, p95: 340, p99: 580 },
      { time: '04:00', p50: 95, p95: 280, p99: 450 },
      { time: '08:00', p50: 180, p95: 420, p99: 720 },
      { time: '12:00', p50: 210, p95: 480, p99: 850 },
      { time: '16:00', p50: 195, p95: 450, p99: 780 },
      { time: '20:00', p50: 145, p95: 380, p99: 620 }
    ],
    endpoints: [
      { endpoint: '/api/users', calls: 4521, avg_time: 145, errors: 12, slowest: 1200 },
      { endpoint: '/api/orders', calls: 3890, avg_time: 234, errors: 45, slowest: 2100 },
      { endpoint: '/api/products', calls: 2341, avg_time: 189, errors: 8, slowest: 890 },
      { endpoint: '/api/auth/login', calls: 1876, avg_time: 98, errors: 23, slowest: 450 },
      { endpoint: '/api/analytics', calls: 1543, avg_time: 567, errors: 15, slowest: 3400 }
    ],
    recentErrors: [
      { id: 1, endpoint: '/api/orders', error: 'Database timeout', timestamp: '2 mins ago', status: 500 },
      { id: 2, endpoint: '/api/users', error: 'Invalid token', timestamp: '5 mins ago', status: 401 },
      { id: 3, endpoint: '/api/products', error: 'Not found', timestamp: '12 mins ago', status: 404 },
      { id: 4, endpoint: '/api/orders', error: 'Rate limit exceeded', timestamp: '18 mins ago', status: 429 }
    ]
  };
}

const SummaryCard = ({ icon, title, value, bgColor }) => {
  return (
    <div className="bg-[#3B4252] rounded-lg border border-[#4C566A] p-4 sm:p-5 lg:p-6 flex items-start gap-3 sm:gap-4 hover:border-[#88C0D0] transition-colors">
      <div className={`${bgColor} text-white p-2 sm:p-2.5 lg:p-3 rounded-lg`}>
        {React.cloneElement(icon, { className: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6' })}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-[#D8DEE9] mb-0.5 sm:mb-1">{title}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#ECEFF4]">{value}</p>
      </div>
    </div>
  );
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-2 sm:p-3 shadow-xl">
        <p className="text-xs sm:text-sm text-[#ECEFF4] font-medium mb-1 sm:mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 sm:gap-2">
            <div 
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#D8DEE9] text-xs sm:text-sm">
              {entry.name}: <span className="text-[#ECEFF4] font-semibold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedEndpoint, setSelectedEndpoint] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      activeUsers: 0,
      peakHour: '--:--'
    },
    requestVolume: [],
    statusCodes: [],
    latencyData: [],
    endpoints: [],
    recentErrors: []
  });

  // fetch data from API
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await analyticsService.fetchDashboard(timeRange, selectedEndpoint);
      setAnalyticsData(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedEndpoint]);

  // Initial load
  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  // show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#2E3440] p-4 sm:p-6 flex items-center justify-center">
        <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#BF616A] mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-[#ECEFF4] text-center mb-2">Error Loading Analytics</h2>
          <p className="text-sm sm:text-base text-[#D8DEE9] text-center mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-[#88C0D0] text-[#2E3440] py-2 px-4 rounded-lg hover:bg-[#81A1C1] transition-colors text-sm sm:text-base font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2E3440] p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#ECEFF4] mb-1 sm:mb-2">Analytics Dashboard</h1>
            <p className="text-xs sm:text-sm text-[#D8DEE9]">Real-time API performance and tracing insights</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && lastUpdate && (
              <span className="text-xs sm:text-sm text-[#D8DEE9]">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 sm:p-2 bg-[#3B4252] border border-[#4C566A] rounded-lg hover:bg-[#434C5E] transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-[#ECEFF4] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Time range and endpoint filters */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-[#4C566A] rounded-lg bg-[#3B4252] text-[#ECEFF4] focus:outline-none focus:ring-2 focus:ring-[#88C0D0] focus:border-transparent"
            disabled={loading}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select 
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-[#4C566A] rounded-lg bg-[#3B4252] text-[#ECEFF4] focus:outline-none focus:ring-2 focus:ring-[#88C0D0] focus:border-transparent"
            disabled={loading}
          >
            <option value="all">All Endpoints</option>
            {analyticsData.endpoints.slice(0, 5).map((ep, idx) => (
              <option key={idx} value={ep.endpoint}>{ep.endpoint}</option>
            ))}
          </select>
        </div>

        {/* Loading state */}
        {loading && !analyticsData.summary.totalRequests ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-[#88C0D0] animate-spin mx-auto mb-4" />
              <p className="text-sm sm:text-base text-[#D8DEE9]">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <SummaryCard 
                icon={<Activity className="w-6 h-6" />}
                title="Total Requests"
                value={analyticsData.summary.totalRequests?.toLocaleString() || '0'}
                bgColor="bg-[#88C0D0]"
              />
              <SummaryCard 
                icon={<TrendingUp className="w-6 h-6" />}
                title="Success Rate"
                value={`${analyticsData.summary.successRate || 0}%`}
                bgColor="bg-[#A3BE8C]"
              />
              <SummaryCard 
                icon={<Clock className="w-6 h-6" />}
                title="Avg Response"
                value={`${analyticsData.summary.avgResponseTime || 0}ms`}
                bgColor="bg-[#B48EAD]"
              />
              <SummaryCard 
                icon={<Users className="w-6 h-6" />}
                title="Active Users"
                value={analyticsData.summary.activeUsers || 0}
                bgColor="bg-[#D08770]"
              />
              <SummaryCard 
                icon={<Zap className="w-6 h-6" />}
                title="Peak Hour"
                value={analyticsData.summary.peakHour || '--:--'}
                bgColor="bg-[#5E81AC]"
              />
            </div>

            {/* Request volume over time */}
            <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#ECEFF4] mb-3 sm:mb-4">Request Volume</h2>
              {analyticsData.requestVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData.requestVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4C566A" />
                    <XAxis dataKey="time" stroke="#D8DEE9" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#D8DEE9" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#D8DEE9', fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#88C0D0" 
                      strokeWidth={2}
                      dot={{ fill: '#88C0D0', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-[#D8DEE9]">
                  No data available for this time range
                </div>
              )}
            </div>

            {/* Status Codes & Latency side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              
              {/* Status codes pie chart */}
              <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-4 sm:p-5 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#ECEFF4] mb-3 sm:mb-4">Status Code Distribution</h2>
                {analyticsData.statusCodes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusCodes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        style={{ fontSize: '11px' }}
                      >
                        {analyticsData.statusCodes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-sm text-[#D8DEE9]">
                    No status data available
                  </div>
                )}
              </div>

              {/* Response time percentiles */}
              <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-4 sm:p-5 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#ECEFF4] mb-3 sm:mb-4">Response Time (Percentiles)</h2>
                {analyticsData.latencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.latencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4C566A" />
                      <XAxis dataKey="time" stroke="#D8DEE9" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#D8DEE9" style={{ fontSize: '12px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#D8DEE9', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="p50" stroke="#A3BE8C" strokeWidth={2} name="p50" />
                      <Line type="monotone" dataKey="p95" stroke="#EBCB8B" strokeWidth={2} name="p95" />
                      <Line type="monotone" dataKey="p99" stroke="#BF616A" strokeWidth={2} name="p99" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-sm text-[#D8DEE9]">
                    No latency data available
                  </div>
                )}
              </div>
            </div>

            {/* Endpoint performance breakdown */}
            <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#ECEFF4] mb-3 sm:mb-4">Endpoint Performance</h2>
              {analyticsData.endpoints.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#4C566A]">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Endpoint</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Calls</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Avg Time</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Errors</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Slowest</th>
                        <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#D8DEE9]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.endpoints.map((endpoint, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-[#4C566A] hover:bg-[#434C5E] transition-colors cursor-pointer"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <code className="text-xs sm:text-sm bg-[#2E3440] text-[#88C0D0] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-[#4C566A]">
                              {endpoint.endpoint}
                            </code>
                          </td>
                          <td className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#ECEFF4]">
                            {endpoint.calls?.toLocaleString()}
                          </td>
                          <td className="text-right py-2 sm:py-3 px-2 sm:px-4">
                            <span className={`text-xs sm:text-sm font-medium ${endpoint.avg_time > 300 ? 'text-[#BF616A]' : 'text-[#A3BE8C]'}`}>
                              {endpoint.avg_time}ms
                            </span>
                          </td>
                          <td className="text-right py-2 sm:py-3 px-2 sm:px-4">
                            <span className={`text-xs sm:text-sm ${endpoint.errors > 20 ? 'text-[#BF616A] font-semibold' : 'text-[#ECEFF4]'}`}>
                              {endpoint.errors}
                            </span>
                          </td>
                          <td className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#ECEFF4]">
                            {endpoint.slowest}ms
                          </td>
                          <td className="text-right py-2 sm:py-3 px-2 sm:px-4">
                            <button className="text-[#88C0D0] hover:text-[#81A1C1] text-xs sm:text-sm font-medium">
                              View Trace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 sm:py-12 text-sm text-[#D8DEE9]">
                  No endpoint data available
                </div>
              )}
            </div>

            {/* Recent errors list */}
            <div className="bg-[#3B4252] border border-[#4C566A] rounded-lg p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#ECEFF4]">Recent Errors</h2>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#BF616A]" />
              </div>
              {analyticsData.recentErrors.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {analyticsData.recentErrors.map((error) => (
                    <div 
                      key={error.id}
                      className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 bg-[#434C5E] border border-[#4C566A] rounded-lg hover:bg-[#4C566A] transition-colors cursor-pointer gap-2"
                    >
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <code className="text-xs sm:text-sm bg-[#2E3440] text-[#88C0D0] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-[#4C566A]">
                            {error.endpoint}
                          </code>
                          <span className="text-xs font-semibold text-[#ECEFF4] bg-[#BF616A] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {error.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#EBCB8B] font-medium">{error.error}</p>
                      </div>
                      <span className="text-xs text-[#D8DEE9] whitespace-nowrap sm:ml-4">
                        {error.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 sm:py-12 text-sm text-[#D8DEE9]">
                  No recent errors
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}