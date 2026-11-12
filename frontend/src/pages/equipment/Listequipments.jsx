import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { getCategories } from '../../services/categoryService';
import { formatVnd } from '../../utils/currency';

/* ------------------------------------------------------------------ */
/* Static option data                                                  */
/* ------------------------------------------------------------------ */

const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Used'];
const CITIES = ['Ho Chi Minh City', 'Hanoi', 'Da Nang'];
const DISTRICTS = ['District 1', 'District 3', 'District 7', 'Binh Thanh', 'Thu Duc City', 'Go Vap'];

const STEPS = ['Equipment Details', 'Photos', 'Pricing & Availability', 'Review & Publish'];

const RULE_OPTIONS = [
  { key: 'noSmoking', label: 'No smoking' },
  { key: 'noPets', label: 'No pets' },
  { key: 'idRequired', label: 'ID verification required' },
  { key: 'originalCondition', label: 'Return equipment in original condition' },
  { key: 'other', label: 'Other rules' },
];

const MAX_PHOTOS = 8;

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

const Icon = {
  upload: (p) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.6" {...p}><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></svg>,
  camera: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6" {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8 7l1.5-2.5h5L16 7" /></svg>,
  trash: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>,
  star: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5E7EB" stroke="#E5E7EB" {...p}><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" /></svg>,
  pin: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  info: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
  check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
  pencil: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? '#2F5FE0' : '#E5E7EB' }}
    >
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: checked ? '18px' : '2px' }} />
    </button>
  );
}

function FormRow({ label, hint, error, children, required }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{hint}</p>}
      {error && <p className="text-xs mt-1.5" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

const inputClass = () => 'w-full h-12 px-3.5 rounded-lg text-sm outline-none transition-colors';
const inputStyle = (hasError) => ({ border: `1px solid ${hasError ? '#DC2626' : '#E5E7EB'}`, background: '#fff' });

function SectionTitle({ title }) {
  return <h2 className="rh-heading text-base font-bold mb-4" style={{ color: '#0F1B3D' }}>{title}</h2>;
}

function Divider() {
  return <div className="h-px my-7" style={{ background: '#EEF0F3' }} />;
}

/* ------------------------------------------------------------------ */
/* Stepper header — click to revisit a completed step                  */
/* ------------------------------------------------------------------ */

function StepperHeader({ currentStep, maxStepReached, onStepClick }) {
  return (
    <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const completed = i < currentStep;
        const active = i === currentStep;
        const reachable = i <= maxStepReached;
        return (
          <React.Fragment key={s}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick(i)}
              className="flex items-center gap-2 shrink-0"
              style={{ cursor: reachable ? 'pointer' : 'default' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: completed ? '#16A34A' : active ? '#2F5FE0' : '#EEF0F3',
                  color: completed || active ? '#fff' : '#9CA3AF',
                }}
              >
                {completed ? <Icon.check /> : i + 1}
              </div>
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: active ? '#0F1B3D' : completed ? '#374151' : '#9CA3AF' }}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-8 h-px shrink-0" style={{ background: i < currentStep ? '#16A34A' : '#E5E7EB' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ListEquipment() {
  const navigate = useNavigate();
  const formTopRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    condition: '',
    brand: '',
    model: '',
    serialNumber: '',
    yearPurchased: '',
    address: '',
    city: '',
    district: '',
    pricePerDay: '',
    deposit: '',
    weeklyDiscount: '',
    monthlyDiscount: '',
    availability: 'Available',
    availableFrom: '',
    availableUntil: '',
    allowRequestBooking: true,
    rules: { noSmoking: false, noPets: false, idRequired: false, originalCondition: false, other: false },
    additionalRules: '',
  });

  const [photos, setPhotos] = useState([]); // { id, url, isCover }
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      const items = await getCategories();
      setCategories(items);
    };
    loadCategories();
  }, []);

  // Scroll the form card back into view whenever the step changes, so
  // the user isn't left scrolled halfway down the previous step's content.
  useEffect(() => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDirect = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* ---------------- Photos ---------------- */

  const addFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length);
    if (files.length === 0) return;
    const newPhotos = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      url: URL.createObjectURL(file),
      isCover: photos.length === 0 && i === 0,
    }));
    setPhotos((p) => [...p, ...newPhotos]);
    setErrors((er) => ({ ...er, photos: '' }));
  };

  const removePhoto = (id) => {
    setPhotos((p) => {
      const next = p.filter((ph) => ph.id !== id);
      if (next.length > 0 && !next.some((ph) => ph.isCover)) next[0].isCover = true;
      return [...next];
    });
  };

  const setCover = (id) => setPhotos((p) => p.map((ph) => ({ ...ph, isCover: ph.id === id })));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  /* ---------------- Rules ---------------- */

  const toggleRule = (key) => setForm((f) => ({ ...f, rules: { ...f.rules, [key]: !f.rules[key] } }));

  /* ---------------- Earnings estimate ---------------- */

  const earnings = useMemo(() => {
    const price = parseFloat(form.pricePerDay) || 0;
    const weeklyOff = parseFloat(form.weeklyDiscount) || 0;
    const monthlyOff = parseFloat(form.monthlyDiscount) || 0;
    return {
      day: price,
      week: Math.round(price * 7 * (1 - weeklyOff / 100)),
      month: Math.round(price * 30 * (1 - monthlyOff / 100)),
    };
  }, [form.pricePerDay, form.weeklyDiscount, form.monthlyDiscount]);

  const coverPhoto = photos.find((p) => p.isCover) || photos[0];

  /* ---------------- Validation, split per step ---------------- */

  const validateStep0 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Equipment name is required.';
    if (!form.category) errs.category = 'Please select a category.';
    if (!form.description.trim() || form.description.trim().length < 20) errs.description = 'Please add a description of at least 20 characters.';
    if (!form.condition) errs.condition = 'Please select the equipment condition.';
    if (!form.address.trim()) errs.address = 'Pickup location is required.';
    if (!form.city) errs.city = 'Please select a city.';
    if (!form.district) errs.district = 'Please select a district.';
    return errs;
  };

  const validateStep1 = () => {
    const errs = {};
    if (photos.length < 3) errs.photos = 'Please upload at least 3 photos.';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.pricePerDay || parseFloat(form.pricePerDay) <= 0) errs.pricePerDay = 'Please enter a valid price per day.';
    if (form.deposit !== '' && parseFloat(form.deposit) < 0) errs.deposit = 'Deposit cannot be negative.';
    if (form.availableFrom && form.availableUntil && new Date(form.availableUntil) <= new Date(form.availableFrom)) {
      errs.availableUntil = 'Available until date must be after the start date.';
    }
    return errs;
  };

  const STEP_VALIDATORS = [validateStep0, validateStep1, validateStep2, () => ({})];

  const goToStep = (i) => {
    setErrors({});
    setCurrentStep(i);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleContinue = () => {
    const errs = STEP_VALIDATORS[currentStep]();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    setMaxStepReached((m) => Math.max(m, next));
  };

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 900);
  };

  const handlePublish = async () => {
    const allErrors = { ...validateStep0(), ...validateStep1(), ...validateStep2() };
    if (Object.keys(allErrors).length > 0) {
      if (Object.keys(validateStep0()).length) return goToStep(0);
      if (Object.keys(validateStep1()).length) return goToStep(1);
      return goToStep(2);
    }

    try {
      setPublishing(true);

      const selectedCategory = categories.find((item) => item.name === form.category);
      const formData = new FormData();

      formData.append('title', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('pricePerDay', String(form.pricePerDay));
      formData.append('depositAmount', form.deposit || '0');
      formData.append('address', form.address.trim());
      if (selectedCategory?.id) formData.append('categoryId', selectedCategory.id);
      formData.append('condition', form.condition);
      formData.append('brand', form.brand.trim());
      formData.append('model', form.model.trim());
      formData.append('serialNumber', form.serialNumber.trim());
      if (form.yearPurchased) formData.append('yearPurchased', String(form.yearPurchased));
      formData.append('city', form.city);
      formData.append('district', form.district);
      formData.append('weeklyDiscount', form.weeklyDiscount || '0');
      formData.append('monthlyDiscount', form.monthlyDiscount || '0');
      formData.append('availability', form.availability);
      if (form.availableFrom) formData.append('availableFrom', form.availableFrom);
      if (form.availableUntil) formData.append('availableUntil', form.availableUntil);
      formData.append('allowRequestBooking', String(form.allowRequestBooking));
      formData.append('rules', JSON.stringify(form.rules));
      formData.append('additionalRules', form.additionalRules.trim());

      photos.forEach((photo) => {
        if (photo.file) formData.append('files', photo.file);
      });

      const response = await axiosClient.post('/equipments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(response.data?.message || 'Equipment created successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Publish equipment failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Unable to publish listing. Please try again.';
      alert(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="rh-root pb-24 lg:pb-16" style={{ background: '#F7F9FC', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-card { border: 1px solid #EEF0F3; border-radius: 16px; background: #fff; }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease, transform .1s ease; }
        .rh-btn-primary:hover:not(:disabled) { background: #274DBD; }
        .rh-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .rh-btn-outline { border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; transition: background .15s ease; background: #fff; }
        .rh-btn-outline:hover { background: #F9FAFB; }
        select, input, textarea { font-family: 'Inter', sans-serif; }
        select:focus, input:focus, textarea:focus { outline: none; border-color: #2F5FE0 !important; box-shadow: 0 0 0 3px rgba(47,95,224,0.12); }
        .rh-checkbox { width: 18px; height: 18px; accent-color: #2F5FE0; }
        .rh-step-fade { animation: rh-step-in .25s ease both; }
        @keyframes rh-step-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .rh-step-fade { animation: none; } }
      `}</style>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8" ref={formTopRef}>
        {/* ---------------- PAGE TITLE + STEPPER ---------------- */}
        <h1 className="rh-heading text-2xl sm:text-3xl font-extrabold" style={{ color: '#0F1B3D' }}>List Your Equipment</h1>
        <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Share your equipment with others and start earning from your unused items.</p>

        <StepperHeader currentStep={currentStep} maxStepReached={maxStepReached} onStepClick={goToStep} />

        {/* ---------------- FORM + PREVIEW ---------------- */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
          <div key={currentStep} className="rh-card p-6 sm:p-8 rh-step-fade">

            {/* ============ STEP 0 — Equipment Details ============ */}
            {currentStep === 0 && (
              <>
                <SectionTitle title="Basic Information" />
                <div id="field-name">
                  <FormRow label="Equipment Name" required error={errors.name}>
                    <input className={inputClass()} style={inputStyle(errors.name)} placeholder="e.g. Sony A7 IV Camera" value={form.name} onChange={set('name')} />
                  </FormRow>
                </div>
                <div id="field-category">
                  <FormRow label="Category" required error={errors.category}>
                    <select className={inputClass()} style={inputStyle(errors.category)} value={form.category} onChange={set('category')}>
                      <option value="">Select a category</option>
                      {categories.map((item) => (
                        <option key={item.id ?? item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </FormRow>
                </div>
                <div id="field-description">
                  <FormRow label="Description" required error={errors.description}>
                    <textarea
                      rows={4}
                      className="w-full px-3.5 py-3 rounded-lg text-sm resize-none"
                      style={inputStyle(errors.description)}
                      placeholder="Describe your equipment, its condition, specifications, and what is included..."
                      value={form.description}
                      onChange={set('description')}
                      maxLength={500}
                    />
                    <p className="text-xs mt-1 text-right" style={{ color: '#9CA3AF' }}>{form.description.length} / 500</p>
                  </FormRow>
                </div>

                <Divider />

                <SectionTitle title="Equipment Details" />
                <div id="field-condition">
                  <FormRow label="Condition" required error={errors.condition}>
                    <select className={inputClass()} style={inputStyle(errors.condition)} value={form.condition} onChange={set('condition')}>
                      <option value="">Select condition</option>
                      {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormRow>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormRow label="Brand">
                    <input className={inputClass()} style={inputStyle()} placeholder="e.g. Sony" value={form.brand} onChange={set('brand')} />
                  </FormRow>
                  <FormRow label="Model">
                    <input className={inputClass()} style={inputStyle()} placeholder="e.g. A7 IV" value={form.model} onChange={set('model')} />
                  </FormRow>
                  <FormRow label="Serial Number (optional)">
                    <input className={inputClass()} style={inputStyle()} placeholder="e.g. SN-4821093" value={form.serialNumber} onChange={set('serialNumber')} />
                  </FormRow>
                  <FormRow label="Year Purchased (optional)">
                    <input type="number" className={inputClass()} style={inputStyle()} placeholder="e.g. 2024" value={form.yearPurchased} onChange={set('yearPurchased')} />
                  </FormRow>
                </div>

                <Divider />

                <SectionTitle title="Location" />
                <div id="field-address">
                  <FormRow label="Location / Address" required error={errors.address} hint="Your exact address will only be shared with confirmed renters.">
                    <div className="relative">
                      <Icon.pin className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                      <input className="w-full h-12 pl-9 pr-3.5 rounded-lg text-sm" style={inputStyle(errors.address)} placeholder="Enter pickup location" value={form.address} onChange={set('address')} />
                    </div>
                  </FormRow>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div id="field-city">
                    <FormRow label="City" required error={errors.city}>
                      <select className={inputClass()} style={inputStyle(errors.city)} value={form.city} onChange={set('city')}>
                        <option value="">Select city</option>
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </FormRow>
                  </div>
                  <div id="field-district">
                    <FormRow label="District" required error={errors.district}>
                      <select className={inputClass()} style={inputStyle(errors.district)} value={form.district} onChange={set('district')}>
                        <option value="">Select district</option>
                        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </FormRow>
                  </div>
                </div>
              </>
            )}

            {/* ============ STEP 1 — Photos ============ */}
            {currentStep === 1 && (
              <>
                <SectionTitle title="Photos" />
                <p className="text-sm -mt-3 mb-1" style={{ color: '#374151' }}>Upload Equipment Photos</p>
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Add up to 8 photos. High-quality photos help your listing get more attention.</p>

                <div id="field-photos">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className="rounded-xl flex flex-col items-center justify-center text-center py-10 px-4 cursor-pointer transition-colors"
                    style={{ border: `2px dashed ${dragActive ? '#2F5FE0' : errors.photos ? '#DC2626' : '#D1D5DB'}`, background: dragActive ? 'rgba(47,95,224,0.04)' : '#F9FAFB' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon.upload />
                    <p className="text-sm font-medium mt-3" style={{ color: '#374151' }}>Drag & drop photos here</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>or click to browse files · recommended ratio 4:3</p>
                    <span className="rh-btn-outline px-4 py-2 text-xs mt-4 inline-block">Browse Files</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                    />
                  </div>
                  {errors.photos && <p className="text-xs mt-1.5" style={{ color: '#DC2626' }}>{errors.photos}</p>}
                  <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Tip: add photos of the front, back, accessories, and any visible damage.</p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                    {photos.map((p) => (
                      <div key={p.id} className="relative rounded-lg overflow-hidden aspect-[4/3]" style={{ border: '1px solid #EEF0F3' }}>
                        <img src={p.url} alt="Equipment" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(p.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,27,61,0.7)' }} aria-label="Remove photo">
                          <Icon.trash />
                        </button>
                        {p.isCover ? (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#2F5FE0' }}>Cover</span>
                        ) : (
                          <button type="button" onClick={() => setCover(p.id)} className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white" style={{ color: '#374151' }}>
                            Set as cover
                          </button>
                        )}
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/3] rounded-lg flex items-center justify-center text-xs font-medium"
                        style={{ border: '1px dashed #D1D5DB', color: '#9CA3AF' }}
                      >
                        + Add more
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ============ STEP 2 — Pricing & Availability ============ */}
            {currentStep === 2 && (
              <>
                <SectionTitle title="Pricing" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div id="field-pricePerDay">
                    <FormRow label="Price per Day (VND)" required error={errors.pricePerDay}>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>₫</span>
                        <input type="number" min="0" className="w-full h-12 pl-7 pr-14 rounded-lg text-sm" style={inputStyle(errors.pricePerDay)} placeholder="0" value={form.pricePerDay} onChange={set('pricePerDay')} />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>/ day</span>
                      </div>
                    </FormRow>
                  </div>
                  <FormRow label="Security Deposit (VND)" error={errors.deposit}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>₫</span>
                      <input type="number" min="0" className="w-full h-12 pl-7 pr-3.5 rounded-lg text-sm" style={inputStyle(errors.deposit)} placeholder="0" value={form.deposit} onChange={set('deposit')} />
                    </div>
                  </FormRow>
                  <FormRow label="Weekly Discount (optional)">
                    <div className="relative">
                      <input type="number" min="0" max="100" className="w-full h-12 pl-3.5 pr-8 rounded-lg text-sm" style={inputStyle()} placeholder="0" value={form.weeklyDiscount} onChange={set('weeklyDiscount')} />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>%</span>
                    </div>
                  </FormRow>
                  <FormRow label="Monthly Discount (optional)">
                    <div className="relative">
                      <input type="number" min="0" max="100" className="w-full h-12 pl-3.5 pr-8 rounded-lg text-sm" style={inputStyle()} placeholder="0" value={form.monthlyDiscount} onChange={set('monthlyDiscount')} />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>%</span>
                    </div>
                  </FormRow>
                </div>

                {parseFloat(form.pricePerDay) > 0 && (
                  <div className="rounded-xl p-4 flex items-start gap-2.5 mt-1" style={{ background: '#EFF6FF' }}>
                    <Icon.info className="mt-0.5 shrink-0" />
                    <div className="text-sm" style={{ color: '#374151' }}>
                      <p className="font-medium mb-1">Estimated earnings</p>
                      <p style={{ color: '#6B7280' }}>{formatVnd(earnings.day)} / day · {formatVnd(earnings.week)} / week · {formatVnd(earnings.month)} / month</p>
                    </div>
                  </div>
                )}

                <Divider />

                <SectionTitle title="Availability" />
                <FormRow label="Availability">
                  <div className="flex gap-3">
                    {['Available', 'Temporarily unavailable'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDirect('availability', opt)}
                        className="flex-1 h-12 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          border: `1px solid ${form.availability === opt ? '#2F5FE0' : '#E5E7EB'}`,
                          background: form.availability === opt ? 'rgba(47,95,224,0.08)' : '#fff',
                          color: form.availability === opt ? '#2F5FE0' : '#374151',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </FormRow>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormRow label="Available From">
                    <input type="date" className={inputClass()} style={inputStyle()} value={form.availableFrom} onChange={set('availableFrom')} />
                  </FormRow>
                  <div id="field-availableUntil">
                    <FormRow label="Available Until" error={errors.availableUntil}>
                      <input type="date" className={inputClass()} style={inputStyle(errors.availableUntil)} value={form.availableUntil} onChange={set('availableUntil')} />
                    </FormRow>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg px-4 py-3.5 mt-1" style={{ background: '#F7F9FC' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>Allow renters to request booking</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Renters can send a request without contacting you first.</p>
                  </div>
                  <Toggle checked={form.allowRequestBooking} onChange={(v) => setDirect('allowRequestBooking', v)} />
                </div>

                <Divider />

                <SectionTitle title="Rental Rules" />
                <div className="space-y-2.5 mb-4">
                  {RULE_OPTIONS.map((r) => (
                    <label key={r.key} className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: '#374151' }}>
                      <input type="checkbox" className="rh-checkbox" checked={form.rules[r.key]} onChange={() => toggleRule(r.key)} />
                      {r.label}
                    </label>
                  ))}
                </div>
                <FormRow label="Additional rental rules">
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-3 rounded-lg text-sm resize-none"
                    style={inputStyle()}
                    placeholder="Any other rules renters should know about..."
                    value={form.additionalRules}
                    onChange={set('additionalRules')}
                  />
                </FormRow>
              </>
            )}

            {/* ============ STEP 3 — Review & Publish ============ */}
            {currentStep === 3 && (
              <ReviewStep form={form} photos={photos} earnings={earnings} categories={categories} onEdit={goToStep} />
            )}
          </div>

          {/* ---------------- LISTING PREVIEW (visible on every step) ---------------- */}
          <div className="lg:sticky lg:top-24 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Listing Preview</p>
            <div className="rh-card overflow-hidden">
              <div className="relative h-44 flex items-center justify-center" style={{ background: '#F7F9FC' }}>
                {coverPhoto ? (
                  <img src={coverPhoto.url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Icon.camera />
                )}
                <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: form.availability === 'Available' ? '#ECFDF3' : '#FEF9C3', color: form.availability === 'Available' ? '#16A34A' : '#A16207' }}>
                  {form.availability}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase" style={{ color: '#2F5FE0' }}>{form.category || 'Category'}</p>
                <h3 className="rh-heading text-base font-bold mt-0.5" style={{ color: '#0F1B3D' }}>{form.name || 'Equipment name'}</h3>
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#6B7280' }}>
                  <Icon.pin /> {form.district ? `${form.district}, ${form.city}` : (form.city || 'Location')}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{form.condition || 'Condition'}</p>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => <Icon.star key={i} />)}
                  <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>No reviews yet</span>
                </div>
                <div className="flex items-end justify-between mt-4 pt-4" style={{ borderTop: '1px solid #EEF0F3' }}>
                  <div>
                    <p className="rh-heading text-lg font-extrabold" style={{ color: '#0F1B3D' }}>
                      {formatVnd(form.pricePerDay || 0)}<span className="text-xs font-normal" style={{ color: '#6B7280' }}> / day</span>
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatVnd(form.deposit || 0)} deposit</p>
                  </div>
                </div>
                <button type="button" className="rh-btn-primary w-full py-2.5 text-sm mt-4">Preview Listing</button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- ACTION BUTTONS (desktop) ---------------- */}
        <div className="hidden lg:flex items-center justify-end gap-3 mt-8">
          {currentStep === 0 ? (
            <button type="button" onClick={() => navigate('/profile')} className="rh-btn-outline px-5 py-3 text-sm">Cancel</button>
          ) : (
            <button type="button" onClick={handleBack} className="rh-btn-outline px-5 py-3 text-sm">Back</button>
          )}
          <button type="button" onClick={handleSaveDraft} disabled={saving} className="rh-btn-outline px-5 py-3 text-sm">{saving ? 'Saving...' : 'Save as Draft'}</button>
          {currentStep < 3 ? (
            <button type="button" onClick={handleContinue} className="rh-btn-primary px-7 py-3 text-sm">Continue</button>
          ) : (
            <button type="button" onClick={handlePublish} disabled={publishing} className="rh-btn-primary px-7 py-3 text-sm">{publishing ? 'Publishing...' : 'Publish Listing'}</button>
          )}
        </div>
      </div>

      {/* ---------------- STICKY MOBILE ACTION BAR ---------------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t px-5 py-3 flex gap-2.5" style={{ borderColor: '#EEF0F3', boxShadow: '0 -8px 24px -12px rgba(15,27,61,0.15)' }}>
        {currentStep > 0 && (
          <button type="button" onClick={handleBack} className="rh-btn-outline flex-1 py-3 text-sm">Back</button>
        )}
        {currentStep < 3 ? (
          <button type="button" onClick={handleContinue} className="rh-btn-primary flex-[2] py-3 text-sm">Continue</button>
        ) : (
          <button type="button" onClick={handlePublish} disabled={publishing} className="rh-btn-primary flex-[2] py-3 text-sm">{publishing ? 'Publishing...' : 'Publish'}</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review & Publish — read-only summary of every step, with per-       */
/* section "Edit" links that jump straight back to that step.          */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value }) {
  return (
    <div>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#111827' }}>{value || '—'}</p>
    </div>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <div className="rounded-xl p-5 mb-4" style={{ border: '1px solid #EEF0F3' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: '#0F1B3D' }}>{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#2F5FE0' }}>
          <Icon.pencil /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function ReviewStep({ form, photos, earnings, categories, onEdit }) {
  const activeRules = RULE_OPTIONS.filter((r) => form.rules[r.key]).map((r) => r.label);
  return (
    <div>
      <SectionTitle title="Review & Publish" />
      <p className="text-sm -mt-3 mb-5" style={{ color: '#6B7280' }}>Double-check everything below before your listing goes live.</p>

      <ReviewCard title="Basic Information & Location" onEdit={() => onEdit(0)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <ReviewRow label="Equipment Name" value={form.name} />
          <ReviewRow label="Category" value={form.category} />
          <ReviewRow label="Condition" value={form.condition} />
          <ReviewRow label="Brand / Model" value={[form.brand, form.model].filter(Boolean).join(' / ')} />
          <ReviewRow label="Location" value={form.address} />
          <ReviewRow label="City / District" value={[form.district, form.city].filter(Boolean).join(', ')} />
        </div>
        <ReviewRow label="Description" value={form.description} />
      </ReviewCard>

      <ReviewCard title={`Photos (${photos.length})`} onEdit={() => onEdit(1)}>
        {photos.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No photos uploaded.</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative rounded-lg overflow-hidden aspect-[4/3]" style={{ border: '1px solid #EEF0F3' }}>
                <img src={p.url} alt="Equipment" className="w-full h-full object-cover" />
                {p.isCover && <span className="absolute bottom-1 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#2F5FE0' }}>Cover</span>}
              </div>
            ))}
          </div>
        )}
      </ReviewCard>

      <ReviewCard title="Pricing & Availability" onEdit={() => onEdit(2)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <ReviewRow label="Price per Day (VND)" value={form.pricePerDay ? formatVnd(form.pricePerDay) : ''} />
          <ReviewRow label="Security Deposit (VND)" value={formatVnd(form.deposit || 0)} />
          <ReviewRow label="Weekly Discount" value={form.weeklyDiscount ? `${form.weeklyDiscount}%` : 'None'} />
          <ReviewRow label="Monthly Discount" value={form.monthlyDiscount ? `${form.monthlyDiscount}%` : 'None'} />
          <ReviewRow label="Availability" value={form.availability} />
          <ReviewRow label="Available From — Until" value={form.availableFrom || form.availableUntil ? `${form.availableFrom || '—'} → ${form.availableUntil || '—'}` : ''} />
        </div>
        {parseFloat(form.pricePerDay) > 0 && (
          <div className="rounded-lg p-3.5 flex items-start gap-2.5 mb-3" style={{ background: '#EFF6FF' }}>
            <Icon.info className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: '#374151' }}>
              Estimated earnings: <strong>{formatVnd(earnings.day)}/day · {formatVnd(earnings.week)}/week · {formatVnd(earnings.month)}/month</strong>
            </p>
          </div>
        )}
        <ReviewRow label="Rental Rules" value={activeRules.length ? activeRules.join(', ') : 'None selected'} />
        {form.additionalRules && <div className="mt-3"><ReviewRow label="Additional Rules" value={form.additionalRules} /></div>}
      </ReviewCard>
    </div>
  );
}