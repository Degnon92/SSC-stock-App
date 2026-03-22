import React, { useState, useMemo } from 'react';
import { Badge, Table, Tr, Td, SearchBar, PageHeader, Empty, Card } from '../UI';

export function AuditLogs({ store }) {
  const { auditLogs = [] } = store;
  const [search, setSearch] = useState('');

  // ⚡ OPTIMISATION : filtrage mis en cache
  const filtered = useMemo(() => {
    if (!search) return auditLogs;
    const q = search.toLowerCase();
    return auditLogs.filter(l =>
      (l.user || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.module || '').toLowerCase().includes(q) ||
      (l.desc || '').toLowerCase().includes(q)
    );
  }, [auditLogs, search]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CRÉATION':    return { bg: 'rgba(0,168,120,0.15)',  color: '#00a878' };
      case 'MODIFICATION':return { bg: 'rgba(0,121,193,0.15)',  color: '#0079c1' };
      case 'SUPPRESSION': return { bg: 'rgba(230,57,70,0.15)',  color: '#e63946' };
      case 'ALERTE':      return { bg: 'rgba(244,162,97,0.15)', color: '#f4a261' };
      default:            return { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🛡️ Historique d'Audit (Logs)">
        <Badge variant="info">{filtered.length} logs enregistrés</Badge>
      </PageHeader>
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <SearchBar placeholder="Rechercher un log (utilisateur, action, module...)" value={search} onChange={setSearch} />
        </div>
        <Table
          headers={['Date & Heure', 'Utilisateur', 'Action', 'Module', 'Détails']}
          empty={filtered.length === 0 ? <Empty icon="🛡️" message={search ? 'Aucun log ne correspond à votre recherche.' : 'Aucune activité enregistrée pour le moment.'} /> : null}
        >
          {filtered.map(log => {
            const c = getActionColor(log.action);
            return (
              <Tr key={log.id} style={{ fontSize: '0.85rem' }}>
                <Td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(log.date).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleTimeString('fr-FR')}</div>
                </Td>
                <Td style={{ fontWeight: 600 }}>{log.user}</Td>
                <Td>
                  <span style={{ display: 'inline-block', background: c.bg, color: c.color, padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.5 }}>
                    {log.action}
                  </span>
                </Td>
                <Td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{log.module}</Td>
                <Td style={{ color: 'var(--text-main)' }}>{log.desc}</Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
