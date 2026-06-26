import React, { useState, useEffect } from 'react';
import { RefreshCw, UserCheck, Shield, Trash2, Mail, Wallet } from 'lucide-react';

export default function AdminUsers({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Yakin ingin mengubah role user menjadi ${newRole}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert('Role berhasil diperbarui!');
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal memperbarui role.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><RefreshCw className="animate-spin" size={32} /></div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800' }}>Manajemen User</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Kelola tingkatan membership pembeli (Member & Reseller).</p>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary"><RefreshCw size={16} /> Segarkan</button>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>USER</th>
              <th style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>ROLE</th>
              <th style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>SALDO</th>
              <th style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background 0.2s' }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {u.email}
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-premium' : u.role === 'RESELLER' ? 'badge-smm' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wallet size={14} /> Rp {u.balance.toLocaleString('id-ID')}
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  {u.isVerified ? (
                    <span style={{ fontSize: '12px', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={14} /> Terverifikasi
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unverified</span>
                  )}
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {u.role !== 'RESELLER' && u.role !== 'ADMIN' && (
                      <button 
                        onClick={() => handleChangeRole(u.id, 'RESELLER')}
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Jadikan Reseller
                      </button>
                    )}
                    {u.role === 'RESELLER' && (
                      <button 
                        onClick={() => handleChangeRole(u.id, 'USER')}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Turunkan ke Member
                      </button>
                    )}
                    {u.role === 'ADMIN' ? (
                       <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 12px' }}>Akses Penuh</span>
                    ) : (
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px', borderRadius: '8px' }}
                        title="Hapus User (Permanen)"
                        onClick={() => alert('Fitur hapus user fisik sedang diproses.')}
                      >
                        <Trash2 size={14} />
                      </button>
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
