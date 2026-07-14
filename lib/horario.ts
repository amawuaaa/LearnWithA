export const NOMBRES_DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const NOMBRES_DIAS_CORTOS = ["D", "L", "M", "X", "J", "V", "S"] as const;

export interface SlotHorario {
  dia_semana: number;
  hora: string;
}

export interface ClaseCalendario {
  id?: string;
  fecha: string;
  hora: string;
  cancelada?: boolean;
  estudiante?: { nombre: string };
}

export interface DiaGrilla {
  fecha: Date;
  enMes: boolean;
}

export function formatearHora(hora: string | null | undefined): string {
  if (!hora) return "";
  return hora.slice(0, 5);
}

export function slotsPorDia(horario: SlotHorario[], diaSemana: number) {
  return horario
    .filter((slot) => slot.dia_semana === diaSemana)
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

export function diasConClase(horario: SlotHorario[]) {
  return new Set(horario.map((slot) => slot.dia_semana));
}

// Evita desfases de zona horaria: no usa toISOString (que convierte a UTC).
export function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function clasesPorFecha(
  clases: ClaseCalendario[],
  fechaStr: string,
  { soloActivas = false }: { soloActivas?: boolean } = {},
) {
  return clases
    .filter(
      (clase) =>
        clase.fecha === fechaStr && (!soloActivas || !clase.cancelada),
    )
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

export function fechasConClase(
  clases: ClaseCalendario[],
  { soloActivas = true }: { soloActivas?: boolean } = {},
) {
  return new Set(
    clases
      .filter((clase) => !soloActivas || !clase.cancelada)
      .map((clase) => clase.fecha),
  );
}

export function proximaClaseEstudiante(
  clases: ClaseCalendario[],
  desde: Date = new Date(),
) {
  const hoyStr = formatearFechaLocal(inicioDelDia(desde));
  const activas = clases
    .filter((clase) => !clase.cancelada && clase.fecha >= hoyStr)
    .sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
    );

  if (activas.length === 0) return null;

  const primeraFecha = activas[0].fecha;
  const clasesDelDia = activas.filter((clase) => clase.fecha === primeraFecha);
  const fecha = new Date(`${primeraFecha}T00:00:00`);
  const diasRestantes = Math.round(
    (inicioDelDia(fecha).getTime() - inicioDelDia(desde).getTime()) / 86400000,
  );

  return {
    fecha,
    diasRestantes,
    clases: clasesDelDia,
  };
}

// Busca la próxima fecha (desde hoy, incluido) que caiga en uno de los días
// de la semana del horario y no esté cancelada. `horizonDias` limita cuánto
// mira hacia adelante por si no hay ningún día de clase configurado.
export function proximaClase({
  diasSemana,
  canceladas,
  desde = new Date(),
  horizonDias = 60,
}: {
  diasSemana: Set<number>;
  canceladas?: Set<string>;
  desde?: Date;
  horizonDias?: number;
}) {
  if (!diasSemana || diasSemana.size === 0) return null;

  const hoy = inicioDelDia(desde);

  for (let offset = 0; offset <= horizonDias; offset += 1) {
    const candidata = new Date(hoy);
    candidata.setDate(candidata.getDate() + offset);

    if (!diasSemana.has(candidata.getDay())) continue;
    if (canceladas?.has(formatearFechaLocal(candidata))) continue;

    return { fecha: candidata, diasRestantes: offset };
  }

  return null;
}

// Genera la grilla de un mes (incluyendo días del mes anterior/siguiente
// para completar semanas de domingo a sábado) para pintar un calendario.
export function generarGrillaMes(anio: number, mes: number): DiaGrilla[] {
  const primerDia = new Date(anio, mes, 1);
  const inicioGrilla = new Date(primerDia);
  inicioGrilla.setDate(inicioGrilla.getDate() - primerDia.getDay());

  const dias: DiaGrilla[] = [];
  const cursor = new Date(inicioGrilla);

  for (let i = 0; i < 42; i += 1) {
    dias.push({
      fecha: new Date(cursor),
      enMes: cursor.getMonth() === mes,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return dias;
}

export function rangoGrillaMes(anio: number, mes: number) {
  const grilla = generarGrillaMes(anio, mes);

  return {
    desde: formatearFechaLocal(grilla[0].fecha),
    hasta: formatearFechaLocal(grilla[grilla.length - 1].fecha),
  };
}

export function claveMes(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}`;
}
