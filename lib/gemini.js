const MODELOS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
];

const ESTADOS_REINTENTABLES = new Set([429, 500, 502, 503, 504]);

export async function generarJsonConGemini({ prompt, responseSchema }) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "configuracion" };
  }

  let ultimoEstado = null;

  for (const modelo of MODELOS) {
    let respuesta;
    try {
      respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );
    } catch {
      ultimoEstado = 502;
      continue;
    }

    if (respuesta.ok) {
      return { datos: await respuesta.json(), modelo };
    }

    ultimoEstado = respuesta.status;
    let detalle = "";
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo?.error?.message ?? "";
    } catch {
      detalle = "";
    }

    console.error("Error de Gemini", {
      modelo,
      estado: respuesta.status,
      detalle,
    });

    if (!ESTADOS_REINTENTABLES.has(respuesta.status)) {
      return { error: "rechazado", estado: respuesta.status };
    }
  }

  return { error: "no_disponible", estado: ultimoEstado };
}
