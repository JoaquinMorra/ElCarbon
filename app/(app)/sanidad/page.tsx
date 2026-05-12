"use client";

import { useEffect, useState } from "react";

type Animal = { id: string; eid: string; visualTag?: string };
type Registro = { id: string; type: string; product: string; dose?: string; date: string; notes?: string; animal: Animal };

const TIPOS = ["Vacuna", "Antiparasitario", "Antibiótico", "Vitamina", "Desparasitante", "Otro"];

export default function SanidadPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    type: "Vacuna",
    product: "",
    dose: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  async function cargar() {
    const [r, a] = await Promise.all([fetch("/api/sanidad"), fetch("/api/animales")]);
    setRegistros(await r.json());
    setAnimales(await a.json());
  }

  useEffect(() => { cargar(); }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function toggleAnimal(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/sanidad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, animalIds: Array.from(selectedIds) }),
    });
    setShowForm(false);
    setSelectedIds(new Set());
    setForm(f => ({ ...f, product: "", dose: "", notes: "" }));
    await cargar();
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sanidad</h2>
          <p className="text-gray-500 text-sm mt-0.5">Vacunas y tratamientos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Registrar
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Nuevo tratamiento</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                <select value={form.type} onChange={e => set("type", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                <input required type="date" value={form.date} onChange={e => set("date", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Producto</label>
              <input required type="text" value={form.product} onChange={e => set("product", e.target.value)}
                placeholder="Ej: Ivermectina, Clostridial 8"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dosis (opcional)</label>
              <input type="text" value={form.dose} onChange={e => set("dose", e.target.value)}
                placeholder="Ej: 1ml/50kg"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animales tratados
                {selectedIds.size > 0 && <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{selectedIds.size} seleccionados</span>}
              </label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setSelectedIds(new Set(animales.map(a => a.id)))}
                  className="text-xs text-green-700 underline">Todos</button>
                <button type="button" onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-400 underline">Ninguno</button>
              </div>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {animales.map(a => (
                  <label key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleAnimal(a.id)} className="accent-green-700" />
                    <span className="text-xs font-mono text-gray-600 flex-1">{a.eid}</span>
                    {a.visualTag && <span className="text-xs text-gray-400">{a.visualTag}</span>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>

            <button type="submit" disabled={loading || selectedIds.size === 0}
              className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
              {loading ? "Guardando..." : `Guardar para ${selectedIds.size} animales`}
            </button>
          </form>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">💉</p>
          <p className="font-medium">No hay registros de sanidad todavía</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {registros.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-base shrink-0">💉</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 text-sm">{r.product}</p>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">{r.type}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.animal.visualTag ?? r.animal.eid} · {new Date(r.date).toLocaleDateString("es-AR")}
                  {r.dose && ` · ${r.dose}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
