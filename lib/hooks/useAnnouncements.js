"use client";

import { ordenarAnuncios } from "@/lib/anuncios";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useAnnouncements(
  initialAnuncios,
  { limite, canal = "anuncios" } = {},
) {
  const [anuncios, setAnuncios] = useState(initialAnuncios);

  useEffect(() => {
    const supabase = createClient();

    async function sincronizar(payload) {
      if (payload.eventType === "DELETE") {
        setAnuncios((actuales) =>
          actuales.filter((anuncio) => anuncio.id !== payload.old.id),
        );
        return;
      }

      const { data } = await supabase
        .from("anuncios")
        .select("*, usuarios(nombre)")
        .eq("id", payload.new.id)
        .single();

      if (!data) return;

      setAnuncios((actuales) => {
        const actualizados = ordenarAnuncios([
          data,
          ...actuales.filter((anuncio) => anuncio.id !== data.id),
        ]);
        return limite ? actualizados.slice(0, limite) : actualizados;
      });
    }

    const suscripcion = supabase
      .channel(canal)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anuncios" },
        sincronizar,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(suscripcion);
    };
  }, [canal, limite]);

  return [anuncios, setAnuncios];
}
