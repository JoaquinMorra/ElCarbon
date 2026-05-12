"use client";

import { useEffect, useState } from "react";

type Animal = { id: string; eid: string; visualTag?: string; sex: string; sessionRecords: { weight?: number }[] };
type Lote = { id: string; name: string; description?: string; animalHistory: { animal: Animal }[] };

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  async function cargar() {
    const res = await fetch("/api/lotes");
    setLotes(await res.json());
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/lotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, description: descripcion }),
    });
    setNombre(""); setDescripcion(""); setShowForm(false);
    await cargar();
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lotes</h2>
          <p className="text-gray-500 text-sm mt-0.5">Potreros y grupos de animales</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Nuevo lote
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Nuevo lote</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del lote</label>
              <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Potrero Norte, Terneros 2024"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (opcional)</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Campo de 50 has, uso invernada"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
              {loading ? "Guardando..." : "Crear lote"}
            </button>
          </form>
        </div>
      )}

      {lotes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-medium">No hay lotes creados todavía</p>
          <p className="text-sm mt-1">Creá un potrero o grupo para organizar tus animales</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lotes.map(lote => {
            const animales = lote.animalHistory.map(h => h.animal);
            const pesoTotal = animales.reduce((s, a) => s + (a.sessionRecords[0]?.weight ?? 0), 0);
            const pesoPromedio = animales.length > 0 ? pesoTotal / animales.length : 0;
            return (
              <div key={lote.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{lote.name}</p>
                    {lote.description && <p className="text-xs text-gray-400 mt-0.5">{lote.description}</p>}
                  </div>
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                    {animales.length} anim.
                  </span>
                </div>
                {pesoPromedio > 0 && (
                  <p className="text-sm text-gray-500">
                    Peso promedio: <span className="font-medium text-gray-700">{pesoPromedio.toFixed(0)} kg</span>
                    {" · "}Total: <span className="font-medium text-gray-700">{pesoTotal.toFixed(0)} kg</span>
                  </p>
                )}
                {animales.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1.5">Animales en este lote:</p>
                    <div className="flex flex-wrap gap-1">
                      {animales.slice(0, 8).map(a => (
                        <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {a.visualTag ?? a.eid.slice(-6)}
                        </span>
                      ))}
                      {animales.length > 8 && (
                        <span className="text-xs text-gray-400">+{animales.length - 8} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
