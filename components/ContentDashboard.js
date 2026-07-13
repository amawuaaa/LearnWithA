"use client";

import { nivelBadgeClase, nivelDesbloqueado } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminContentForm from "./AdminContentForm";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";

const textos = {
  juego: {
    sobreTitulo: "Aprender jugando",
    titulo: "Juegos",
    descripcion: "Actividades externas para practicar de forma divertida.",
    boton: "Añadir juego",
  },
  vocabulario: {
    sobreTitulo: "Material de estudio",
    titulo: "Vocabulario",
    descripcion: "Palabras y verbos para repasar en cualquier momento.",
    boton: "Añadir contenido",
  },
};

export default function ContentDashboard({
  contenidos,
  tipoPagina,
  esAdmin,
  nivelUsuario,
  embebido = false,
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");
  const texto = textos[tipoPagina];

  function abrir(contenido = null) {
    setEditando(contenido);
    setModalAbierto(true);
  }

  async function confirmarBorrado() {
    setEliminando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("contenido_didactico")
      .delete()
      .eq("id", borrando.id);
    setEliminando(false);

    if (error) {
      setErrorBorrado("No se pudo eliminar el contenido.");
      return;
    }
    setBorrando(null);
    router.refresh();
  }

  function guardado() {
    setModalAbierto(false);
    router.refresh();
  }

  return (
    <>
      <div
        className={`mb-8 flex items-start justify-between gap-4 ${
          embebido ? "mt-12 border-t border-slate-200 pt-10" : ""
        }`}
      >
        <div>
          {!embebido && (
            <p className="text-sm font-medium text-accent">
              {texto.sobreTitulo}
            </p>
          )}
          {embebido ? (
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Material adicional
            </h2>
          ) : (
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              {texto.titulo}
            </h1>
          )}
          <p className="mt-2 text-slate-500">
            {embebido
              ? "Apuntes y listas breves para complementar las lecciones."
              : texto.descripcion}
          </p>
        </div>
        {esAdmin && (
          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            type="button"
            onClick={() => abrir()}
          >
            {texto.boton}
          </button>
        )}
      </div>

      {contenidos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Todavía no hay contenido en esta sección.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contenidos.map((contenido) => {
            const bloqueado =
              !esAdmin && !nivelDesbloqueado(contenido.nivel, nivelUsuario);

            if (bloqueado) {
              return (
                <article
                  key={contenido.id}
                  className="flex flex-col items-start rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <span className={nivelBadgeClase(contenido.nivel)}>
                      Nivel {contenido.nivel}
                    </span>
                    <span aria-hidden="true" className="text-2xl">
                      🔒
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-500">
                    {contenido.titulo}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Se desbloquea al alcanzar el nivel {contenido.nivel}.
                  </p>
                </article>
              );
            }

            return (
              <article
                key={contenido.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {tipoPagina === "vocabulario" && (
                    <span className="w-fit rounded-full bg-accent-muted px-2.5 py-1 text-xs font-medium capitalize text-teal-700">
                      {contenido.tipo}
                    </span>
                  )}
                  {contenido.nivel && (
                    <span className={nivelBadgeClase(contenido.nivel)}>
                      Nivel {contenido.nivel}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {contenido.titulo}
                </h2>
                <p className="mt-2 flex-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {contenido.descripcion}
                </p>

                {contenido.tipo === "juego" && contenido.url && (
                  <a
                    className="mt-5 w-fit text-sm font-semibold text-accent hover:underline"
                    href={contenido.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir juego ↗
                  </a>
                )}

                {esAdmin && (
                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                    <button
                      className="text-sm font-medium text-accent hover:underline"
                      type="button"
                      onClick={() => abrir(contenido)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-sm font-medium text-red-600 hover:underline"
                      type="button"
                      onClick={() => {
                        setErrorBorrado("");
                        setBorrando(contenido);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        titulo={
          editando
            ? "Editar contenido"
            : tipoPagina === "juego"
              ? "Añadir juego"
              : "Añadir vocabulario"
        }
        onClose={() => setModalAbierto(false)}
      >
        <AdminContentForm
          key={editando?.id ?? "nuevo"}
          contenido={editando}
          tipoInicial={tipoPagina}
          permitirVerbos={tipoPagina === "vocabulario"}
          onSaved={guardado}
        />
      </Modal>

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar contenido"
        mensaje={`¿Eliminar "${borrando?.titulo}"? Esta acción no se puede deshacer.`}
        cargando={eliminando}
        error={errorBorrado}
        onConfirm={confirmarBorrado}
        onCancel={() => setBorrando(null)}
      />
    </>
  );
}
