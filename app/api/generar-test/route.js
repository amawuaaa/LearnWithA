import { generarJsonConGemini } from "@/lib/gemini";
import { getPerfilActual } from "@/lib/auth";
import { consumirCupoIa, respuestaLimiteIa } from "@/lib/limiteIa";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ESQUEMA_TEST = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    preguntas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          pregunta: { type: "STRING" },
          opciones: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          respuesta_correcta: { type: "STRING" },
        },
        required: ["pregunta", "opciones", "respuesta_correcta"],
      },
    },
  },
  required: ["titulo", "preguntas"],
};

// Normaliza y valida la forma del test devuelto por la IA. Devuelve null si
// no cumple lo que AdminTestForm necesita para guardarlo (opciones distintas,
// respuesta_correcta presente entre ellas, etc.).
function normalizarTest(test) {
  if (
    !test ||
    typeof test.titulo !== "string" ||
    !Array.isArray(test.preguntas) ||
    test.preguntas.length === 0
  ) {
    return null;
  }

  const preguntas = [];
  for (const pregunta of test.preguntas) {
    if (
      !pregunta ||
      typeof pregunta.pregunta !== "string" ||
      !Array.isArray(pregunta.opciones)
    ) {
      return null;
    }

    const opciones = pregunta.opciones
      .filter((opcion) => typeof opcion === "string")
      .map((opcion) => opcion.trim())
      .filter(Boolean);
    const respuestaCorrecta =
      typeof pregunta.respuesta_correcta === "string"
        ? pregunta.respuesta_correcta.trim()
        : "";

    if (
      opciones.length < 2 ||
      new Set(opciones).size !== opciones.length ||
      !opciones.includes(respuestaCorrecta)
    ) {
      return null;
    }

    preguntas.push({
      pregunta: pregunta.pregunta.trim(),
      opciones,
      respuesta_correcta: respuestaCorrecta,
    });
  }

  return { titulo: test.titulo.trim(), preguntas };
}

export async function POST(request) {
  const { user, perfil } = await getPerfilActual();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (perfil.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

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

  const temaLimpio =
    typeof cuerpo?.tema === "string" ? cuerpo.tema.trim() : "";

  if (!temaLimpio) {
    return NextResponse.json(
      { error: "Falta el tema del test." },
      { status: 400 },
    );
  }

  const numPreguntasSolicitado = Number(cuerpo?.numPreguntas);
  const base = Number.isFinite(numPreguntasSolicitado)
    ? numPreguntasSolicitado
    : 5;
  const cantidad = Math.min(Math.max(base, 1), 15);

  const respuestaLimite = respuestaLimiteIa(
    await consumirCupoIa(supabase),
    NextResponse,
  );
  if (respuestaLimite) return respuestaLimite;

  const prompt = `Eres un asistente que ayuda a una profesora a crear mini-tests de opción múltiple para su clase.
Genera un test sobre: "${temaLimpio}".
Requisitos:
- Exactamente ${cantidad} preguntas.
- Cada pregunta debe tener 4 opciones distintas entre sí.
- "respuesta_correcta" debe coincidir textualmente con una de las opciones.
- El título del test debe ser breve y describir el tema.
- Todo el contenido debe estar en español.`;

  const resultadoGemini = await generarJsonConGemini({
    prompt,
    responseSchema: ESQUEMA_TEST,
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
          "La IA no pudo generar contenido para ese tema. Prueba con otro tema o redáctalo de otra forma.",
      },
      { status: 422 },
    );
  }

  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    return NextResponse.json(
      { error: "La IA no devolvió contenido. Intenta de nuevo." },
      { status: 502 },
    );
  }

  let testGenerado;
  try {
    testGenerado = normalizarTest(JSON.parse(texto));
  } catch {
    testGenerado = null;
  }

  if (!testGenerado) {
    return NextResponse.json(
      {
        error:
          "La IA devolvió un test con un formato inesperado. Intenta generar de nuevo.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(testGenerado);
}
