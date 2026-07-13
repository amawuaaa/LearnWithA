export const NIVELES = ["A1", "A2", "B1", "B2", "C1"];

const coloresPorNivel = {
  A1: "bg-emerald-50 text-emerald-700",
  A2: "bg-teal-50 text-teal-700",
  B1: "bg-amber-50 text-amber-700",
  B2: "bg-orange-50 text-orange-700",
  C1: "bg-rose-50 text-rose-700",
};

export function nivelBadgeClase(nivel) {
  const color = coloresPorNivel[nivel] ?? "bg-accent-muted text-teal-700";
  return `inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${color}`;
}

// Contenido sin nivel asignado (juegos, o vocabulario creado antes de tener
// niveles) queda abierto para todos.
export function nivelDesbloqueado(nivelContenido, nivelUsuario) {
  if (!nivelContenido) return true;
  const indiceContenido = NIVELES.indexOf(nivelContenido);
  const indiceUsuario = NIVELES.indexOf(nivelUsuario ?? "A1");
  return indiceContenido <= indiceUsuario;
}
