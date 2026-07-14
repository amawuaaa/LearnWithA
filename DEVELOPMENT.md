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

La CI en GitHub Actions ejecuta las mismas comprobaciones en cada push a `main`.
