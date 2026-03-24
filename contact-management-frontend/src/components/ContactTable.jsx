import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';

export default function ContactTable({ contacts, onDelete, onToggleFavorite, emptyMessage, groupedSections }) {
  const isGrouped = Array.isArray(groupedSections) && groupedSections.length > 0;

  if (!isGrouped && !contacts.length) {
    return (
      <p className="empty-hint">
        {emptyMessage || 'No contacts yet. Add your first contact.'}
      </p>
    );
  }

  if (isGrouped && groupedSections.every((g) => !g.items.length)) {
    return (
      <p className="empty-hint">
        {emptyMessage || 'No contacts yet. Add your first contact.'}
      </p>
    );
  }

  let rowIndex = 0;

  const row = (c) => {
    const i = rowIndex++;
    return (
      <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
        <td>
          <button
            type="button"
            className="btn-star"
            onClick={() => onToggleFavorite && onToggleFavorite(c)}
            title={c.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className={c.favorite ? 'star-filled' : 'star-empty'}>
              {c.favorite ? '★' : '☆'}
            </span>
          </button>
        </td>
        <td>
          <Avatar name={c.name} size={36} />
        </td>
        <td className="cell-clamp">{c.name}</td>
        <td className="cell-clamp">{c.email}</td>
        <td className="cell-clamp">{c.phone}</td>
        <td className="cell-clamp">{c.address || '—'}</td>
        <td className="table-actions">
          <Link to={`/contacts/${c.id}/edit`} className="btn btn-accent btn-sm">
            Edit
          </Link>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(c)}>
            Delete
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="table-wrap">
      <table className="contact-table">
        <thead>
          <tr>
            <th style={{ width: '3rem' }}>★</th>
            <th />
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isGrouped
            ? groupedSections.map(({ letter, items }) => (
                <Fragment key={letter}>
                  <tr className="contact-group-row">
                    <td colSpan={7}>
                      <span className="contact-group-label">{letter}</span>
                    </td>
                  </tr>
                  {items.map((c) => row(c))}
                </Fragment>
              ))
            : contacts.map((c) => row(c))}
        </tbody>
      </table>
    </div>
  );
}
