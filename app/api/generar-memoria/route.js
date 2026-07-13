import { generarJsonConGemini } from "@/lib/gemini";
import { consumirCupoIa, respuestaLimiteIa } from "@/lib/limiteIa";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const NIVELES = new Set(["A1", "A2", "B1", "B2", "C1"]);

const ESQUEMA_JUEGO = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    pares: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          termino: { type: "STRING" },
          pareja: { type: "STRING" },
          emoji: { type: "STRING" },
        },
        required: ["termino", "pareja", "emoji"],
      },
    },
  },
  required: ["titulo", "pares"],
};

function normalizarJuego(juego, cantidad) {
  if (
    !juego ||
    typeof juego.titulo !== "string" ||
    !Array.isArray(juego.pares) ||
    juego.pares.length !== cantidad
  ) {
    return null;
  }

  const pares = juego.pares.map((par) => ({
    termino: typeof par?.termino === "string" ? par.termino.trim() : "",
    pareja: typeof par?.pareja === "string" ? par.pareja.trim() : "",
    emoji: typeof par?.emoji === "string" ? par.emoji.trim() : "",
  }));
  const textos = pares.flatMap((par) => [
    par.termino.toLowerCase(),
    par.pareja.toLowerCase(),
  ]);

  if (
    pares.some((par) => !par.termino || !par.pareja || !par.emoji) ||
    new Set(textos).size !== textos.length
  ) {
    return null;
  }

  const titulo = juego.titulo.trim().slice(0, 120);
  return titulo ? { titulo, pares } : null;
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const tema = typeof cuerpo?.tema === "string" ? cuerpo.tema.trim() : "";
  const nivel = NIVELES.has(cuerpo?.nivel) ? cuerpo.nivel : "A1";
  const cantidad = 8;

  if (!tema) {
    return NextResponse.json(
      { error: "Escribe el tema del juego." },
      { status: 400 },
    );
  }

  const respuestaLimite = respuestaLimiteIa(
    await consumirCupoIa(supabase),
    NextResponse,
  );
  if (respuestaLimite) return respuestaLimite;

  const prompt = `Crea un juego de memoria para estudiantes hispanohablantes que aprenden inglés.
Tema: "${tema}". Nivel CEFR: ${nivel}.
Requisitos:
- Genera exactamente ${cantidad} parejas.
- "termino" debe ser una palabra o expresión en inglés.
- "pareja" debe ser su traducción breve en español.
- "emoji" debe ser un único emoji que represente visualmente el concepto.
- No repitas ningún texto entre las tarjetas.
- El título debe ser breve y estar en español.
- Usa vocabulario apropiado para el nivel ${nivel}.`;

  const resultadoGemini = await generarJsonConGemini({
    prompt,
    responseSchema: ESQUEMA_JUEGO,
  });

  if (resultadoGemini.error === "configuracion") {
    return NextResponse.json(
      { error: "El generador de IA no está configurado." },
      { status: 503 },
    );
  }

  if (resultadoGemini.error) {
    return NextResponse.json(
      { error: "La IA no está disponible. Intenta de nuevo en unos minutos." },
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
  if (!texto) {
    return NextResponse.json(
      { error: "La IA no devolvió contenido. Intenta de nuevo." },
      { status: 502 },
    );
  }

  let juego;
  try {
    juego = normalizarJuego(JSON.parse(texto), cantidad);
  } catch {
    juego = null;
  }

  if (!juego) {
    return NextResponse.json(
      { error: "La IA devolvió un juego incompleto. Intenta de nuevo." },
      { status: 502 },
    );
  }

  return NextResponse.json(juego);
}
