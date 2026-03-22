import React, { useState, useMemo } from 'react';
import { Card } from '../UI';
import { AlertTriangle, Clock, TrendingDown, PackageX, CheckCircle2 } from 'lucide-react';

// ─── CONFIGURATION DES TYPES D'ALERTES ───────────────────────────────────────
const ALERT_CONFIG = {
  rupture:    { color: '#ef4444', icon: PackageX,      bgGradient: 'linear-gradient(90deg, rgba(239,68,68,0.08) 0%, transparent 100%)',   getLabel: ()  => 'RUPTURE TOTALE',       actionText: 'Réapprovisionner', navTarget: 'mouvements' },
  faible:     { color: '#f59e0b', icon: AlertTriangle, bgGradient: 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, transparent 100%)',   getLabel: (p) => `STOCK: ${p.stock}`,    actionText: 'Commander',        navTarget: 'commandes'  },
  expiration: { color: '#3b82f6', icon: Clock,         bgGradient: 'linear-gradient(90deg, rgba(59,130,246,0.08) 0%, transparent 100%)',   getLabel: ()  => 'PÉREMPTION',           actionText: 'Inspecter',        navTarget: 'mouvements' },
  prediction: { color: '#a855f7', icon: TrendingDown,  bgGradient: 'linear-gradient(90deg, rgba(168,85,247,0.08) 0%, transparent 100%)',   getLabel: (p) => `~${p.joursRestants} JOURS`, actionText: 'Anticiper', navTarget: 'commandes'  },
};

// ─── STYLES D'ANIMATION ───────────────────────────────────────────────────────
const AlertesStyles = () => (
  <style>{`
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(-15px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulseSoft {
      0%   { box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
      70%  { box-shadow: 0 0 0 6px rgba(239,68,68,0);   }
      100% { box-shadow: 0 0 0 0   rgba(239,68,68,0);   }
    }
    .alert-card-stagger {
      animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }
  `}</style>
);

// ─── MINI JAUGE VISUELLE ──────────────────────────────────────────────────────
function MiniGauge({ current, max, color }) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (current / safeMax) * 100));
  return (
    <div style={{ width: 120, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}`, transition: 'width 1s ease-out' }} />
    </div>
  );
}

// ─── SECTION D'ALERTES ────────────────────────────────────────────────────────
function AlertSection({ title, color, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 10px ${color}80` }} />
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

// ─── CARTE D'ALERTE ───────────────────────────────────────────────────────────
function AlertCard({ p, type, onNavigate, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;
  const isRupture  = type === 'rupture';
  const isPredic   = type === 'prediction';
  const isExpire   = type === 'expiration';

  return (
    <article
      className="alert-card-stagger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 0.05}s`,
        display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px',
        background: isHovered ? config.bgGradient : 'var(--bg-card)',
        borderRadius: 12,
        border: `1px solid ${isHovered ? `${config.color}50` : 'var(--border-color)'}`,
        borderLeft: `4px solid ${config.color}`,
        boxShadow: isHovered ? `0 8px 24px -10px ${config.color}40` : 'var(--card-shadow)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Icône avec effet pulse si rupture critique */}
      <div style={{
        width: 46, height: 46, borderRadius: 12, background: `${config.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: config.color, animation: isRupture ? 'pulseSoft 2s infinite' : 'none',
      }}>
        <Icon size={24} strokeWidth={2.5} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {p.nom}
          {p.ref && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 4 }}>{p.ref}</span>}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isExpire
            ? `Péremption le ${new Date(p.date_expiration).toLocaleDateString('fr-FR')} (Stock: ${p.stock})`
            : isPredic
            ? `Vitesse: ${p.vsj?.toFixed(1) ?? '?'}/jour — Rupture estimée dans ${p.joursRestants} j.`
            : `Niveau critique atteint. (Seuil: ${p.seuil})`}
        </div>
        {/* Jauge uniquement pour les stocks faibles */}
        {!isExpire && !isRupture && !isPredic && (
          <MiniGauge current={p.stock} max={p.seuil} color={config.color} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
        <span style={{ color: config.color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textShadow: `0 0 10px ${config.color}40` }}>
          {config.getLabel(p)}
        </span>
        <button
          onClick={() => onNavigate(config.navTarget)}
          style={{
            padding: '8px 16px',
            background: isHovered ? config.color : 'transparent',
            border: `1px solid ${isHovered ? config.color : 'var(--border-color)'}`,
            color: isHovered ? '#fff' : 'var(--text-main)',
            borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            boxShadow: isHovered ? `0 4px 12px ${config.color}40` : 'none',
          }}
        >
          {config.actionText}
        </button>
      </div>
    </article>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export function Alertes({ store, onNavigate }) {
  const { ruptures = [], stockFaible = [], expirationProche = [], predictionsRupture = [] } = store;

  const total = useMemo(
    () => ruptures.length + stockFaible.length + expirationProche.length + predictionsRupture.length,
    [ruptures, stockFaible, expirationProche, predictionsRupture]
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <AlertesStyles />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Alertes de Stock</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Supervision intelligente des niveaux critiques et péremptions.</p>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: total > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          color: total > 0 ? '#ef4444' : '#10b981',
          border: `1px solid ${total > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 24, padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700,
          boxShadow: `0 0 20px ${total > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
        }}>
          {total > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {total > 0 ? `${total} action${total > 1 ? 's' : ''} requise${total > 1 ? 's' : ''}` : 'Aucun problème'}
        </span>
      </header>

      {total === 0 ? (
        <Card style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#10b981', marginBottom: 20, filter: 'drop-shadow(0 10px 20px rgba(16,185,129,0.3))' }}>
            <CheckCircle2 size={72} strokeWidth={1.5} />
          </div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 10px' }}>Tout est sous contrôle</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, maxWidth: 400 }}>
            Vos niveaux de stock sont optimaux et aucun produit n'arrive à expiration prochainement.
          </p>
        </Card>
      ) : (
        <div>
          {ruptures.length > 0 && (
            <AlertSection title={`Ruptures de stock (${ruptures.length})`} color={ALERT_CONFIG.rupture.color}>
              {ruptures.map((p, i) => <AlertCard key={p.id} p={p} type="rupture" index={i} onNavigate={onNavigate} />)}
            </AlertSection>
          )}
          {stockFaible.length > 0 && (
            <AlertSection title={`Stock faible (${stockFaible.length})`} color={ALERT_CONFIG.faible.color}>
              {stockFaible.map((p, i) => <AlertCard key={p.id} p={p} type="faible" index={i} onNavigate={onNavigate} />)}
            </AlertSection>
          )}
          {expirationProche.length > 0 && (
            <AlertSection title={`Péremptions proches (${expirationProche.length})`} color={ALERT_CONFIG.expiration.color}>
              {expirationProche.map((p, i) => <AlertCard key={p.id} p={p} type="expiration" index={i} onNavigate={onNavigate} />)}
            </AlertSection>
          )}
          {predictionsRupture.length > 0 && (
            <AlertSection title={`Prédictions de rupture (${predictionsRupture.length})`} color={ALERT_CONFIG.prediction.color}>
              {predictionsRupture.map((p, i) => <AlertCard key={p.id} p={p} type="prediction" index={i} onNavigate={onNavigate} />)}
            </AlertSection>
          )}
        </div>
      )}
    </div>
  );
}
