"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useProfileDashboard({
  usuario,
  perfil,
  mensualidadesError,
}) {
  const router = useRouter();
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [errorNombre, setErrorNombre] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatar_url);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensualidadEditando, setMensualidadEditando] = useState(null);
  const [borrandoMensualidad, setBorrandoMensualidad] = useState(null);
  const [eliminandoMensualidad, setEliminandoMensualidad] = useState(false);
  const [errorBorradoMensualidad, setErrorBorradoMensualidad] = useState("");
  const [errorMensualidades] = useState(mensualidadesError ?? "");
  const [errorNivel, setErrorNivel] = useState("");

  async function guardarNombre(event) {
    event.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("usuarios")
      .update({ nombre: nombreLimpio })
      .eq("id", usuario.id)
      .select("nombre")
      .single();

    if (error || !data) {
      setErrorNombre("No se pudo actualizar el nombre.");
      return;
    }

    setEditandoNombre(false);
    router.refresh();
  }

  async function cambiarAvatar(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    setErrorAvatar("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      setErrorAvatar("Elige una imagen JPG, PNG o WebP.");
      event.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setErrorAvatar("La imagen no puede superar los 2 MB.");
      event.target.value = "";
      return;
    }

    setSubiendoAvatar(true);
    const supabase = createClient();
    const ruta = `${usuario.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatares")
      .upload(ruta, archivo, {
        upsert: true,
        contentType: archivo.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      setErrorAvatar("No se pudo subir la foto.");
      setSubiendoAvatar(false);
      event.target.value = "";
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatares").getPublicUrl(ruta);
    const nuevaUrl = `${publicUrl}?v=${Date.now()}`;
    const { data: perfilActualizado, error: updateError } = await supabase
      .from("usuarios")
      .update({ avatar_url: nuevaUrl })
      .eq("id", usuario.id)
      .select("avatar_url")
      .single();

    if (updateError || !perfilActualizado) {
      setErrorAvatar("La foto subió, pero no se pudo guardar en el perfil.");
      setSubiendoAvatar(false);
      event.target.value = "";
      return;
    }

    setAvatarUrl(perfilActualizado.avatar_url);
    setSubiendoAvatar(false);
    event.target.value = "";
    router.refresh();
  }

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

  async function cambiarNivelEstudiante(estudianteId, nuevoNivel) {
    setErrorNivel("");
    const supabase = createClient();
    const { error } = await supabase.rpc("actualizar_nivel_estudiante", {
      p_estudiante_id: estudianteId,
      p_nivel: nuevoNivel,
    });

    if (error) {
      setErrorNivel("No se pudo actualizar el nivel.");
      return;
    }
    router.refresh();
  }

  return {
    router,
    editandoNombre,
    setEditandoNombre,
    nombre,
    setNombre,
    errorNombre,
    guardarNombre,
    avatarUrl,
    subiendoAvatar,
    errorAvatar,
    cambiarAvatar,
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
    errorNivel,
    cambiarNivelEstudiante,
  };
}
