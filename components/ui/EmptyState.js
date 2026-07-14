export default function EmptyState({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
