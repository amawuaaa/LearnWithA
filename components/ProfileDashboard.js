"use client";

import { estilosEstadoMensualidad as estilosEstado } from "@/lib/mensualidades";
import { NIVELES } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminBulkMonthlyForm from "./AdminBulkMonthlyForm";
import AdminMonthlyForm from "./AdminMonthlyForm";
import AdminRegistrationCode from "./AdminRegistrationCode";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";

function fechaLegible(fecha, opciones = {}) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", opciones);
}

function periodoLegible(periodo) {
  return fechaLegible(periodo, { month: "long", year: "numeric" });
}

function importeLegible(importe) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(importe);
}

export default function ProfileDashboard({
  usuario,
  perfil,
  mensualidades,
  estudiantes,
  testsCompletados,
  codigoRegistro,
  mensualidadesError,
}) {
  const router = useRouter();
  const esAdmin = perfil.rol === "admin";
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
  const [errorMensualidades, setErrorMensualidades] = useState(
    mensualidadesError ?? "",
  );
  const [errorNivel, setErrorNivel] = useState("");
  const mensualidadActual = !esAdmin ? mensualidades[0] : null;

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

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Cuenta</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Mi perfil
        </h1>
        <p className="mt-2 text-slate-500">
          Consulta tus datos personales y la información de la clase.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="text-center">
              <Avatar
                nombre={perfil.nombre}
                url={avatarUrl}
                className="h-16 w-16 text-2xl"
              />
              <label className="mt-2 block cursor-pointer text-xs font-medium text-accent hover:underline">
                {subiendoAvatar ? "Subiendo…" : "Cambiar foto"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={subiendoAvatar}
                  onChange={cambiarAvatar}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {perfil.nombre}
              </h2>
              <p className="text-sm capitalize text-slate-500">{perfil.rol}</p>
              {errorAvatar && (
                <p className="mt-2 text-xs text-red-700">{errorAvatar}</p>
              )}
            </div>
          </div>

          <dl className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nombre
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{perfil.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{usuario.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tipo de cuenta
              </dt>
              <dd className="mt-1 text-sm capitalize text-slate-800">
                {perfil.rol}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Miembro desde
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {new Date(perfil.creado_en).toLocaleDateString("es-ES")}
              </dd>
            </div>
          </dl>

          {editandoNombre ? (
            <form
              className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row"
              onSubmit={guardarNombre}
            >
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                maxLength={100}
                required
              />
              <button
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                type="submit"
              >
                Guardar
              </button>
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                type="button"
                onClick={() => setEditandoNombre(false)}
              >
                Cancelar
              </button>
              {errorNombre && (
                <p className="text-sm text-red-700">{errorNombre}</p>
              )}
            </form>
          ) : (
            <button
              className="mt-6 text-sm font-medium text-accent hover:underline"
              type="button"
              onClick={() => setEditandoNombre(true)}
            >
              Editar nombre
            </button>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resumen</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-slate-500">
                {esAdmin ? "Resultados registrados" : "Tests completados"}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {testsCompletados}
              </p>
            </div>
            {!esAdmin && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Tu nivel actual</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {perfil.nivel ?? "A1"}
                </p>
              </div>
            )}
            {!esAdmin && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Última mensualidad</p>
                {mensualidadActual ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {importeLegible(mensualidadActual.importe)}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstado[mensualidadActual.estado]}`}
                    >
                      {mensualidadActual.estado}
                    </span>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Sin mensualidades registradas
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {esAdmin && <AdminRegistrationCode codigoInicial={codigoRegistro} />}

      {!esAdmin && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Mis mensualidades
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium">Importe</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mensualidades.map((mensualidad) => (
                  <tr key={mensualidad.id}>
                    <td className="px-4 py-3 capitalize">
                      {periodoLegible(mensualidad.periodo)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {importeLegible(mensualidad.importe)}
                    </td>
                    <td className="px-4 py-3">
                      {fechaLegible(mensualidad.fecha_vencimiento)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstado[mensualidad.estado]}`}
                      >
                        {mensualidad.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {mensualidades.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan="4"
                    >
                      No hay mensualidades registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {esAdmin && (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Nivel de los alumnos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube el nivel de un alumno cuando esté listo para el siguiente
              reto. Los tests y el vocabulario de niveles superiores
              quedarán desbloqueados para él.
            </p>
            {errorNivel && (
              <p className="mt-2 text-sm text-red-700">{errorNivel}</p>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  <th className="px-4 py-3 font-medium">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudiantes.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td className="px-4 py-3">{estudiante.nombre}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
                        value={estudiante.nivel ?? "A1"}
                        onChange={(event) =>
                          cambiarNivelEstudiante(
                            estudiante.id,
                            event.target.value,
                          )
                        }
                      >
                        {NIVELES.map((opcion) => (
                          <option key={opcion} value={opcion}>
                            {opcion}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {estudiantes.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan="2"
                    >
                      Aún no hay alumnos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {esAdmin && (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Gestión de mensualidades
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Genera el mes para todos los alumnos o registra casos puntuales.
              </p>
              {errorMensualidades && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {errorMensualidades}
                </p>
              )}
            </div>
            <button
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              type="button"
              onClick={() => abrirMensualidad()}
            >
              Nueva mensualidad
            </button>
          </div>

          <AdminBulkMonthlyForm
            estudiantes={estudiantes}
            onSaved={() => router.refresh()}
          />

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium">Importe</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mensualidades.map((mensualidad) => (
                  <tr key={mensualidad.id}>
                    <td className="px-4 py-3">
                      {mensualidad.usuarios?.nombre ?? "Alumno"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {periodoLegible(mensualidad.periodo)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {importeLegible(mensualidad.importe)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstado[mensualidad.estado]}`}
                      >
                        {mensualidad.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          className="font-medium text-accent hover:underline"
                          type="button"
                          onClick={() => abrirMensualidad(mensualidad)}
                        >
                          Editar
                        </button>
                        <button
                          className="font-medium text-red-600 hover:underline"
                          type="button"
                          onClick={() => {
                            setErrorBorradoMensualidad("");
                            setBorrandoMensualidad(mensualidad);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {mensualidades.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan="5"
                    >
                      Aún no hay mensualidades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        abierto={modalAbierto}
        titulo={
          mensualidadEditando ? "Editar mensualidad" : "Nueva mensualidad"
        }
        onClose={() => setModalAbierto(false)}
      >
        <AdminMonthlyForm
          key={mensualidadEditando?.id ?? "nueva"}
          mensualidad={mensualidadEditando}
          estudiantes={estudiantes}
          onSaved={mensualidadGuardada}
        />
      </Modal>

      <ConfirmDialog
        abierto={borrandoMensualidad !== null}
        titulo="Eliminar mensualidad"
        mensaje="¿Eliminar esta mensualidad? Esta acción no se puede deshacer."
        cargando={eliminandoMensualidad}
        error={errorBorradoMensualidad}
        onConfirm={confirmarBorradoMensualidad}
        onCancel={() => setBorrandoMensualidad(null)}
      />
    </>
  );
}
