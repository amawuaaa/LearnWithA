"use client";

import { MAX_ARCHIVOS, MAX_TAMANO, TIPOS_PERMITIDOS } from "@/lib/chat/constants";
import { nombreSeguro, ordenarMensajes } from "@/lib/chat/utilidades";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function useChatDashboard({
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
  }, [esAdmin, estudianteSeleccionado, listaEstudiantes, mensajes]);

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
      const esConversacionActiva = data.estudiante_id === estudianteSeleccionado;

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
              new Date(data.creado_en) >= new Date(estudiante.ultimo.creado_en);
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
  }, [esAdmin, estudianteSeleccionado, mensajesVisibles, usuario.id]);

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
                      (ultimoRestante.adjuntos?.length ? "Archivo adjunto" : ""),
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

  return {
    esAdmin,
    usuario,
    estudiantes,
    conversaciones,
    estudianteSeleccionado,
    estudianteActivo,
    mensajesVisibles,
    hayMasMensajes,
    cargandoConversacion,
    cargandoAnteriores,
    contenido,
    setContenido,
    archivos,
    setArchivos,
    enviando,
    error,
    editando,
    setEditando,
    textoEdicion,
    setTextoEdicion,
    guardandoEdicion,
    errorEdicion,
    borrando,
    setBorrando,
    eliminando,
    errorEliminar,
    setErrorEliminar,
    vistaMovil,
    setVistaMovil,
    finalRef,
    archivoInputRef,
    abrirConversacion,
    cargarMensajesAnteriores,
    enviarMensaje,
    seleccionarArchivos,
    iniciarEdicion,
    guardarEdicion,
    eliminarMensaje,
    mostrarListaMovil: esAdmin && vistaMovil === "lista",
    mostrarChatMovil: !esAdmin || vistaMovil === "chat",
  };
}
