"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";
import ChatAttachment from "./ChatAttachment";
import ConfirmDialog from "./ConfirmDialog";

const MAX_ARCHIVOS = 5;
const MAX_TAMANO = 10 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function nombreSeguro(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-120);
}

function ordenarMensajes(mensajes) {
  return [...mensajes].sort(
    (a, b) => new Date(a.creado_en) - new Date(b.creado_en),
  );
}

function IconVolver({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export default function ChatDashboard({
  esAdmin,
  usuario,
  estudiantes,
  initialMessages,
  initialHasMore = false,
}) {
  const [mensajes, setMensajes] = useState(initialMessages);
  const [listaEstudiantes, setListaEstudiantes] = useState(estudiantes);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(
    esAdmin ? estudiantes[0]?.id ?? null : usuario.id,
  );
  const [hayMasMensajes, setHayMasMensajes] = useState(initialHasMore);
  const [cargandoConversacion, setCargandoConversacion] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [contenido, setContenido] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [borrando, setBorrando] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [vistaMovil, setVistaMovil] = useState("lista");
  const finalRef = useRef(null);
  const archivoInputRef = useRef(null);
  const cargaConversacionRef = useRef(0);

  const conversaciones = useMemo(() => {
    if (!esAdmin) return [];

    return listaEstudiantes
      .map((estudiante) => {
        const suyos = mensajes.filter(
          (mensaje) => mensaje.estudiante_id === estudiante.id,
        );
        const esActiva = estudiante.id === estudianteSeleccionado;
        const ultimo = esActiva
          ? suyos.at(-1) ?? estudiante.ultimo
          : estudiante.ultimo;
        const noLeidos = esActiva
          ? suyos.filter(
              (mensaje) =>
                !mensaje.leido_en &&
                mensaje.remitente_id === mensaje.estudiante_id,
            ).length
          : estudiante.noLeidos;
        return { ...estudiante, ultimo, noLeidos };
      })
      .sort((a, b) => {
        if (a.noLeidos !== b.noLeidos) return b.noLeidos - a.noLeidos;
        return (
          new Date(b.ultimo?.creado_en ?? 0) -
          new Date(a.ultimo?.creado_en ?? 0)
        );
      });
  }, [
    esAdmin,
    estudianteSeleccionado,
    listaEstudiantes,
    mensajes,
  ]);

  const mensajesVisibles = mensajes.filter(
    (mensaje) => mensaje.estudiante_id === estudianteSeleccionado,
  );
  const ultimoMensajeId = mensajesVisibles.at(-1)?.id;
  const estudianteActivo = listaEstudiantes.find(
    (estudiante) => estudiante.id === estudianteSeleccionado,
  );

  useEffect(() => {
    const supabase = createClient();

    async function sincronizar(payload) {
      if (payload.eventType === "DELETE") {
        setMensajes((actuales) =>
          actuales.filter((mensaje) => mensaje.id !== payload.old.id),
        );
        return;
      }

      const { data } = await supabase
        .from("mensajes")
        .select(
          "*, remitente:usuarios!mensajes_remitente_id_fkey(nombre, avatar_url, rol)",
        )
        .eq("id", payload.new.id)
        .single();

      if (!data) return;
      const esConversacionActiva =
        data.estudiante_id === estudianteSeleccionado;

      if (esConversacionActiva) {
        setMensajes((actuales) =>
          ordenarMensajes([
            data,
            ...actuales.filter((mensaje) => mensaje.id !== data.id),
          ]),
        );
      }

      if (esAdmin) {
        setListaEstudiantes((actuales) =>
          actuales.map((estudiante) => {
            if (estudiante.id !== data.estudiante_id) return estudiante;

            const esMasReciente =
              !estudiante.ultimo ||
              new Date(data.creado_en) >=
                new Date(estudiante.ultimo.creado_en);
            const nuevoNoLeido =
              payload.eventType === "INSERT" &&
              data.remitente_id === data.estudiante_id &&
              !esConversacionActiva;

            return {
              ...estudiante,
              ultimo: esMasReciente
                ? {
                    contenido:
                      data.contenido ??
                      (data.adjuntos?.length ? "Archivo adjunto" : ""),
                    creado_en: data.creado_en,
                  }
                : estudiante.ultimo,
              noLeidos: nuevoNoLeido
                ? (estudiante.noLeidos ?? 0) + 1
                : estudiante.noLeidos,
            };
          }),
        );
      }
    }

    const filtro = esAdmin
      ? { event: "*", schema: "public", table: "mensajes" }
      : {
          event: "*",
          schema: "public",
          table: "mensajes",
          filter: `estudiante_id=eq.${usuario.id}`,
        };
    const canal = supabase
      .channel(`chat-${usuario.id}`)
      .on("postgres_changes", filtro, sincronizar)
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [esAdmin, estudianteSeleccionado, usuario.id]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [estudianteSeleccionado, ultimoMensajeId]);

  useEffect(() => {
    if (!estudianteSeleccionado) return;

    const noLeidos = mensajesVisibles.filter(
      (mensaje) =>
        !mensaje.leido_en &&
        mensaje.remitente_id !== usuario.id &&
        (esAdmin
          ? mensaje.remitente_id === mensaje.estudiante_id
          : mensaje.estudiante_id === usuario.id),
    );

    if (noLeidos.length === 0) return;

    const ids = noLeidos.map((mensaje) => mensaje.id);
    const leidoEn = new Date().toISOString();
    const supabase = createClient();

    async function marcarLeidos() {
      const { error: updateError } = await supabase
        .from("mensajes")
        .update({ leido_en: leidoEn })
        .eq("estudiante_id", estudianteSeleccionado)
        .neq("remitente_id", usuario.id)
        .is("leido_en", null);

      if (!updateError) {
        setMensajes((actuales) =>
          actuales.map((mensaje) =>
            ids.includes(mensaje.id)
              ? { ...mensaje, leido_en: leidoEn }
              : mensaje,
          ),
        );
        setListaEstudiantes((actuales) =>
          actuales.map((estudiante) =>
            estudiante.id === estudianteSeleccionado
              ? { ...estudiante, noLeidos: 0 }
              : estudiante,
          ),
        );
      }
    }

    marcarLeidos();
  }, [
    esAdmin,
    estudianteSeleccionado,
    mensajesVisibles,
    usuario.id,
  ]);

  async function consultarMensajes(estudianteId, antesDe = null) {
    const supabase = createClient();
    let consulta = supabase
      .from("mensajes")
      .select(
        "*, remitente:usuarios!mensajes_remitente_id_fkey(nombre, avatar_url, rol)",
      )
      .eq("estudiante_id", estudianteId)
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false })
      .limit(51);

    if (antesDe) {
      consulta = consulta.lt("creado_en", antesDe);
    }

    const { data, error: queryError } = await consulta;
    if (queryError) return null;

    return {
      mensajes: (data ?? []).slice(0, 50).reverse(),
      hayMas: (data?.length ?? 0) > 50,
    };
  }

  async function abrirConversacion(estudianteId) {
    if (
      !esAdmin ||
      estudianteId === estudianteSeleccionado ||
      cargandoConversacion
    ) {
      return;
    }

    const numeroCarga = cargaConversacionRef.current + 1;
    cargaConversacionRef.current = numeroCarga;
    setEstudianteSeleccionado(estudianteId);
    setVistaMovil("chat");
    setCargandoConversacion(true);
    setMensajes([]);
    setHayMasMensajes(false);
    setEditando(null);
    setContenido("");
    setArchivos([]);
    setError("");

    const resultado = await consultarMensajes(estudianteId);
    if (cargaConversacionRef.current !== numeroCarga) return;

    if (!resultado) {
      setError("No se pudo cargar la conversación.");
      setCargandoConversacion(false);
      return;
    }

    setMensajes(resultado.mensajes);
    setHayMasMensajes(resultado.hayMas);
    setCargandoConversacion(false);
  }

  async function cargarMensajesAnteriores() {
    const primero = mensajesVisibles[0];
    if (!primero || cargandoAnteriores || !hayMasMensajes) return;

    setCargandoAnteriores(true);
    const resultado = await consultarMensajes(
      estudianteSeleccionado,
      primero.creado_en,
    );
    setCargandoAnteriores(false);

    if (!resultado) {
      setError("No se pudo cargar el historial anterior.");
      return;
    }

    setMensajes((actuales) =>
      ordenarMensajes([
        ...resultado.mensajes,
        ...actuales.filter(
          (mensaje) =>
            !resultado.mensajes.some((anterior) => anterior.id === mensaje.id),
        ),
      ]),
    );
    setHayMasMensajes(resultado.hayMas);
  }

  async function enviarMensaje(event) {
    event.preventDefault();
    const texto = contenido.trim();
    if ((!texto && archivos.length === 0) || !estudianteSeleccionado) return;

    setEnviando(true);
    setError("");
    const supabase = createClient();
    const adjuntos = [];
    const rutasSubidas = [];

    for (const archivo of archivos) {
      const path = `${estudianteSeleccionado}/${usuario.id}/${crypto.randomUUID()}-${nombreSeguro(archivo.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("archivos_chat")
        .upload(path, archivo, {
          contentType: archivo.type,
          upsert: false,
        });

      if (uploadError) {
        if (rutasSubidas.length > 0) {
          await supabase.storage.from("archivos_chat").remove(rutasSubidas);
        }
        setEnviando(false);
        setError(`No se pudo subir ${archivo.name}.`);
        return;
      }

      rutasSubidas.push(path);
      adjuntos.push({
        path,
        nombre: archivo.name,
        tipo: archivo.type,
        tamano: archivo.size,
      });
    }

    const { data, error: insertError } = await supabase
      .from("mensajes")
      .insert({
        estudiante_id: estudianteSeleccionado,
        remitente_id: usuario.id,
        contenido: texto || null,
        adjuntos,
      })
      .select(
        "*, remitente:usuarios!mensajes_remitente_id_fkey(nombre, avatar_url, rol)",
      )
      .single();

    setEnviando(false);

    if (insertError || !data) {
      if (rutasSubidas.length > 0) {
        await supabase.storage.from("archivos_chat").remove(rutasSubidas);
      }
      setError("No se pudo enviar el mensaje.");
      return;
    }

    setContenido("");
    setArchivos([]);
    if (archivoInputRef.current) archivoInputRef.current.value = "";
    setMensajes((actuales) =>
      ordenarMensajes([
        data,
        ...actuales.filter((mensaje) => mensaje.id !== data.id),
      ]),
    );
  }

  function seleccionarArchivos(event) {
    const nuevos = Array.from(event.target.files ?? []);
    setError("");

    if (archivos.length + nuevos.length > MAX_ARCHIVOS) {
      setError(`Puedes adjuntar un máximo de ${MAX_ARCHIVOS} archivos.`);
      event.target.value = "";
      return;
    }

    const archivoNoValido = nuevos.find(
      (archivo) =>
        archivo.size > MAX_TAMANO || !TIPOS_PERMITIDOS.has(archivo.type),
    );

    if (archivoNoValido) {
      setError(
        archivoNoValido.size > MAX_TAMANO
          ? `${archivoNoValido.name} supera el máximo de 10 MB.`
          : `${archivoNoValido.name} no tiene un formato permitido.`,
      );
      event.target.value = "";
      return;
    }

    setArchivos((actuales) => [...actuales, ...nuevos]);
  }

  function iniciarEdicion(mensaje) {
    setEditando(mensaje.id);
    setTextoEdicion(mensaje.contenido ?? "");
    setErrorEdicion("");
  }

  async function guardarEdicion(mensaje) {
    const texto = textoEdicion.trim();
    if (!texto && (mensaje.adjuntos?.length ?? 0) === 0) {
      setErrorEdicion("El mensaje no puede quedar vacío.");
      return;
    }

    setGuardandoEdicion(true);
    setErrorEdicion("");
    const supabase = createClient();
    const { error: editError } = await supabase.rpc("editar_mensaje", {
      p_mensaje_id: mensaje.id,
      p_contenido: texto || null,
    });
    setGuardandoEdicion(false);

    if (editError) {
      setErrorEdicion("No se pudo editar el mensaje.");
      return;
    }

    const editadoEn = new Date().toISOString();
    setMensajes((actuales) =>
      actuales.map((actual) =>
        actual.id === mensaje.id
          ? { ...actual, contenido: texto || null, editado_en: editadoEn }
          : actual,
      ),
    );
    setEditando(null);
  }

  async function eliminarMensaje() {
    if (!borrando) return;

    setEliminando(true);
    setErrorEliminar("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("mensajes")
      .delete()
      .eq("id", borrando.id)
      .eq("remitente_id", usuario.id);

    if (deleteError) {
      setEliminando(false);
      setErrorEliminar("No se pudo eliminar el mensaje.");
      return;
    }

    const restantes = mensajes.filter((mensaje) => mensaje.id !== borrando.id);
    const ultimoRestante = restantes.at(-1);
    setMensajes(restantes);
    setListaEstudiantes((actuales) =>
      actuales.map((estudiante) =>
        estudiante.id === borrando.estudiante_id
          ? {
              ...estudiante,
              ultimo: ultimoRestante
                ? {
                    contenido:
                      ultimoRestante.contenido ??
                      (ultimoRestante.adjuntos?.length
                        ? "Archivo adjunto"
                        : ""),
                    creado_en: ultimoRestante.creado_en,
                  }
                : null,
            }
          : estudiante,
      ),
    );
    setEditando((actual) => (actual === borrando.id ? null : actual));

    const rutas = borrando.adjuntos?.map((adjunto) => adjunto.path) ?? [];
    if (rutas.length > 0) {
      await supabase.storage.from("archivos_chat").remove(rutas);
    }

    setEliminando(false);
    setBorrando(null);
  }

  const mostrarListaMovil = esAdmin && vistaMovil === "lista";
  const mostrarChatMovil = !esAdmin || vistaMovil === "chat";

  return (
    <div className="-mb-6 flex h-[calc(100dvh-6rem)] flex-col md:-mb-2 md:h-[calc(100dvh-4.5rem)]">
      {esAdmin && (
        <div
          className={`mb-4 shrink-0 ${vistaMovil === "chat" ? "hidden lg:block" : ""}`}
        >
          <p className="text-sm font-medium text-accent">Comunicación privada</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Mensajes
          </h1>
          <p className="mt-1 hidden text-slate-500 sm:block">
            Responde de forma privada a las dudas de tus alumnos.
          </p>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
          esAdmin ? "lg:grid lg:grid-cols-[280px_minmax(0,1fr)]" : ""
        }`}
      >
        {esAdmin && (
          <aside
            className={`flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r ${
              mostrarListaMovil ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="shrink-0 border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-900">Alumnos</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {conversaciones.map((estudiante) => (
                <button
                  key={estudiante.id}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                    estudianteSeleccionado === estudiante.id
                      ? "bg-accent-muted"
                      : ""
                  }`}
                  type="button"
                  onClick={() => abrirConversacion(estudiante.id)}
                >
                  <Avatar
                    nombre={estudiante.nombre}
                    url={estudiante.avatar_url}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {estudiante.nombre}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {estudiante.ultimo?.contenido ??
                        (estudiante.ultimo?.adjuntos?.length
                          ? "📎 Archivo adjunto"
                          : "Sin mensajes")}
                    </span>
                  </span>
                  {estudiante.noLeidos > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                      {estudiante.noLeidos}
                    </span>
                  )}
                </button>
              ))}
              {estudiantes.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">
                  Todavía no hay alumnos.
                </p>
              )}
            </div>
          </aside>
        )}

        <section
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            esAdmin && !mostrarChatMovil ? "hidden lg:flex" : "flex"
          }`}
        >
          {estudianteSeleccionado ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
                {esAdmin && (
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                    type="button"
                    aria-label="Volver a la lista de alumnos"
                    onClick={() => setVistaMovil("lista")}
                  >
                    <IconVolver />
                  </button>
                )}
                {esAdmin && (
                  <Avatar
                    nombre={estudianteActivo?.nombre}
                    url={estudianteActivo?.avatar_url}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-slate-900">
                    {esAdmin
                      ? estudianteActivo?.nombre
                      : "Conversación con la profesora"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    La respuesta puede no ser inmediata.
                  </p>
                </div>
              </header>

              <div
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50/60 p-4 sm:p-5"
                aria-live="polite"
              >
                {hayMasMensajes && !cargandoConversacion && (
                  <div className="text-center">
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      type="button"
                      disabled={cargandoAnteriores}
                      onClick={cargarMensajesAnteriores}
                    >
                      {cargandoAnteriores
                        ? "Cargando…"
                        : "Cargar mensajes anteriores"}
                    </button>
                  </div>
                )}
                {cargandoConversacion && (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Cargando conversación…
                  </div>
                )}
                {mensajesVisibles.map((mensaje) => {
                  const propio = mensaje.remitente_id === usuario.id;
                  return (
                    <div
                      key={mensaje.id}
                      className={`flex ${propio ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[70%] ${
                          propio
                            ? "rounded-br-md bg-accent text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {editando === mensaje.id ? (
                          <div>
                            <textarea
                              className="h-24 w-full min-w-56 resize-none rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-accent-muted"
                              value={textoEdicion}
                              onChange={(event) =>
                                setTextoEdicion(event.target.value)
                              }
                              maxLength={2000}
                              autoFocus
                            />
                            {errorEdicion && (
                              <p className="mt-1 text-xs text-red-100">
                                {errorEdicion}
                              </p>
                            )}
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
                                type="button"
                                disabled={guardandoEdicion}
                                onClick={() => setEditando(null)}
                              >
                                Cancelar
                              </button>
                              <button
                                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted disabled:opacity-60"
                                type="button"
                                disabled={guardandoEdicion}
                                onClick={() => guardarEdicion(mensaje)}
                              >
                                {guardandoEdicion ? "Guardando…" : "Guardar"}
                              </button>
                            </div>
                          </div>
                        ) : mensaje.contenido ? (
                          <p className="whitespace-pre-wrap break-words leading-6">
                            {mensaje.contenido}
                          </p>
                        ) : null}
                        {mensaje.adjuntos?.length > 0 && (
                          <div
                            className={`space-y-2 ${
                              mensaje.contenido ? "mt-3" : ""
                            }`}
                          >
                            {mensaje.adjuntos.map((adjunto) => (
                              <ChatAttachment
                                key={adjunto.path}
                                adjunto={adjunto}
                                propio={propio}
                              />
                            ))}
                          </div>
                        )}
                        <p
                          className={`mt-1 text-[11px] ${
                            propio ? "text-teal-100" : "text-slate-400"
                          }`}
                          suppressHydrationWarning
                        >
                          {new Date(mensaje.creado_en).toLocaleString("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                          {mensaje.editado_en ? " · Editado" : ""}
                          {propio && mensaje.leido_en ? " · Leído" : ""}
                        </p>
                        {propio && editando !== mensaje.id && (
                          <div className="mt-1 flex justify-end gap-3 text-[11px] text-teal-100">
                            <button
                              className="hover:text-white hover:underline"
                              type="button"
                              onClick={() => iniciarEdicion(mensaje)}
                            >
                              Editar
                            </button>
                            <button
                              className="hover:text-white hover:underline"
                              type="button"
                              onClick={() => {
                                setBorrando(mensaje);
                                setErrorEliminar("");
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!cargandoConversacion && mensajesVisibles.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    <p>
                      {esAdmin
                        ? "Todavía no hay mensajes. Puedes iniciar la conversación."
                        : "Todavía no hay mensajes. Escribe tu primera duda."}
                    </p>
                  </div>
                )}
                <div ref={finalRef} />
              </div>

              <form
                className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4"
                onSubmit={enviarMensaje}
              >
                {archivos.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {archivos.map((archivo, indice) => (
                      <span
                        key={`${archivo.name}-${archivo.size}-${indice}`}
                        className="flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700"
                      >
                        <span className="truncate">{archivo.name}</span>
                        <button
                          className="font-semibold text-slate-500 hover:text-red-600"
                          type="button"
                          aria-label={`Quitar ${archivo.name}`}
                          onClick={() =>
                            setArchivos((actuales) =>
                              actuales.filter(
                                (_, archivoIndice) =>
                                  archivoIndice !== indice,
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="sr-only" htmlFor="nuevo-mensaje">
                    Escribe un mensaje
                  </label>
                  <textarea
                    id="nuevo-mensaje"
                    className="h-12 min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted"
                    value={contenido}
                    onChange={(event) => setContenido(event.target.value)}
                    placeholder="Escribe un mensaje…"
                    maxLength={2000}
                    disabled={cargandoConversacion}
                  />
                  <input
                    ref={archivoInputRef}
                    className="sr-only"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.doc,.docx"
                    onChange={seleccionarArchivos}
                  />
                  <button
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    type="button"
                    title="Adjuntar archivos"
                    aria-label="Adjuntar archivos"
                    disabled={
                      enviando ||
                      cargandoConversacion ||
                      archivos.length >= MAX_ARCHIVOS
                    }
                    onClick={() => archivoInputRef.current?.click()}
                  >
                    📎
                  </button>
                  <button
                    className="flex h-12 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                    type="submit"
                    disabled={
                      enviando || (!contenido.trim() && archivos.length === 0)
                      || cargandoConversacion
                    }
                  >
                    {enviando ? "Enviando…" : "Enviar"}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-700" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center text-slate-500">
              Selecciona un alumno para abrir la conversación.
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar mensaje"
        mensaje="¿Quieres eliminar este mensaje? Esta acción no se puede deshacer."
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={eliminarMensaje}
        onCancel={() => {
          if (eliminando) return;
          setBorrando(null);
          setErrorEliminar("");
        }}
      />
    </div>
  );
}
