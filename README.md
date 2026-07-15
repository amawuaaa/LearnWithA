# LearnWithA

Aplicación educativa con acceso para profesora y estudiantes. Incluye anuncios
en tiempo real, mini-tests, seguimiento de resultados, vocabulario y juegos.

## Configuración inicial

Requisitos: **Node.js 22** (ver `.nvmrc`) y pnpm.

> **Desarrollo local:** no trabajes desde iCloud Drive; provoca hot reload
> inestable. Sigue la guía en [`DEVELOPMENT.md`](DEVELOPMENT.md).

1. Crea un proyecto en Supabase.
2. Abre el editor SQL de Supabase y ejecuta `supabase/schema.sql`.
   Si ya ejecutaste el esquema anteriormente, aplica en orden los archivos
   pendientes según [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md).
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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
GEMINI_API_KEY=tu-clave-de-google-ai-studio
```

En producción, `NEXT_PUBLIC_SITE_URL` debe ser la URL pública de la app
(sin barra final). Ver también [`COSTES.md`](COSTES.md) para una estimación
de hosting y mantenimiento.

6. Instala y arranca la aplicación:

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Recuperación de contraseña

Producción actual: [https://learn-with-a.vercel.app](https://learn-with-a.vercel.app).

Si el correo **sí llega** pero al abrir el enlace **no se puede cambiar** la
contraseña, el fallo casi siempre está en Supabase (Site URL / plantilla).

### Checklist (hazlo en este orden)

1. Abre **Supabase → Authentication → URL Configuration**
   - **Site URL** (obligatorio, sin barra final):

```text
https://learn-with-a.vercel.app
```

   - **Redirect URLs** (una por línea):

```text
http://localhost:3000/auth/callback
http://localhost:3000/actualizar-password
https://learn-with-a.vercel.app/auth/callback
https://learn-with-a.vercel.app/actualizar-password
```

2. **Authentication → Email Templates → Reset Password**  
   Sustituye el enlace por defecto (`{{ .ConfirmationURL }}`) por este
   (usa `token_hash`; no depende del navegador donde pediste el reset):

```html
<h2>Restablecer contraseña</h2>
<p>Pulsa el enlace para elegir una contraseña nueva:</p>
<p>
  <a href="{{ .SiteURL }}/actualizar-password?token_hash={{ .TokenHash }}&type=recovery">
    Cambiar mi contraseña
  </a>
</p>
```

3. En **Vercel → Settings → Environment Variables**, pon:

```text
NEXT_PUBLIC_SITE_URL=https://learn-with-a.vercel.app
```

4. Guarda, espera 1 minuto, pide un **enlace nuevo** (los emails viejos
   siguen apuntando a la URL antigua) y ábrelo en el mismo dispositivo.

## Comprobaciones

```bash
pnpm lint
pnpm test
pnpm build
```
