import { api } from './api.js';

export async function fetchDashboardStats() {
  const { data } = await api.get('/api/dashboard/stats');
  return data;
}

export async function fetchContacts(page = 0, size = 10) {
  const { data } = await api.get('/api/contacts', { params: { page, size } });
  return data;
}

export async function searchContacts(query, page = 0, size = 10) {
  const { data } = await api.get('/api/contacts/search', {
    params: { query: query || '', page, size },
  });
  return data;
}

export async function getContact(id) {
  const { data } = await api.get(`/api/contacts/${id}`);
  return data;
}

export async function createContact(payload) {
  const { data } = await api.post('/api/contacts', payload);
  return data;
}

export async function updateContact(id, payload) {
  const { data } = await api.put(`/api/contacts/${id}`, payload);
  return data;
}

export async function deleteContact(id) {
  await api.delete(`/api/contacts/${id}`);
}

export async function toggleFavorite(id) {
  const { data } = await api.patch(`/api/contacts/${id}/favorite`);
  return data;
}

export async function exportContactsCsv() {
  const { data } = await api.get('/api/contacts/export/csv', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'contacts.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
