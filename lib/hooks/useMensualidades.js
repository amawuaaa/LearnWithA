"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useMensualidades({ mensualidadesError } = {}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensualidadEditando, setMensualidadEditando] = useState(null);
  const [borrandoMensualidad, setBorrandoMensualidad] = useState(null);
  const [eliminandoMensualidad, setEliminandoMensualidad] = useState(false);
  const [errorBorradoMensualidad, setErrorBorradoMensualidad] = useState("");
  const [errorMensualidades] = useState(mensualidadesError ?? "");

  function abrirMensualidad(mensualidad = null) {
    setMensualidadEditando(mensualidad);
    setModalAbierto(true);
  }

  function mensualidadGuardada() {
    setModalAbierto(false);
    router.refresh();
  }

  async function confirmarBorradoMensualidad() {
    setEliminandoMensualidad(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("mensualidades")
      .delete()
      .eq("id", borrandoMensualidad.id);
    setEliminandoMensualidad(false);

    if (error) {
      setErrorBorradoMensualidad("No se pudo eliminar la mensualidad.");
      return;
    }
    setBorrandoMensualidad(null);
    router.refresh();
  }

  function solicitarBorradoMensualidad(mensualidad) {
    setErrorBorradoMensualidad("");
    setBorrandoMensualidad(mensualidad);
  }

  return {
    router,
    modalAbierto,
    setModalAbierto,
    mensualidadEditando,
    abrirMensualidad,
    mensualidadGuardada,
    borrandoMensualidad,
    setBorrandoMensualidad,
    eliminandoMensualidad,
    errorBorradoMensualidad,
    confirmarBorradoMensualidad,
    solicitarBorradoMensualidad,
    errorMensualidades,
  };
}
