import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, Card, Btn, Badge, FormGroup, Select, Input } from './UI';

export default function Scanner({ store }) {
  const { produits, addMouvement, clients, fournisseurs, settings } = store;
  const [scanning,    setScanning]    = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [foundProd,   setFoundProd]   = useState(null);
  const [mode,        setMode]        = useState('Sortie'); // Entrée ou Sortie
  const [qte,         setQte]         = useState(1);
  const [clientFourn, setClientFourn] = useState('');
  const [message,     setMessage]     = useState(null);
  const [manualCode,  setManualCode]  = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

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
    // Cherche par référence exacte OU par nom contenant le code
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
    handleScan(manualCode.trim());
  }

  async function handleValider() {
    if (!foundProd) return;
    if (mode === 'Sortie' && qte > foundProd.stock) {
      setMessage({ type: 'error', text: `Stock insuffisant ! Disponible: ${foundProd.stock}` });
      return;
    }
    await addMouvement({
      produit_id: foundProd.id,
      produit_nom: foundProd.nom,
      type: mode,
      qte: parseInt(qte),
      date: new Date().toISOString().slice(0, 10),
      motif: `Scan code-barres`,
      operateur: settings?.operateur || '',
      client_fourn: clientFourn,
      prix_unitaire: mode === 'Entrée' ? foundProd.prix_achat : foundProd.prix_vente,
    });
    setMessage({ type: 'success', text: `✅ ${mode} enregistrée — ${qte} × ${foundProd.nom}` });
    setScannedCode('');
    setFoundProd(null);
    setQte(1);
    setClientFourn('');
    setManualCode('');
    setTimeout(() => setMessage(null), 3500);
  }

  function reset() {
    setScannedCode('');
    setFoundProd(null);
    setQte(1);
    setClientFourn('');
    setMessage(null);
    setManualCode('');
  }

  const statusInfo = foundProd
    ? foundProd.stock === 0 ? { label: 'Rupture', variant: 'danger' }
      : foundProd.stock <= foundProd.seuil ? { label: 'Stock faible', variant: 'warn' }
      : { label: 'Disponible', variant: 'ok' }
    : null;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📷 Scanner Code-Barres" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* SCANNER */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>📷 Caméra</div>

          {/* Mode switch */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-page)', borderRadius: 10, padding: 4 }}>
            {['Entrée', 'Sortie'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer', borderRadius: 7,
                background: mode === m ? (m === 'Entrée' ? '#00a878' : '#e63946') : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
              }}>{m === 'Entrée' ? '▲ Entrée' : '▼ Sortie'}</button>
            ))}
          </div>

          {/* Scanner div */}
          <div id="qr-reader" ref={scannerRef} style={{ width: '100%', borderRadius: 10, overflow: 'hidden', background: '#000', minHeight: scanning ? 280 : 0 }} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {!scanning
              ? <Btn variant="accent" onClick={startScanner} icon="📷" style={{ flex: 1, justifyContent: 'center' }}>Démarrer le scanner</Btn>
              : <Btn variant="danger" onClick={stopScanner} icon="⏹️" style={{ flex: 1, justifyContent: 'center' }}>Arrêter</Btn>
            }
          </div>

          {/* Saisie manuelle */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Ou saisie manuelle
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                placeholder="Référence ou code produit..."
                style={{ flex: 1 }}
              />
              <Btn variant="primary" onClick={handleManualSearch}>🔍</Btn>
            </div>
          </div>
        </Card>

        {/* RÉSULTAT */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>📦 Produit scanné</div>

          {message && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem',
              background: message.type === 'success' ? 'rgba(0,168,120,0.1)' : message.type === 'error' ? 'rgba(230,57,70,0.1)' : 'rgba(244,162,97,0.1)',
              color: message.type === 'success' ? '#00a878' : message.type === 'error' ? '#e63946' : '#c07828',
            }}>{message.text}</div>
          )}

          {!foundProd && !scannedCode && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.3 }}>📷</div>
              <p style={{ fontSize: '0.85rem' }}>Scannez un code-barres ou saisissez une référence pour commencer.</p>
            </div>
          )}

          {scannedCode && !foundProd && (
            <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>❓</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Code scanné : <code style={{ background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4 }}>{scannedCode}</code></div>
              <div style={{ color: '#e63946', fontSize: '0.85rem' }}>Aucun produit correspondant dans le catalogue.</div>
              <Btn variant="outline" size="sm" onClick={reset} style={{ marginTop: 14 }}>Réinitialiser</Btn>
            </div>
          )}

          {foundProd && (
            <div>
              {/* Fiche produit */}
              <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{foundProd.nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{foundProd.ref} · {foundProd.cat}</div>
                  </div>
                  {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.83rem' }}>
                  {[
                    ['Stock actuel', `${foundProd.stock} unités`],
                    ['Seuil alerte', foundProd.seuil],
                    ['Prix achat', `${foundProd.prix_achat?.toLocaleString('fr-FR')} F`],
                    ['Prix vente', `${foundProd.prix_vente?.toLocaleString('fr-FR')} F`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--bg-card)', borderRadius: 7, padding: '8px 10px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                      <div style={{ fontWeight: 700, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulaire mouvement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <FormGroup label="Quantité">
                  <Input type="number" min="1" max={mode === 'Sortie' ? foundProd.stock : undefined} value={qte} onChange={e => setQte(parseInt(e.target.value) || 1)} />
                </FormGroup>
                <FormGroup label={mode === 'Entrée' ? 'Fournisseur' : 'Client'}>
                  <Select value={clientFourn} onChange={e => setClientFourn(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {(mode === 'Entrée' ? fournisseurs : clients).map(x => (
                      <option key={x.id} value={x.nom}>{x.nom}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Btn variant="outline" onClick={reset} style={{ flex: '0 0 auto' }}>↩️ Reset</Btn>
                <Btn variant={mode === 'Entrée' ? 'accent' : 'danger'} onClick={handleValider} style={{ flex: 1, justifyContent: 'center' }}>
                  {mode === 'Entrée' ? '▲' : '▼'} Valider {mode} ({qte} unité{qte > 1 ? 's' : ''})
                </Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Historique récent des scans de la session */}
    </div>
  );
}
