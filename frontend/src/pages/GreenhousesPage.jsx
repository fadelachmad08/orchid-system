import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGreenhouses, createGreenhouse, updateGreenhouse, deleteGreenhouse } from '../utils/api';

export default function GreenhousesPage() {
  const { token } = useAuth();
  const [greenhouses, setGreenhouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGreenhouse, setEditingGreenhouse] = useState(null);

  useEffect(() => {
    fetchGreenhouses();
  }, [token]);

  const fetchGreenhouses = async () => {
    try {
      setLoading(true);
      const response = await getGreenhouses(token);
      setGreenhouses(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingGreenhouse(null);
    setShowModal(true);
  };

  const handleEdit = (greenhouse) => {
    setEditingGreenhouse(greenhouse);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteGreenhouse(token, id);
      fetchGreenhouses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingGreenhouse(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchGreenhouses();
  };

  const getUsageColor = (percent) => {
    if (percent >= 90) return 'text-red-600 bg-red-100';
    if (percent >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading greenhouses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Greenhouse Management</h2>
          <p className="text-gray-500">Manage your greenhouse facilities</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <span className="mr-2">➕</span>
          Add Greenhouse
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Greenhouses Grid */}
      {greenhouses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Greenhouses Yet</h3>
          <p className="text-gray-500 mb-4">Add your first greenhouse to start managing plant locations.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Add Greenhouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {greenhouses.map((gh) => (
            <div key={gh.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{gh.greenhouse_name}</h3>
                    <p className="text-sm text-gray-500">{gh.greenhouse_code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getUsageColor(gh.usage_percent)}`}>
                    {gh.usage_percent}% used
                  </span>
                </div>
                {gh.location && (
                  <p className="text-sm text-gray-500 mt-2">📍 {gh.location}</p>
                )}
              </div>

              {/* Stats */}
              <div className="p-6">
                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-medium">{gh.current_plants.toLocaleString()} / {gh.capacity.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${getProgressColor(gh.usage_percent)} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(gh.usage_percent, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-800">{gh.batch_count}</p>
                    <p className="text-xs text-gray-500">Batches</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-800">{gh.current_plants.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Plants</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                <Link
                  to={`/greenhouses/${gh.id}`}
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                >
                  View Details →
                </Link>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(gh)}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(gh.id, gh.greenhouse_name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <GreenhouseModal
          greenhouse={editingGreenhouse}
          token={token}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// Greenhouse Modal Component
function GreenhouseModal({ greenhouse, token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    greenhouse_code: greenhouse?.greenhouse_code || '',
    greenhouse_name: greenhouse?.greenhouse_name || '',
    location: greenhouse?.location || '',
    capacity: greenhouse?.capacity || '',
    notes: greenhouse?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!greenhouse;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.greenhouse_code || !formData.greenhouse_name) {
      setError('Code and Name are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0
      };

      if (isEditing) {
        await updateGreenhouse(token, greenhouse.id, data);
      } else {
        await createGreenhouse(token, data);
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Greenhouse' : 'Add Greenhouse'}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              name="greenhouse_code"
              value={formData.greenhouse_code}
              onChange={handleChange}
              disabled={isEditing}
              placeholder="e.g., GH-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="greenhouse_name"
              value={formData.greenhouse_name}
              onChange={handleChange}
              placeholder="e.g., Greenhouse A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., North Area"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (plants)
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

