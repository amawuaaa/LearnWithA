export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${className}`.trim()}
    >
      {children}
    </span>
  );
}
