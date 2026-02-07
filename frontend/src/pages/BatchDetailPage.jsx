import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getBatch, getTransitionHistory, movePhase, recordLoss } from '../utils/api';

export default function BatchDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchData, historyData] = await Promise.all([
        getBatch(token, id),
        getTransitionHistory(token, id)
      ]);
      setBatch(batchData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase, isActive) => {
    if (!isActive) return 'bg-gray-200 text-gray-500';
    
    const colors = {
      'A1': 'bg-blue-500 text-white',
      'A2': 'bg-green-500 text-white',
      'A3': 'bg-yellow-500 text-white',
      'A4': 'bg-purple-500 text-white',
      'A5': 'bg-pink-500 text-white'
    };
    return colors[phase] || 'bg-gray-500 text-white';
  };

  const getCurrentQuantity = () => {
    if (!batch) return 0;
    const phase = batch.current_phase;
    if (phase === 'A1') return batch.phase_quantities?.a1_current || 0;
    if (phase === 'A2') return batch.phase_quantities?.a2_current || 0;
    if (phase === 'A3') return batch.phase_quantities?.a3_current || 0;
    if (phase === 'A4') return batch.phase_quantities?.a4_current || 0;
    if (phase === 'A5') return batch.phase_quantities?.a5_sold || 0;
    return 0;
  };

  const canMovePhase = () => {
    if (!batch || batch.is_completed) return false;
    return ['A1', 'A2', 'A3', 'A4'].includes(batch.current_phase);
  };

  const getNextPhase = () => {
    const transitions = { 'A1': 'A2', 'A2': 'A3', 'A3': 'A4', 'A4': 'A5' };
    return transitions[batch?.current_phase] || null;
  };

  if (loading) {
    return (
      <Layout title="Batch Detail">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading batch details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !batch) {
    return (
      <Layout title="Batch Detail">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Batch not found'}
        </div>
        <Link to="/batches" className="mt-4 inline-block text-purple-600 hover:text-purple-800">
          ← Back to Batches
        </Link>
      </Layout>
    );
  }

  const phases = ['A1', 'A2', 'A3', 'A4', 'A5'];
  const currentPhaseIndex = phases.indexOf(batch.current_phase);

  return (
    <Layout title="Batch Detail">
      {/* Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/batches" className="text-purple-600 hover:text-purple-800 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Batches
        </Link>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!batch.is_completed && getCurrentQuantity() > 0 && (
            <button
              onClick={() => setShowLossModal(true)}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              📉 Record Loss
            </button>
          )}
          {canMovePhase() && getCurrentQuantity() > 0 && (
            <button
              onClick={() => setShowMoveModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Move to {getNextPhase()}
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-purple-200 text-sm mb-1">Batch Number</p>
            <h2 className="text-3xl font-bold">{batch.batch_number}</h2>
            <p className="text-purple-100 mt-2">{batch.variety?.name} ({batch.variety?.code})</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${batch.is_completed ? 'bg-green-600' : 'bg-white/20'}`}>
              {batch.is_completed ? '✅ Completed' : `Phase ${batch.current_phase}`}
            </span>
            <p className="text-purple-200 mt-2">
              Current: <span className="text-white font-bold">{getCurrentQuantity().toLocaleString()}</span> plants
            </p>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Phase Progress</h3>
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => (
            <div key={phase} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPhaseColor(phase, index <= currentPhaseIndex)}`}>
                  {phase}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {index === 0 && 'Quarantine'}
                  {index === 1 && 'Repot 1'}
                  {index === 2 && 'Repot 2'}
                  {index === 3 && 'Highland'}
                  {index === 4 && 'Sales'}
                </p>
              </div>
              {index < phases.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${index < currentPhaseIndex ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Variety</h3>
          <p className="text-xl font-semibold text-gray-800">{batch.variety?.name}</p>
          <p className="text-sm text-gray-500">{batch.variety?.code}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Container</h3>
          <Link 
            to={`/containers/${batch.container?.id}`}
            className="text-xl font-semibold text-purple-600 hover:text-purple-800"
          >
            {batch.container?.number}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Supplier</h3>
          <p className="text-xl font-semibold text-gray-800">{batch.supplier?.name}</p>
        </div>
      </div>

      {/* Quantities */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quantities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Expected</p>
            <p className="text-2xl font-bold text-blue-800">{batch.quantities?.expected?.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Received</p>
            <p className="text-2xl font-bold text-green-800">{batch.quantities?.actual?.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Current</p>
            <p className="text-2xl font-bold text-purple-800">{getCurrentQuantity().toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 mb-1">Total Loss</p>
            <p className="text-2xl font-bold text-red-800">{history?.summary?.total_quantity_lost?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Phase Quantities Detail */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Phase Quantities</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phase</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Start</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Current</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Entry Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 'A1', name: 'Quarantine', start: batch.phase_quantities?.a1_start, current: batch.phase_quantities?.a1_current, date: batch.dates?.a1_entry },
                { phase: 'A2', name: 'Repotting 1', start: batch.phase_quantities?.a2_start, current: batch.phase_quantities?.a2_current, date: batch.dates?.a2_entry },
                { phase: 'A3', name: 'Repotting 2', start: batch.phase_quantities?.a3_start, current: batch.phase_quantities?.a3_current, date: batch.dates?.a3_entry },
                { phase: 'A4', name: 'Highland', start: batch.phase_quantities?.a4_start, current: batch.phase_quantities?.a4_current, date: batch.dates?.a4_entry },
              ].map(row => (
                <tr key={row.phase} className={`border-b ${batch.current_phase === row.phase ? 'bg-purple-50' : ''}`}>
                  <td className="py-3 px-4 font-medium">{row.phase} - {row.name}</td>
                  <td className="py-3 px-4 text-right">{row.start?.toLocaleString() || '-'}</td>
                  <td className="py-3 px-4 text-right">{row.current?.toLocaleString() || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{row.date || '-'}</td>
                </tr>
              ))}
              <tr className={batch.current_phase === 'A5' ? 'bg-pink-50' : ''}>
                <td className="py-3 px-4 font-medium">A5 - Sold</td>
                <td colSpan="2" className="py-3 px-4 text-right">{batch.phase_quantities?.a5_sold?.toLocaleString() || '-'}</td>
                <td className="py-3 px-4 text-gray-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transition History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transition History</h3>
        
        {!history?.history || history.history.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transitions recorded yet</p>
        ) : (
          <div className="space-y-4">
            {history.history.map((t, index) => (
              <div 
                key={t.id} 
                className={`border-l-4 pl-4 py-3 ${
                  t.type === 'phase_move' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                } rounded-r-lg`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {t.type === 'phase_move' 
                        ? `${t.from_phase} → ${t.to_phase}`
                        : `Loss in ${t.from_phase}`
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {t.type === 'phase_move' 
                        ? `Moved ${t.quantity_moved.toLocaleString()} plants`
                        : `Lost ${t.quantity_loss.toLocaleString()} plants`
                      }
                      {t.quantity_loss > 0 && t.type === 'phase_move' && (
                        <span className="text-red-600"> (Loss: {t.quantity_loss})</span>
                      )}
                    </p>
                    {t.loss_reason && (
                      <p className="text-sm text-gray-500">Reason: {t.loss_reason}</p>
                    )}
                    {t.notes && (
                      <p className="text-sm text-gray-500 italic">"{t.notes}"</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {t.transition_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Move Phase Modal */}
      {showMoveModal && (
        <PhaseActionModal
          type="move"
          batch={{ 
            id: batch.id, 
            batch_number: batch.batch_number,
            current_phase: batch.current_phase,
            next_phase: getNextPhase(),
            variety_name: batch.variety?.name,
            current_quantity: getCurrentQuantity()
          }}
          token={token}
          onClose={() => setShowMoveModal(false)}
          onSuccess={() => {
            setShowMoveModal(false);
            fetchData();
          }}
        />
      )}

      {/* Record Loss Modal */}
      {showLossModal && (
        <PhaseActionModal
          type="loss"
          batch={{ 
            id: batch.id, 
            batch_number: batch.batch_number,
            current_phase: batch.current_phase,
            variety_name: batch.variety?.name,
            current_quantity: getCurrentQuantity()
          }}
          token={token}
          onClose={() => setShowLossModal(false)}
          onSuccess={() => {
            setShowLossModal(false);
            fetchData();
          }}
        />
      )}
    </Layout>
  );
}

// Phase Action Modal (Move or Loss)
function PhaseActionModal({ type, batch, token, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(type === 'move' ? 0 : 1);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [lossReason, setLossReason] = useState('');
  const [lossNotes, setLossNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMove = type === 'move';
  const quantityMoved = isMove ? batch.current_quantity - quantity : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (isMove) {
        await movePhase(token, {
          batch_id: batch.id,
          quantity_loss: parseInt(quantity),
          transition_date: actionDate,
          loss_reason: lossReason || null,
          loss_notes: lossNotes || null,
          notes: notes || null
        });
      } else {
        await recordLoss(token, {
          batch_id: batch.id,
          quantity_loss: parseInt(quantity),
          loss_date: actionDate,
          loss_reason: lossReason || null,
          loss_notes: lossNotes || null
        });
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 border-b ${isMove ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white rounded-t-xl`}>
          <h3 className="text-xl font-bold">{isMove ? 'Move Phase' : 'Record Loss'}</h3>
          <p className="text-white/80 text-sm mt-1">
            {batch.batch_number} • {isMove ? `${batch.current_phase} → ${batch.next_phase}` : batch.current_phase}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Quantity</span>
              <span className="font-bold">{batch.current_quantity.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isMove ? 'Transition Date' : 'Loss Date'} *
            </label>
            <input
              type="date"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isMove ? 'Reject/Loss Quantity' : 'Loss Quantity'} *
            </label>
            <input
              type="number"
              min={isMove ? 0 : 1}
              max={batch.current_quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required={!isMove}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {isMove && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Will move to {batch.next_phase}:</span>
                <span className="text-2xl font-bold text-blue-600">{quantityMoved.toLocaleString()}</span>
              </div>
            </div>
          )}

          {(quantity > 0 || !isMove) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loss Reason</label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Loss Notes</label>
                <textarea
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                isMove ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : (isMove ? `Move to ${batch.next_phase}` : 'Record Loss')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
