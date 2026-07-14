# Desarrollo local

## No uses iCloud para el código

El proyecto en `~/Library/Mobile Documents/.../LearnWithA` vive en iCloud Drive. Eso provoca:

- Hot reload lento o inconsistente en Next.js
- Conflictos de sincronización con `node_modules` y `.next`
- Builds que fallan de forma intermitente

**Recomendación:** clona o copia el repositorio a una carpeta local fuera de iCloud.

## Configuración recomendada

```bash
# 1. Carpeta de proyectos (fuera de iCloud)
mkdir -p ~/Projects
cd ~/Projects

# 2. Copiar el proyecto (recomendado si ya lo tienes en iCloud)
mkdir -p ~/Projects
rsync -a --exclude node_modules --exclude .next \
  ~/Library/Mobile\ Documents/com~apple~CloudDocs/LearnWithA/portal-clase/ \
  ~/Projects/learnwitha/

# Alternativa: clonar desde GitHub (solo si ya has hecho push de todo)
# git clone https://github.com/amawuaaa/LearnWithA.git ~/Projects/learnwitha

cd ~/Projects/learnwitha

# 3. Node 22 (ver .nvmrc)
nvm install
nvm use

# 4. Dependencias y entorno
pnpm install
cp .env.local.example .env.local
# Edita .env.local con tus claves de Supabase

# 5. Arrancar
pnpm dev
```

Abre `http://localhost:3000` y trabaja siempre desde `~/Projects/learnwitha`.

## Si ya desarrollabas en iCloud

1. Cierra el servidor de desarrollo en la carpeta de iCloud.
2. Clona como arriba (o mueve la carpeta con `rsync` excluyendo artefactos):

```bash
rsync -a --exclude node_modules --exclude .next \
  ~/Library/Mobile\ Documents/com~apple~CloudDocs/LearnWithA/portal-clase/ \
  ~/Projects/learnwitha/
```

3. En la nueva ubicación: `pnpm install` y `pnpm dev`.
4. Abre esa carpeta en Cursor (`File → Open Folder`).

## Base de datos

- Esquema completo: `supabase/schema.sql`
- Migraciones incrementales: ver `supabase/MIGRATIONS.md`
- Tras clonar, no hace falta volver a crear Supabase; reutiliza las mismas variables en `.env.local`.

## Comprobaciones antes de commit

```bash
pnpm lint
pnpm test
pnpm verify:migrations
pnpm build
```

## Aplicar migración 027 (privacidad de perfiles)

1. Añade `SUPABASE_DB_URL` a `.env.local` (cadena de conexión de Supabase → Settings → Database).
2. Ejecuta:

```bash
pnpm db:migrate:027
pnpm db:verify:migration
```

## Tests E2E (Playwright)

1. Crea `.env.e2e.local` con credenciales de cuentas de prueba:

```env
E2E_STUDENT_EMAIL=alumno@ejemplo.com
E2E_STUDENT_PASSWORD=contraseña-segura
E2E_ADMIN_EMAIL=profesora@ejemplo.com
E2E_ADMIN_PASSWORD=contraseña-segura
# Opcional: prueba el registro completo (¡crea una cuenta real en cada ejecución!)
# E2E_REGISTRATION_CODE=codigo-de-clase
```

2. Instala el navegador y ejecuta:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test:e2e
```

Los tests que necesitan sesión (login, chat, mini-tests, admin) se omiten
automáticamente si faltan las credenciales correspondientes. Los tests de
registro con código inválido y de las rutas de IA no necesitan credenciales.

### Secrets en GitHub Actions (CI completa)

En el repo → **Settings → Secrets and variables → Actions**, añade:

| Secret | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto (igual que en `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon/publica de Supabase |
| `E2E_STUDENT_EMAIL` | Email del alumno de prueba |
| `E2E_STUDENT_PASSWORD` | Contraseña del alumno de prueba |
| `E2E_ADMIN_EMAIL` | Email de la cuenta admin de prueba |
| `E2E_ADMIN_PASSWORD` | Contraseña de la cuenta admin de prueba |

Sin estos secrets, la CI sigue pasando lint/tests/build pero **omite** los E2E
que necesitan sesión. `E2E_REGISTRATION_CODE` no se configura en CI a propósito:
crearía una cuenta nueva en cada ejecución.

La CI en GitHub Actions ejecuta las mismas comprobaciones en cada push a `main`.
