import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteContact, fetchContacts, searchContacts, toggleFavorite, exportContactsCsv } from '../services/contactService.js';
import { fetchGroups } from '../services/groupService.js';
import { useToast } from '../utils/ToastContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import ContactTable from '../components/ContactTable.jsx';
import ContactCard from '../components/ContactCard.jsx';

const PAGE_SIZE = 10;

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debounced]);

  useEffect(() => {
    setPage(0);
  }, [selectedGroupId]);

  const loadContacts = useCallback(async () => {
    const groupMode = selectedGroupId !== 'all';
    const size = groupMode ? 500 : PAGE_SIZE;
    const effectivePage = groupMode ? 0 : page;
    const res = debounced
      ? await searchContacts(debounced, effectivePage, size)
      : await fetchContacts(effectivePage, size);
    setData(res);
  }, [debounced, page, selectedGroupId]);

  const loadGroups = useCallback(async () => {
    const res = await fetchGroups();
    setGroups(res);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadContacts(), loadGroups()]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load contacts');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [loadContacts, loadGroups]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleDelete = async (contact) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteContact(contact.id);
      toast.success(`"${contact.name}" deleted`);
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleFavorite = async (contact) => {
    try {
      const updated = await toggleFavorite(contact.id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((c) => (c.id === updated.id ? updated : c)),
        };
      });
      toast.success(updated.favorite ? `★ "${contact.name}" added to favorites` : `"${contact.name}" removed from favorites`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update favorite');
    }
  };

  const handleExport = async () => {
    try {
      await exportContactsCsv();
      toast.success('Contacts exported as CSV');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Export failed');
    }
  };

  const contacts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const visibleContacts = useMemo(() => {
    if (!selectedGroup || selectedGroupId === 'all') return contacts;
    const q = debounced.toLowerCase();
    const ids = new Set(selectedGroup.contactIds || []);
    return contacts.filter((c) => {
      if (!ids.has(c.id)) return false;
      if (!q) return true;
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [contacts, selectedGroup, selectedGroupId, debounced]);

  return (
    <div>
      <div className="page-header-row">
        <h1 className="page-title">Contacts</h1>
        <div className="page-header-actions">
          <button type="button" className="btn btn-ghost" onClick={handleExport}>
            ⬇ Export CSV
          </button>
          <Link to="/groups" className="btn btn-ghost">
            Manage groups
          </Link>
          <Link to="/contacts/new" className="btn btn-primary">
            Add contact
          </Link>
        </div>
      </div>

      <div className="contacts-toolbar">
        <SearchBar value={query} onChange={setQuery} />
        <div className="group-by-control">
          <label htmlFor="group-by">View group</label>
          <select
            id="group-by"
            className="group-by-select"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            aria-label="View contacts by group"
          >
            <option value="all">All contacts</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {selectedGroup && selectedGroupId !== 'all' ? (
        <p className="group-active-hint">
          Showing group: <strong>{selectedGroup.name}</strong> ({selectedGroup.contactIds?.length || 0} contacts)
        </p>
      ) : null}

      {loading ? (
        <div className="loading-inline">Loading contacts…</div>
      ) : (
        <>
          <div className="contacts-desktop">
            <ContactTable
              contacts={visibleContacts}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              emptyMessage={
                debounced
                  ? 'No contacts match your search.'
                  : selectedGroupId !== 'all'
                    ? 'This group has no contacts yet.'
                    : 'No contacts yet. Add your first contact.'
              }
            />
          </div>

          <div className="contacts-mobile">
            {visibleContacts.length === 0 ? (
              <p className="empty-hint">
                {debounced
                  ? 'No contacts match your search.'
                  : selectedGroupId !== 'all'
                    ? 'This group has no contacts yet.'
                    : 'No contacts yet. Add your first contact.'}
              </p>
            ) : (
              visibleContacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>

          {selectedGroupId === 'all' ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              disabled={loading}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
