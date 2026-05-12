"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CATEGORIAS_EGRESO = [
  "Semillas", "Agroquímicos", "Fertilizantes", "Combustible",
  "Mano de obra", "Veterinaria", "Flete", "Alquiler de campo",
  "Maquinaria", "Impuestos", "Alimentación animales", "Otro gasto",
];

const CATEGORIAS_INGRESO = [
  "Venta de animales", "Venta de granos", "Venta de forraje",
  "Arriendo", "Subsidio", "Otro ingreso",
];

type Movimiento = {
  id: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  notas?: string;
  adjunto?: string;
  adjuntoNombre?: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtCorto = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function agruparPorMes(movimientos: Movimiento[]) {
  const mapa: Record<string, { mes: string; ingresos: number; egresos: number; items: Movimiento[] }> = {};
  for (const m of movimientos) {
    const d = new Date(m.fecha);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    if (!mapa[key]) mapa[key] = { mes: label, ingresos: 0, egresos: 0, items: [] };
    if (m.tipo === "INGRESO") mapa[key].ingresos += m.monto;
    else mapa[key].egresos += m.monto;
    mapa[key].items.push(m);
  }
  return Object.entries(mapa)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

const TooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/movimientos");
    if (res.ok) setMovimientos(await res.json());
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, categoria, descripcion, monto, fecha, notas }),
    });
    setShowForm(false);
    setDescripcion(""); setMonto(""); setNotas(""); setCategoria("");
    await cargar();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`/api/movimientos?id=${id}`, { method: "DELETE" });
    await cargar();
  }

  async function handleAdjunto(id: string, file: File) {
    setUploadingId(id);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("movimientoId", id);
    await fetch("/api/movimientos/adjunto", { method: "POST", body: fd });
    await cargar();
    setUploadingId(null);
  }

  async function handleRemoveAdjunto(id: string) {
    await fetch(`/api/movimientos/adjunto?id=${id}`, { method: "DELETE" });
    await cargar();
  }

  const totalIngresos = movimientos.filter(m => m.tipo === "INGRESO").reduce((s, m) => s + m.monto, 0);
  const totalEgresos = movimientos.filter(m => m.tipo === "EGRESO").reduce((s, m) => s + m.monto, 0);
  const saldo = totalIngresos - totalEgresos;
  const grupos = agruparPorMes(movimientos);
  const categorias = tipo === "EGRESO" ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Movimientos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Ingresos y gastos del campo</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Nuevo
        </button>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total ingresos</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total gastos</p>
          <p className="text-xl font-bold text-red-500">{fmt(totalEgresos)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${saldo >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs text-gray-400 mb-1">Saldo acumulado</p>
          <p className={`text-xl font-bold ${saldo >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(saldo)}</p>
        </div>
      </div>

      {/* Gráfico */}
      {grupos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Ingresos vs Gastos</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grupos} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCorto} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Movimientos agrupados por mes */}
      {grupos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">No hay movimientos todavía</p>
          <p className="text-sm mt-1">Registrá un ingreso o gasto para empezar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {[...grupos].reverse().map((grupo) => {
            const saldoMes = grupo.ingresos - grupo.egresos;
            return (
              <div key={grupo.mes}>
                {/* Header del mes */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-sm font-semibold text-gray-600">{grupo.mes}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {grupo.ingresos > 0 && <span className="text-green-600">+{fmt(grupo.ingresos)}</span>}
                    {grupo.egresos > 0 && <span className="text-red-500">-{fmt(grupo.egresos)}</span>}
                    <span className={`font-semibold ${saldoMes >= 0 ? "text-green-700" : "text-red-600"}`}>
                      = {fmt(saldoMes)}
                    </span>
                  </div>
                </div>

                {/* Lista de movimientos del mes */}
                <div className="flex flex-col gap-1.5">
                  {[...grupo.items]
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((m) => (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${m.tipo === "INGRESO" ? "bg-green-400" : "bg-red-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800 text-sm truncate">{m.descripcion}</p>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{m.categoria}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(m.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          {m.notas && ` · ${m.notas}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${m.tipo === "INGRESO" ? "text-green-700" : "text-red-500"}`}>
                          {m.tipo === "EGRESO" ? "-" : "+"}{fmt(m.monto)}
                        </p>
                        {m.adjunto ? (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <a href={m.adjunto} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-700 underline truncate max-w-[90px]"
                              title={m.adjuntoNombre ?? "Ver factura"}>
                              📎 {m.adjuntoNombre ?? "Factura"}
                            </a>
                            <button onClick={() => handleRemoveAdjunto(m.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none">
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="mt-1 flex items-center justify-end cursor-pointer">
                            <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                              {uploadingId === m.id ? "Subiendo..." : "📎 Adjuntar"}
                            </span>
                            <input type="file" accept="image/*,application/pdf" className="hidden"
                              disabled={uploadingId === m.id}
                              onChange={e => { if (e.target.files?.[0]) handleAdjunto(m.id, e.target.files[0]); }} />
                          </label>
                        )}
                      </div>
                      <button onClick={() => handleDelete(m.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none ml-1">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nuevo movimiento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <form onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Nuevo movimiento</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["EGRESO", "INGRESO"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => { setTipo(t); setCategoria(""); }}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    tipo === t
                      ? t === "EGRESO" ? "bg-red-500 border-red-500 text-white" : "bg-green-700 border-green-700 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {t === "EGRESO" ? "💸 Gasto" : "💰 Ingreso"}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
              <select required value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Seleccioná una categoría</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <input required type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Semillas de soja lote 3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto ($)</label>
                <input required type="number" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                <input required type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
              {loading ? "Guardando..." : "Guardar movimiento"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
