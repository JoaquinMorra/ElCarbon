"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parse } from "csv-parse/sync";

type Animal = { id: string; eid: string; visualTag?: string; sex: string; status: string; sessionRecords: { weight?: number }[] };

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function detectDelimiter(text: string) {
  return text.split("\n")[0].includes(";") ? ";" : ",";
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState("");
  const [modo, setModo] = useState<"csv" | "manual">("csv");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    buyer: "",
    pricePerKg: "",
    pricePerHead: "",
    totalAmount: "",
    freightCost: "",
    commission: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/animales").then(r => r.json()).then(setAnimales);
  }, []);

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleAnimal(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function procesarCSV(file: File) {
    setCsvError("");
    const text = await file.text();
    let rows: Record<string, string>[];
    try {
      rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, delimiter: detectDelimiter(text), relax_quotes: true, relax_column_count: true });
    } catch {
      setCsvError("No se pudo leer el archivo CSV");
      return;
    }

    const tieneIDE = rows.some(r => r["IDE"] ?? r["EID"] ?? r["eid"] ?? r["Tag"]);
    const tieneIDV = rows.some(r => r["IDV"] ?? r["idv"]);

    if (!tieneIDE && !tieneIDV) {
      setCsvError("No se encontraron caravanas en el archivo");
      return;
    }

    const activos = animales.filter(a => a.status === "ACTIVE");
    let encontrados: Animal[] = [];
    let noEncontrados: string[] = [];

    if (tieneIDE) {
      const eidsCSV = rows.map(r => (r["IDE"] ?? r["EID"] ?? r["eid"] ?? r["Tag"] ?? "").trim()).filter(Boolean);
      encontrados = activos.filter(a => eidsCSV.includes(a.eid));
      noEncontrados = eidsCSV.filter(eid => !activos.find(a => a.eid === eid));
    } else {
      // Buscar por número de caravana visual (IDV)
      const idvsCSV = rows.map(r => (r["IDV"] ?? r["idv"] ?? "").trim()).filter(Boolean);
      encontrados = activos.filter(a => a.visualTag && idvsCSV.includes(a.visualTag));
      noEncontrados = idvsCSV.filter(idv => !activos.find(a => a.visualTag === idv));
    }

    setSelectedIds(new Set(encontrados.map(a => a.id)));

    if (noEncontrados.length > 0) {
      setCsvError(`${encontrados.length} animales cargados. ${noEncontrados.length} no encontrados en el rodeo: ${noEncontrados.slice(0, 3).join(", ")}${noEncontrados.length > 3 ? "..." : ""}`);
    }
  }

  async function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCsvFile(file);
    if (file) await procesarCSV(file);
  }

  function calcTotal() {
    const pxkg = parseFloat(form.pricePerKg);
    if (!pxkg || selectedIds.size === 0) return;
    const totalKg = Array.from(selectedIds).reduce((s: number, id) => {
      const a = animales.find(a => a.id === id);
      return s + (a?.sessionRecords[0]?.weight ?? 0);
    }, 0);
    if (totalKg > 0) set("totalAmount", (totalKg * pxkg).toFixed(0));
  }

  const flete = parseFloat(form.freightCost) || 0;
  const comision = parseFloat(form.commission) || 0;
  const base = parseFloat(form.totalAmount) || 0;
  const totalNeto = base - flete - comision;

  const animalesSeleccionados = animales.filter(a => selectedIds.has(a.id));
  const pesoTotal = animalesSeleccionados.reduce((s: number, a) => s + (a.sessionRecords[0]?.weight ?? 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) return alert("Agregá al menos un animal");
    setLoading(true);
    const weightsBySale: Record<string, number> = {};
    selectedIds.forEach(id => {
      const a = animales.find(a => a.id === id);
      if (a?.sessionRecords[0]?.weight) weightsBySale[id] = a.sessionRecords[0].weight;
    });
    await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, animalIds: Array.from(selectedIds), weightsBySale }),
    });
    router.push("/ventas");
  }

  const activeAnimales = animales.filter(a => a.status === "ACTIVE");

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nueva venta</h2>
        <p className="text-gray-500 text-sm mt-1">Registrá la salida de animales del campo</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">

        {/* Comprador y fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comprador / Remate</label>
            <input required type="text" value={form.buyer} onChange={e => set("buyer", e.target.value)}
              placeholder="Nombre del comprador o consignatario"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
            <input required type="date" value={form.date} onChange={e => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {/* Selector de modo */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">¿Cómo cargás los animales?</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button type="button" onClick={() => { setModo("csv"); setSelectedIds(new Set()); setCsvFile(null); setCsvError(""); }}
              className={`py-3 px-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                modo === "csv" ? "bg-green-700 border-green-700 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              <span className="text-xl">📁</span>
              CSV del bastón
              <span className={`text-xs font-normal ${modo === "csv" ? "text-green-100" : "text-gray-400"}`}>Rápido y sin errores</span>
            </button>
            <button type="button" onClick={() => { setModo("manual"); setSelectedIds(new Set()); setCsvFile(null); setCsvError(""); }}
              className={`py-3 px-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                modo === "manual" ? "bg-green-700 border-green-700 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              <span className="text-xl">✋</span>
              Selección manual
              <span className={`text-xs font-normal ${modo === "manual" ? "text-green-100" : "text-gray-400"}`}>Elegir uno por uno</span>
            </button>
          </div>

          {/* Modo CSV */}
          {modo === "csv" && (
            <div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-green-400 transition-colors">
                <input type="file" accept=".csv" onChange={handleCsvChange} className="hidden" id="csv-venta" />
                <label htmlFor="csv-venta" className="cursor-pointer">
                  {selectedIds.size > 0 ? (
                    <div>
                      <p className="text-3xl mb-1">✅</p>
                      <p className="font-semibold text-green-700">{selectedIds.size} animales cargados</p>
                      <p className="text-xs text-gray-400 mt-0.5">{csvFile?.name} · Tocá para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-1">📁</p>
                      <p className="text-sm text-gray-500">Subí el CSV del bastón con los animales que salen</p>
                      <p className="text-xs text-gray-400 mt-1">El mismo archivo que generó DataLink en la manga</p>
                    </div>
                  )}
                </label>
              </div>
              {csvError && (
                <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${selectedIds.size > 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>
                  {csvError}
                </p>
              )}
            </div>
          )}

          {/* Modo manual */}
          {modo === "manual" && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {activeAnimales.length === 0 ? (
                <p className="text-sm text-gray-400 italic p-4">No hay animales activos en el rodeo</p>
              ) : (
                activeAnimales.map(a => (
                  <label key={a.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleAnimal(a.id)} className="accent-green-700" />
                    <span className="text-xs font-mono text-gray-600 flex-1">{a.eid}</span>
                    {a.visualTag && <span className="text-xs text-gray-400">{a.visualTag}</span>}
                    {a.sessionRecords[0]?.weight && <span className="text-xs text-gray-500">{a.sessionRecords[0].weight} kg</span>}
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Resumen animales seleccionados */}
        {selectedIds.size > 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
            <span className="text-gray-600">{selectedIds.size} animales · {pesoTotal > 0 ? `${pesoTotal.toFixed(0)} kg totales` : "sin peso registrado"}</span>
            {pesoTotal > 0 && <span className="text-gray-400 text-xs">Prom: {(pesoTotal / selectedIds.size).toFixed(0)} kg</span>}
          </div>
        )}

        {/* Precio */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Precio de venta</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Por kilo ($)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerKg}
                onChange={e => set("pricePerKg", e.target.value)} onBlur={calcTotal}
                placeholder="Ej: 3500"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Por cabeza ($)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerHead}
                onChange={e => set("pricePerHead", e.target.value)}
                placeholder="Ej: 200000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {/* Montos */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Montos</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Total bruto ($)</label>
              <input required type="number" min="0" step="0.01" value={form.totalAmount}
                onChange={e => set("totalAmount", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Flete ($)</label>
              <input type="number" min="0" step="0.01" value={form.freightCost}
                onChange={e => set("freightCost", e.target.value)} placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Comisión ($)</label>
              <input type="number" min="0" step="0.01" value={form.commission}
                onChange={e => set("commission", e.target.value)} placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {base > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total neto a cobrar</p>
              {selectedIds.size > 0 && pesoTotal > 0 && base > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  ${(totalNeto / pesoTotal).toFixed(0)}/kg promedio
                </p>
              )}
            </div>
            <span className="font-bold text-green-700 text-xl">{fmt(totalNeto)}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            placeholder="Liquidación, condiciones de pago..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading || selectedIds.size === 0}
            className="flex-1 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : `Guardar venta (${selectedIds.size} animales)`}
          </button>
        </div>
      </form>
    </div>
  );
}
