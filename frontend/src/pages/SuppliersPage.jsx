import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../utils/api';
import SupplierModal from '../components/SupplierModal';

export default function SuppliersPage() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(token);
      setSuppliers(data);
      setError('');
    } catch (err) {
      setError('Failed to load suppliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create/update supplier
  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');
      
      if (editingSupplier) {
        // Update existing supplier
        await updateSupplier(token, editingSupplier.id, formData);
        setSuccessMessage('Supplier updated successfully!');
      } else {
        // Create new supplier
        await createSupplier(token, formData);
        setSuccessMessage('Supplier created successfully!');
      }
      
      // Refresh list
      await fetchSuppliers();
      
      // Close modal
      setShowModal(false);
      setEditingSupplier(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete supplier
  const handleDelete = async (supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.supplier_name}"?`)) {
      return;
    }

    try {
      await deleteSupplier(token, supplier.id);
      setSuccessMessage('Supplier deleted successfully!');
      await fetchSuppliers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    }
  };

  // Handle edit click
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  // Handle add new click
  const handleAddNew = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  // Filter suppliers based on search
const filteredSuppliers = suppliers.filter(supplier =>
  supplier.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supplier.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                🏷️ Suppliers Management
              </h1>
            </div>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              + Add Supplier
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
            placeholder="Search suppliers by name, code, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4 animate-bounce">🌸</div>
            <p className="text-gray-600">Loading suppliers...</p>
          </div>
        ) : (
          <>
            {/* Suppliers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
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
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers yet. Click "Add Supplier" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supplier.supplier_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier.supplier_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.country || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{supplier.contact_person || '-'}</div>
                          <div className="text-xs text-gray-400">{supplier.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            supplier.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(supplier)}
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
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
          </>
        )}
      </main>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        supplier={editingSupplier}
        loading={submitting}
      />
    </div>
  );
}