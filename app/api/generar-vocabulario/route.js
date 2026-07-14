import { generarJsonConGemini } from "@/lib/gemini";
import { requireAdmin } from "@/lib/auth";
import { consumirCupoIa, respuestaLimiteIa } from "@/lib/limiteIa";
import { createClient } from "@/lib/supabase/server";
import { limpiarPalabras, palabrasValidas } from "@/lib/vocabulario";
import { NextResponse } from "next/server";

const NIVELES = new Set(["A1", "A2", "B1", "B2", "C1"]);

const ESQUEMA_LECCION = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    tema: { type: "STRING" },
    descripcion: { type: "STRING" },
    palabras: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          termino: { type: "STRING" },
          significado: { type: "STRING" },
          pronunciacion: { type: "STRING" },
          ejemplo: { type: "STRING" },
        },
        required: ["termino", "significado", "pronunciacion", "ejemplo"],
      },
    },
  },
  required: ["titulo", "tema", "descripcion", "palabras"],
};

function normalizarLeccion(leccion, cantidad) {
  if (
    !leccion ||
    typeof leccion.titulo !== "string" ||
    typeof leccion.tema !== "string" ||
    typeof leccion.descripcion !== "string" ||
    !Array.isArray(leccion.palabras) ||
    leccion.palabras.length !== cantidad
  ) {
    return null;
  }

  const palabras = limpiarPalabras(
    leccion.palabras.map((palabra) => ({
      termino: typeof palabra?.termino === "string" ? palabra.termino : "",
      significado:
        typeof palabra?.significado === "string" ? palabra.significado : "",
      pronunciacion:
        typeof palabra?.pronunciacion === "string"
          ? palabra.pronunciacion
          : "",
      ejemplo: typeof palabra?.ejemplo === "string" ? palabra.ejemplo : "",
    })),
  );

  if (!palabrasValidas(palabras)) return null;

  const resultado = {
    titulo: leccion.titulo.trim().slice(0, 120),
    tema: leccion.tema.trim().slice(0, 80),
    descripcion: leccion.descripcion.trim().slice(0, 500),
    palabras,
  };

  return resultado.titulo && resultado.tema && resultado.descripcion
    ? resultado
    : null;
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = await createClient();

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const tema = typeof cuerpo?.tema === "string" ? cuerpo.tema.trim() : "";
  const nivel = NIVELES.has(cuerpo?.nivel) ? cuerpo.nivel : "A1";
  const cantidadSolicitada = Number(cuerpo?.cantidad);
  const cantidad = Math.min(
    Math.max(
      Number.isFinite(cantidadSolicitada)
        ? Math.trunc(cantidadSolicitada)
        : 8,
      4,
    ),
    20,
  );

  if (!tema) {
    return NextResponse.json(
      { error: "Escribe el tema de la lección." },
      { status: 400 },
    );
  }

  const respuestaLimite = respuestaLimiteIa(
    await consumirCupoIa(supabase),
    NextResponse,
  );
  if (respuestaLimite) return respuestaLimite;

  const prompt = `Eres un asistente para una profesora de inglés que enseña a estudiantes hispanohablantes.
Crea una lección de vocabulario de nivel CEFR ${nivel} sobre: "${tema}".
Requisitos:
- Incluye exactamente ${cantidad} palabras o expresiones en inglés.
- "significado" debe ser una traducción o explicación breve en español.
- "pronunciacion" debe usar IPA o una guía fonética breve y clara.
- "ejemplo" debe ser una oración natural en inglés adecuada al nivel ${nivel}.
- No repitas términos ni significados.
- El título, el tema y la descripción deben estar en español.
- La descripción debe explicar en una o dos frases qué aprenderá el alumno.`;

  const resultadoGemini = await generarJsonConGemini({
    prompt,
    responseSchema: ESQUEMA_LECCION,
  });

  if (resultadoGemini.error === "configuracion") {
    return NextResponse.json(
      { error: "El generador de IA no está configurado." },
      { status: 503 },
    );
  }

  if (resultadoGemini.error) {
    return NextResponse.json(
      {
        error:
          "Los modelos de IA no están disponibles ahora mismo. Intenta de nuevo en unos minutos.",
      },
      { status: 503 },
    );
  }

  const datos = resultadoGemini.datos;
  if (datos.promptFeedback?.blockReason) {
    return NextResponse.json(
      {
        error:
          "La IA no pudo generar contenido para ese tema. Prueba a describirlo de otra forma.",
      },
      { status: 422 },
    );
  }

  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
  let leccion;
  try {
    leccion = normalizarLeccion(JSON.parse(texto), cantidad);
  } catch {
    leccion = null;
  }

  if (!leccion) {
    return NextResponse.json(
      {
        error:
          "La IA devolvió una lección incompleta. Intenta generar de nuevo.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(leccion);
}
