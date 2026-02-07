import { useState, useEffect } from 'react';
import { 
  FileDown, 
  Filter, 
  Calendar, 
  Building2, 
  Leaf, 
  Users, 
  FileSpreadsheet,
  FileText,
  Download,
  X,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ExportPage() {
  const [exportType, setExportType] = useState('batches');
  const [format, setFormat] = useState('xlsx');
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    phase: '',
    supplier_id: '',
    variety_id: '',
    greenhouse_id: '',
    date_from: '',
    date_to: '',
    min_loss_rate: '',
    group_by: 'batch'
  });
  
  // Master data for dropdowns
  const [suppliers, setSuppliers] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [greenhouses, setGreenhouses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [suppRes, varRes, ghRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/varieties'),
        api.get('/greenhouses')
      ]);
      setSuppliers(suppRes.data);
      setVarieties(varRes.data);
      setGreenhouses(ghRes.data);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const exportTypes = [
    { id: 'batches', label: 'Batches', icon: Leaf, description: 'Export all batches with current status' },
    { id: 'containers', label: 'Containers', icon: Building2, description: 'Export container details' },
    { id: 'phase-transitions', label: 'Phase Transitions', icon: FileSpreadsheet, description: 'Export movement history' },
    { id: 'loss-report', label: 'Loss Report', icon: FileText, description: 'Export loss analysis' },
    { id: 'inventory-summary', label: 'Inventory Summary', icon: FileDown, description: 'Export current inventory' }
  ];

  const phases = ['A1', 'A2', 'A3', 'A4', 'A5'];
  const groupByOptions = [
    { value: 'batch', label: 'By Batch' },
    { value: 'phase', label: 'By Phase' },
    { value: 'supplier', label: 'By Supplier' },
    { value: 'variety', label: 'By Variety' }
  ];

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (exportType === 'batches') {
        if (filters.phase) params.append('phase', filters.phase);
        if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
        if (filters.variety_id) params.append('variety_id', filters.variety_id);
        if (filters.greenhouse_id) params.append('greenhouse_id', filters.greenhouse_id);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        if (filters.min_loss_rate) params.append('min_loss_rate', filters.min_loss_rate);
      }
      
      if (exportType === 'phase-transitions') {
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
      }
      
      if (exportType === 'loss-report') {
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        params.append('group_by', filters.group_by);
      }

      const response = await api.get(`/exports/${exportType}?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${exportType}_${timestamp}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export ${exportType} berhasil!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      phase: '',
      supplier_id: '',
      variety_id: '',
      greenhouse_id: '',
      date_from: '',
      date_to: '',
      min_loss_rate: '',
      group_by: 'batch'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'batch');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileDown className="w-7 h-7 text-green-600" />
          Export Data
        </h1>
        <p className="text-gray-600 mt-1">Export data ke format Excel atau CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Type Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Data Export</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setExportType(type.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    exportType === type.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <type.icon className={`w-6 h-6 ${
                      exportType === type.id ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        exportType === type.id ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Filters Toggle */}
            {['batches', 'phase-transitions', 'loss-report'].includes(exportType) && (
              <div className="mt-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  {hasActiveFilters && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>

                {showFilters && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">Filter Data</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Clear Filters
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Dari Tanggal
                        </label>
                        <input
                          type="date"
                          value={filters.date_from}
                          onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Sampai Tanggal
                        </label>
                        <input
                          type="date"
                          value={filters.date_to}
                          onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      {/* Batch-specific filters */}
                      {exportType === 'batches' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                            <select
                              value={filters.phase}
                              onChange={(e) => setFilters({...filters, phase: e.target.value})}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Semua Phase</option>
                              {phases.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <select
                              value={filters.supplier_id}
                              onChange={(e) => setFilters({...filters, supplier_id: e.target.value})}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Semua Supplier</option>
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                            <select
                              value={filters.variety_id}
                              onChange={(e) => setFilters({...filters, variety_id: e.target.value})}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Semua Variety</option>
                              {varieties.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Greenhouse</label>
                            <select
                              value={filters.greenhouse_id}
                              onChange={(e) => setFilters({...filters, greenhouse_id: e.target.value})}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Semua Greenhouse</option>
                              {greenhouses.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Loss Rate (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={filters.min_loss_rate}
                              onChange={(e) => setFilters({...filters, min_loss_rate: e.target.value})}
                              placeholder="e.g. 5"
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        </>
                      )}

                      {/* Loss Report group by */}
                      {exportType === 'loss-report' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                          <select
                            value={filters.group_by}
                            onChange={(e) => setFilters({...filters, group_by: e.target.value})}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          >
                            {groupByOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export Options & Action */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
            
            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format File</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormat('xlsx')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    format === 'xlsx'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Excel
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    format === 'csv'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  CSV
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Data:</strong> {exportTypes.find(t => t.id === exportType)?.label}</p>
                <p><strong>Format:</strong> {format.toUpperCase()}</p>
                {hasActiveFilters && <p><strong>Filters:</strong> Active</p>}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
