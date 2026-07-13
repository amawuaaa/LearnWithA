import {
  consumirCupoRegistro,
  obtenerIpRegistro,
  respuestaLimiteRegistro,
} from "@/lib/limiteRegistro";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const nombre =
    typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim() : "";
  const email = typeof cuerpo?.email === "string" ? cuerpo.email.trim() : "";
  const password =
    typeof cuerpo?.password === "string" ? cuerpo.password : "";
  const codigo =
    typeof cuerpo?.codigo === "string" ? cuerpo.codigo.trim() : "";

  if (!nombre || nombre.length > 100 || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Revisa el nombre, el email y la contraseña." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const respuestaLimite = respuestaLimiteRegistro(
    await consumirCupoRegistro(supabase, obtenerIpRegistro(request), email),
    NextResponse,
  );
  if (respuestaLimite) return respuestaLimite;

  const { data: codigoValido, error: codigoError } = await supabase.rpc(
    "codigo_registro_valido",
    { p_codigo: codigo },
  );

  if (codigoError) {
    return NextResponse.json(
      { error: "No se pudo validar el código de clase." },
      { status: 503 },
    );
  }

  if (!codigoValido) {
    return NextResponse.json(
      { error: "El código de clase no es correcto." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear la cuenta. Revisa los datos." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    sesionCreada: Boolean(data.session),
    necesitaConfirmacion: !data.session,
  });
}
