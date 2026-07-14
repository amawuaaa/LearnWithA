export function ordenarAnuncios(anuncios) {
  return [...anuncios].sort(
    (a, b) => new Date(b.creado_en) - new Date(a.creado_en),
  );
}
