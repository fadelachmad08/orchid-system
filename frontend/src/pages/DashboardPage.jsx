import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Users, Home, AlertTriangle, 
  Package, Activity, ArrowUp, ArrowDown 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for all statistics
  const [overview, setOverview] = useState({
    total_plants: 0,
    active_batches: 0,
    total_greenhouses: 0,
    loss_rate: 0
  });
  const [plantsByPhase, setPlantsByPhase] = useState([]);
  const [plantsByVariety, setPlantsByVariety] = useState([]);
  const [lossTrend, setLossTrend] = useState([]);
  const [greenhouseUtil, setGreenhouseUtil] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all endpoints in parallel
      const [
        overviewRes,
        phaseRes,
        varietyRes,
        lossRes,
        greenhouseRes,
        activitiesRes
      ] = await Promise.all([
        fetch('http://localhost:8000/api/stats/overview', { headers }),
        fetch('http://localhost:8000/api/stats/plants-by-phase', { headers }),
        fetch('http://localhost:8000/api/stats/plants-by-variety?limit=5', { headers }),
        fetch('http://localhost:8000/api/stats/loss-trend?months=6', { headers }),
        fetch('http://localhost:8000/api/stats/greenhouse-utilization', { headers }),
        fetch('http://localhost:8000/api/stats/recent-activities?limit=8', { headers })
      ]);

      if (!overviewRes.ok) throw new Error('Failed to fetch overview stats');

      const overviewData = await overviewRes.json();
      const phaseData = await phaseRes.json();
      const varietyData = await varietyRes.json();
      const lossData = await lossRes.json();
      const greenhouseData = await greenhouseRes.json();
      const activitiesData = await activitiesRes.json();

      setOverview(overviewData);
      setPlantsByPhase(phaseData);
      setPlantsByVariety(varietyData);
      setLossTrend(lossData);
      setGreenhouseUtil(greenhouseData);
      setRecentActivities(activitiesData);

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'arrival':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'movement':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'loss':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'arrival':
        return 'bg-blue-50 border-blue-200';
      case 'movement':
        return 'bg-green-50 border-green-200';
      case 'loss':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.full_name || user?.username}! Here's your orchid farm overview.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Plants Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Plants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview.total_plants.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Active Batches Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Batches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview.active_batches}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Greenhouses Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Greenhouses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview.total_greenhouses}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Home className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Loss Rate Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Loss Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overview.loss_rate}%
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plants by Phase Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plants by Phase</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={plantsByPhase}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Plants" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plants by Variety Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Varieties</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={plantsByVariety}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ variety_name, percent }) => `${variety_name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {plantsByVariety.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loss Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loss Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lossTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="loss_count" stroke="#ef4444" name="Plants Lost" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Greenhouse Utilization Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Greenhouse Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={greenhouseUtil} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="greenhouse_name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current_usage" fill="#10b981" name="Current" />
              <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            recentActivities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
