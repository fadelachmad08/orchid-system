import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  XSquare, 
  Trash2, 
  Building2, 
  RefreshCw,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function BulkActions({ 
  selectedIds, 
  onClearSelection, 
  onActionComplete,
  greenhouses = []
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAssignGreenhouse, setShowAssignGreenhouse] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deletePreview, setDeletePreview] = useState(null);

  const count = selectedIds.length;

  if (count === 0) return null;

  const handleBulkUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error('Pilih status terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      await api.post('/imports/batches/bulk-update', {
        batch_ids: selectedIds,
        field: 'status',
        value: selectedStatus
      });
      
      toast.success(`${count} batches berhasil diupdate ke status "${selectedStatus}"`);
      setShowUpdateStatus(false);
      setSelectedStatus('');
      onClearSelection();
      onActionComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignGreenhouse = async () => {
    if (!selectedGreenhouse) {
      toast.error('Pilih greenhouse terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/imports/batches/bulk-assign-greenhouse', {
        batch_ids: selectedIds,
        greenhouse_id: parseInt(selectedGreenhouse)
      });
      
      toast.success(`${count} batches berhasil dipindahkan ke ${response.data.greenhouse}`);
      setShowAssignGreenhouse(false);
      setSelectedGreenhouse('');
      onClearSelection();
      onActionComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Assign greenhouse gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeletePreview = async () => {
    setLoading(true);
    try {
      const response = await api.post('/imports/batches/bulk-delete', {
        batch_ids: selectedIds,
        confirm: false
      });
      
      setDeletePreview(response.data);
      setShowConfirmDelete(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memuat preview');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setLoading(true);
    try {
      await api.post('/imports/batches/bulk-delete', {
        batch_ids: selectedIds,
        confirm: true
      });
      
      toast.success(`${count} batches berhasil dihapus`);
      setShowConfirmDelete(false);
      setDeletePreview(null);
      onClearSelection();
      onActionComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckSquare className="w-5 h-5" />
              {count} item{count > 1 ? 's' : ''} selected
            </div>
            <button
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
            >
              <XSquare className="w-4 h-4" />
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Update Status Button */}
            <button
              onClick={() => setShowUpdateStatus(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Update Status
            </button>

            {/* Assign Greenhouse Button */}
            <button
              onClick={() => setShowAssignGreenhouse(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Assign Greenhouse
            </button>

            {/* Delete Button */}
            <button
              onClick={handleBulkDeletePreview}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                <button 
                  onClick={() => setShowUpdateStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Update status untuk <strong>{count} batch</strong> yang dipilih:
              </p>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 mb-4"
              >
                <option value="">-- Pilih Status --</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpdateStatus(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdateStatus}
                  disabled={loading || !selectedStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Greenhouse Modal */}
      {showAssignGreenhouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign Greenhouse</h3>
                <button 
                  onClick={() => setShowAssignGreenhouse(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Pindahkan <strong>{count} batch</strong> ke greenhouse:
              </p>

              <select
                value={selectedGreenhouse}
                onChange={(e) => setSelectedGreenhouse(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 mb-4"
              >
                <option value="">-- Pilih Greenhouse --</option>
                {greenhouses.map(gh => (
                  <option key={gh.id} value={gh.id}>
                    {gh.name} (Capacity: {gh.capacity?.toLocaleString()})
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignGreenhouse(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssignGreenhouse}
                  disabled={loading || !selectedGreenhouse}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              {deletePreview && (
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">
                    You are about to delete {deletePreview.batches_to_delete?.length} batches:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {deletePreview.batches_to_delete?.slice(0, 10).map(batch => (
                      <div key={batch.id} className="flex justify-between text-sm bg-white p-2 rounded">
                        <span className="font-medium">{batch.batch_code}</span>
                        <span className="text-gray-500">{batch.current_quantity?.toLocaleString()} plants</span>
                      </div>
                    ))}
                    {deletePreview.batches_to_delete?.length > 10 && (
                      <p className="text-sm text-red-600">
                        ...dan {deletePreview.batches_to_delete.length - 10} batch lainnya
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-red-800 font-semibold">
                      Total plants affected: {deletePreview.total_plants_affected?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeletePreview(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete {count} Batches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
