import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const CONFIG = {
  SHEET_ID: "TU_SHEET_ID_ACÁ",
  API_KEY: "TU_API_KEY_ACÁ",
  SHEETS: {
    inquilinos: "INQUILINOS",
    propiedades: "PROPIEDADES",
    pagos: "PAGOS",
    reclamos: "RECLAMOS",
  },
};

// ─── ESTILOS ────────────────────────────────────────────────────────────────
const S = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#0F1923",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#E8EDF2",
    overflow: "hidden",
  },
  sidebar: {
    width: 220,
    background: "#111D2B",
    borderRight: "1px solid #1E2D3D",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  logo: {
    padding: "24px 20px 16px",
    borderBottom: "1px solid #1E2D3D",
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#00C49F",
    letterSpacing: "0.02em",
    margin: 0,
  },
  logoSub: {
    fontSize: 11,
    color: "#4A6480",
    marginTop: 2,
  },
  nav: { padding: "12px 8px", flex: 1 },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 2,
    background: active ? "#1A2D40" : "transparent",
    color: active ? "#00C49F" : "#8AA5BE",
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    border: "none",
    width: "100%",
    textAlign: "left",
    transition: "all 0.15s",
  }),
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: {
    padding: "20px 28px",
    borderBottom: "1px solid #1E2D3D",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0F1923",
  },
  headerTitle: { fontSize: 20, fontWeight: 700, margin: 0, color: "#E8EDF2" },
  syncBtn: {
    background: "#1A2D40",
    border: "1px solid #1E2D3D",
    color: "#00C49F",
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  content: { flex: 1, overflow: "auto", padding: 28 },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },
  kpiCard: (color) => ({
    background: "#111D2B",
    border: `1px solid ${color}30`,
    borderRadius: 12,
    padding: "18px 20px",
    borderTop: `3px solid ${color}`,
  }),
  kpiValue: (color) => ({
    fontSize: 28,
    fontWeight: 700,
    color: color,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  }),
  kpiLabel: { fontSize: 11, color: "#4A6480", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: 11,
    color: "#4A6480",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #1E2D3D",
    fontWeight: 600,
  },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    borderBottom: "1px solid #131F2B",
    color: "#C8D8E8",
  },
  tableWrap: {
    background: "#111D2B",
    border: "1px solid #1E2D3D",
    borderRadius: 12,
    overflow: "hidden",
  },
  badge: (color, bg) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: bg,
  }),
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#4A6480",
  },
  configBox: {
    background: "#111D2B",
    border: "1px solid #1E2D3D",
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
  },
  input: {
    width: "100%",
    background: "#0F1923",
    border: "1px solid #1E2D3D",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#E8EDF2",
    fontSize: 13,
    marginBottom: 12,
    boxSizing: "border-box",
  },
  label: { fontSize: 12, color: "#4A6480", marginBottom: 4, display: "block" },
  saveBtn: {
    background: "#00C49F",
    border: "none",
    color: "#0F1923",
    padding: "9px 20px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#4A6480",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 14,
    marginTop: 0,
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fetchSheet = async (sheetName, sheetId, apiKey) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al leer ${sheetName}`);
  const data = await res.json();
  const [headers, ...rows] = data.values || [];
  return rows.map((row) =>
    Object.fromEntries((headers || []).map((h, i) => [h, row[i] || ""]))
  );
};

const estadoBadge = (estado) => {
  const map = {
    "Al día": ["#00C49F", "#00C49F15"],
    "Pendiente": ["#F6C90E", "#F6C90E15"],
    "Vencido": ["#FF6B6B", "#FF6B6B15"],
    "Pagado": ["#00C49F", "#00C49F15"],
    "Abierto": ["#F6C90E", "#F6C90E15"],
    "En proceso": ["#4A9EFF", "#4A9EFF15"],
    "Resuelto": ["#00C49F", "#00C49F15"],
    "Urgente": ["#FF6B6B", "#FF6B6B15"],
  };
  const [color, bg] = map[estado] || ["#8AA5BE", "#8AA5BE15"];
  return <span style={S.badge(color, bg)}>{estado}</span>;
};

// ─── VIEWS ──────────────────────────────────────────────────────────────────

function DashboardView({ data }) {
  const pagosVencidos = (data.pagos || []).filter(
    (p) => p.ESTADO === "Vencido" || p.ESTADO === "Pendiente"
  ).length;
  const reclamosAbiertos = (data.reclamos || []).filter(
    (r) => r.ESTADO === "Abierto" || r.ESTADO === "Urgente" || r.ESTADO === "En proceso"
  ).length;
  const reclamosUrgentes = (data.reclamos || []).filter((r) => r.ESTADO === "Urgente").length;

  return (
    <>
      <div style={S.kpiGrid}>
        <div style={S.kpiCard("#4A9EFF")}>
          <div style={S.kpiValue("#4A9EFF")}>{(data.inquilinos || []).length}</div>
          <div style={S.kpiLabel}>Inquilinos activos</div>
        </div>
        <div style={S.kpiCard("#00C49F")}>
          <div style={S.kpiValue("#00C49F")}>{(data.propiedades || []).length}</div>
          <div style={S.kpiLabel}>Propiedades</div>
        </div>
        <div style={S.kpiCard(pagosVencidos > 0 ? "#FF6B6B" : "#00C49F")}>
          <div style={S.kpiValue(pagosVencidos > 0 ? "#FF6B6B" : "#00C49F")}>{pagosVencidos}</div>
          <div style={S.kpiLabel}>Pagos pendientes/vencidos</div>
        </div>
        <div style={S.kpiCard(reclamosAbiertos > 0 ? "#F6C90E" : "#00C49F")}>
          <div style={S.kpiValue(reclamosAbiertos > 0 ? "#F6C90E" : "#00C49F")}>{reclamosAbiertos}</div>
          <div style={S.kpiLabel}>Reclamos activos</div>
        </div>
        {reclamosUrgentes > 0 && (
          <div style={S.kpiCard("#FF6B6B")}>
            <div style={S.kpiValue("#FF6B6B")}>{reclamosUrgentes}</div>
            <div style={S.kpiLabel}>🚨 Reclamos urgentes</div>
          </div>
        )}
      </div>

      <p style={S.sectionTitle}>Últimos reclamos</p>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Propiedad", "Inquilino", "Descripción", "Estado", "Fecha"].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.reclamos || []).slice(0, 5).map((r, i) => (
              <tr key={i}>
                <td style={S.td}>{r.PROPIEDAD || r.DIRECCION || "—"}</td>
                <td style={S.td}>{r.INQUILINO || r.NOMBRE || "—"}</td>
                <td style={S.td}>{r.DESCRIPCION || r.RECLAMO || "—"}</td>
                <td style={S.td}>{estadoBadge(r.ESTADO)}</td>
                <td style={S.td}>{r.FECHA || "—"}</td>
              </tr>
            ))}
            {(data.reclamos || []).length === 0 && (
              <tr><td colSpan={5} style={{ ...S.td, ...S.emptyState }}>Sin reclamos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ ...S.sectionTitle, marginTop: 28 }}>Pagos recientes</p>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Inquilino", "Propiedad", "Monto", "Período", "Estado"].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.pagos || []).slice(0, 5).map((p, i) => (
              <tr key={i}>
                <td style={S.td}>{p.INQUILINO || p.NOMBRE || "—"}</td>
                <td style={S.td}>{p.PROPIEDAD || p.DIRECCION || "—"}</td>
                <td style={S.td}>${p.MONTO || "—"}</td>
                <td style={S.td}>{p.PERIODO || p.MES || "—"}</td>
                <td style={S.td}>{estadoBadge(p.ESTADO)}</td>
              </tr>
            ))}
            {(data.pagos || []).length === 0 && (
              <tr><td colSpan={5} style={{ ...S.td, ...S.emptyState }}>Sin pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TableView({ rows, columns }) {
  if (!rows.length) return (
    <div style={S.tableWrap}>
      <div style={S.emptyState}>Sin datos para mostrar</div>
    </div>
  );
  const headers = columns || Object.keys(rows[0]);
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} style={S.td}>
                  {h === "ESTADO" ? estadoBadge(row[h]) : (row[h] || "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigView({ config, onSave }) {
  const [sheetId, setSheetId] = useState(config.sheetId || "");
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  return (
    <div style={S.configBox}>
      <p style={{ ...S.sectionTitle, marginTop: 0 }}>Conexión con Google Sheets</p>
      <label style={S.label}>Sheet ID</label>
      <input style={S.input} value={sheetId} onChange={(e) => setSheetId(e.target.value)}
        placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
      <label style={S.label}>API Key</label>
      <input style={S.input} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
        placeholder="Ej: AIzaSy..." type="password" />
      <br />
      <button style={S.saveBtn} onClick={() => onSave({ sheetId, apiKey })}>
        Guardar y conectar
      </button>
      <p style={{ fontSize: 11, color: "#4A6480", marginTop: 16 }}>
        El Sheet ID está en la URL de tu Google Sheet.<br />
        Las hojas deben llamarse: INQUILINOS, PROPIEDADES, PAGOS, RECLAMOS.
      </p>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "inquilinos", label: "Inquilinos", icon: "👥" },
  { id: "propiedades", label: "Propiedades", icon: "🏠" },
  { id: "pagos", label: "Pagos", icon: "💰" },
  { id: "reclamos", label: "Reclamos", icon: "🔧" },
  { id: "config", label: "Configuración", icon: "⚙️" },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState({ inquilinos: [], propiedades: [], pagos: [], reclamos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [creds, setCreds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("crm_creds") || "{}");
    } catch { return {}; }
  });

  const sync = useCallback(async () => {
    if (!creds.sheetId || !creds.apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const [inquilinos, propiedades, pagos, reclamos] = await Promise.all([
        fetchSheet("INQUILINOS", creds.sheetId, creds.apiKey),
        fetchSheet("PROPIEDADES", creds.sheetId, creds.apiKey),
        fetchSheet("PAGOS", creds.sheetId, creds.apiKey),
        fetchSheet("RECLAMOS", creds.sheetId, creds.apiKey),
      ]);
      setData({ inquilinos, propiedades, pagos, reclamos });
      setLastSync(new Date().toLocaleTimeString("es-AR"));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [creds]);

  useEffect(() => { sync(); }, [sync]);

  const saveCreds = (newCreds) => {
    setCreds(newCreds);
    localStorage.setItem("crm_creds", JSON.stringify(newCreds));
    setView("dashboard");
  };

  const titles = {
    dashboard: "Resumen general",
    inquilinos: "Inquilinos",
    propiedades: "Propiedades",
    pagos: "Pagos",
    reclamos: "Reclamos",
    config: "Configuración",
  };

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <p style={S.logoTitle}>CRM Inquilino</p>
          <p style={S.logoSub}>Gestión de alquileres</p>
        </div>
        <nav style={S.nav}>
          {NAV.map((item) => (
            <button
              key={item.id}
              style={S.navItem(view === item.id)}
              onClick={() => setView(item.id)}
            >
              <span style={S.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {lastSync && (
          <div style={{ padding: "12px 20px", fontSize: 10, color: "#2A4A60", borderTop: "1px solid #1E2D3D" }}>
            Última sync: {lastSync}
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={S.main}>
        <header style={S.header}>
          <h1 style={S.headerTitle}>{titles[view]}</h1>
          <button style={S.syncBtn} onClick={sync} disabled={loading}>
            {loading ? "⏳ Sincronizando..." : "🔄 Sincronizar"}
          </button>
        </header>

        <div style={S.content}>
          {error && (
            <div style={{ background: "#FF6B6B15", border: "1px solid #FF6B6B40", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#FF6B6B", fontSize: 13 }}>
              ⚠️ {error} — Verificá las credenciales en Configuración.
            </div>
          )}
          {!creds.sheetId && view !== "config" && (
            <div style={{ background: "#F6C90E10", border: "1px solid #F6C90E30", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#F6C90E", fontSize: 13 }}>
              ⚙️ Configurá tu Google Sheet antes de continuar.{" "}
              <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setView("config")}>
                Ir a Configuración
              </span>
            </div>
          )}

          {view === "dashboard" && <DashboardView data={data} />}
          {view === "inquilinos" && <TableView rows={data.inquilinos} />}
          {view === "propiedades" && <TableView rows={data.propiedades} />}
          {view === "pagos" && <TableView rows={data.pagos} />}
          {view === "reclamos" && <TableView rows={data.reclamos} />}
          {view === "config" && <ConfigView config={creds} onSave={saveCreds} />}
        </div>
      </main>
    </div>
  );
}
