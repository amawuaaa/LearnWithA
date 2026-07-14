"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "../Avatar";

export default function PerfilAvatar({ usuario, perfil, dashboard }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-6 flex items-center gap-4">
        <div className="text-center">
          <Avatar
            nombre={perfil.nombre}
            url={dashboard.avatarUrl}
            className="h-16 w-16 text-2xl"
          />
          <label className="mt-2 block cursor-pointer text-xs font-medium text-accent hover:underline">
            {dashboard.subiendoAvatar ? "Subiendo…" : "Cambiar foto"}
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={dashboard.subiendoAvatar}
              onChange={dashboard.cambiarAvatar}
            />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {perfil.nombre}
          </h2>
          <p className="text-sm capitalize text-slate-500">{perfil.rol}</p>
          {dashboard.errorAvatar && (
            <p className="mt-2 text-xs text-red-700">{dashboard.errorAvatar}</p>
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

      {dashboard.editandoNombre ? (
        <form
          className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row"
          onSubmit={dashboard.guardarNombre}
        >
          <Input
            className="flex-1"
            value={dashboard.nombre}
            onChange={(event) => dashboard.setNombre(event.target.value)}
            maxLength={100}
            required
          />
          <Button type="submit">
            Guardar
          </Button>
          <Button
            variante="secondary"
            type="button"
            onClick={() => dashboard.setEditandoNombre(false)}
          >
            Cancelar
          </Button>
          {dashboard.errorNombre && (
            <p className="text-sm text-red-700">{dashboard.errorNombre}</p>
          )}
        </form>
      ) : (
        <Button
          className="mt-6"
          variante="ghost"
          type="button"
          onClick={() => dashboard.setEditandoNombre(true)}
        >
          Editar nombre
        </Button>
      )}
    </section>
  );
}
