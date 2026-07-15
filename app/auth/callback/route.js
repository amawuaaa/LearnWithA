import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function destinoSeguro(nextParam) {
  if (nextParam?.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return "/";
}

function crearClienteConCookies(request, destino, responseRef) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Hay que escribir las cookies en la Response del redirect;
          // si solo se usan cookies() de next/headers, la sesión se pierde.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          responseRef.current = NextResponse.redirect(destino);
          cookiesToSet.forEach(({ name, value, options }) => {
            responseRef.current.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = destinoSeguro(url.searchParams.get("next"));
  const errorParam = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const destino = new URL(next, url.origin);
  const errorDestino = new URL("/recuperar-password?error=enlace", url.origin);

  if (errorParam || errorCode) {
    return NextResponse.redirect(errorDestino);
  }

  const responseRef = { current: NextResponse.redirect(destino) };

  if (tokenHash && type === "recovery") {
    const supabase = crearClienteConCookies(request, destino, responseRef);
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (!error) {
      return responseRef.current;
    }

    return NextResponse.redirect(errorDestino);
  }

  if (code) {
    const supabase = crearClienteConCookies(request, destino, responseRef);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return responseRef.current;
    }

    return NextResponse.redirect(errorDestino);
  }

  // Sin parámetros de query: posible enlace con tokens en el hash.
  if (next === "/actualizar-password") {
    return NextResponse.redirect(new URL("/actualizar-password", url.origin));
  }

  return NextResponse.redirect(errorDestino);
}
