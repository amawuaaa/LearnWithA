export default function PageHeader({
  etiqueta,
  titulo,
  descripcion,
  accion,
  className = "",
}) {
  return (
    <div
      className={`mb-8 flex items-start justify-between gap-4 ${className}`.trim()}
    >
      <div>
        {etiqueta && (
          <p className="text-sm font-medium text-accent">{etiqueta}</p>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descripcion && <p className="mt-2 text-slate-500">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
