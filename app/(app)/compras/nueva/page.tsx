"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevaCompraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    seller: "",
    cabezas: "",
    pricePerKg: "",
    pricePerHead: "",
    totalAmount: "",
    freightCost: "",
    commission: "",
    notes: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Calcula el total automáticamente si hay precio/kg y cabezas
  function calcTotal() {
    const cabezas = parseInt(form.cabezas) || 0;
    const pxcab = parseFloat(form.pricePerHead) || 0;
    if (cabezas > 0 && pxcab > 0) {
      set("totalAmount", (cabezas * pxcab).toFixed(0));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        animalIds: [],
      }),
    });
    router.push("/compras");
  }

  const flete = parseFloat(form.freightCost) || 0;
  const comision = parseFloat(form.commission) || 0;
  const base = parseFloat(form.totalAmount) || 0;
  const totalNeto = base + flete + comision;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Nueva compra</h2>
        <p className="text-gray-500 text-sm mt-1">Registrá la entrada de animales al campo</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendedor / Procedencia</label>
            <input required type="text" value={form.seller} onChange={e => set("seller", e.target.value)}
              placeholder="Nombre del vendedor o campo"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
            <input required type="date" value={form.date} onChange={e => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad de cabezas</label>
            <input type="number" min="1" value={form.cabezas} onChange={e => set("cabezas", e.target.value)} onBlur={calcTotal}
              placeholder="Ej: 45"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Precio</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Por kilo ($)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerKg} onChange={e => set("pricePerKg", e.target.value)}
                placeholder="Ej: 3200"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Por cabeza ($)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerHead} onChange={e => set("pricePerHead", e.target.value)} onBlur={calcTotal}
                placeholder="Ej: 150000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Costos</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Total base ($)</label>
              <input required type="number" min="0" step="0.01" value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Flete ($)</label>
              <input type="number" min="0" step="0.01" value={form.freightCost} onChange={e => set("freightCost", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Comisión ($)</label>
              <input type="number" min="0" step="0.01" value={form.commission} onChange={e => set("commission", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {totalNeto > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total invertido</span>
            <span className="font-bold text-red-600 text-lg">
              {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalNeto)}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            placeholder="Raza, condición, observaciones..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : "Guardar compra"}
          </button>
        </div>
      </form>
    </div>
  );
}
