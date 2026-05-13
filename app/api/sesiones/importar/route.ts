import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

// Detecta el delimitador del CSV (punto y coma o coma)
function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0];
  return firstLine.includes(";") ? ";" : ",";
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const sessionName = formData.get("sessionName") as string;
  const sessionType = (formData.get("sessionType") as string) || "WEIGHING";
  const sessionDate = formData.get("sessionDate") as string;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const text = await file.text();
  let rows: Record<string, string>[];

  try {
    const delimiter = detectDelimiter(text);
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
    });
  } catch {
    return NextResponse.json({ error: "Archivo CSV inválido" }, { status: 400 });
  }

  // Detectar la fecha de la sesión desde el CSV si no se proporcionó
  const fechaCSV = rows[0]?.["Fecha"] ?? null;
  const sessionDateFinal = sessionDate
    ? new Date(sessionDate)
    : fechaCSV
    ? new Date(fechaCSV)
    : new Date();

  const session = await prisma.session.create({
    data: {
      name: sessionName || `Importación ${sessionDateFinal.toLocaleDateString("es-AR")}`,
      type: sessionType as never,
      date: sessionDateFinal,
    },
  });

  let creados = 0;
  let actualizados = 0;
  let registros = 0;

  for (const row of rows) {
    // Columnas formato TruTest DataLink (separador ;, español)
    // IDE = EID electrónico | IDV = caravana visual | Tacto = preñez
    const eid =
      row["IDE"] ?? row["EID"] ?? row["eid"] ?? row["Electronic ID"] ?? row["Tag"] ?? "";

    const visualTag =
      row["IDV"] ?? row["Visual"] ?? row["VisualTag"] ?? null;

    const weight =
      parseFloat(row["Peso"] ?? row["Weight"] ?? row["peso"] ?? row["weight"] ?? "") || null;

    const sex =
      row["Sexo"] ?? row["Sex"] ?? row["sex"] ?? row["sexo"] ?? "";

    const breed =
      row["Raza"] ?? row["Breed"] ?? row["breed"] ?? null;

    const birthDateRaw =
      row["NAC"] ?? row["FechaNac"] ?? row["BirthDate"] ?? null;
    const birthDate =
      birthDateRaw && birthDateRaw.trim() !== "" ? new Date(birthDateRaw) : null;

    // Tacto: "Preniada" / "Vacia" (TruTest) o "yes"/"no" (inglés)
    const tactoRaw = row["Tacto"] ?? row["Pregnant"] ?? row["Preñada"] ?? row["pregnant"] ?? "";
    const pregnant =
      tactoRaw === ""
        ? null
        : ["preniada", "preñada", "yes", "si", "sí", "1", "true", "y"].includes(
            tactoRaw.toLowerCase()
          );

    // Si no hay IDE pero hay IDV, usar IDV como identificador
    const eidClean = eid.trim() || (visualTag?.trim() ? `IDV-${visualTag.trim()}` : "");
    if (!eidClean) continue;

    const wasNew = !(await prisma.animal.findUnique({ where: { eid: eidClean } }));

    const animal = await prisma.animal.upsert({
      where: { eid: eidClean },
      create: {
        eid: eidClean,
        visualTag: visualTag?.trim() || null,
        sex: sex || "N/D",
        breed: breed || null,
        birthDate,
      },
      update: {
        visualTag: visualTag?.trim() || undefined,
        breed: breed || undefined,
        birthDate: birthDate || undefined,
      },
    });

    if (wasNew) creados++;
    else actualizados++;

    await prisma.sessionRecord.create({
      data: {
        sessionId: session.id,
        animalId: animal.id,
        weight,
        pregnant,
      },
    });
    registros++;
  }

  return NextResponse.json({ session, creados, actualizados, registros });
}
