"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = {
  WEIGHING: "Pesada",
  VACCINATION: "Vacunación",
  MOVEMENT: "Movimiento",
  PREG_CHECK: "Control preñez",
  OTHER: "Otro",
};

const TYPE_COLOR: Record<string, string> = {
  WEIGHING: "bg-blue-100 text-blue-700",
  VACCINATION: "bg-yellow-100 text-yellow-700",
  MOVEMENT: "bg-green-100 text-green-700",
  PREG_CHECK: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-600",
};

type Sesion = {
  id: string;
  name: string;
  type: string;
  date: string;
  _count: { records: number };
};

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);

  async function cargar() {
    const res = await fetch("/api/sesiones");
    if (res.ok) setSesiones(await res.json());
  }

  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la sesión "${nombre}"?\n\nSe borrarán todos los registros de esa jornada. Los animales quedan en el rodeo.`)) return;
    await fetch(`/api/sesiones/${id}`, { method: "DELETE" });
    await cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sesiones</h2>
          <p className="text-gray-500 text-sm mt-0.5">Jornadas del bastón TruTest</p>
        </div>
        <Link href="/sesiones/importar"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Importar CSV
        </Link>
      </div>

      {sesiones.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Todavía no hay sesiones cargadas</p>
          <p className="text-sm mt-1">Exportá un CSV desde el portal Datamars e importalo acá</p>
          <Link href="/sesiones/importar"
            className="inline-block mt-4 bg-green-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-800">
            Importar primera sesión
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sesiones.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(s.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${TYPE_COLOR[s.type]}`}>
                  {TYPE_LABEL[s.type]}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">{s._count.records}</p>
                  <p className="text-xs text-gray-400">animales</p>
                </div>
                <button
                  onClick={() => eliminar(s.id, s.name)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none p-1"
                  title="Eliminar sesión"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
