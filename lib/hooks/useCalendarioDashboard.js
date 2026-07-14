"use client";

import {
  cargarDatosCalendario,
  fusionarClases,
  fusionarEventos,
} from "@/lib/calendario/consultas";
import {
  clasesPorFecha,
  claveMes,
  fechasConClase,
  formatearFechaLocal,
  generarGrillaMes,
} from "@/lib/horario";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function useCalendarioDashboard({
  esAdmin,
  clasesIniciales,
  eventosIniciales,
  estudiantes,
  usuarioId,
  mesInicial,
}) {
  const [clases, setClases] = useState(clasesIniciales);
  const [eventos, setEventos] = useState(eventosIniciales);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [estudianteNuevo, setEstudianteNuevo] = useState(
    estudiantes[0]?.id ?? "",
  );
  const [horaNueva, setHoraNueva] = useState("18:00");
  const [tipoEvento, setTipoEvento] = useState("anuncio");
  const [tituloEvento, setTituloEvento] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [guardandoClase, setGuardandoClase] = useState(false);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [cargandoMes, setCargandoMes] = useState(false);
  const [error, setError] = useState("");
  const mesesCargadosRef = useRef(new Set([mesInicial]));

  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );

  useEffect(() => {
    const clave = claveMes(mesVisible);
    if (mesesCargadosRef.current.has(clave)) return undefined;

    let cancelado = false;

    async function cargarMes() {
      setCargandoMes(true);
      const supabase = createClient();
      const resultado = await cargarDatosCalendario(
        supabase,
        mesVisible.getFullYear(),
        mesVisible.getMonth(),
        { esAdmin, usuarioId },
      );

      if (cancelado) return;

      setCargandoMes(false);

      if (resultado.error) {
        setError("No se pudieron cargar los datos del mes.");
        return;
      }

      setClases((actuales) => fusionarClases(actuales, resultado.clases));
      setEventos((actuales) => fusionarEventos(actuales, resultado.eventos));
      mesesCargadosRef.current.add(clave);
    }

    cargarMes();

    return () => {
      cancelado = true;
      setCargandoMes(false);
    };
  }, [mesVisible, esAdmin, usuarioId]);

  function actualizarClases(nuevasClases) {
    setClases((actuales) => fusionarClases(actuales, nuevasClases));
    mesesCargadosRef.current.add(claveMes(mesVisible));
  }

  const clasesVisibles = useMemo(() => {
    if (esAdmin) return clases;
    return clases.filter((clase) => clase.estudiante_id === usuarioId);
  }, [clases, esAdmin, usuarioId]);

  const fechasClaseSet = useMemo(
    () => fechasConClase(clasesVisibles),
    [clasesVisibles],
  );

  const eventosPorFecha = useMemo(() => {
    const mapa = {};
    for (const evento of eventos) {
      mapa[evento.fecha] = [...(mapa[evento.fecha] ?? []), evento];
    }
    return mapa;
  }, [eventos]);

  const grilla = useMemo(
    () => generarGrillaMes(mesVisible.getFullYear(), mesVisible.getMonth()),
    [mesVisible],
  );

  const hoyStr = formatearFechaLocal(hoy);
  const diaSeleccionadoStr = diaSeleccionado
    ? formatearFechaLocal(diaSeleccionado)
    : null;
  const clasesDiaSeleccionado = diaSeleccionadoStr
    ? clasesPorFecha(clasesVisibles, diaSeleccionadoStr)
    : [];
  const eventosDiaSeleccionado = diaSeleccionadoStr
    ? (eventosPorFecha[diaSeleccionadoStr] ?? [])
    : [];

  function cambiarMes(delta) {
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1),
    );
  }

  function irAHoy() {
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }

  function abrirDia(fecha) {
    setError("");
    setDiaSeleccionado(fecha);
    setEstudianteNuevo(estudiantes[0]?.id ?? "");
    setHoraNueva("18:00");
  }

  async function anadirClase(event) {
    event.preventDefault();
    if (!diaSeleccionadoStr || !estudianteNuevo || !horaNueva) return;

    setGuardandoClase(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("clases_estudiante")
      .insert({
        estudiante_id: estudianteNuevo,
        fecha: diaSeleccionadoStr,
        hora: horaNueva,
      })
      .select(
        "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
      )
      .single();
    setGuardandoClase(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ese alumno ya tiene clase a esa hora ese día."
          : "No se pudo programar la clase.",
      );
      return;
    }

    setClases((actuales) =>
      [...actuales, data].sort(
        (a, b) =>
          a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
      ),
    );
  }

  async function cancelarClase(clase, restaurar = false) {
    setError("");
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("clases_estudiante")
      .update({
        cancelada: !restaurar,
        motivo_cancelacion: restaurar ? null : clase.motivo_cancelacion ?? null,
      })
      .eq("id", clase.id)
      .select(
        "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
      )
      .single();

    if (updateError || !data) {
      setError(
        restaurar
          ? "No se pudo restaurar la clase."
          : "No se pudo cancelar la clase.",
      );
      return;
    }

    setClases((actuales) =>
      actuales.map((actual) => (actual.id === data.id ? data : actual)),
    );
  }

  async function eliminarClase(id) {
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("clases_estudiante")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar la clase.");
      return;
    }

    setClases((actuales) => actuales.filter((clase) => clase.id !== id));
  }

  async function crearEvento(event) {
    event.preventDefault();
    if (!diaSeleccionadoStr || !tituloEvento.trim()) return;

    setGuardandoEvento(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("eventos_calendario")
      .insert({
        fecha: diaSeleccionadoStr,
        tipo: tipoEvento,
        titulo: tituloEvento.trim(),
        descripcion: descripcionEvento.trim() || null,
        creado_por: usuarioId,
      })
      .select()
      .single();
    setGuardandoEvento(false);

    if (insertError || !data) {
      setError("No se pudo crear el evento.");
      return;
    }

    setEventos((actuales) => [...actuales, data]);
    setTituloEvento("");
    setDescripcionEvento("");
  }

  async function eliminarEvento(id) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("eventos_calendario")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar el evento.");
      return;
    }

    setEventos((actuales) => actuales.filter((evento) => evento.id !== id));
  }

  return {
    esAdmin,
    estudiantes,
    error,
    cargandoMes,
    mesVisible,
    cambiarMes,
    irAHoy,
    grilla,
    hoyStr,
    clasesVisibles,
    fechasClaseSet,
    eventosPorFecha,
    diaSeleccionado,
    setDiaSeleccionado,
    diaSeleccionadoStr,
    clasesDiaSeleccionado,
    eventosDiaSeleccionado,
    abrirDia,
    actualizarClases,
    anadirClase,
    cancelarClase,
    eliminarClase,
    crearEvento,
    eliminarEvento,
    estudianteNuevo,
    setEstudianteNuevo,
    horaNueva,
    setHoraNueva,
    tipoEvento,
    setTipoEvento,
    tituloEvento,
    setTituloEvento,
    descripcionEvento,
    setDescripcionEvento,
    guardandoClase,
    guardandoEvento,
  };
}
