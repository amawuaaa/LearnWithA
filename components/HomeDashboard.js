import { estilosEstadoMensualidad } from "@/lib/mensualidades";
import Link from "next/link";
import HomeAnnouncements from "./HomeAnnouncements";
import PageHeader from "./ui/PageHeader";
import {
  IconAnuncios,
  IconCalendario,
  IconMemoria,
  IconMensajes,
  IconPerfil,
  IconTests,
  IconVocabulario,
} from "./icons";

const accesos = [
  {
    href: "/calendario",
    etiqueta: "Calendario",
    descripcion: "Consulta los días de clase",
    Icono: IconCalendario,
  },
  {
    href: "/anuncios",
    etiqueta: "Anuncios",
    descripcion: "Novedades y avisos de la clase",
    Icono: IconAnuncios,
  },
  {
    href: "/mensajes",
    etiqueta: "Mensajes",
    descripcion: "Chatea con la profesora",
    Icono: IconMensajes,
  },
  {
    href: "/tests",
    etiqueta: "Tests",
    descripcion: "Practica y comprueba tu progreso",
    Icono: IconTests,
  },
  {
    href: "/vocabulario",
    etiqueta: "Vocabulario",
    descripcion: "Palabras y verbos para repasar",
    Icono: IconVocabulario,
  },
  {
    href: "/memoria",
    etiqueta: "Memoria",
    descripcion: "Pon a prueba tu memoria",
    Icono: IconMemoria,
  },
  {
    href: "/perfil",
    etiqueta: "Mi perfil",
    descripcion: "Tus datos y mensualidades",
    Icono: IconPerfil,
  },
];

function Estadistica({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  );
}

function textoCuentaAtras(diasRestantes) {
  if (diasRestantes === 0) return "¡Hoy tienes clase!";
  if (diasRestantes === 1) return "Mañana tienes clase";
  return `Tu próxima clase es en ${diasRestantes} días`;
}

export default function HomeDashboard({
  nombre,
  esAdmin,
  anuncios,
  estadisticas,
  proximaClase,
}) {
  return (
    <>
      <PageHeader
        etiqueta="Inicio"
        titulo={`Hola, ${nombre}`}
        descripcion="Esto es lo último en tu clase."
        className="mb-8"
      />

      {proximaClase && (
        <Link
          href="/calendario"
          className="mb-8 flex items-center justify-between gap-4 rounded-xl bg-accent px-6 py-5 text-white shadow-sm transition hover:bg-accent-hover"
        >
          <div>
            <p className="text-lg font-semibold">
              {textoCuentaAtras(proximaClase.diasRestantes)}
            </p>
            <p className="mt-1 text-sm capitalize text-teal-100">
              {proximaClase.fechaLabel}
              {proximaClase.horas?.length > 0 && (
                <> · {proximaClase.horas.join(", ")}</>
              )}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-teal-100">
            Ver calendario →
          </span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Últimos anuncios
            </h2>
            <Link
              href="/anuncios"
              className="text-sm font-medium text-accent hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <HomeAnnouncements initialAnuncios={anuncios} />
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resumen</h2>
          <div className="mt-5 space-y-5">
            {esAdmin ? (
              <>
                <Estadistica etiqueta="Estudiantes" valor={estadisticas.estudiantes} />
                <div className="border-t border-slate-100 pt-5">
                  <Estadistica etiqueta="Tests creados" valor={estadisticas.tests} />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <Estadistica
                    etiqueta="Resultados registrados"
                    valor={estadisticas.resultados}
                  />
                </div>
              </>
            ) : (
              <>
                <Estadistica
                  etiqueta="Tests completados"
                  valor={estadisticas.testsCompletados}
                />
                <div className="border-t border-slate-100 pt-5">
                  <Estadistica etiqueta="Tu nivel actual" valor={estadisticas.nivel} />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-sm text-slate-500">Última mensualidad</p>
                  {estadisticas.mensualidad ? (
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstadoMensualidad[estadisticas.mensualidad.estado]}`}
                    >
                      {estadisticas.mensualidad.estado}
                    </span>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Sin mensualidades registradas
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Accesos rápidos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accesos.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted text-accent">
                <acceso.Icono className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold text-slate-900">
                {acceso.etiqueta}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {acceso.descripcion}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
