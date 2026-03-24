import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContact } from '../services/contactService.js';
import { useToast } from '../utils/ToastContext.jsx';

const initial = { name: '', email: '', phone: '', address: '' };

export default function AddContactPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await createContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      toast.success('Contact created successfully');
      navigate('/contacts');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create contact';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key) => (ev) => setForm((f) => ({ ...f, [key]: ev.target.value }));

  return (
    <div>
      <h1 className="page-title">Add contact</h1>
      <div className="card form-card">
        {error ? <div className="alert-error">{error}</div> : null}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="add-name">Name</label>
            <input id="add-name" value={form.name} onChange={onChange('name')} />
            {fieldErrors.name ? <div className="form-error">{fieldErrors.name}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="add-email">Email</label>
            <input id="add-email" type="email" value={form.email} onChange={onChange('email')} />
            {fieldErrors.email ? <div className="form-error">{fieldErrors.email}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="add-phone">Phone</label>
            <input id="add-phone" value={form.phone} onChange={onChange('phone')} />
            {fieldErrors.phone ? <div className="form-error">{fieldErrors.phone}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="add-address">Address</label>
            <textarea id="add-address" rows={3} value={form.address} onChange={onChange('address')} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
