import React, { useState, useEffect } from 'react';
import { RefreshCw, UserCheck, Shield, Trash2, Mail, Wallet } from 'lucide-react';

export default function AdminUsers({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Yakin ingin mengubah role user menjadi ${newRole}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) { alert('Role berhasil diperbarui!'); fetchUsers(); }
      else { const e = await res.json(); alert(e.error || 'Gagal.'); }
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="adm-loading"><RefreshCw size={32} className="spin" /> Memuat data user...</div>;

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-title">Manajemen User</div>
          <div className="adm-page-sub">Kelola tingkatan membership pembeli (Member & Reseller)</div>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary"><RefreshCw size={16} /> Segarkan</button>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Saldo</th><th>Status</th><th className="td-actions">Aksi</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><div className="adm-user-cell"><div className="name">{u.name}</div><div className="email"><Mail size={11} /> {u.email}</div></div></td>
                <td><span className={`adm-badge ${u.role === 'ADMIN' ? 'adm-badge-info' : u.role === 'RESELLER' ? 'adm-badge-success' : 'adm-badge-neutral'}`}>{u.role}</span></td>
                <td className="td-amt"><Wallet size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />Rp {u.balance.toLocaleString('id-ID')}</td>
                <td>{u.isVerified ? <span style={{ color: '#16a34a', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><UserCheck size={14} /> Terverifikasi</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unverified</span>}</td>
                <td className="td-actions">
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {u.role !== 'RESELLER' && u.role !== 'ADMIN' && (
                      <button onClick={() => handleChangeRole(u.id, 'RESELLER')} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px' }}>Jadikan Reseller</button>
                    )}
                    {u.role === 'RESELLER' && (
                      <button onClick={() => handleChangeRole(u.id, 'USER')} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px' }}>Turunkan ke Member</button>
                    )}
                    {u.role === 'ADMIN' ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '5px 10px' }}>Akses Penuh</span>
                    ) : (
                      <button className="btn btn-danger" style={{ padding: '5px', borderRadius: '6px' }} title="Hapus"
                        onClick={() => alert('Fitur hapus user sedang diproses.')}><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
