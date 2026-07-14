import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { MAX_ARCHIVOS } from "@/lib/chat/constants";

export default function ChatFormularioEnvio({
  contenido,
  archivos,
  enviando,
  error,
  cargandoConversacion,
  archivoInputRef,
  onCambiarContenido,
  onSeleccionarArchivos,
  onQuitarArchivo,
  onEnviar,
}) {
  return (
    <form
      className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4"
      onSubmit={onEnviar}
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
                onClick={() => onQuitarArchivo(indice)}
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
        <Textarea
          id="nuevo-mensaje"
          className="h-12 min-w-0 flex-1 py-3 text-base sm:text-sm"
          value={contenido}
          onChange={(event) => onCambiarContenido(event.target.value)}
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
          onChange={onSeleccionarArchivos}
        />
        <Button
          compact
          className="flex h-12 w-12 shrink-0 items-center justify-center text-lg"
          variante="secondary"
          type="button"
          title="Adjuntar archivos"
          aria-label="Adjuntar archivos"
          disabled={
            enviando || cargandoConversacion || archivos.length >= MAX_ARCHIVOS
          }
          onClick={() => archivoInputRef.current?.click()}
        >
          📎
        </Button>
        <Button
          className="h-12 shrink-0"
          type="submit"
          disabled={
            enviando ||
            (!contenido.trim() && archivos.length === 0) ||
            cargandoConversacion
          }
        >
          {enviando ? "Enviando…" : "Enviar"}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
