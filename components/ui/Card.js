export default function Card({ children, className = "", ...props }) {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </article>
  );
}
