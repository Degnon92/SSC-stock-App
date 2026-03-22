import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, Box, AlertCircle, CheckCircle, RefreshCw, XCircle, StopCircle, ArrowUpCircle, ArrowDownCircle, Info, Clock } from 'lucide-react';
import { PageHeader, Card, Btn, Badge, FormGroup, Select, Input } from './UI';

export default function Scanner({ store }) {
  const { produits, addMouvement, clients, fournisseurs, settings } = store;
  const [scanning,       setScanning]       = useState(false);
  const [scannedCode,    setScannedCode]    = useState('');
  const [foundProd,      setFoundProd]      = useState(null);
  const [mode,           setMode]           = useState('Sortie');
  const [qte,            setQte]            = useState(1);
  const [clientFourn,    setClientFourn]    = useState('');
  const [message,        setMessage]        = useState(null);
  const [manualCode,     setManualCode]     = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    return () => { stopScanner(); };
  }, []); // eslint-disable-line

  async function startScanner() {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { handleScan(decodedText); },
        () => {}
      );
      setScanning(true);
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: `Impossible d'accéder à la caméra. ${err.message || 'Vérifiez les permissions.'}` });
    }
  }

  async function stopScanner() {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch {}
    setScanning(false);
  }

  function handleScan(code) {
    setScannedCode(code);
    const prod = produits.find(p =>
      p.ref === code ||
      p.ref?.toLowerCase() === code.toLowerCase() ||
      p.nom?.toLowerCase().includes(code.toLowerCase()) ||
      p.ean === code
    );
    setFoundProd(prod || null);
    if (!prod) setMessage({ type: 'warn', text: `Code "${code}" non trouvé dans le catalogue. Vérifiez la référence.` });
    else setMessage(null);
    stopScanner();
  }

  function handleManualSearch() {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
  }

  async function handleValider() {
    if (!foundProd) return;
    if (mode === 'Sortie' && qte > foundProd.stock) {
      setMessage({ type: 'error', text: `Stock insuffisant ! Disponible: ${foundProd.stock}` });
      return;
    }
    const newMouvement = {
      produit_id:    foundProd.id,
      produit_nom:   foundProd.nom,
      type:          mode,
      qte:           parseInt(qte),
      date:          new Date().toISOString().slice(0, 10),
      motif:         'Scan code-barres',
      operateur:     settings?.operateur || '',
      client_fourn:  clientFourn,
      prix_unitaire: mode === 'Entrée' ? foundProd.prix_achat : foundProd.prix_vente,
    };
    await addMouvement(newMouvement);

    // Historique de session (max 10 entrées)
    setSessionHistory(prev => [{
      ...newMouvement,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      id: Date.now().toString(),
    }, ...prev].slice(0, 10));

    setMessage({ type: 'success', text: `${mode} enregistrée avec succès — ${qte} × ${foundProd.nom}` });
    setScannedCode(''); setFoundProd(null); setQte(1); setClientFourn(''); setManualCode('');
    setTimeout(() => setMessage(null), 3500);
  }

  function reset() {
    setScannedCode(''); setFoundProd(null); setQte(1);
    setClientFourn(''); setMessage(null); setManualCode('');
  }

  const statusInfo = foundProd
    ? foundProd.stock === 0          ? { label: 'Rupture',     variant: 'danger' }
    : foundProd.stock <= foundProd.seuil ? { label: 'Stock faible', variant: 'warn'   }
    :                                    { label: 'Disponible',  variant: 'ok'     }
    : null;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Scanner Code-Barres" subtitle="Entrée/Sortie rapide par scan ou référence" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* ── COLONNE GAUCHE : SCANNER ─────────────────────────────────────── */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 20, color: 'var(--text-main)', fontSize: '1.1rem' }}>
            <Camera size={20} /> Caméra & Saisie
          </div>

          {/* Mode switch */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--input-bg)', borderRadius: 12, padding: 6, border: '1px solid var(--border-color)' }}>
            {['Entrée', 'Sortie'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: 10, border: 'none', cursor: 'pointer', borderRadius: 8,
                background: mode === m ? (m === 'Entrée' ? 'rgba(0,168,120,0.15)' : 'rgba(230,57,70,0.15)') : 'transparent',
                color: mode === m ? (m === 'Entrée' ? '#00a878' : '#e63946') : 'var(--text-muted)',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {m === 'Entrée' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />} {m}
              </button>
            ))}
          </div>

          {/* Zone caméra */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: scanning ? '2px solid var(--accent)' : '1px solid var(--border-color)', transition: 'all 0.3s ease' }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%', minHeight: scanning ? 280 : 0, transition: 'min-height 0.3s' }} />
            {!scanning && (
              <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <Camera size={48} strokeWidth={1} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', margin: 0 }}>La caméra est en pause</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {!scanning
              ? <Btn variant="accent" onClick={startScanner} style={{ flex: 1, justifyContent: 'center', padding: 12 }}><Camera size={18} style={{ marginRight: 8 }} /> Démarrer le scanner</Btn>
              : <Btn variant="danger" onClick={stopScanner}  style={{ flex: 1, justifyContent: 'center', padding: 12 }}><StopCircle size={18} style={{ marginRight: 8 }} /> Arrêter</Btn>
            }
          </div>

          {/* Saisie manuelle */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> Saisie manuelle
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={manualCode} onChange={e => setManualCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleManualSearch()} placeholder="Ex: REF-1234 ou EAN..." style={{ flex: 1 }} />
              <Btn variant="primary" onClick={handleManualSearch} style={{ padding: '0 16px' }}><Search size={18} /></Btn>
            </div>
          </div>
        </Card>

        {/* ── COLONNE DROITE : RÉSULTAT ─────────────────────────────────────── */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 20, color: 'var(--text-main)', fontSize: '1.1rem' }}>
            <Box size={20} /> Produit scanné
          </div>

          {/* Message feedback */}
          {message && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: message.type === 'success' ? 'rgba(0,168,120,0.1)' : message.type === 'error' ? 'rgba(230,57,70,0.1)' : 'rgba(244,162,97,0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(0,168,120,0.2)' : message.type === 'error' ? 'rgba(230,57,70,0.2)' : 'rgba(244,162,97,0.2)'}`,
              color: message.type === 'success' ? '#00a878' : message.type === 'error' ? '#e63946' : '#c07828',
              animation: 'fadeIn 0.3s ease',
            }}>
              {message.type === 'success' && <CheckCircle size={20} style={{ flexShrink: 0 }} />}
              {message.type === 'error'   && <XCircle     size={20} style={{ flexShrink: 0 }} />}
              {message.type === 'warn'    && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
              <div style={{ lineHeight: 1.4, fontWeight: 500 }}>{message.text}</div>
            </div>
          )}

          {/* État vide */}
          {!foundProd && !scannedCode && !message && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-page)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
              <Box size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: '0.95rem', textAlign: 'center', maxWidth: 250, margin: 0 }}>En attente de scan… Scannez un code-barres ou saisissez une référence.</p>
            </div>
          )}

          {/* Code inconnu */}
          {scannedCode && !foundProd && (
            <div style={{ flex: 1, background: 'rgba(230,57,70,0.05)', borderRadius: 16, padding: 30, textAlign: 'center', border: '1px solid rgba(230,57,70,0.1)' }}>
              <AlertCircle size={40} color="#e63946" style={{ marginBottom: 16, opacity: 0.8 }} />
              <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                Code : <code style={{ background: 'var(--bg-page)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)' }}>{scannedCode}</code>
              </div>
              <div style={{ color: '#e63946', fontSize: '0.9rem', marginBottom: 20 }}>Aucun produit correspondant dans le catalogue.</div>
              <Btn variant="outline" onClick={reset}><RefreshCw size={16} style={{ marginRight: 8 }} /> Nouvelle recherche</Btn>
            </div>
          )}

          {/* Produit trouvé */}
          {foundProd && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ background: 'var(--input-bg)', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 4 }}>{foundProd.nom}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>{foundProd.ref}</code>
                      <span>•</span><span>{foundProd.cat}</span>
                    </div>
                  </div>
                  {statusInfo && <Badge variant={statusInfo.variant} style={{ padding: '6px 10px' }}>{statusInfo.label}</Badge>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Stock actuel', `${foundProd.stock} unités`,                        Info],
                    ['Seuil alerte', foundProd.seuil,                                    AlertCircle],
                    ['Prix achat',   `${foundProd.prix_achat?.toLocaleString('fr-FR')} F`, null],
                    ['Prix vente',   `${foundProd.prix_vente?.toLocaleString('fr-FR')} F`, null],
                  ].map(([k, v, Ic]) => (
                    <div key={k} style={{ background: 'var(--bg-page)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {Ic && <Ic size={12} />} {k}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <FormGroup label={`Quantité à ${mode === 'Entrée' ? 'ajouter' : 'retirer'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Btn variant="outline" onClick={() => setQte(Math.max(1, qte - 1))} style={{ padding: '0 16px', height: 42 }}>-</Btn>
                    <Input type="number" min="1" max={mode === 'Sortie' ? foundProd.stock : undefined} value={qte} onChange={e => setQte(parseInt(e.target.value) || 1)} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }} />
                    <Btn variant="outline" onClick={() => setQte(qte + 1)} style={{ padding: '0 16px', height: 42 }}>+</Btn>
                  </div>
                </FormGroup>
                <FormGroup label={mode === 'Entrée' ? 'Fournisseur (Optionnel)' : 'Client (Optionnel)'}>
                  <Select value={clientFourn} onChange={e => setClientFourn(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {(mode === 'Entrée' ? fournisseurs : clients).map(x => (
                      <option key={x.id} value={x.nom}>{x.nom}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <Btn variant="outline" onClick={reset} style={{ flex: '0 0 auto', padding: '0 20px' }}><RefreshCw size={18} /></Btn>
                <Btn variant={mode === 'Entrée' ? 'accent' : 'danger'} onClick={handleValider} style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: '1rem' }}>
                  {mode === 'Entrée' ? <ArrowUpCircle size={20} style={{ marginRight: 8 }} /> : <ArrowDownCircle size={20} style={{ marginRight: 8 }} />}
                  Valider {mode} ({qte})
                </Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── HISTORIQUE DE SESSION ──────────────────────────────────────────── */}
      {sessionHistory.length > 0 && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-main)' }}>
              <Clock size={18} color="var(--text-muted)" /> Scans récents (cette session)
            </div>
            <Badge variant="outline">{sessionHistory.length} scan{sessionHistory.length > 1 ? 's' : ''}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessionHistory.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-page)', borderRadius: 10, borderLeft: `4px solid ${item.type === 'Entrée' ? '#00a878' : '#e63946'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: item.type === 'Entrée' ? '#00a878' : '#e63946' }}>
                    {item.type === 'Entrée' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.produit_nom}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.timestamp} • {item.client_fourn ? `${item.type === 'Entrée' ? 'De' : 'Pour'} ${item.client_fourn}` : 'Aucun tiers'}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: item.type === 'Entrée' ? '#00a878' : 'var(--text-main)' }}>
                  {item.type === 'Entrée' ? '+' : '-'}{item.qte}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
