import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getContainer } from '../utils/api';

export default function ContainerDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainer();
  }, [id, token]);

  const fetchContainer = async () => {
    try {
      setLoading(true);
      const data = await getContainer(token, id);
      setContainer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'A1': 'bg-blue-100 text-blue-800',
      'A2': 'bg-green-100 text-green-800',
      'A3': 'bg-yellow-100 text-yellow-800',
      'A4': 'bg-purple-100 text-purple-800',
      'A5': 'bg-pink-100 text-pink-800'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout title="Container Detail">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading container details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Container Detail">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to="/containers" className="mt-4 inline-block text-purple-600 hover:text-purple-800">
          ← Back to Containers
        </Link>
      </Layout>
    );
  }

  if (!container) {
    return (
      <Layout title="Container Detail">
        <div className="text-center py-12">
          <p className="text-gray-500">Container not found</p>
          <Link to="/containers" className="mt-4 inline-block text-purple-600 hover:text-purple-800">
            ← Back to Containers
          </Link>
        </div>
      </Layout>
    );
  }

  // Calculate loss percentage
  const lossPercentage = container.quantities?.actual > 0 
    ? ((container.quantities?.total_loss / container.quantities?.actual) * 100).toFixed(1)
    : 0;

  return (
    <Layout title="Container Detail">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/containers" className="text-purple-600 hover:text-purple-800 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Containers
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-blue-200 text-sm mb-1">Container Number</p>
            <h2 className="text-3xl font-bold">{container.container_number}</h2>
            <p className="text-blue-100 mt-2">Arrived: {container.arrival_date}</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-bold bg-white/20`}>
              {container.batch_count} Batches
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Supplier Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Supplier</h3>
          <p className="text-xl font-semibold text-gray-800">{container.supplier?.name}</p>
          <p className="text-sm text-gray-500">{container.supplier?.code}</p>
          {container.supplier?.country && (
            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {container.supplier?.country}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Status</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-lg font-medium ${getStatusColor(container.status)}`}>
            {container.status}
          </span>
          <p className="text-sm text-gray-500 mt-2">Created: {new Date(container.created_at).toLocaleDateString()}</p>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Notes</h3>
          <p className="text-gray-800">{container.notes || 'No notes'}</p>
        </div>
      </div>

      {/* Quantities Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quantities Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Expected</p>
            <p className="text-2xl font-bold text-blue-800">{container.quantities?.expected?.toLocaleString() || '-'}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Received</p>
            <p className="text-2xl font-bold text-green-800">{container.quantities?.actual?.toLocaleString() || '-'}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Current</p>
            <p className="text-2xl font-bold text-purple-800">{container.quantities?.current?.toLocaleString() || 0}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600 mb-1">Initial Loss</p>
            <p className="text-2xl font-bold text-yellow-800">{container.quantities?.initial_loss?.toLocaleString() || 0}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 mb-1">Total Loss</p>
            <p className="text-2xl font-bold text-red-800">
              {container.quantities?.total_loss?.toLocaleString() || 0}
              <span className="text-sm font-normal ml-1">({lossPercentage}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Batches List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Batches in this Container ({container.batch_count})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variety
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Received
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {container.batches?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p>No batches in this container</p>
                  </td>
                </tr>
              ) : (
                container.batches?.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/batches/${batch.id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {batch.batch_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{batch.variety_name}</div>
                        <div className="text-xs text-gray-500">{batch.variety_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(batch.current_phase)}`}>
                        {batch.current_phase}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {batch.quantity_actual?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={batch.current_quantity < batch.quantity_actual ? 'text-orange-600' : 'text-gray-900'}>
                        {batch.current_quantity?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.date_received}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/batches/${batch.id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Batch Summary Footer */}
        {container.batches?.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total batches: {container.batch_count}</span>
              <span className="text-gray-500">
                Total plants: {container.batches?.reduce((sum, b) => sum + (b.quantity_actual || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
