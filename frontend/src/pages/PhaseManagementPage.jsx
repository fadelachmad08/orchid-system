import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBatchesReadyForTransition, movePhase } from '../utils/api';
import { showToast } from '../utils/toast';

export default function PhaseManagementPage() {
  const { token } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phaseFilter, setPhaseFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, [token, phaseFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await getBatchesReadyForTransition(token, phaseFilter || null);
      setBatches(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveClick = (batch) => {
    setSelectedBatch(batch);
    setShowMoveModal(true);
  };

  const handleMoveComplete = () => {
    setShowMoveModal(false);
    setSelectedBatch(null);
    fetchBatches(); // Refresh list
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'A1': 'bg-blue-100 text-blue-800 border-blue-300',
      'A2': 'bg-green-100 text-green-800 border-green-300',
      'A3': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'A4': 'bg-purple-100 text-purple-800 border-purple-300',
      'A5': 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  // Group batches by phase
  const batchesByPhase = batches.reduce((acc, batch) => {
    const phase = batch.current_phase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(batch);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Phase Management</h2>
        <p className="text-gray-500">Move batches through production phases A1 → A2 → A3 → A4 → A5</p>
      </div>

      {/* Phase Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPhaseFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              phaseFilter === '' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Phases
          </button>
          {['A1', 'A2', 'A3', 'A4'].map(phase => (
            <button
              key={phase}
              onClick={() => setPhaseFilter(phase)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                phaseFilter === phase 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Phase Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['A1', 'A2', 'A3', 'A4'].map(phase => (
          <div key={phase} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Phase Header */}
            <div className={`p-4 ${getPhaseColor(phase)} border-b-2`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{phase}</h3>
                  <p className="text-sm opacity-75">
                    {phase === 'A1' && 'Quarantine'}
                    {phase === 'A2' && 'Repotting 1'}
                    {phase === 'A3' && 'Repotting 2'}
                    {phase === 'A4' && 'Highland'}
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {batchesByPhase[phase]?.length || 0}
                </div>
              </div>
            </div>

            {/* Batches List */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {!batchesByPhase[phase] || batchesByPhase[phase].length === 0 ? (
                <p className="text-center text-gray-400 py-8">No batches</p>
              ) : (
                <div className="space-y-3">
                  {batchesByPhase[phase].map(batch => (
                    <div 
                      key={batch.id}
                      className="border rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link 
                          to={`/batches/${batch.id}`}
                          className="font-medium text-purple-600 hover:text-purple-800 text-sm"
                        >
                          {batch.batch_number}
                        </Link>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {batch.current_quantity.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{batch.variety_name}</p>
                      
                      {batch.can_move && (
                        <button
                          onClick={() => handleMoveClick(batch)}
                          className="w-full text-center py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Move to {batch.next_phase} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['A1', 'A2', 'A3', 'A4'].map(phase => {
            const phaseBatches = batchesByPhase[phase] || [];
            const totalPlants = phaseBatches.reduce((sum, b) => sum + b.current_quantity, 0);
            return (
              <div key={phase} className="text-center">
                <p className="text-sm text-gray-500">{phase} Plants</p>
                <p className="text-2xl font-bold text-gray-800">{totalPlants.toLocaleString()}</p>
              </div>
            );
          })}
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Ready</p>
            <p className="text-2xl font-bold text-purple-600">{batches.length}</p>
          </div>
        </div>
      </div>

      {/* Move Phase Modal */}
      {showMoveModal && selectedBatch && (
        <MovePhaseModal
          batch={selectedBatch}
          token={token}
          onClose={() => setShowMoveModal(false)}
          onSuccess={handleMoveComplete}
        />
      )}
    </div>
  );
}

// Move Phase Modal Component
function MovePhaseModal({ batch, token, onClose, onSuccess }) {
  const [quantityLoss, setQuantityLoss] = useState(0);
  const [transitionDate, setTransitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [lossReason, setLossReason] = useState('');
  const [lossNotes, setLossNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quantityMoved = batch.current_quantity - quantityLoss;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (quantityLoss < 0) {
      setError('Loss quantity cannot be negative');
      return;
    }
    
    if (quantityLoss > batch.current_quantity) {
      setError('Loss quantity cannot exceed current quantity');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await movePhase(token, {
        batch_id: batch.id,
        quantity_loss: parseInt(quantityLoss),
        transition_date: transitionDate,
        loss_reason: lossReason || null,
        loss_notes: lossNotes || null,
        notes: notes || null
      });

      // Show success toast
      showToast.success(
        `Successfully moved ${quantityMoved.toLocaleString()} plants from ${batch.current_phase} to ${batch.next_phase}!`
      );

      onSuccess();
    } catch (err) {
      setError(err.message);
      showToast.error(`Failed to move phase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
          <h3 className="text-xl font-bold">Move Phase</h3>
          <p className="text-purple-100 text-sm mt-1">
            {batch.batch_number} • {batch.current_phase} → {batch.next_phase}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Variety</p>
                <p className="font-medium">{batch.variety_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Qty</p>
                <p className="font-medium text-lg">{batch.current_quantity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transition Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transition Date *
            </label>
            <input
              type="date"
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Loss Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reject/Loss Quantity
            </label>
            <input
              type="number"
              min="0"
              max={batch.current_quantity}
              value={quantityLoss}
              onChange={(e) => setQuantityLoss(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Plants that will NOT be moved (rejected/dead)
            </p>
          </div>

          {/* Quantity Preview */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-800">Will move to {batch.next_phase}:</span>
              <span className="text-2xl font-bold text-blue-600">
                {quantityMoved.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Loss Reason (if there's loss) */}
          {quantityLoss > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loss Reason
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select reason...</option>
                  <option value="disease">Disease</option>
                  <option value="damage">Physical Damage</option>
                  <option value="dead">Dead/Wilted</option>
                  <option value="weak">Weak/Undersized</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loss Notes
                </label>
                <textarea
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe the loss..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || quantityMoved < 0}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Moving...' : `Move to ${batch.next_phase}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
