import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBatchTracking, getLossSummary, getContainers, getAgeGroups, exportBatchTracking } from '../utils/api';

export default function BatchTrackingPage() {
  const { token } = useAuth();
  
  // Container selection state
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [loadingContainers, setLoadingContainers] = useState(true);
  
  // Age Group selection state
  const [ageGroups, setAgeGroups] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
  
  // Tracking data state
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lossSummary, setLossSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainers();
  }, [token]);

  const fetchContainers = async () => {
    try {
      setLoadingContainers(true);
      const response = await getContainers(token, { limit: 100 });
      setContainers(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingContainers(false);
    }
  };

  const handleSelectContainer = async (container) => {
    setSelectedContainer(container);
    setSelectedAgeGroup(null);
    setData([]);
    setSummary(null);
    await fetchAgeGroups(container.id);
  };

  const fetchAgeGroups = async (containerId) => {
    try {
      setLoadingAgeGroups(true);
      setError(null);
      const response = await getAgeGroups(token, containerId);
      setAgeGroups(response || []);
      
      // Jika tidak ada age groups, langsung load semua batch
      if (!response || response.length === 0) {
        await fetchTrackingData(containerId, null);
      }
    } catch (err) {
      // Jika endpoint belum ada, load semua batch
      console.log('Age groups not available, loading all batches');
      setAgeGroups([]);
      await fetchTrackingData(containerId, null);
    } finally {
      setLoadingAgeGroups(false);
    }
  };

  const handleSelectAgeGroup = async (ageGroup) => {
    setSelectedAgeGroup(ageGroup);
    await fetchTrackingData(selectedContainer.id, ageGroup?.id);
  };

  const handleViewAllBatches = async () => {
    setSelectedAgeGroup({ id: null, name: 'Semua Batch' });
    await fetchTrackingData(selectedContainer.id, null);
  };

  const handleBackToContainers = () => {
    setSelectedContainer(null);
    setSelectedAgeGroup(null);
    setAgeGroups([]);
    setData([]);
    setSummary(null);
    setLossSummary(null);
  };

  const handleBackToAgeGroups = () => {
    setSelectedAgeGroup(null);
    setData([]);
    setSummary(null);
    setLossSummary(null);
  };

  const fetchTrackingData = async (containerId, ageGroupId) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { container_id: containerId };
      if (ageGroupId) {
        params.age_group_id = ageGroupId;
      }
      
      const [trackingRes, lossRes] = await Promise.all([
        getBatchTracking(token, params),
        getLossSummary(token, params)
      ]);
      
      setData(trackingRes.data || []);
      setSummary(trackingRes.summary || null);
      setLossSummary(lossRes || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = { container_id: selectedContainer.id };
      if (selectedAgeGroup?.id) {
        params.age_group_id = selectedAgeGroup.id;
      }
      const blob = await exportBatchTracking(token, params);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = selectedAgeGroup?.id 
        ? `batch_tracking_${selectedContainer.container_number}_${selectedAgeGroup.name}_${new Date().toISOString().split('T')[0]}.csv`
        : `batch_tracking_${selectedContainer.container_number}_${new Date().toISOString().split('T')[0]}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Loading containers
  if (loadingContainers) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading containers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Container Selection View
  if (!selectedContainer) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Batch Tracking</h2>
          <p className="text-gray-500">Pilih container untuk melihat tracking batch</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {containers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 mb-2">Belum ada container</p>
            <p className="text-gray-400 text-sm">Import packing list terlebih dahulu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {containers.map((container) => (
              <div
                key={container.id}
                onClick={() => handleSelectContainer(container)}
                className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-purple-300 border-2 border-transparent transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{container.container_number}</h3>
                    <p className="text-sm text-gray-500">{container.supplier_name || 'Multi Supplier'}</p>
                  </div>
                  <span className="text-2xl">🚢</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tanggal Kedatangan:</span>
                    <span className="font-medium text-gray-800">{formatDate(container.arrival_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jumlah Batch:</span>
                    <span className="font-medium text-purple-600">{container.batch_count || 0} batch</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Plants:</span>
                    <span className="font-medium text-green-600">{(container.total_plants || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-center text-purple-600 hover:text-purple-800 font-medium text-sm">
                    Lihat Tracking →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Age Group Selection View (after selecting container, before selecting age group)
  if (selectedContainer && !selectedAgeGroup && ageGroups.length > 0) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={handleBackToContainers}
            className="text-purple-600 hover:text-purple-800 flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke pilihan container
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🚢</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedContainer.container_number}</h2>
              <p className="text-gray-500">{formatDate(selectedContainer.arrival_date)}</p>
            </div>
          </div>
          <p className="text-gray-500 mt-2">Pilih kelompok umur untuk melihat tracking batch</p>
        </div>

        {loadingAgeGroups ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading kelompok umur...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* View All Batches Card */}
            <div
              onClick={handleViewAllBatches}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-all text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Semua Batch</h3>
                  <p className="text-sm text-purple-100">Lihat semua kelompok umur</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-100">Total Kelompok:</span>
                  <span className="font-medium">{ageGroups.length} kelompok</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-100">Total Batch:</span>
                  <span className="font-medium">{selectedContainer.batch_count || 0} batch</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-purple-400">
                <button className="w-full text-center text-white font-medium text-sm">
                  Lihat Semua →
                </button>
              </div>
            </div>

            {/* Age Group Cards */}
            {ageGroups.map((ageGroup) => (
              <div
                key={ageGroup.id}
                onClick={() => handleSelectAgeGroup(ageGroup)}
                className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-orange-300 border-2 border-transparent transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{ageGroup.name}</h3>
                    <p className="text-sm text-gray-500">Kelompok Umur</p>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jumlah Batch:</span>
                    <span className="font-medium text-orange-600">{ageGroup.batch_count || 0} batch</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Plants:</span>
                    <span className="font-medium text-green-600">{(ageGroup.total_quantity || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${ageGroup.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                      {ageGroup.status === 'active' ? 'Aktif' : ageGroup.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-center text-orange-600 hover:text-orange-800 font-medium text-sm">
                    Lihat Tracking →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tracking Table View (after selecting age group or if no age groups exist)
  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={ageGroups.length > 0 ? handleBackToAgeGroups : handleBackToContainers}
          className="text-purple-600 hover:text-purple-800 flex items-center mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {ageGroups.length > 0 ? 'Kembali ke pilihan kelompok umur' : 'Kembali ke pilihan container'}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Batch Tracking</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <span>🚢</span>
              <span>{selectedContainer.container_number}</span>
              <span>|</span>
              <span>{formatDate(selectedContainer.arrival_date)}</span>
              {selectedAgeGroup && (
                <>
                  <span>|</span>
                  <span className="text-orange-600 font-medium">📅 {selectedAgeGroup.name}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <span className="mr-2">📥</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.total_initial_plants?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Initial Plants</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.total_current_plants?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Current Plants</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.total_loss?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Loss</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.overall_survival_rate}%</p>
            <p className="text-xs text-gray-500">Survival Rate</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading tracking data...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Batch Tracking Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white">
                <tr>
                  <th className="py-3 px-3 text-left font-medium">No</th>
                  <th className="py-3 px-3 text-left font-medium">Batch Number</th>
                  <th className="py-3 px-3 text-left font-medium">Variety</th>
                  <th className="py-3 px-3 text-center font-medium">A1<br/>Start</th>
                  <th className="py-3 px-3 text-center font-medium bg-indigo-800" colSpan="2">A1 → A2</th>
                  <th className="py-3 px-3 text-center font-medium bg-indigo-800" colSpan="2">A2 → A3</th>
                  <th className="py-3 px-3 text-center font-medium bg-indigo-800" colSpan="2">A3 → A4</th>
                  <th className="py-3 px-3 text-center font-medium bg-indigo-800" colSpan="2">A4 → A5</th>
                  <th className="py-3 px-3 text-center font-medium">Current</th>
                  <th className="py-3 px-3 text-center font-medium">Survival</th>
                </tr>
                <tr className="bg-indigo-600 text-white text-xs">
                  <th colSpan="4"></th>
                  <th className="py-2 px-2">Loss</th>
                  <th className="py-2 px-2">A2</th>
                  <th className="py-2 px-2">Loss</th>
                  <th className="py-2 px-2">A3</th>
                  <th className="py-2 px-2">Loss</th>
                  <th className="py-2 px-2">A4</th>
                  <th className="py-2 px-2">Loss</th>
                  <th className="py-2 px-2">A5</th>
                  <th colSpan="2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="py-12 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  data.map((batch, idx) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 text-center text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <Link 
                          to={`/batches/${batch.id}`}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {batch.batch_number}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-indigo-700">{batch.variety_code}</p>
                        <p className="text-xs text-gray-500">{batch.variety_name}</p>
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {batch.a1_start?.toLocaleString()}
                      </td>
                      
                      {/* A1 → A2 */}
                      <td className="py-3 px-2 text-center text-red-600 font-medium">
                        {((batch.loss_a1_to_a2 || 0) + (batch.loss_in_a1 || 0)) > 0 ? `-${((batch.loss_a1_to_a2 || 0) + (batch.loss_in_a1 || 0)).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(batch.a2_start || 0) > 0 ? batch.a2_start.toLocaleString() : '-'}
                      </td>
                      
                      {/* A2 → A3 */}
                      <td className="py-3 px-2 text-center text-red-600 font-medium">
                        {((batch.loss_a2_to_a3 || 0) + (batch.loss_in_a2 || 0)) > 0 ? `-${((batch.loss_a2_to_a3 || 0) + (batch.loss_in_a2 || 0)).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(batch.a3_start || 0) > 0 ? batch.a3_start.toLocaleString() : '-'}
                      </td>
                      
                      {/* A3 → A4 */}
                      <td className="py-3 px-2 text-center text-red-600 font-medium">
                        {((batch.loss_a3_to_a4 || 0) + (batch.loss_in_a3 || 0)) > 0 ? `-${((batch.loss_a3_to_a4 || 0) + (batch.loss_in_a3 || 0)).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(batch.a4_start || 0) > 0 ? batch.a4_start.toLocaleString() : '-'}
                      </td>
                      
                      {/* A4 → A5 */}
                      <td className="py-3 px-2 text-center text-red-600 font-medium">
                        {((batch.loss_a4_to_a5 || 0) + (batch.loss_in_a4 || 0)) > 0 ? `-${((batch.loss_a4_to_a5 || 0) + (batch.loss_in_a4 || 0)).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {(batch.a5_sold || 0) > 0 ? batch.a5_sold.toLocaleString() : '-'}
                      </td>
                      
                      {/* Current & Survival */}
                      <td className="py-3 px-3 text-center font-bold text-green-600">
                        {batch.current_quantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          batch.survival_rate >= 90 ? 'bg-green-100 text-green-800' :
                          batch.survival_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {batch.survival_rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loss Summary */}
      {lossSummary && lossSummary.total_loss > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loss by Transition */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Loss by Transition</h3>
            <div className="space-y-3">
              {Object.entries(lossSummary.by_transition || {}).map(([key, value]) => (
                value > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600">{key}</span>
                    <span className="font-medium text-red-600">-{value.toLocaleString()}</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Loss by Reason */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Loss by Reason</h3>
            <div className="space-y-3">
              {Object.entries(lossSummary.by_reason || {}).map(([key, value]) => (
                value > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{key}</span>
                    <span className="font-medium text-red-600">-{value.toLocaleString()}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}