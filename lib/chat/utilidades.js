export function nombreSeguro(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-120);
}

export function ordenarMensajes(mensajes) {
  return [...mensajes].sort(
    (a, b) => new Date(a.creado_en) - new Date(b.creado_en),
  );
}
