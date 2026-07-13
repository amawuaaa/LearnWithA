export function obtenerIpRegistro(request) {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) {
    return reenviada.split(",")[0]?.trim() ?? "desconocida";
  }

  return request.headers.get("x-real-ip") ?? "desconocida";
}

export async function consumirCupoRegistro(supabase, ip, email) {
  const { data, error } = await supabase
    .rpc("consumir_cupo_registro", {
      p_ip: ip,
      p_email: email,
    })
    .single();

  if (error || !data) {
    return { error: true, permitido: false };
  }

  return {
    error: false,
    permitido: data.permitido,
  };
}

export function respuestaLimiteRegistro(cupo, NextResponse) {
  if (cupo.error) {
    return NextResponse.json(
      { error: "No se pudo validar el intento de registro." },
      { status: 503 },
    );
  }

  if (!cupo.permitido) {
    return NextResponse.json(
      {
        error:
          "Demasiados intentos de registro. Espera un poco antes de volver a intentarlo.",
      },
      { status: 429 },
    );
  }

  return null;
}
