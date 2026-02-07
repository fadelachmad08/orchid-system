import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getGreenhouse, getAvailableBatches, assignBatchToGreenhouse } from '../utils/api';

export default function GreenhouseDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [greenhouse, setGreenhouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchGreenhouse();
  }, [id, token]);

  const fetchGreenhouse = async () => {
    try {
      setLoading(true);
      const data = await getGreenhouse(token, id);
      setGreenhouse(data);
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

  const getUsageColor = (percent) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Layout title="Greenhouse Detail">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading greenhouse...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !greenhouse) {
    return (
      <Layout title="Greenhouse Detail">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Greenhouse not found'}
        </div>
        <Link to="/greenhouses" className="mt-4 inline-block text-purple-600 hover:text-purple-800">
          ← Back to Greenhouses
        </Link>
      </Layout>
    );
  }

  return (
    <Layout title="Greenhouse Detail">
      {/* Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/greenhouses" className="text-purple-600 hover:text-purple-800 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Greenhouses
        </Link>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          ➕ Assign Batches
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-green-200 text-sm mb-1">Greenhouse</p>
            <h2 className="text-3xl font-bold">{greenhouse.greenhouse_name}</h2>
            <p className="text-green-100 mt-1">{greenhouse.greenhouse_code}</p>
            {greenhouse.location && (
              <p className="text-green-100 mt-2">📍 {greenhouse.location}</p>
            )}
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className={`text-3xl font-bold ${getUsageColor(greenhouse.usage_percent)}`}>
              {greenhouse.usage_percent}%
            </p>
            <p className="text-green-200">Capacity Used</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-3xl font-bold text-gray-800">{greenhouse.current_plants.toLocaleString()}</p>
          <p className="text-gray-500">Current Plants</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-3xl font-bold text-gray-800">{greenhouse.capacity.toLocaleString()}</p>
          <p className="text-gray-500">Total Capacity</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{greenhouse.available_space.toLocaleString()}</p>
          <p className="text-gray-500">Available Space</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-3xl font-bold text-purple-600">{greenhouse.batch_count}</p>
          <p className="text-gray-500">Total Batches</p>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Capacity Overview</h3>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">
            {greenhouse.current_plants.toLocaleString()} of {greenhouse.capacity.toLocaleString()} plants
          </span>
          <span className={`font-medium ${getUsageColor(greenhouse.usage_percent)}`}>
            {greenhouse.usage_percent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`${getProgressColor(greenhouse.usage_percent)} h-4 rounded-full transition-all`}
            style={{ width: `${Math.min(greenhouse.usage_percent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Batches in this Greenhouse */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Batches in this Greenhouse</h3>
        </div>

        {!greenhouse.batches || greenhouse.batches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">No batches assigned to this greenhouse yet.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              Assign Batches
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Batch Number</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Variety</th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Phase</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">Quantity</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Received</th>
                  <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {greenhouse.batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link 
                        to={`/batches/${batch.id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {batch.batch_number}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-800">{batch.variety_name}</p>
                      <p className="text-xs text-gray-500">{batch.variety_code}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(batch.current_phase)}`}>
                        {batch.current_phase}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      {batch.current_quantity.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {batch.date_received}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link 
                        to={`/batches/${batch.id}`}
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignBatchModal
          greenhouseId={parseInt(id)}
          greenhouseName={greenhouse.greenhouse_name}
          token={token}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchGreenhouse();
          }}
        />
      )}
    </Layout>
  );
}

// Assign Batch Modal
function AssignBatchModal({ greenhouseId, greenhouseName, token, onClose, onSuccess }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableBatches();
  }, []);

  const fetchAvailableBatches = async () => {
    try {
      const response = await getAvailableBatches(token, greenhouseId);
      setBatches(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = (batchId) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleAssign = async () => {
    if (selectedBatches.length === 0) {
      setError('Please select at least one batch');
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      // Assign batches one by one
      for (const batchId of selectedBatches) {
        await assignBatchToGreenhouse(token, greenhouseId, batchId);
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'A1': 'bg-blue-100 text-blue-800',
      'A2': 'bg-green-100 text-green-800',
      'A3': 'bg-yellow-100 text-yellow-800',
      'A4': 'bg-purple-100 text-purple-800'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Assign Batches to {greenhouseName}</h3>
          <p className="text-gray-500 text-sm mt-1">Select batches to assign to this greenhouse</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading batches...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No available batches to assign.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div 
                  key={batch.id}
                  onClick={() => toggleBatch(batch.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedBatches.includes(batch.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.id)}
                        onChange={() => {}}
                        className="h-5 w-5 text-purple-600 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{batch.batch_number}</p>
                        <p className="text-sm text-gray-500">{batch.variety_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(batch.current_phase)}`}>
                        {batch.current_phase}
                      </span>
                      <p className="text-sm font-medium mt-1">{batch.current_quantity.toLocaleString()} plants</p>
                    </div>
                  </div>
                  {batch.current_greenhouse_name && (
                    <p className="text-xs text-gray-400 mt-2">
                      Currently in: {batch.current_greenhouse_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {selectedBatches.length} batch(es) selected
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={assigning}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || selectedBatches.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : `Assign ${selectedBatches.length} Batch(es)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
