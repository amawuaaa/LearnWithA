export async function consumirCupoIa(supabase) {
  const { data, error } = await supabase
    .rpc("consumir_cupo_ia")
    .single();

  if (error || !data) {
    return { error: true, permitido: false, restantes: 0 };
  }

  return {
    error: false,
    permitido: data.permitido,
    restantes: data.restantes,
  };
}

export function respuestaLimiteIa(cupo, NextResponse) {
  if (cupo.error) {
    return NextResponse.json(
      { error: "No se pudo comprobar el límite de uso de la IA." },
      { status: 503 },
    );
  }

  if (!cupo.permitido) {
    return NextResponse.json(
      {
        error:
          "Has alcanzado el límite de 10 generaciones por hora. Intenta de nuevo más tarde.",
      },
      { status: 429 },
    );
  }

  return null;
}
