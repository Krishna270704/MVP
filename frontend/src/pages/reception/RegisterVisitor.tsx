import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntities, getEntityEmployees, createVisitor } from '../../api/endpoints';
import { Entity, Employee } from '../../types';
import CameraCapture from '../../components/CameraCapture';

interface FormErrors {
  name?: string;
  mobile?: string;
  purpose?: string;
  entity_id?: string;
  host_employee_id?: string;
  photo?: string;
  general?: string;
}

export default function RegisterVisitor() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    company: '',
    purpose: '',
    visitor_type: 'Guest',
    entity_id: '',
    host_employee_id: '',
  });
  const [photo, setPhoto] = useState<File | Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    getEntities().then((res) => setEntities(res.data)).catch(console.error);
  }, []);

  // Dynamic employee filter on entity change
  useEffect(() => {
    if (form.entity_id) {
      getEntityEmployees(form.entity_id)
        .then((res) => {
          setEmployees(res.data);
          setForm((prev) => ({ ...prev, host_employee_id: '' }));
        })
        .catch(console.error);
    } else {
      setEmployees([]);
      setForm((prev) => ({ ...prev, host_employee_id: '' }));
    }
  }, [form.entity_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors((prev) => ({ ...prev, photo: 'Only JPEG, PNG, or WebP images are allowed' }));
        return;
      }
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: 'Image must be under 5MB' }));
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, photo: undefined }));
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    setPhoto(blob);
    setPhotoPreview(URL.createObjectURL(blob));
    setShowCamera(false);
    setErrors((prev) => ({ ...prev, photo: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Visitor name is required';
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
    }
    if (!form.purpose.trim()) newErrors.purpose = 'Purpose of visit is required';
    if (!form.entity_id) newErrors.entity_id = 'Please select an entity';
    if (!form.host_employee_id) newErrors.host_employee_id = 'Please select a host employee';
    if (!photo) newErrors.photo = 'Visitor photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('mobile', form.mobile.trim());
      formData.append('company', form.company.trim());
      formData.append('purpose', form.purpose.trim());
      formData.append('visitor_type', form.visitor_type);
      formData.append('entity_id', form.entity_id);
      formData.append('host_employee_id', form.host_employee_id);
      formData.append('check_in_time', new Date().toISOString());

      if (photo) {
        const photoFile = photo instanceof File
          ? photo
          : new File([photo], 'camera-capture.jpg', { type: 'image/jpeg' });
        formData.append('photo', photoFile);
      }

      await createVisitor(formData);
      navigate('/reception/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrors({ general: detail.join(', ') });
      } else if (typeof detail === 'string') {
        setErrors({ general: detail });
      } else {
        setErrors({ general: 'Failed to register visitor. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const visitorTypes = ['Guest', 'Vendor', 'Client', 'Interview', 'Delivery', 'Contractor', 'Other'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Register Visitor</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the visitor details below</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {errors.general && (
          <div className="mx-6 mt-6 px-4 py-3 bg-danger-50 border border-danger-500/20 rounded-xl">
            <p className="text-sm text-danger-600 font-medium">{errors.general}</p>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Photo Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Visitor Photo *</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 shrink-0 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    <p className="text-xs text-slate-400 mt-1">No photo</p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer px-4 py-2 bg-primary-50 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-100 transition-colors text-center">
                  📁 Upload File
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                >
                  📸 Use Camera
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                    className="text-xs text-danger-500 hover:text-danger-600"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            {errors.photo && <p className="text-xs text-danger-500 mt-1.5">{errors.photo}</p>}
          </div>

          {/* Name & Mobile */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Visitor Name *
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.name ? 'border-danger-500 bg-danger-50/30' : 'border-slate-200 bg-white'
                }`}
                placeholder="Full name"
              />
              {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mobile Number *
              </label>
              <input
                id="mobile"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.mobile ? 'border-danger-500 bg-danger-50/30' : 'border-slate-200 bg-white'
                }`}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {errors.mobile && <p className="text-xs text-danger-500 mt-1">{errors.mobile}</p>}
            </div>
          </div>

          {/* Company & Visitor Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Company / Organization
              </label>
              <input
                id="company"
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="Company name"
              />
            </div>
            <div>
              <label htmlFor="visitor_type" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Visitor Type / Relation
              </label>
              <select
                id="visitor_type"
                name="visitor_type"
                value={form.visitor_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
              >
                {visitorTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Purpose of Visit *
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              rows={2}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none ${
                errors.purpose ? 'border-danger-500 bg-danger-50/30' : 'border-slate-200 bg-white'
              }`}
              placeholder="Reason for visit"
            />
            {errors.purpose && <p className="text-xs text-danger-500 mt-1">{errors.purpose}</p>}
          </div>

          {/* Entity & Host */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entity_id" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Entity *
              </label>
              <select
                id="entity_id"
                name="entity_id"
                value={form.entity_id}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white ${
                  errors.entity_id ? 'border-danger-500 bg-danger-50/30' : 'border-slate-200'
                }`}
              >
                <option value="">Select Entity</option>
                {entities.map((e) => (
                  <option key={e._id} value={e._id}>{e.name}</option>
                ))}
              </select>
              {errors.entity_id && <p className="text-xs text-danger-500 mt-1">{errors.entity_id}</p>}
            </div>
            <div>
              <label htmlFor="host_employee_id" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Host Employee *
              </label>
              <select
                id="host_employee_id"
                name="host_employee_id"
                value={form.host_employee_id}
                onChange={handleChange}
                disabled={!form.entity_id}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400 ${
                  errors.host_employee_id ? 'border-danger-500 bg-danger-50/30' : 'border-slate-200'
                }`}
              >
                <option value="">{form.entity_id ? 'Select Employee' : 'Select entity first'}</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
              {errors.host_employee_id && <p className="text-xs text-danger-500 mt-1">{errors.host_employee_id}</p>}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/reception/dashboard')}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Registering...
              </span>
            ) : (
              'Register Visitor'
            )}
          </button>
        </div>
      </form>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
