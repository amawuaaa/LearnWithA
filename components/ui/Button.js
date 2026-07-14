const variantes = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "px-0 py-0 text-accent hover:underline",
  enlace: "px-0 py-0 text-sm font-medium text-accent hover:underline",
  enlacePeligro:
    "px-0 py-0 text-sm font-medium text-red-600 hover:underline",
};

export default function Button({
  variante = "primary",
  className = "",
  compact = false,
  type = "button",
  ...props
}) {
  const esEnlace = variante === "ghost" || variante === "enlace" || variante === "enlacePeligro";
  const sinPadding = compact || esEnlace;

  return (
    <button
      type={type}
      className={`rounded-lg text-sm font-medium transition disabled:opacity-60 ${
        sinPadding ? "" : "px-4 py-2.5"
      } ${variantes[variante] ?? variantes.primary} ${className}`.trim()}
      {...props}
    />
  );
}
