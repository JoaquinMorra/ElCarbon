"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "WEIGHING", label: "Pesada" },
  { value: "VACCINATION", label: "Vacunación" },
  { value: "MOVEMENT", label: "Movimiento" },
  { value: "PREG_CHECK", label: "Control preñez" },
  { value: "OTHER", label: "Otro" },
];

export default function ImportarSesionPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("WEIGHING");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number; registros: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("sessionName", nombre);
    fd.append("sessionType", tipo);
    fd.append("sessionDate", fecha);

    const res = await fetch("/api/sesiones/importar", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al importar");
    } else {
      setResultado(data);
    }
    setLoading(false);
  }

  if (resultado) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h3 className="text-xl font-bold text-gray-800 mb-4">¡Sesión importada!</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">{resultado.registros}</p>
              <p className="text-xs text-gray-500">registros</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-700">{resultado.creados}</p>
              <p className="text-xs text-gray-500">animales nuevos</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-700">{resultado.actualizados}</p>
              <p className="text-xs text-gray-500">actualizados</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setResultado(null)}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Importar otra
            </button>
            <button
              onClick={() => router.push("/sesiones")}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
            >
              Ver sesiones
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Importar sesión</h2>
        <p className="text-gray-500 text-sm mt-1">
          Exportá el CSV desde el portal Datamars y subilo acá
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la sesión</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Vacunación terneros mayo"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Archivo CSV de Datamars</label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="cursor-pointer">
              {file ? (
                <div>
                  <p className="text-green-700 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 text-sm">Hacé click para seleccionar el archivo</p>
                  <p className="text-gray-300 text-xs mt-1">Solo archivos .csv</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={!file || loading}
          className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Importando..." : "Importar sesión"}
        </button>
      </form>
    </div>
  );
}
