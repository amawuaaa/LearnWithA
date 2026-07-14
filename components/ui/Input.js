const claseCampo =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted";

export default function Input({ className = "", ...props }) {
  return (
    <input className={`${claseCampo} ${className}`.trim()} {...props} />
  );
}

export function Textarea({ className = "", redimensionable = false, ...props }) {
  return (
    <textarea
      className={`${claseCampo} ${redimensionable ? "resize-y" : "resize-none"} ${className}`.trim()}
      {...props}
    />
  );
}
