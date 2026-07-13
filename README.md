# LearnWithA

Aplicación educativa con acceso para profesora y estudiantes. Incluye anuncios
en tiempo real, mini-tests, seguimiento de resultados, vocabulario y juegos.

## Configuración inicial

Requisitos: Node.js 20 o posterior y pnpm. Se recomienda Node.js 22.

1. Crea un proyecto en Supabase.
2. Abre el editor SQL de Supabase y ejecuta `supabase/schema.sql`.
   Si ya ejecutaste el esquema anteriormente, aplica en orden los archivos
   pendientes de `supabase/migrations/`.
3. Crea las cuentas desde Authentication > Users. Cada cuenta obtiene
   automáticamente un perfil con rol `estudiante`.
4. Convierte la cuenta de la profesora en admin desde el editor SQL:

```sql
update public.usuarios
set rol = 'admin'
where id = (
  select id from auth.users where email = 'profesora@ejemplo.com'
);
```

5. Copia el archivo de variables y añade los datos de API del proyecto:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
GEMINI_API_KEY=tu-clave-de-google-ai-studio
```

6. Instala y arranca la aplicación:

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Recuperación de contraseña

En Supabase, abre Authentication > URL Configuration y añade esta URL a
Redirect URLs:

```text
http://localhost:3000/auth/callback
```

En Authentication > Email Templates > Reset Password, usa un enlace con el
token seguro de Supabase:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/actualizar-password">
  Cambiar mi contraseña
</a>
```

Al desplegar la aplicación, añade también la URL equivalente del dominio de
producción.

## Comprobaciones

```bash
pnpm lint
pnpm build
```
