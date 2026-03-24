import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContact, updateContact } from '../services/contactService.js';
import { useToast } from '../utils/ToastContext.jsx';

export default function EditContactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getContact(id);
        if (!cancelled) {
          setForm({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Contact not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
    setSaving(true);
    try {
      await updateContact(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      toast.success('Contact updated successfully');
      navigate('/contacts');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not update contact';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onChange = (key) => (ev) => setForm((f) => ({ ...f, [key]: ev.target.value }));

  if (loading) {
    return <div className="loading-inline">Loading contact…</div>;
  }

  return (
    <div>
      <h1 className="page-title">Edit contact</h1>
      <div className="card form-card">
        {error ? <div className="alert-error">{error}</div> : null}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="edit-name">Name</label>
            <input id="edit-name" value={form.name} onChange={onChange('name')} />
            {fieldErrors.name ? <div className="form-error">{fieldErrors.name}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="edit-email">Email</label>
            <input id="edit-email" type="email" value={form.email} onChange={onChange('email')} />
            {fieldErrors.email ? <div className="form-error">{fieldErrors.email}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="edit-phone">Phone</label>
            <input id="edit-phone" value={form.phone} onChange={onChange('phone')} />
            {fieldErrors.phone ? <div className="form-error">{fieldErrors.phone}</div> : null}
          </div>
          <div className="form-group">
            <label htmlFor="edit-address">Address</label>
            <textarea id="edit-address" rows={3} value={form.address} onChange={onChange('address')} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
