"use client";

import { useEffect, useState } from "react";

const CATEGORIAS = [
  { value: "VACA_MADRE", label: "Vaca Madre", color: "bg-pink-100 text-pink-700" },
  { value: "VAQUILLONA", label: "Vaquillona", color: "bg-purple-100 text-purple-700" },
  { value: "TERNERO", label: "Ternero", color: "bg-blue-100 text-blue-700" },
  { value: "TERNERA", label: "Ternera", color: "bg-cyan-100 text-cyan-700" },
  { value: "TORO", label: "Toro", color: "bg-red-100 text-red-700" },
  { value: "NOVILLO", label: "Novillo", color: "bg-orange-100 text-orange-700" },
];

const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.value, c]));

type Animal = {
  id: string; eid: string; visualTag?: string; sex: string;
  color?: string; breed?: string; categoria?: string; status: string;
  sessionRecords: { weight?: number; pregnant?: boolean }[];
};

type ConteoManual = {
  id: string; categoria: string; cantidad: number; fecha: string; notas?: string;
};

export default function RodeoPage() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [conteos, setConteos] = useState<ConteoManual[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCatModal, setShowCatModal] = useState(false);
  const [showConteoModal, setShowConteoModal] = useState(false);
  const [catFiltro, setCatFiltro] = useState<string>("TODAS");
  const [conteoForm, setConteoForm] = useState({ categoria: "TERNERO", cantidad: "", notas: "", fecha: new Date().toISOString().split("T")[0] });
  const [loading, setLoading] = useState(false);

  async function cargar() {
    const [a, c] = await Promise.all([fetch("/api/animales"), fetch("/api/conteo")]);
    if (a.ok) setAnimales(await a.json());
    if (c.ok) setConteos(await c.json());
  }

  useEffect(() => { cargar(); }, []);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtrados.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtrados.map(a => a.id)));
    }
  }

  async function asignarCategoria(cat: string) {
    setLoading(true);
    await fetch("/api/animales/categoria", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animalIds: Array.from(selected), categoria: cat }),
    });
    setSelected(new Set());
    setShowCatModal(false);
    await cargar();
    setLoading(false);
  }

  async function eliminarAnimal(id: string, eid: string) {
    if (!confirm(`¿Eliminar el animal con caravana ${eid}?\nEsta acción no se puede deshacer.`)) return;
    await fetch(`/api/animales/${id}`, { method: "DELETE" });
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    await cargar();
  }

  async function guardarConteo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/conteo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conteoForm),
    });
    setShowConteoModal(false);
    setConteoForm(f => ({ ...f, cantidad: "", notas: "" }));
    await cargar();
    setLoading(false);
  }

  async function borrarConteo(id: string) {
    await fetch(`/api/conteo?id=${id}`, { method: "DELETE" });
    await cargar();
  }

  const activos = animales.filter(a => a.status === "ACTIVE");
  const filtrados = catFiltro === "TODAS" ? activos : activos.filter(a => a.categoria === catFiltro);

  // Resumen por categoría (animales con caravana)
  const resumenCat = CATEGORIAS.map(cat => ({
    ...cat,
    count: activos.filter(a => a.categoria === cat.value).length,
    conteoManual: conteos.filter(c => c.categoria === cat.value).reduce((s, c) => s + c.cantidad, 0),
  }));
  const sinCategoria = activos.filter(a => !a.categoria).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rodeo</h2>
          <p className="text-gray-500 text-sm mt-0.5">{activos.length} animales con caravana</p>
        </div>
        <button onClick={() => setShowConteoModal(true)}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Conteo manual
        </button>
      </div>

      {/* Resumen por categoría */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {resumenCat.map(cat => (
          <button key={cat.value}
            onClick={() => setCatFiltro(catFiltro === cat.value ? "TODAS" : cat.value)}
            className={`rounded-xl p-3 text-center border transition-all ${catFiltro === cat.value ? "border-green-500 ring-2 ring-green-300" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            <p className="text-xl font-bold text-gray-800">{cat.count + cat.conteoManual}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{cat.label}</p>
            {cat.conteoManual > 0 && (
              <p className="text-xs text-orange-500 mt-0.5">{cat.conteoManual} sin 🏷️</p>
            )}
          </button>
        ))}
      </div>

      {/* Barra de acciones cuando hay selección */}
      {selected.size > 0 && (
        <div className="bg-green-700 text-white rounded-xl px-4 py-3 flex items-center justify-between mb-4">
          <p className="text-sm font-medium">{selected.size} animales seleccionados</p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())}
              className="text-white/70 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-white/10">
              Cancelar
            </button>
            <button onClick={() => setShowCatModal(true)}
              className="bg-white text-green-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-green-50">
              Asignar categoría
            </button>
          </div>
        </div>
      )}

      {/* Filtro activo */}
      {catFiltro !== "TODAS" && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${CAT_MAP[catFiltro]?.color}`}>
            {CAT_MAP[catFiltro]?.label}
          </span>
          <button onClick={() => setCatFiltro("TODAS")} className="text-xs text-gray-400 hover:text-gray-600">
            × Quitar filtro
          </button>
        </div>
      )}

      {/* Tabla animales */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐄</p>
          <p className="font-medium">No hay animales en esta categoría</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox"
                    checked={selected.size === filtrados.length && filtrados.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-green-700" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Caravana</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Visual</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Raza</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Peso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tacto</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(animal => {
                const ultimo = animal.sessionRecords[0];
                const cat = animal.categoria ? CAT_MAP[animal.categoria] : null;
                return (
                  <tr key={animal.id}
                    onClick={() => toggleSelect(animal.id)}
                    className={`cursor-pointer transition-colors ${selected.has(animal.id) ? "bg-green-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(animal.id)} onChange={() => {}} className="accent-green-700" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{animal.eid}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{animal.visualTag ?? "-"}</td>
                    <td className="px-4 py-3">
                      {cat ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{animal.breed ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{ultimo?.weight ? `${ultimo.weight} kg` : "-"}</td>
                    <td className="px-4 py-3">
                      {ultimo?.pregnant === null || ultimo?.pregnant === undefined ? (
                        <span className="text-gray-300">-</span>
                      ) : ultimo.pregnant ? (
                        <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs">Preñada</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">Vacía</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); eliminarAnimal(animal.id, animal.eid); }}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                        title="Eliminar animal"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Conteos manuales */}
      {conteos.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Animales sin caravana (conteo manual)</p>
          <div className="flex flex-col gap-2">
            {conteos.map(c => {
              const cat = CAT_MAP[c.categoria];
              return (
                <div key={c.id} className="bg-white border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cat?.color}`}>{cat?.label}</span>
                  <p className="text-2xl font-bold text-gray-800">{c.cantidad}</p>
                  <div className="flex-1">
                    {c.notas && <p className="text-xs text-gray-400">{c.notas}</p>}
                    <p className="text-xs text-gray-400">{new Date(c.fecha).toLocaleDateString("es-AR")}</p>
                  </div>
                  <button onClick={() => borrarConteo(c.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal asignar categoría */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Asignar categoría</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{selected.size} animales seleccionados</p>
            <div className="flex flex-col gap-2">
              {CATEGORIAS.map(cat => (
                <button key={cat.value} onClick={() => asignarCategoria(cat.value)} disabled={loading}
                  className={`text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors font-medium text-sm ${cat.color}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal conteo manual */}
      {showConteoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <form onSubmit={guardarConteo} className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Conteo manual</h3>
              <button type="button" onClick={() => setShowConteoModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500">Para animales sin caravana todavía</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIAS.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => setConteoForm(f => ({ ...f, categoria: cat.value }))}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${conteoForm.categoria === cat.value ? `${cat.color} border-transparent` : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad</label>
                <input required type="number" min="1" value={conteoForm.cantidad}
                  onChange={e => setConteoForm(f => ({ ...f, cantidad: e.target.value }))}
                  placeholder="Ej: 15"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                <input type="date" value={conteoForm.fecha}
                  onChange={e => setConteoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
              <input type="text" value={conteoForm.notas}
                onChange={e => setConteoForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Ej: Terneros nacidos en abril"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
              {loading ? "Guardando..." : "Guardar conteo"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
