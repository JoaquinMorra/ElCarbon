"use client";

import { useEffect, useState } from "react";

type Resultado = {
  totalAnimales: number;
  animalesVendidos: number;
  totalInvertidoAnimales: number;
  totalVentasAnimales: number;
  gananciaAnimales: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoGeneral: number;
  porCategoria: Record<string, number>;
  ultimasOperaciones: { tipo: string; fecha: string; descripcion: string; monto: number; cabezas: number }[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function ResultadosPage() {
  const [data, setData] = useState<Resultado | null>(null);

  useEffect(() => {
    fetch("/api/resultados").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-center py-20 text-gray-400">Cargando resultados...</div>;

  const categorias = Object.entries(data.porCategoria).sort((a, b) => b[1] - a[1]);
  const maxCategoria = categorias[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Resultados</h2>
        <p className="text-gray-500 text-sm mt-0.5">Resumen financiero del campo</p>
      </div>

      {/* Saldo general */}
      <div className={`rounded-xl p-5 border ${data.saldoGeneral >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <p className="text-sm text-gray-500 mb-1">Saldo general</p>
        <p className={`text-4xl font-bold ${data.saldoGeneral >= 0 ? "text-green-700" : "text-red-600"}`}>
          {fmt(data.saldoGeneral)}
        </p>
        <p className="text-xs text-gray-400 mt-1">Ingresos totales menos todos los gastos</p>
      </div>

      {/* Cards animales */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Animales</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Rodeo activo</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{data.totalAnimales}</p>
            <p className="text-xs text-gray-400">animales</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Vendidos</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{data.animalesVendidos}</p>
            <p className="text-xs text-gray-400">animales</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-gray-400">Invertido en compras</p>
            <p className="text-xl font-bold text-red-600 mt-1">{fmt(data.totalInvertidoAnimales)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-gray-400">Cobrado en ventas</p>
            <p className="text-xl font-bold text-green-700 mt-1">{fmt(data.totalVentasAnimales)}</p>
          </div>
        </div>
        {data.totalInvertidoAnimales > 0 && (
          <div className={`mt-3 rounded-xl p-4 border ${data.gananciaAnimales >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
            <p className="text-xs text-gray-500">Ganancia neta en animales</p>
            <p className={`text-2xl font-bold mt-1 ${data.gananciaAnimales >= 0 ? "text-blue-700" : "text-orange-600"}`}>
              {fmt(data.gananciaAnimales)}
            </p>
          </div>
        )}
      </div>

      {/* Gastos por categoría */}
      {categorias.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Gastos por categoría</p>
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
            {categorias.map(([cat, monto]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat}</span>
                  <span className="font-medium text-gray-800">{fmt(monto)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${(monto / maxCategoria) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas operaciones */}
      {data.ultimasOperaciones.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Últimas operaciones</p>
          <div className="flex flex-col gap-2">
            {data.ultimasOperaciones.map((op, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`w-1 self-stretch rounded-full ${op.monto >= 0 ? "bg-green-400" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{op.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(op.fecha).toLocaleDateString("es-AR")} · {op.cabezas} cabezas
                  </p>
                </div>
                <p className={`font-bold text-sm shrink-0 ${op.monto >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {op.monto >= 0 ? "+" : ""}{fmt(op.monto)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
