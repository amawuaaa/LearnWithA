const MODELOS_POR_DEFECTO = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
] as const;

const ESTADOS_REINTENTABLES = new Set([404, 429, 500, 502, 503, 504]);

export function obtenerModelosGemini(): string[] {
  const desdeEnv = process.env.GEMINI_MODELS?.trim();
  if (!desdeEnv) {
    return [...MODELOS_POR_DEFECTO];
  }

  const modelos = desdeEnv
    .split(",")
    .map((modelo) => modelo.trim())
    .filter(Boolean);

  return modelos.length > 0 ? modelos : [...MODELOS_POR_DEFECTO];
}

export function debeReintentarModelo(estado: number): boolean {
  return ESTADOS_REINTENTABLES.has(estado);
}

type GenerarJsonParams = {
  prompt: string;
  responseSchema: Record<string, unknown>;
};

type GenerarJsonOk = {
  datos: unknown;
  modelo: string;
};

type GenerarJsonError =
  | { error: "configuracion" }
  | { error: "rechazado"; estado: number }
  | { error: "no_disponible"; estado: number | null };

export type GenerarJsonResult = GenerarJsonOk | GenerarJsonError;

export async function generarJsonConGemini({
  prompt,
  responseSchema,
}: GenerarJsonParams): Promise<GenerarJsonResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "configuracion" };
  }

  const modelos = obtenerModelosGemini();
  let ultimoEstado: number | null = null;

  for (const modelo of modelos) {
    let respuesta: Response;
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

    if (!debeReintentarModelo(respuesta.status)) {
      return { error: "rechazado", estado: respuesta.status };
    }
  }

  return { error: "no_disponible", estado: ultimoEstado };
}
