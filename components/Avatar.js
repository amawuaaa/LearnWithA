export default function Avatar({ nombre, url, className = "h-10 w-10" }) {
  const inicial = nombre?.trim().charAt(0).toUpperCase() || "U";

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent ${className}`}
    >
      {inicial}
      {url && (
        // La URL procede exclusivamente del bucket de avatares de Supabase.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={url}
          alt={`Foto de perfil de ${nombre}`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}
