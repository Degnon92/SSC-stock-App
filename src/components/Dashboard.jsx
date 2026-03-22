import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { StatCard, Card, SectionCard, Btn, Badge } from './UI';
import { generateRapportFlash } from '../utils/pdfUtils';

const fmt = (n) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
const fmtCfa = (n) => n.toLocaleString('fr-FR') + ' FCFA';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

export default function Dashboard({ store, onNavigate }) {
  const {
    produits, mouvements, fournisseurs, clients,
    alertes, ruptures, stockFaible,
    valeurStock, valeurVente,
    expirationProche, statsParMois, caParMois,
  } = store;

  const lastMouvements = [...mouvements].reverse().slice(0, 7);
  const marge = valeurVente - valeurStock;
  const txMarge = valeurVente > 0 ? ((marge / valeurVente) * 100).toFixed(1) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* EN-TÊTE + BOUTON RAPPORT FLASH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>📊 Tableau de bord</h1>
        <Btn variant="accent" icon="⚡" onClick={() => generateRapportFlash({ storeVal: store })}>Générer Rapport Flash (PDF)</Btn>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard label="Total références" value={produits.length} sub={`${fournisseurs.length} fournisseurs actifs`} color="blue" icon="📦" />
        <StatCard label="Valeur stock" value={fmt(valeurStock)} sub={`Prix achat — ${fmtCfa(valeurStock)}`} color="green" icon="💰" />
        <StatCard label="Valeur vente" value={fmt(valeurVente)} sub={`Marge potentielle: ${txMarge}%`} color="purple" icon="📈" />
        <StatCard label="Alertes stock" value={alertes.length} sub={`${ruptures.length} rupture(s), ${stockFaible.length} faible(s)`} color={alertes.length > 0 ? 'danger' : 'green'} icon="🔔" />
        <StatCard label="Expirations proches" value={expirationProche.length} sub="Dans les 90 prochains jours" color={expirationProche.length > 0 ? 'warn' : 'green'} icon="⏰" />
        <StatCard label="Clients actifs" value={clients.filter(c => c.actif).length} sub={`${mouvements.filter(m => m.type === 'Sortie').length} ventes enregistrées`} color="blue" icon="🏥" />
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>
        <SectionCard title="📊 Mouvements stock — 6 mois">
          <div style={{ padding: '8px 0', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsParMois} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--input-bg)' }} />
                <Bar dataKey="entrees" name="Entrées" fill="var(--neon-blue)" radius={[6, 6, 0, 0]} barSize={12} />
                <Bar dataKey="sorties" name="Sorties" fill="var(--neon-pink)" radius={[6, 6, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="💵 Chiffre d'affaires (ventes)">
          <div style={{ padding: '8px 0', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={caParMois} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip content={<CustomTooltip />} formatter={(v) => [fmtCfa(v), 'CA']} cursor={{ stroke: 'var(--border-color)' }} />
                <Line type="monotone" dataKey="ca" name="CA" stroke="var(--neon-green)" strokeWidth={3} dot={{ fill: 'var(--neon-green)', strokeWidth: 2, r: 4, stroke: 'var(--bg-card)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* DERNIERS MOUVEMENTS */}
        <SectionCard title="🔄 Derniers mouvements" action={<Btn variant="outline" size="sm" onClick={() => onNavigate('mouvements')}>Voir tout →</Btn>}>
          <div style={{ overflowX: 'auto', margin: '0 -24px -24px -24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {lastMouvements.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Aucun mouvement</td></tr>
                ) : lastMouvements.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.produit_nom}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>{m.client_fourn}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <Badge variant={m.type === 'Entrée' ? 'ok' : 'danger'}>{m.type === 'Entrée' ? '▲' : '▼'} {m.type}</Badge>
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, fontSize: '0.9rem' }}>{m.qte}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ALERTES */}
        <SectionCard title="🚨 Alertes actives" action={<Btn variant="outline" size="sm" onClick={() => onNavigate('alertes')}>Voir tout →</Btn>}>
          <div style={{ padding: '8px 0' }}>
            {alertes.length === 0 && expirationProche.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--neon-green)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: '0.85rem' }}>Tous les stocks sont suffisants</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {alertes.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)', borderLeft: `3px solid ${p.stock === 0 ? '#ef4444' : '#f97316'}` }}>
                    <span style={{ fontSize: '1.1rem' }}>{p.stock === 0 ? '🚨' : '⚠️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.stock === 0 ? 'Rupture' : `Stock: ${p.stock}`} / Seuil: {p.seuil}</div>
                    </div>
                    <Badge variant={p.stock === 0 ? 'danger' : 'warn'}>{p.stock}</Badge>
                  </div>
                ))}
                {expirationProche.slice(0, 2).map(p => (
                  <div key={`exp-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)', borderLeft: '3px solid var(--neon-blue)' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏰</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Expire le {new Date(p.date_expiration).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Badge variant="info">Expiration</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
