import React, { useState, useEffect, useRef } from 'react';

// ── Brand tokens ──────────────────────────────────────────
const WHITE = '#FFFFFF';
const BG = '#F4F6F9';
const CARD = '#FFFFFF';
const NAVY = '#0B1829';
const NAVY2 = '#112036';
const GOLD = '#F5C518';
const GOLD2 = '#D4A800';
const GRAY = '#6B7C93';
const LGRAY = '#B0BEC5';
const BORDER = '#D8E0EA';
const IBORDER = '#C2CDD8';
const ITEXT = '#0B1829';

// ── Conversion constants ──────────────────────────────────
const KG_PER_PALLET = 750;
const KG_PER_BOX = 25;
const KG_PER_MT = 1000;

const roundPallets = (raw) => {
  if (raw <= 0) return 0;
  const floored = Math.floor(raw);
  const decimal = parseFloat((raw - floored).toFixed(10));
  return decimal > 0.15 ? floored + 1 : Math.max(floored, 1);
};

const toPallets = (qty, unit) => {
  const n = parseFloat(qty) || 0;
  let raw = 0;
  if (unit === 'pallet') raw = n;
  if (unit === 'boxes') raw = (n * KG_PER_BOX) / KG_PER_PALLET;
  if (unit === 'mt') raw = (n * KG_PER_MT) / KG_PER_PALLET;
  return roundPallets(raw);
};

const PALLET_WEEK_RATE = { frozen: 850, chilled: 800 };

const ratePerUnitPerDay = (product, unit) => {
  const rppd = PALLET_WEEK_RATE[product] / 7;
  if (unit === 'pallet') return rppd;
  if (unit === 'boxes') return rppd * (KG_PER_BOX / KG_PER_PALLET);
  if (unit === 'mt') return rppd * (KG_PER_MT / KG_PER_PALLET);
  return rppd;
};

function convertUnits(qty, srcUnit) {
  const n = parseFloat(qty) || 0;
  let kgs = 0;
  if (srcUnit === 'boxes') kgs = n * KG_PER_BOX;
  if (srcUnit === 'pallet') kgs = n * KG_PER_PALLET;
  if (srcUnit === 'mt') kgs = n * KG_PER_MT;
  const rawPallets = kgs / KG_PER_PALLET;
  const roundedPallets = srcUnit === 'pallet' ? n : roundPallets(rawPallets);
  const wasRounded =
    srcUnit !== 'pallet' && Math.abs(rawPallets - roundedPallets) > 0.0001;
  return {
    boxes: kgs / KG_PER_BOX,
    pallet: roundedPallets,
    palletRaw: rawPallets,
    palletRounded: wasRounded,
    palletRoundedUp: wasRounded && roundedPallets > rawPallets,
    mt: kgs / KG_PER_MT,
    kgs,
  };
}

const PL = { frozen: 'Frozen −18°C to 0°C', chilled: 'Chilled +2°C to +18°C' };
const UL = { boxes: 'Boxes / Carton', pallet: 'Pallets', mt: 'Metric Tons' };

const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtNum = (n) =>
  isNaN(n) || !isFinite(n)
    ? '—'
    : (+n.toFixed(3)).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const today = () =>
  new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
const DEFAULT_RATE = 5;

const CHAMBERS = [
  { id: 'c1', name: 'Chamber 1', temp: '−18°C to 0°C', cols: 6, rows: 3 },
  { id: 'c2', name: 'Chamber 2', temp: '+2°C to +18°C', cols: 5, rows: 2 },
];

const S = {
  card: {
    background: CARD,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 1px 4px rgba(11,24,41,0.06)',
  },
  lbl: {
    fontSize: 11,
    fontWeight: 700,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: '0.9px',
    marginBottom: 7,
    display: 'block',
  },
  inp: {
    width: '100%',
    background: WHITE,
    border: `1.5px solid ${IBORDER}`,
    borderRadius: 8,
    padding: '11px 13px',
    color: ITEXT,
    fontFamily: "'Inter',sans-serif",
    fontSize: 14,
    outline: 'none',
  },
};

// ── ConversionPanel ───────────────────────────────────────
function ConversionPanel({ qty, unit, onUseBoxes }) {
  const conv = convertUnits(qty, unit);
  const boxCount = Math.round(conv.boxes);
  const rows = [
    { key: 'boxes', label: 'Boxes / Carton', icon: '📦', weight: '25 kg each' },
    { key: 'pallet', label: 'Pallets', icon: '🔲', weight: '750 kg each' },
    { key: 'mt', label: 'Metric Tons', icon: '⚖️', weight: '1,000 kg' },
  ].filter((r) => r.key !== unit);
  return (
    <div
      style={{
        marginTop: 10,
        background: BG,
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: NAVY,
          padding: '9px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: WHITE }}>
          Unit Conversion
        </span>
        <span style={{ fontSize: 11, color: LGRAY }}>
          · {parseFloat(qty) || 0} {UL[unit]}
        </span>
      </div>
      {rows.map((r) => {
        const isPallet = r.key === 'pallet';
        const displayVal = isPallet ? conv.pallet : conv[r.key];
        const wasRounded = isPallet && conv.palletRounded;
        const roundedUp = isPallet && conv.palletRoundedUp;
        return (
          <div
            key={r.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '11px 14px',
              borderBottom: `1px solid ${BORDER}`,
              background: WHITE,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 10, color: LGRAY }}>{r.weight}</div>
                {wasRounded && (
                  <div
                    style={{
                      fontSize: 10,
                      color: roundedUp ? '#C62828' : GRAY,
                      marginTop: 2,
                    }}
                  >
                    raw {fmtNum(conv.palletRaw)} →{' '}
                    {roundedUp ? 'rounded up ↑' : 'rounded down ↓'}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: wasRounded ? (roundedUp ? '#C62828' : GRAY) : NAVY,
                }}
              >
                {isPallet
                  ? Math.round(displayVal).toLocaleString('en-IN')
                  : fmtNum(displayVal)}
              </div>
              <div style={{ fontSize: 10, color: GRAY }}>
                {r.key === 'mt'
                  ? 'metric tons'
                  : r.key === 'pallet'
                  ? 'pallets'
                  : 'boxes'}
              </div>
            </div>
          </div>
        );
      })}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: `${GOLD}12`,
          borderTop: `1px solid ${GOLD}44`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
            Total Weight
          </div>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 15,
            fontWeight: 700,
            color: GOLD2,
          }}
        >
          {fmtNum(conv.kgs)} kg
        </div>
      </div>
      <div
        style={{
          padding: '10px 14px',
          background: WHITE,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <button
          onClick={() => onUseBoxes(conv.boxes)}
          style={{
            width: '100%',
            padding: '10px 0',
            border: `1.5px solid ${NAVY}`,
            borderRadius: 8,
            background: NAVY,
            color: WHITE,
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>📦</span> Apply {boxCount.toLocaleString('en-IN')} boxes to
          Handling In &amp; Out
        </button>
        <div
          style={{
            fontSize: 10,
            color: LGRAY,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          Auto-fills box count in both Handling In and Out · editable after
          applying
        </div>
      </div>
    </div>
  );
}

// ── HandlingSection ───────────────────────────────────────
function HandlingSection({ label, enabled, boxes, rate, lumpSum, onChange }) {
  const isLump = lumpSum !== '' && !isNaN(parseFloat(lumpSum));
  const computed = isLump
    ? parseFloat(lumpSum)
    : (Number(boxes) || 0) * (Number(rate) || 0);
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1.5px solid ${enabled ? IBORDER : BORDER}`,
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          background: enabled ? BG : WHITE,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: enabled ? NAVY : GRAY,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: enabled ? (isLump ? GOLD2 : '#2E7D32') : LGRAY,
              marginTop: 3,
            }}
          >
            {enabled
              ? isLump
                ? `Lump Sum: ${fmt(computed)}`
                : `${Number(boxes) || 0} boxes × ₹${Number(rate) || 0} = ${fmt(
                    computed
                  )}`
              : 'Disabled'}
          </div>
        </div>
        <button
          onClick={() => onChange('enabled', !enabled)}
          style={{
            width: 46,
            height: 26,
            borderRadius: 13,
            border: 'none',
            background: enabled ? GOLD : IBORDER,
            position: 'relative',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              borderRadius: 10,
              background: enabled ? NAVY : WHITE,
              top: 3,
              left: enabled ? 23 : 3,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
      {enabled && (
        <div
          style={{
            padding: 14,
            background: WHITE,
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={S.lbl}>No. of Boxes</span>
              <input
                type="number"
                min={0}
                style={{
                  ...S.inp,
                  borderColor: isLump ? BORDER : IBORDER,
                  color: isLump ? LGRAY : ITEXT,
                }}
                value={boxes}
                onChange={(e) => onChange('boxes', e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={S.lbl}>Rate / Box (₹)</span>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: GRAY,
                    fontSize: 13,
                    pointerEvents: 'none',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  style={{
                    ...S.inp,
                    paddingLeft: 26,
                    borderColor: isLump ? BORDER : IBORDER,
                    color: isLump ? LGRAY : ITEXT,
                  }}
                  value={rate}
                  onChange={(e) => onChange('rate', e.target.value)}
                />
              </div>
            </div>
          </div>
          {!isLump && (
            <div
              style={{
                background: BG,
                borderRadius: 8,
                padding: '9px 13px',
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                border: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: 12, color: GRAY }}>Computed Amount</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  color: NAVY,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {fmt(computed)}
              </span>
            </div>
          )}
          <div>
            <span style={{ ...S.lbl, color: isLump ? GOLD2 : GRAY }}>
              Lump Sum Override{' '}
              <span
                style={{
                  color: LGRAY,
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: 10,
                  marginLeft: 6,
                }}
              >
                (optional)
              </span>
            </span>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isLump ? GOLD2 : GRAY,
                  fontSize: 13,
                  pointerEvents: 'none',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                min={0}
                style={{
                  ...S.inp,
                  paddingLeft: 26,
                  borderColor: isLump ? GOLD : IBORDER,
                  color: ITEXT,
                }}
                value={lumpSum}
                placeholder="Leave blank to use box calculation"
                onChange={(e) => onChange('lumpSum', e.target.value)}
              />
              {isLump && (
                <button
                  onClick={() => onChange('lumpSum', '')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#FFEBEE',
                    border: 'none',
                    borderRadius: 6,
                    color: '#C62828',
                    fontSize: 10,
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {isLump && (
              <div style={{ marginTop: 5, fontSize: 11, color: GOLD2 }}>
                ⚡ Lump sum active — box calc ignored
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('calc');
  const [floor, setFloor] = useState(0);
  const [exp, setExp] = useState(null);
  const [flash, setFlash] = useState(null);
  const [res, setRes] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [spots, setSpots] = useState({});
  const [saveFmt, setSaveFmt] = useState(null); // "pdf"|"png"|"jpg"
  const resultRef = useRef(null);

  const [form, setForm] = useState({
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    product: 'frozen',
    unit: 'boxes',
    qty: '30',
    days: '7',
    disc: 0,
    hInEnabled: true,
    hInBoxes: '30',
    hInRate: String(DEFAULT_RATE),
    hInLumpSum: '',
    hOutEnabled: false,
    hOutBoxes: '30',
    hOutRate: String(DEFAULT_RATE),
    hOutLumpSum: '',
  });

  useEffect(() => {
    try {
      const q = localStorage.getItem('mp:quotes');
      if (q) setQuotes(JSON.parse(q));
      const s = localStorage.getItem('mp:spots');
      if (s) setSpots(JSON.parse(s));
    } catch {}
  }, []);

  const showFlash = (m) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 2400);
  };

  const setField = (k, v) => {
    setForm((f) => {
      const updated = { ...f, [k]: v };
      if (k === 'qty' || k === 'unit') {
        const unit = k === 'unit' ? v : f.unit;
        const qty = k === 'qty' ? v : f.qty;
        const boxes = Math.round(convertUnits(qty, unit).boxes);
        if (!isNaN(boxes) && isFinite(boxes)) {
          updated.hInBoxes = String(boxes);
          updated.hOutBoxes = String(boxes);
        }
      }
      return updated;
    });
  };

  const hChange = (prefix) => (key, val) => {
    const map = {
      enabled: 'Enabled',
      boxes: 'Boxes',
      rate: 'Rate',
      lumpSum: 'LumpSum',
    };
    setForm((f) => ({ ...f, [`${prefix}${map[key]}`]: val }));
  };
  const hInChange = hChange('hIn');
  const hOutChange = hChange('hOut');

  const calcH = (en, boxes, rate, ls) => {
    if (!en) return 0;
    const v = parseFloat(ls);
    return !isNaN(v) && ls !== ''
      ? v
      : (Number(boxes) || 0) * (Number(rate) || 0);
  };

  const calculate = () => {
    const {
      product,
      unit,
      qty,
      days,
      disc,
      hInEnabled,
      hInBoxes,
      hInRate,
      hInLumpSum,
      hOutEnabled,
      hOutBoxes,
      hOutRate,
      hOutLumpSum,
    } = form;
    const effectivePallets = toPallets(qty, unit);
    const rawPallets =
      (parseFloat(qty) || 0) *
      (unit === 'pallet'
        ? 1
        : unit === 'boxes'
        ? KG_PER_BOX / KG_PER_PALLET
        : KG_PER_MT / KG_PER_PALLET);
    const ratePerDay = PALLET_WEEK_RATE[product] / 7;
    const stor = ratePerDay * effectivePallets * (Number(days) || 1);
    const ia = calcH(hInEnabled, hInBoxes, hInRate, hInLumpSum);
    const oa = calcH(hOutEnabled, hOutBoxes, hOutRate, hOutLumpSum);
    const sub = stor + ia + oa;
    const da = (sub * disc) / 100;
    const net = sub - da;
    const gst = net * 0.18;
    const hInIsLump =
      hInEnabled && hInLumpSum !== '' && !isNaN(parseFloat(hInLumpSum));
    const hOutIsLump =
      hOutEnabled && hOutLumpSum !== '' && !isNaN(parseFloat(hOutLumpSum));
    setRes({
      ...form,
      effectivePallets,
      rawPallets,
      ratePerDay,
      stor,
      ia,
      oa,
      sub,
      da,
      net,
      gst,
      grand: net + gst,
      date: today(),
      id: Date.now(),
      hInIsLump,
      hOutIsLump,
    });
  };

  const saveQuote = async () => {
    if (!res) return;
    const nq = [res, ...quotes].slice(0, 50);
    setQuotes(nq);
    try {
      localStorage.setItem('mp:quotes', JSON.stringify(nq));
    } catch {}
    showFlash('Quote saved ✓');
  };

  const toggleSpot = async (k) => {
    const states = ['available', 'occupied', 'reserved'];
    const ns = {
      ...spots,
      [k]: states[(states.indexOf(spots[k] || 'available') + 1) % 3],
    };
    setSpots(ns);
    try {
      localStorage.setItem('mp:spots', JSON.stringify(ns));
    } catch {}
  };

  const spotCounts = () => {
    let t = 0,
      o = 0,
      rv = 0;
    [0, 1].forEach((fl) =>
      CHAMBERS.forEach((ch) => {
        for (let r = 0; r < ch.rows; r++)
          for (let c = 0; c < ch.cols; c++) {
            t++;
            const s = spots[`${fl}:${ch.id}:${r}:${c}`] || 'available';
            if (s === 'occupied') o++;
            else if (s === 'reserved') rv++;
          }
      })
    );
    return { t, o, rv, a: t - o - rv };
  };

  // ── Quote text builder ────────────────────────────────
  const buildQuoteText = (q, fmt2) => {
    const conv = q.unit !== 'pallet' ? ` (${q.effectivePallets} pallets)` : '';
    if (fmt2 === 'whatsapp') {
      return (
        `*MyPallet Cold Storage Quote*\n\n` +
        `Client: ${q.clientName || '—'}\n` +
        (q.clientMobile ? `Mobile: ${q.clientMobile}\n` : '') +
        `Product: ${PL[q.product]}\n` +
        `Quantity: ${q.qty} ${UL[q.unit]}${conv}\n` +
        `Duration: ${q.days} days  |  Date: ${q.date}\n\n` +
        `Storage Charges : ${fmt(q.stor)}\n` +
        (q.hInEnabled ? `Handling In     : ${fmt(q.ia)}\n` : '') +
        (q.hOutEnabled ? `Handling Out    : ${fmt(q.oa)}\n` : '') +
        (q.disc ? `Discount (${q.disc}%) : -${fmt(q.da)}\n` : '') +
        `GST (18%)       : ${fmt(q.gst)}\n` +
        `*Grand Total    : ${fmt(q.grand)}*\n\n` +
        `MyPallet Cold Storages LLP, Balanagar, Hyderabad\n+91 95424 37555`
      );
    }
    return (
      `MyPallet Cold Storage Quote\n${'─'.repeat(34)}\n` +
      `Client   : ${q.clientName || '—'}\n` +
      (q.clientMobile ? `Mobile   : ${q.clientMobile}\n` : '') +
      (q.clientEmail ? `Email    : ${q.clientEmail}\n` : '') +
      `Product  : ${PL[q.product]}\n` +
      `Quantity : ${q.qty} ${UL[q.unit]}${conv}\n` +
      `Duration : ${q.days} days  |  Date: ${q.date}\n` +
      `${'─'.repeat(34)}\n` +
      `Storage Charges : ${fmt(q.stor)}\n` +
      (q.hInEnabled ? `Handling In     : ${fmt(q.ia)}\n` : '') +
      (q.hOutEnabled ? `Handling Out    : ${fmt(q.oa)}\n` : '') +
      (q.disc ? `Discount (${q.disc}%) : -${fmt(q.da)}\n` : '') +
      `GST (18%)       : ${fmt(q.gst)}\n` +
      `${'─'.repeat(34)}\nGRAND TOTAL     : ${fmt(q.grand)}\n${'─'.repeat(
        34
      )}\n` +
      `MyPallet Cold Storages LLP, Balanagar, Hyderabad\n+91 95424 37555  |  info@mypallet.in`
    );
  };

  // ── Print/PDF ─────────────────────────────────────────
  const printQuote = (q) => {
    const conv = q.unit !== 'pallet' ? ` (${q.effectivePallets} pallets)` : '';
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>MyPallet Quote · ${
      q.date
    }</title>
    <style>body{font-family:'Inter',Arial,sans-serif;max-width:640px;margin:48px auto;color:#111;font-size:14px}
    .logo{display:inline-flex;align-items:center;background:#0B1829;border-radius:50px;padding:10px 22px;margin-bottom:24px}
    .logo span{color:#fff;font-weight:700;font-size:18px}.logo em{color:#F5C518;font-style:normal}
    hr{border:none;border-top:1px solid #ddd;margin:20px 0}
    .meta{display:flex;gap:24px;flex-wrap:wrap;font-size:13px;margin-bottom:20px}.meta span{color:#666}
    table{width:100%;border-collapse:collapse}td{padding:9px 4px;border-bottom:1px solid #eee}
    td:last-child{text-align:right}.tot td{font-weight:700;font-size:18px;border-top:2.5px solid #0B1829;border-bottom:none;padding-top:14px}
    .footer{margin-top:40px;font-size:11px;color:#aaa;line-height:1.7}</style></head><body>
    <div class="logo"><span>my<em>pallet</em></span></div>
    <div style="color:#666;font-size:12px">Cold Storages LLP · 36, IDA, Balanagar, Hyderabad</div><hr>
    <div class="meta">
      <div><span>Client</span><br><b>${q.clientName || '—'}</b></div>
      ${
        q.clientMobile
          ? `<div><span>Mobile</span><br><b>${q.clientMobile}</b></div>`
          : ''
      }
      ${
        q.clientEmail
          ? `<div><span>Email</span><br><b>${q.clientEmail}</b></div>`
          : ''
      }
      <div><span>Date</span><br><b>${q.date}</b></div>
      <div><span>Product</span><br><b>${PL[q.product]}</b></div>
      <div><span>Quantity</span><br><b>${q.qty} ${UL[q.unit]}${conv}</b></div>
      <div><span>Duration</span><br><b>${q.days} days</b></div>
    </div><hr>
    <table>
      <tr><td>Storage Charges<br><small style="color:#999">${q.qty} ${
      UL[q.unit]
    }${conv} × ₹${q.ratePerDay.toFixed(2)}/pallet/day × ${
      q.days
    }d</small></td><td>${fmt(q.stor)}</td></tr>
      ${
        q.hInEnabled
          ? `<tr><td>Handling In<br><small style="color:#999">${
              q.hInIsLump
                ? 'Lump Sum'
                : `${q.hInBoxes} boxes × ₹${q.hInRate}/box`
            }</small></td><td>${fmt(q.ia)}</td></tr>`
          : ''
      }
      ${
        q.hOutEnabled
          ? `<tr><td>Handling Out<br><small style="color:#999">${
              q.hOutIsLump
                ? 'Lump Sum'
                : `${q.hOutBoxes} boxes × ₹${q.hOutRate}/box`
            }</small></td><td>${fmt(q.oa)}</td></tr>`
          : ''
      }
      <tr><td>Subtotal</td><td>${fmt(q.sub)}</td></tr>
      ${
        q.disc
          ? `<tr><td>Discount (${q.disc}%)</td><td style="color:#c33">− ${fmt(
              q.da
            )}</td></tr>`
          : ''
      }
      <tr><td>GST @ 18%</td><td>${fmt(q.gst)}</td></tr>
      <tr class="tot"><td>Grand Total (incl. GST)</td><td>${fmt(
        q.grand
      )}</td></tr>
    </table>
    <p class="footer">Indicative quote only. Final rates subject to agreement.<br>MyPallet Cold Storages LLP · 36, IDA, Balanagar, Hyderabad, Telangana 500037<br>+91 95424 37555 · info@mypallet.in</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // ── Build quote as SVG (for PNG/JPG export) ───────────
  const buildQuoteSVG = (q) => {
    const conv = q.unit !== 'pallet' ? ` (${q.effectivePallets} pallets)` : '';
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const W = 640;
    // Build line rows
    const lines = [
      ['Storage Charges', fmt(q.stor)],
      q.hInEnabled && ['Handling In', fmt(q.ia)],
      q.hOutEnabled && ['Handling Out', fmt(q.oa)],
      q.disc && [`Discount (${q.disc}%)`, '−' + fmt(q.da)],
      ['GST (18%)', fmt(q.gst)],
    ].filter(Boolean);

    const metaItems = [
      ['Client', q.clientName || '—'],
      q.clientMobile && ['Mobile', q.clientMobile],
      q.clientEmail && ['Email', q.clientEmail],
    ].filter(Boolean);

    let y = 0;
    const rowH = 38;
    const headerH = 88;
    const totalBoxH = 92;
    const metaH = metaItems.length ? 64 : 0;
    const rowsH = lines.length * rowH + 46; // + grand total row
    const footerH = 60;
    const padTop = 32,
      padBetween = 16;
    const H =
      padTop +
      headerH +
      padBetween +
      totalBoxH +
      padBetween +
      metaH +
      (metaH ? padBetween : 0) +
      rowsH +
      footerH +
      20;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, Arial, sans-serif">`;
    svg += `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`;

    // Header
    y = padTop;
    svg += `<rect x="32" y="${y}" width="${
      W - 64
    }" height="${headerH}" rx="12" fill="#0B1829"/>`;
    svg += `<text x="56" y="${
      y + 38
    }" font-size="24" font-weight="700" fill="#FFFFFF">my<tspan fill="#F5C518">pallet</tspan></text>`;
    svg += `<text x="56" y="${
      y + 58
    }" font-size="10" letter-spacing="2" fill="#B0BEC5">COLD STORAGES LLP</text>`;
    svg += `<text x="${W - 56}" y="${
      y + 34
    }" font-size="12" fill="#B0BEC5" text-anchor="end">Storage Rate Quote</text>`;
    svg += `<text x="${W - 56}" y="${
      y + 54
    }" font-size="12" fill="#B0BEC5" text-anchor="end">${esc(q.date)}</text>`;
    y += headerH + padBetween;

    // Total box
    svg += `<rect x="32" y="${y}" width="${
      W - 64
    }" height="${totalBoxH}" rx="10" fill="#0B1829"/>`;
    svg += `<text x="56" y="${
      y + 26
    }" font-size="10" letter-spacing="1.5" fill="#B0BEC5">GRAND TOTAL</text>`;
    svg += `<text x="56" y="${
      y + 58
    }" font-size="30" font-weight="700" fill="#F5C518">${esc(
      fmt(q.grand)
    )}</text>`;
    svg += `<text x="56" y="${
      y + 76
    }" font-size="11" fill="#3A5070">incl. 18% GST</text>`;
    svg += `<text x="${W - 56}" y="${
      y + 30
    }" font-size="12" fill="#B0BEC5" text-anchor="end">${esc(
      PL[q.product]
    )}</text>`;
    svg += `<text x="${W - 56}" y="${
      y + 50
    }" font-size="12" fill="#B0BEC5" text-anchor="end">${esc(
      q.qty + ' ' + UL[q.unit] + conv
    )}</text>`;
    svg += `<text x="${W - 56}" y="${
      y + 70
    }" font-size="12" fill="#B0BEC5" text-anchor="end">${q.days} days</text>`;
    y += totalBoxH + padBetween;

    // Meta items
    if (metaH) {
      const mW = (W - 64 - (metaItems.length - 1) * 10) / metaItems.length;
      metaItems.forEach((m, i) => {
        const mx = 32 + i * (mW + 10);
        svg += `<rect x="${mx}" y="${y}" width="${mW}" height="${
          metaH - 12
        }" rx="8" fill="#F4F6F9"/>`;
        svg += `<text x="${mx + 14}" y="${
          y + 20
        }" font-size="9" letter-spacing="1" fill="#6B7C93">${esc(
          m[0].toUpperCase()
        )}</text>`;
        svg += `<text x="${mx + 14}" y="${
          y + 38
        }" font-size="12" font-weight="600" fill="#0B1829">${esc(
          m[1].length > 22 ? m[1].slice(0, 21) + '…' : m[1]
        )}</text>`;
      });
      y += metaH + padBetween;
    }

    // Charge rows
    const rowsX = 32,
      rowsW = W - 64;
    svg += `<rect x="${rowsX}" y="${y}" width="${rowsW}" height="${
      lines.length * rowH + 46
    }" rx="10" fill="none" stroke="#D8E0EA"/>`;
    lines.forEach((ln, i) => {
      const ry = y + i * rowH;
      if (i > 0)
        svg += `<line x1="${rowsX}" y1="${ry}" x2="${
          rowsX + rowsW
        }" y2="${ry}" stroke="#D8E0EA"/>`;
      svg += `<text x="${rowsX + 16}" y="${
        ry + 24
      }" font-size="13" fill="#6B7C93">${esc(ln[0])}</text>`;
      const valColor = ln[1].startsWith('−') ? '#C62828' : '#0B1829';
      svg += `<text x="${rowsX + rowsW - 16}" y="${
        ry + 24
      }" font-size="13" font-weight="600" fill="${valColor}" text-anchor="end">${esc(
        ln[1]
      )}</text>`;
    });
    // Grand total row
    const gty = y + lines.length * rowH;
    svg += `<rect x="${rowsX}" y="${gty}" width="${rowsW}" height="46" rx="0" fill="#0B1829"/>`;
    svg += `<rect x="${rowsX}" y="${
      gty + 46 - 10
    }" width="${rowsW}" height="10" fill="#0B1829"/>`;
    svg += `<text x="${rowsX + 16}" y="${
      gty + 30
    }" font-size="13" font-weight="700" fill="#C8D4E0">Grand Total (incl. GST)</text>`;
    svg += `<text x="${rowsX + rowsW - 16}" y="${
      gty + 30
    }" font-size="16" font-weight="700" fill="#F5C518" text-anchor="end">${esc(
      fmt(q.grand)
    )}</text>`;
    y = gty + 46 + 20;

    // Footer
    svg += `<text x="${W / 2}" y="${
      y + 4
    }" font-size="10" fill="#B0BEC5" text-anchor="middle">Indicative quote only · Final rates subject to agreement</text>`;
    svg += `<text x="${W / 2}" y="${
      y + 22
    }" font-size="10" fill="#B0BEC5" text-anchor="middle">MyPallet Cold Storages LLP · Balanagar, Hyderabad · +91 95424 37555</text>`;

    svg += `</svg>`;
    return { svg, W, H };
  };

  // ── Download as PNG / JPG (via SVG → canvas) ──────────
  const downloadImage = (q, format) => {
    if (format === 'pdf') {
      printQuote(q);
      return;
    }
    const { svg, W, H } = buildQuoteSVG(q);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2; // hi-res
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob(
        (b) => {
          if (!b) {
            showFlash('Export failed — try Print/PDF');
            return;
          }
          const dl = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = dl;
          a.download = `mypallet-quote-${(q.clientName || 'client').replace(
            /[^a-z0-9]/gi,
            '-'
          )}-${q.date.replace(/ /g, '-')}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(dl);
          showFlash(`Downloaded as ${format.toUpperCase()} ✓`);
        },
        mime,
        0.95
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showFlash('Export failed — try Print/PDF');
    };
    img.src = url;
  };

  const tabActive = {
    flex: 1,
    padding: '10px 4px',
    border: 'none',
    borderRadius: 8,
    fontFamily: "'Inter',sans-serif",
    fontSize: 12,
    fontWeight: 700,
    background: NAVY,
    color: WHITE,
    cursor: 'pointer',
  };
  const tabInactive = {
    flex: 1,
    padding: '10px 4px',
    border: 'none',
    borderRadius: 8,
    fontFamily: "'Inter',sans-serif",
    fontSize: 12,
    fontWeight: 600,
    background: 'transparent',
    color: GRAY,
    cursor: 'pointer',
  };
  const segBtn = (active) => ({
    flex: 1,
    padding: '10px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    border: `1.5px solid ${active ? NAVY : IBORDER}`,
    background: active ? NAVY : WHITE,
    color: active ? WHITE : NAVY,
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    textAlign: 'center',
  });
  const pillBtn = (active) => ({
    flex: 1,
    padding: '6px 0',
    border: `1.5px solid ${active ? GOLD : IBORDER}`,
    borderRadius: 6,
    background: active ? `${GOLD}18` : WHITE,
    color: active ? GOLD2 : GRAY,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Inter',sans-serif",
    cursor: 'pointer',
  });

  const sc = spotCounts();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${BG};color:${NAVY};font-family:'Inter',sans-serif}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        button{cursor:pointer;font-family:'Inter',sans-serif}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${IBORDER};border-radius:4px}
        input:focus{border-color:${NAVY} !important;box-shadow:0 0 0 3px ${NAVY}18 !important;outline:none}
      `}</style>

      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          minHeight: '100vh',
          background: BG,
          paddingBottom: 60,
        }}
      >
        {flash && (
          <div
            style={{
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: GOLD,
              color: NAVY,
              padding: '9px 24px',
              borderRadius: 50,
              fontWeight: 700,
              fontSize: 13,
              zIndex: 999,
              whiteSpace: 'nowrap',
              boxShadow: `0 4px 20px ${GOLD}66`,
            }}
          >
            {flash}
          </div>
        )}

        {/* Header */}
        <div
          style={{
            background: NAVY,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: NAVY,
                border: `2px solid ${GOLD}55`,
                borderRadius: 50,
                padding: '7px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.25,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 16 }}>
                  my
                </span>
                <span style={{ color: GOLD, fontWeight: 800, fontSize: 16 }}>
                  pallet
                </span>
              </div>
              <div
                style={{
                  color: LGRAY,
                  fontSize: 7,
                  fontWeight: 600,
                  letterSpacing: '1.8px',
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                Cold Storages LLP
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: LGRAY }}>Rate Calculator</div>
              <div style={{ fontSize: 10, color: '#3A5070' }}>
                Balanagar, Hyderabad
              </div>
            </div>
          </div>
          <a
            href="https://wa.me/919542437555"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: GOLD,
              color: NAVY,
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontWeight: 700,
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            Contact Us{' '}
            <span
              style={{
                background: NAVY,
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
              }}
            >
              →
            </span>
          </a>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            margin: '14px 16px 0',
            background: WHITE,
            borderRadius: 10,
            padding: 4,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 1px 4px rgba(11,24,41,0.06)',
          }}
        >
          {[
            ['calc', 'Rate Calc'],
            ['quotes', `Quotes${quotes.length ? ` (${quotes.length})` : ''}`],
            ['layout', 'Layout'],
          ].map(([id, name]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={tab === id ? tabActive : tabInactive}
            >
              {name}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {/* ══════ CALCULATOR ══════ */}
          {tab === 'calc' && (
            <>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: NAVY,
                  marginBottom: 16,
                }}
              >
                Generate Quote
              </div>

              {/* ── Client Master ── */}
              <div style={S.card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${NAVY}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                      Client Master
                    </div>
                    <div style={{ fontSize: 11, color: LGRAY }}>
                      All fields are optional
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={S.lbl}>Client Name</span>
                  <input
                    style={S.inp}
                    placeholder="e.g. ABC Frozen Foods Pvt Ltd"
                    value={form.clientName}
                    onChange={(e) => setField('clientName', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span style={S.lbl}>Mobile Number</span>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: GRAY,
                          fontSize: 12,
                          pointerEvents: 'none',
                        }}
                      >
                        📱
                      </span>
                      <input
                        style={{ ...S.inp, paddingLeft: 32 }}
                        placeholder="+91 98765 43210"
                        value={form.clientMobile}
                        onChange={(e) =>
                          setField('clientMobile', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={S.lbl}>Email ID</span>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: GRAY,
                          fontSize: 12,
                          pointerEvents: 'none',
                        }}
                      >
                        ✉️
                      </span>
                      <input
                        style={{ ...S.inp, paddingLeft: 32 }}
                        placeholder="client@email.com"
                        value={form.clientEmail}
                        onChange={(e) =>
                          setField('clientEmail', e.target.value)
                        }
                        type="email"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage type */}
              <div style={S.card}>
                <span style={S.lbl}>Storage Type</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    ['frozen', '❄  Frozen Storage', '−18°C to 0°C'],
                    ['chilled', '◎  Chilled Storage', '+2°C to +18°C'],
                  ].map(([id, name, t]) => (
                    <button
                      key={id}
                      onClick={() => setField('product', id)}
                      style={{
                        ...segBtn(form.product === id),
                        textAlign: 'left',
                        padding: '10px 10px',
                      }}
                    >
                      <div>{name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: form.product === id ? 0.6 : 0.45,
                          fontWeight: 500,
                          marginTop: 3,
                        }}
                      >
                        {t}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit of Measurement */}
              <div style={S.card}>
                <span style={S.lbl}>Unit of Measurement</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    ['boxes', 'Boxes / Carton'],
                    ['pallet', 'Pallet'],
                    ['mt', 'Metric Ton'],
                  ].map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => setField('unit', id)}
                      style={{
                        ...segBtn(form.unit === id),
                        flex: 1,
                        padding: '9px 6px',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: LGRAY, marginTop: 8 }}>
                  Pallet rate:{' '}
                  <span style={{ color: GRAY, fontWeight: 600 }}>
                    ₹{PALLET_WEEK_RATE[form.product]}/pallet/week
                  </span>
                  <span style={{ color: LGRAY, marginLeft: 6 }}>
                    · ₹{ratePerUnitPerDay(form.product, form.unit).toFixed(2)}
                    /unit/day
                  </span>
                </div>
              </div>

              {/* Qty + Duration + Conversion */}
              <div style={S.card}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={S.lbl}>Quantity</span>
                    <input
                      type="number"
                      style={S.inp}
                      value={form.qty}
                      min={1}
                      onChange={(e) => setField('qty', e.target.value)}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value);
                        setField('qty', String(isNaN(v) || v < 1 ? 1 : v));
                      }}
                      placeholder="Enter qty"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={S.lbl}>Duration (Days)</span>
                    <input
                      type="number"
                      style={S.inp}
                      value={form.days}
                      min={1}
                      onChange={(e) => setField('days', e.target.value)}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value);
                        setField('days', String(isNaN(v) || v < 1 ? 1 : v));
                      }}
                      placeholder="Enter days"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[7, 30, 90, 180].map((d) => (
                    <button
                      key={d}
                      onClick={() => setField('days', String(d))}
                      style={pillBtn(Number(form.days) === d)}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                {(Number(form.qty) || 0) > 0 && (
                  <ConversionPanel
                    qty={form.qty}
                    unit={form.unit}
                    onUseBoxes={(boxCount) => {
                      setForm((f) => ({
                        ...f,
                        hInBoxes: String(Math.round(boxCount)),
                        hOutBoxes: String(Math.round(boxCount)),
                      }));
                      showFlash('Box count applied to Handling ✓');
                    }}
                  />
                )}
              </div>

              {/* Handling */}
              <div style={S.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                    Handling Charges
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: GRAY,
                      background: BG,
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    Default ₹{DEFAULT_RATE}/box
                  </span>
                </div>
                <HandlingSection
                  label="Handling In (Inward)"
                  enabled={form.hInEnabled}
                  boxes={form.hInBoxes}
                  rate={form.hInRate}
                  lumpSum={form.hInLumpSum}
                  onChange={hInChange}
                />
                <HandlingSection
                  label="Handling Out (Outward)"
                  enabled={form.hOutEnabled}
                  boxes={form.hOutBoxes}
                  rate={form.hOutRate}
                  lumpSum={form.hOutLumpSum}
                  onChange={hOutChange}
                />
              </div>

              {/* Discount */}
              <div style={S.card}>
                <span style={S.lbl}>Discount (%)</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    style={{ ...S.inp, width: 88 }}
                    value={form.disc}
                    min={0}
                    max={100}
                    onChange={(e) =>
                      setField(
                        'disc',
                        Math.min(100, Math.max(0, +e.target.value))
                      )
                    }
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 5, 10, 15].map((d) => (
                      <button
                        key={d}
                        onClick={() => setField('disc', d)}
                        style={{
                          padding: '8px 12px',
                          border: `1.5px solid ${
                            form.disc === d ? GOLD : IBORDER
                          }`,
                          borderRadius: 7,
                          background: form.disc === d ? `${GOLD}15` : WHITE,
                          color: form.disc === d ? GOLD2 : GRAY,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={calculate}
                style={{
                  width: '100%',
                  padding: '15px 0',
                  border: 'none',
                  borderRadius: 10,
                  background: GOLD,
                  color: NAVY,
                  fontWeight: 800,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              >
                Calculate Rate →
              </button>

              {/* ── Result ── */}
              {res && (
                <>
                  <div
                    ref={resultRef}
                    style={{
                      background: NAVY,
                      borderRadius: 14,
                      padding: 20,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: LGRAY,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            marginBottom: 4,
                          }}
                        >
                          Grand Total
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 30,
                            fontWeight: 700,
                            color: GOLD,
                            letterSpacing: '-1px',
                          }}
                        >
                          {fmt(res.grand)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#3A5070',
                            marginTop: 3,
                          }}
                        >
                          incl. 18% GST · {res.date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: LGRAY }}>
                          {PL[res.product]}
                        </div>
                        <div style={{ fontSize: 11, color: LGRAY }}>
                          {res.qty} {UL[res.unit]}
                        </div>
                        <div style={{ fontSize: 11, color: LGRAY }}>
                          {res.days} days
                        </div>
                      </div>
                    </div>
                    {[
                      [
                        'Storage Charges',
                        res.stor,
                        false,
                        `${res.qty} ${UL[res.unit]} → ${
                          res.effectivePallets
                        } pallets${
                          res.rawPallets !== res.effectivePallets
                            ? ` (rounded from ${res.rawPallets.toFixed(2)})`
                            : ''
                        } × ₹${res.ratePerDay.toFixed(2)}/day × ${res.days}d`,
                      ],
                      res.hInEnabled && [
                        'Handling In',
                        res.ia,
                        false,
                        res.hInIsLump
                          ? 'Lump Sum'
                          : `${res.hInBoxes} boxes × ₹${res.hInRate}`,
                      ],
                      res.hOutEnabled && [
                        'Handling Out',
                        res.oa,
                        false,
                        res.hOutIsLump
                          ? 'Lump Sum'
                          : `${res.hOutBoxes} boxes × ₹${res.hOutRate}`,
                      ],
                      res.disc && [`Discount (${res.disc}%)`, res.da, true, ''],
                      ['Subtotal', res.net, false, ''],
                      ['GST (18%)', res.gst, false, ''],
                    ]
                      .filter(Boolean)
                      .map(([l, v, neg, note], i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            padding: '7px 0',
                            borderBottom: `1px solid #1E3558`,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, color: '#C8D4E0' }}>
                              {l}
                            </div>
                            {note && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#3A5070',
                                  marginTop: 1,
                                }}
                              >
                                {note}
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              color: neg ? '#F87171' : WHITE,
                              fontSize: 13,
                            }}
                          >
                            {neg ? `−${fmt(v)}` : fmt(v)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* ── Action buttons row ── */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button
                      onClick={saveQuote}
                      style={{
                        flex: 1,
                        padding: '13px 0',
                        border: 'none',
                        borderRadius: 10,
                        background: GOLD,
                        color: NAVY,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={() => printQuote(res)}
                      style={{
                        flex: 1,
                        padding: '13px 0',
                        border: `1.5px solid ${IBORDER}`,
                        borderRadius: 10,
                        background: WHITE,
                        color: NAVY,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      🖨️ Print / PDF
                    </button>
                  </div>

                  {/* ── Share & Download ── */}
                  <div
                    style={{
                      background: WHITE,
                      borderRadius: 12,
                      border: `1px solid ${BORDER}`,
                      overflow: 'hidden',
                      marginBottom: 24,
                    }}
                  >
                    {/* Section header */}
                    <div
                      style={{
                        background: BG,
                        padding: '10px 14px',
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: GRAY,
                          textTransform: 'uppercase',
                          letterSpacing: '0.9px',
                        }}
                      >
                        Share & Download
                      </span>
                    </div>

                    {/* WhatsApp — opens device WA with pre-filled message to client number */}
                    <button
                      onClick={() => {
                        const text = buildQuoteText(res, 'whatsapp');
                        const phone = res.clientMobile
                          ? res.clientMobile.replace(/\D/g, '')
                          : '';
                        const url = phone
                          ? `https://wa.me/${
                              phone.startsWith('91') ? phone : '91' + phone
                            }?text=${encodeURIComponent(text)}`
                          : `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${BORDER}`,
                        background: WHITE,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#E8F8EF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        💬
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 600, color: NAVY }}
                        >
                          WhatsApp
                        </div>
                        <div style={{ fontSize: 11, color: GRAY }}>
                          {res.clientMobile
                            ? `Send directly to ${res.clientMobile}`
                            : 'Open WhatsApp with quote message'}
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: LGRAY,
                          fontSize: 16,
                        }}
                      >
                        →
                      </span>
                    </button>

                    {/* Email — Zoho web compose (opens new tab, works in sandbox) */}
                    <a
                      href={`https://mail.zoho.com/zm/#mail/compose?to=${encodeURIComponent(
                        res.clientEmail || ''
                      )}&subject=${encodeURIComponent(
                        'Storage Rate Quote — MyPallet Cold Storages LLP'
                      )}&body=${encodeURIComponent(
                        buildQuoteText(res, 'email')
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 16px',
                        borderBottom: `1px solid ${BORDER}`,
                        background: WHITE,
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#FFF1E6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        ✉️
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 600, color: NAVY }}
                        >
                          Email via Zoho Mail
                        </div>
                        <div style={{ fontSize: 11, color: GRAY }}>
                          {res.clientEmail
                            ? `Compose to ${res.clientEmail}`
                            : 'Opens Zoho Mail compose with quote'}
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: LGRAY,
                          fontSize: 16,
                        }}
                      >
                        ↗
                      </span>
                    </a>

                    {/* Email — mailto anchor (opens default mail app: real <a> link works in sandbox) */}
                    <a
                      href={`mailto:${encodeURIComponent(
                        res.clientEmail || ''
                      )}?subject=${encodeURIComponent(
                        'Storage Rate Quote — MyPallet Cold Storages LLP'
                      )}&body=${encodeURIComponent(
                        buildQuoteText(res, 'email')
                      )}`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 16px',
                        borderBottom: `1px solid ${BORDER}`,
                        background: WHITE,
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#EEF2FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        📧
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 600, color: NAVY }}
                        >
                          Open in Default Mail App
                        </div>
                        <div style={{ fontSize: 11, color: GRAY }}>
                          Uses your device's default email (Outlook, Apple Mail,
                          etc.)
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: LGRAY,
                          fontSize: 16,
                        }}
                      >
                        →
                      </span>
                    </a>

                    {/* Copy email text fallback */}
                    <button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(buildQuoteText(res, 'email'))
                          .then(() =>
                            showFlash(
                              'Quote text copied — paste into any email ✓'
                            )
                          )
                          .catch(() => showFlash('Copy not supported here'));
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${BORDER}`,
                        background: WHITE,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${NAVY}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        📋
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{ fontSize: 14, fontWeight: 600, color: NAVY }}
                        >
                          Copy Quote Text
                        </div>
                        <div style={{ fontSize: 11, color: GRAY }}>
                          If mail buttons don't open, copy &amp; paste manually
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: LGRAY,
                          fontSize: 16,
                        }}
                      >
                        →
                      </span>
                    </button>

                    {/* Save As — format picker */}
                    <div
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        background: WHITE,
                      }}
                    >
                      <button
                        onClick={() => setSaveFmt((f) => (f ? null : 'pick'))}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '13px 16px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: `${GOLD}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        >
                          ⬇️
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: NAVY,
                            }}
                          >
                            Save As
                          </div>
                          <div style={{ fontSize: 11, color: GRAY }}>
                            Download quote as PDF, PNG or JPG
                          </div>
                        </div>
                        <span
                          style={{
                            marginLeft: 'auto',
                            color: LGRAY,
                            fontSize: 16,
                          }}
                        >
                          {saveFmt ? '↑' : '→'}
                        </span>
                      </button>

                      {/* Format picker */}
                      {saveFmt && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            padding: '0 16px 14px',
                          }}
                        >
                          {[
                            ['pdf', '📄 PDF', 'Best for printing & sharing'],
                            ['png', '🖼️ PNG', 'Transparent background'],
                            ['jpg', '🗃️ JPG', 'Smaller file size'],
                          ].map(([f, label, desc]) => (
                            <button
                              key={f}
                              onClick={() => {
                                downloadImage(res, f);
                                setSaveFmt(null);
                              }}
                              style={{
                                flex: 1,
                                padding: '10px 6px',
                                border: `1.5px solid ${IBORDER}`,
                                borderRadius: 10,
                                background: BG,
                                cursor: 'pointer',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: 18, marginBottom: 4 }}>
                                {label.split(' ')[0]}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: NAVY,
                                }}
                              >
                                {f.toUpperCase()}
                              </div>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: GRAY,
                                  marginTop: 2,
                                }}
                              >
                                {desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════ QUOTES ══════ */}
          {tab === 'quotes' && (
            <>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: NAVY,
                  marginBottom: 16,
                }}
              >
                Saved Quotes
              </div>
              {quotes.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: GRAY,
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  No saved quotes yet.
                  <br />
                  Calculate a rate and save it.
                </div>
              )}
              {quotes.map((q) => (
                <div
                  key={q.id}
                  style={{ ...S.card, cursor: 'pointer' }}
                  onClick={() => setExp(exp === q.id ? null : q.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{ fontWeight: 700, fontSize: 15, color: NAVY }}
                      >
                        {q.clientName || 'Unnamed Client'}
                      </div>
                      {q.clientMobile && (
                        <div style={{ fontSize: 11, color: GRAY }}>
                          {q.clientMobile}
                          {q.clientEmail ? ' · ' + q.clientEmail : ''}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: GRAY,
                          marginTop: 3,
                          lineHeight: 1.7,
                        }}
                      >
                        {PL[q.product]}
                        <br />
                        {q.qty} {UL[q.unit]} · {q.days}d · {q.date}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          color: NAVY,
                          fontSize: 17,
                          fontWeight: 700,
                        }}
                      >
                        {fmt(q.grand)}
                      </div>
                      <div style={{ fontSize: 10, color: GRAY }}>incl. GST</div>
                    </div>
                  </div>
                  {exp === q.id && (
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: `1px solid ${BORDER}`,
                        paddingTop: 12,
                      }}
                    >
                      {[
                        ['Storage', fmt(q.stor)],
                        q.hInEnabled && ['Handling In', fmt(q.ia)],
                        q.hOutEnabled && ['Handling Out', fmt(q.oa)],
                        q.disc && [`Discount (${q.disc}%)`, `−${fmt(q.da)}`],
                        ['GST (18%)', fmt(q.gst)],
                      ]
                        .filter(Boolean)
                        .map(([l, v], i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              padding: '4px 0',
                              color: GRAY,
                              borderBottom: `1px solid ${BORDER}`,
                            }}
                          >
                            <span>{l}</span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                color: NAVY,
                              }}
                            >
                              {v}
                            </span>
                          </div>
                        ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            printQuote(q);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: `1.5px solid ${IBORDER}`,
                            borderRadius: 8,
                            background: WHITE,
                            color: NAVY,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          🖨️ Print/PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = buildQuoteText(q, 'whatsapp');
                            const phone = q.clientMobile
                              ? q.clientMobile.replace(/\D/g, '')
                              : '';
                            window.open(
                              phone
                                ? `https://wa.me/${
                                    phone.startsWith('91')
                                      ? phone
                                      : '91' + phone
                                  }?text=${encodeURIComponent(text)}`
                                : `https://wa.me/?text=${encodeURIComponent(
                                    text
                                  )}`,
                              '_blank'
                            );
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: '1.5px solid #E8F8EF',
                            borderRadius: 8,
                            background: '#E8F8EF',
                            color: '#1A7A45',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          💬 WhatsApp
                        </button>
                        <a
                          href={`https://mail.zoho.com/zm/#mail/compose?to=${encodeURIComponent(
                            q.clientEmail || ''
                          )}&subject=${encodeURIComponent(
                            'Storage Rate Quote — MyPallet'
                          )}&body=${encodeURIComponent(
                            buildQuoteText(q, 'email')
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: '1.5px solid #FFF1E6',
                            borderRadius: 8,
                            background: '#FFF1E6',
                            color: '#B45309',
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                            textAlign: 'center',
                          }}
                        >
                          ✉️ Email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {quotes.length > 0 && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Clear all saved quotes?')) return;
                    setQuotes([]);
                    try {
                      localStorage.removeItem('mp:quotes');
                    } catch {}
                  }}
                  style={{
                    width: '100%',
                    padding: 11,
                    border: '1.5px solid #FFCDD2',
                    borderRadius: 10,
                    background: '#FFF8F8',
                    color: '#C62828',
                    fontSize: 13,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Clear All Quotes
                </button>
              )}
            </>
          )}

          {/* ══════ LAYOUT ══════ */}
          {tab === 'layout' && (
            <>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: NAVY,
                  marginBottom: 16,
                }}
              >
                Storage Layout
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  ['Avail.', sc.a, '#2E7D32'],
                  ['Occ.', sc.o, '#C62828'],
                  ['Res.', sc.rv, GOLD2],
                  ['Total', sc.t, NAVY],
                ].map(([name, val, color]) => (
                  <div
                    key={name}
                    style={{
                      flex: 1,
                      background: WHITE,
                      borderRadius: 10,
                      padding: '10px 6px',
                      textAlign: 'center',
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 22,
                        fontWeight: 700,
                        color,
                      }}
                    >
                      {val}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: GRAY,
                        marginTop: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {name}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {['Floor 1', 'Floor 2'].map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setFloor(i)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      border: `1.5px solid ${floor === i ? NAVY : IBORDER}`,
                      borderRadius: 10,
                      background: floor === i ? NAVY : WHITE,
                      color: floor === i ? WHITE : GRAY,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                {[
                  ['#2E7D32', 'Available'],
                  ['#C62828', 'Occupied'],
                  [GOLD2, 'Reserved'],
                ].map(([c, l]) => (
                  <div
                    key={l}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: GRAY,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: c,
                      }}
                    />
                    {l}
                  </div>
                ))}
              </div>
              {CHAMBERS.map((ch) => {
                const chSpots = [];
                for (let r = 0; r < ch.rows; r++)
                  for (let c = 0; c < ch.cols; c++)
                    chSpots.push({
                      key: `${floor}:${ch.id}:${r}:${c}`,
                      label: `${r + 1}${String.fromCharCode(65 + c)}`,
                    });
                const occ = chSpots.filter(
                  ({ key }) => spots[key] === 'occupied'
                ).length;
                const rsv = chSpots.filter(
                  ({ key }) => spots[key] === 'reserved'
                ).length;
                return (
                  <div key={ch.id} style={{ ...S.card, marginBottom: 14 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: 700, fontSize: 15, color: NAVY }}
                        >
                          {ch.name}
                        </div>
                        <div
                          style={{ fontSize: 11, color: GRAY, marginTop: 2 }}
                        >
                          {ch.temp}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: GRAY }}>
                        <span style={{ color: '#2E7D32' }}>
                          {ch.rows * ch.cols - occ - rsv}
                        </span>{' '}
                        free · <span style={{ color: '#C62828' }}>{occ}</span>{' '}
                        occ
                        {rsv > 0 && (
                          <>
                            {' '}
                            · <span style={{ color: GOLD2 }}>{rsv}</span> res
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${ch.cols},1fr)`,
                        gap: 5,
                      }}
                    >
                      {chSpots.map(({ key, label }) => {
                        const st = spots[key] || 'available';
                        const bg =
                          st === 'available'
                            ? '#E8F5E9'
                            : st === 'occupied'
                            ? '#FFEBEE'
                            : `${GOLD}33`;
                        const tx =
                          st === 'available'
                            ? '#2E7D32'
                            : st === 'occupied'
                            ? '#C62828'
                            : NAVY;
                        const br =
                          st === 'available'
                            ? '#C8E6C9'
                            : st === 'occupied'
                            ? '#FFCDD2'
                            : `${GOLD}55`;
                        return (
                          <button
                            key={key}
                            onClick={() => toggleSpot(key)}
                            style={{
                              height: 40,
                              borderRadius: 7,
                              border: `1px solid ${br}`,
                              background: bg,
                              color: tx,
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            {st === 'available'
                              ? label
                              : st === 'occupied'
                              ? 'OCC'
                              : 'RES'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  fontSize: 11,
                  color: LGRAY,
                  textAlign: 'center',
                  padding: '4px 0 16px',
                  lineHeight: 2,
                }}
              >
                Tap any spot to cycle ·{' '}
                <span style={{ color: '#2E7D32' }}>●</span> Available →{' '}
                <span style={{ color: '#C62828' }}>●</span> Occupied →{' '}
                <span style={{ color: GOLD2 }}>●</span> Reserved
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
