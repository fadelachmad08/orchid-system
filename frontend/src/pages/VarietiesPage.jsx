import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVarieties, createVariety, updateVariety, deleteVariety } from '../utils/api';
import VarietyModal from '../components/VarietyModal';

export default function VarietiesPage() {
  const { token } = useAuth();
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVariety, setEditingVariety] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch varieties on mount
  useEffect(() => {
    fetchVarieties();
  }, []);

  const fetchVarieties = async () => {
    try {
      setLoading(true);
      const data = await getVarieties(token);
      setVarieties(data);
      setError('');
    } catch (err) {
      setError('Failed to load varieties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create/update variety
  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');
      
      if (editingVariety) {
        await updateVariety(token, editingVariety.id, formData);
        setSuccessMessage('Variety updated successfully!');
      } else {
        await createVariety(token, formData);
        setSuccessMessage('Variety created successfully!');
      }
      
      await fetchVarieties();
      setShowModal(false);
      setEditingVariety(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save variety');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete variety
  const handleDelete = async (variety) => {
    if (!confirm(`Are you sure you want to delete "${variety.variety_name}"?`)) {
      return;
    }

    try {
      await deleteVariety(token, variety.id);
      setSuccessMessage('Variety deleted successfully!');
      await fetchVarieties();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete variety');
    }
  };

  // Handle edit click
  const handleEdit = (variety) => {
    setEditingVariety(variety);
    setShowModal(true);
  };

  // Handle add new click
  const handleAddNew = () => {
    setEditingVariety(null);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVariety(null);
  };

  // Filter varieties based on search
  const filteredVarieties = varieties.filter(variety =>
    variety.variety_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variety.variety_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variety.cross_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variety.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                🌺 Varieties Management
              </h1>
            </div>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              + Add Variety
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="Search varieties by name, code, cross info, or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4 animate-bounce">🌸</div>
            <p className="text-gray-600">Loading varieties...</p>
          </div>
        ) : (
          <>
            {/* Varieties Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variety Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cross Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size/Height
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVarieties.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'No varieties found matching your search.' : 'No varieties yet. Click "Add Variety" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredVarieties.map((variety) => (
                      <tr key={variety.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {variety.variety_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variety.variety_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {variety.cross_info || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{variety.flower_size_cm ? `${variety.flower_size_cm} cm` : '-'}</div>
                          <div className="text-xs text-gray-400">
                            {variety.plant_height_cm ? `H: ${variety.plant_height_cm} cm` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variety.grade ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              variety.grade === 'A' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : variety.grade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              Grade {variety.grade}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            variety.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {variety.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(variety)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(variety)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredVarieties.length} of {varieties.length} varieties
            </div>
          </>
        )}
      </main>

      {/* Variety Modal */}
      <VarietyModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        variety={editingVariety}
        loading={submitting}
      />
    </div>
  );
}