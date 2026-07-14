import {
  MAX_ARCHIVOS,
  MAX_TAMANO,
  SELECCION_MENSAJE,
  TIPOS_PERMITIDOS,
} from "./constants";
import { nombreSeguro } from "./utilidades";

// Devuelve el texto de error si la selección no es válida, o null si lo es.
export function validarSeleccionArchivos(actuales, nuevos) {
  if (actuales.length + nuevos.length > MAX_ARCHIVOS) {
    return `Puedes adjuntar un máximo de ${MAX_ARCHIVOS} archivos.`;
  }

  const archivoNoValido = nuevos.find(
    (archivo) =>
      archivo.size > MAX_TAMANO || !TIPOS_PERMITIDOS.has(archivo.type),
  );

  if (archivoNoValido) {
    return archivoNoValido.size > MAX_TAMANO
      ? `${archivoNoValido.name} supera el máximo de 10 MB.`
      : `${archivoNoValido.name} no tiene un formato permitido.`;
  }

  return null;
}

// Sube los adjuntos e inserta el mensaje. Si algo falla, elimina los archivos
// ya subidos para no dejar huérfanos. Devuelve { mensaje } o { error }.
export async function enviarMensajeConAdjuntos(
  supabase,
  { estudianteId, remitenteId, texto, archivos },
) {
  const adjuntos = [];
  const rutasSubidas = [];

  for (const archivo of archivos) {
    const path = `${estudianteId}/${remitenteId}/${crypto.randomUUID()}-${nombreSeguro(archivo.name)}`;
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
      return { error: `No se pudo subir ${archivo.name}.` };
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
      estudiante_id: estudianteId,
      remitente_id: remitenteId,
      contenido: texto || null,
      adjuntos,
    })
    .select(SELECCION_MENSAJE)
    .single();

  if (insertError || !data) {
    if (rutasSubidas.length > 0) {
      await supabase.storage.from("archivos_chat").remove(rutasSubidas);
    }
    return { error: "No se pudo enviar el mensaje." };
  }

  return { mensaje: data };
}
