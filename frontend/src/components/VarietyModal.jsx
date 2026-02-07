import { useState, useEffect } from 'react';

export default function VarietyModal({ isOpen, onClose, onSubmit, variety, loading }) {
  const [formData, setFormData] = useState({
    variety_code: '',
    variety_name: '',
    cross_info: '',
    flower_size_cm: '',
    plant_height_cm: '',
    grade: '',
    photo_url: '',
    notes: '',
    is_active: true
  });

  // Populate form when editing
  useEffect(() => {
    if (variety) {
      setFormData(variety);
    } else {
      // Reset form for new variety
      setFormData({
        variety_code: '',
        variety_name: '',
        cross_info: '',
        flower_size_cm: '',
        plant_height_cm: '',
        grade: '',
        photo_url: '',
        notes: '',
        is_active: true
      });
    }
  }, [variety]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-800">
            {variety ? 'Edit Variety' : 'Add New Variety'}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Variety Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variety Code
              </label>
              <input
                type="text"
                name="variety_code"
                value={formData.variety_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., VAR001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variety Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="variety_name"
                value={formData.variety_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Purple Beauty"
              />
            </div>
          </div>

          {/* Cross Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cross Information
            </label>
            <input
              type="text"
              name="cross_info"
              value={formData.cross_info}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Parent A × Parent B"
            />
          </div>

          {/* Flower Size & Plant Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flower Size (cm)
              </label>
              <input
                type="number"
                step="0.1"
                name="flower_size_cm"
                value={formData.flower_size_cm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 12.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plant Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                name="plant_height_cm"
                value={formData.plant_height_cm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select grade...</option>
                <option value="A">A - Premium</option>
                <option value="B">B - Standard</option>
                <option value="C">C - Economy</option>
              </select>
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo URL
            </label>
            <input
              type="text"
              name="photo_url"
              value={formData.photo_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/photo.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload photo feature coming soon. For now, you can paste image URL.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Active Variety
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : variety ? 'Update Variety' : 'Create Variety'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}