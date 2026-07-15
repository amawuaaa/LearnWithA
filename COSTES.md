# Costes de hosting y mantenimiento — LearnWithA

Estimación orientativa (julio 2026) para una app de clases particulares con
pocos alumnos. Precios en EUR; pueden variar según región y promociones.

## Qué consume dinero hoy

| Servicio | Rol en la app | Plan típico |
|----------|---------------|-------------|
| **Vercel** | Hosting Next.js + dominio | Hobby (gratis) o Pro |
| **Supabase** | Auth, Postgres, Storage, Realtime | Free o Pro |
| **Google Gemini** | Generar tests / vocabulario / memoria | Pago por uso |
| **Dominio** | URL propia (opcional) | ~10–15 €/año |

No hay Stripe ni pasarela de pago: las mensualidades se registran a mano, así
que **no hay comisiones de cobro online**.

## Escenarios mensuales

### A — Arranque / pocos alumnos (recomendado al empezar)

| Concepto | Coste/mes |
|----------|-----------|
| Vercel Hobby | 0 € |
| Supabase Free | 0 € |
| Gemini (uso ligero, &lt;50 generaciones) | ~0–5 € |
| Dominio (anualizado) | ~1 € |
| **Total** | **~1–6 €** |

Límites a vigilar: cuota free de Supabase (DB, auth, storage) y límites de
Vercel Hobby. La app ya limita la IA a **10 generaciones/hora** por admin.

### B — Producción cómoda (clase activa, backup y margen)

| Concepto | Coste/mes |
|----------|-----------|
| Vercel Pro | ~20 € |
| Supabase Pro | ~25 € |
| Gemini (uso moderado) | ~5–15 € |
| Dominio | ~1 € |
| **Total** | **~50–60 €** |

Útil si quieres backups diarios, más almacenamiento, soporte y menos riesgo
de pausas por límites del plan free.

### C — Crecimiento (más alumnos + más IA)

| Concepto | Coste/mes |
|----------|-----------|
| Vercel Pro | ~20 € |
| Supabase Pro (+ uso extra si aplica) | ~25–40 € |
| Gemini intensivo | ~15–40 € |
| Dominio | ~1 € |
| **Total** | **~60–100 €** |

Si más adelante añades **cobro online (Stripe)**, suma ~1,5 % + 0,25 € por
cobro en Europa (orientativo), aparte de tu cuota de clase.

## Mantenimiento (tiempo, no solo €)

| Tarea | Frecuencia | Esfuerzo |
|-------|------------|----------|
| Revisar mensualidades / marcar pagadas | Mensual | 15–30 min |
| Aplicar migraciones SQL tras desplegar | Cuando haya cambios | 10–20 min |
| Revisar emails Auth (recuperar contraseña) | Tras cambiar dominio | 15 min |
| Actualizar dependencias (`pnpm`) | Trimestral | 30–60 min |
| Supervisar uso Gemini / cuotas Supabase | Mensual | 10 min |

Si externalizas mantenimiento técnico puntual: suele cotizarse por horas
(orientativo 40–80 €/h según país). Con el stack actual, el día a día lo
puede llevar la profesora sin desarrollador, salvo cambios de producto.

## Cómo reducir coste

1. Quédate en **Free** mientras quepan alumnos y almacenamiento.
2. Usa la IA con moderación (el límite de 10/hora ya ayuda).
3. Define `NEXT_PUBLIC_SITE_URL` y la plantilla de email en Supabase para
   evitar soporte por “olvidé la contraseña”.
4. No actives Stripe hasta que el registro manual te quite demasiado tiempo.

## Revisión

Revisa este presupuesto cuando:

- Superéis ~50 alumnos activos, o
- El free tier de Supabase/Vercel avise de límites, o
- La factura de Gemini suba de forma sostenida.
