import { useState, useRef } from 'react';
import { 
  FileUp, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ImportPage() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [skipErrors, setSkipErrors] = useState(true);
  const [importResult, setImportResult] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error('File harus berformat Excel (.xlsx, .xls) atau CSV');
        return;
      }
      
      setFile(selectedFile);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    
    setLoading(true);
    setPreview(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/imports/batches/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPreview(response.data);
      
      if (response.data.error_rows > 0) {
        toast.error(`Ditemukan ${response.data.error_rows} baris dengan error`);
      } else {
        toast.success(`${response.data.valid_rows} baris siap diimport`);
      }
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(error.response?.data?.detail || 'Gagal membaca file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview?.can_import) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(
        `/imports/batches/execute?skip_errors=${skipErrors}`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      setImportResult(response.data);
      
      if (response.data.imported > 0) {
        toast.success(`Berhasil import ${response.data.imported} batch!`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.detail || 'Import gagal');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/imports/templates/batches', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'batch_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template berhasil didownload!');
    } catch (error) {
      toast.error('Gagal download template');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileUp className="w-7 h-7 text-green-600" />
          Import Data
        </h1>
        <p className="text-gray-600 mt-1">Import batch data dari file Excel atau CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Area */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
              <button
                onClick={downloadTemplate}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-12 h-12 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="ml-4 text-gray-400 hover:text-red-500"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    Drag & drop file atau <span className="text-green-600 font-medium">browse</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Support: Excel (.xlsx, .xls) dan CSV
                  </p>
                </>
              )}
            </div>

            {/* Preview Button */}
            {file && !preview && (
              <button
                onClick={handlePreview}
                disabled={loading}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Preview & Validate
                  </>
                )}
              </button>
            )}
          </div>

          {/* Preview Results */}
          {preview && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 border-b">
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-gray-900">{preview.total_rows}</div>
                  <div className="text-sm text-gray-500">Total Rows</div>
                </div>
                <div className="p-4 text-center border-r bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{preview.valid_rows}</div>
                  <div className="text-sm text-green-600">Valid</div>
                </div>
                <div className={`p-4 text-center ${preview.error_rows > 0 ? 'bg-red-50' : ''}`}>
                  <div className={`text-2xl font-bold ${preview.error_rows > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {preview.error_rows}
                  </div>
                  <div className={`text-sm ${preview.error_rows > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    Errors
                  </div>
                </div>
              </div>

              {/* Error List */}
              {preview.errors.length > 0 && (
                <div className="p-4 border-b bg-red-50">
                  <h3 className="font-medium text-red-800 flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    Validation Errors
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {preview.errors.slice(0, 20).map((error, idx) => (
                      <div key={idx} className="text-sm bg-white p-2 rounded border border-red-200">
                        <span className="font-medium text-red-700">Row {error.row}, {error.column}:</span>
                        <span className="text-gray-600 ml-2">{error.error}</span>
                        {error.value && (
                          <span className="text-gray-400 ml-2">
                            (value: "{error.value}")
                          </span>
                        )}
                      </div>
                    ))}
                    {preview.errors.length > 20 && (
                      <div className="text-sm text-red-600 font-medium">
                        ...dan {preview.errors.length - 20} error lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Data Preview (First 10 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Batch Code</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Supplier</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Variety</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Qty</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview_data.slice(0, 10).map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`border-t ${
                            row.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-500">{row.row_number}</td>
                          <td className="px-3 py-2">
                            {row.status === 'valid' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium">{row.batch_code}</td>
                          <td className="px-3 py-2">{row.supplier}</td>
                          <td className="px-3 py-2">{row.variety}</td>
                          <td className="px-3 py-2">{row.quantity}</td>
                          <td className="px-3 py-2">{row.arrival_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`rounded-lg shadow p-6 ${
              importResult.imported > 0 ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <h3 className={`font-semibold text-lg flex items-center gap-2 mb-4 ${
                importResult.imported > 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {importResult.imported > 0 ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
                Import Complete
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{importResult.imported}</div>
                  <div className="text-sm text-gray-500">Imported</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-sm text-gray-500">Skipped</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-600">{importResult.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                  <h4 className="font-medium text-gray-700 mb-2">Skipped Rows:</h4>
                  {importResult.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-gray-600">{err}</p>
                  ))}
                </div>
              )}

              <button
                onClick={resetForm}
                className="mt-4 w-full bg-white text-green-600 border border-green-600 py-2 rounded-lg font-medium hover:bg-green-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Import Another File
              </button>
            </div>
          )}
        </div>

        {/* Import Options */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Options</h2>
            
            {/* Skip Errors Option */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Skip Error Rows</div>
                  <div className="text-sm text-gray-500">
                    Lanjutkan import meski ada error
                  </div>
                </div>
              </label>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Instructions</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Download template Excel</li>
                <li>Isi data sesuai format</li>
                <li>Upload file</li>
                <li>Preview & validasi</li>
                <li>Klik Import</li>
              </ol>
            </div>

            {/* Required Columns Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Required Columns
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• batch_code (unique)</li>
                <li>• supplier (exact match)</li>
                <li>• variety (exact match)</li>
                <li>• quantity (number)</li>
                <li>• arrival_date (YYYY-MM-DD)</li>
              </ul>
            </div>

            {/* Import Button */}
            {preview?.can_import && !importResult && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileUp className="w-5 h-5" />
                    Import {preview.valid_rows} Batches
                  </>
                )}
              </button>
            )}

            {preview && !preview.can_import && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Cannot Import</p>
                <p className="text-sm">All rows have errors</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
