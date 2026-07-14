const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconInicio({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconCalendario({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function IconAnuncios({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <path d="M3 10v4h3l7 4V6l-7 4H3z" />
      <path d="M17 9a3 3 0 0 1 0 6" />
    </svg>
  );
}

export function IconMensajes({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 5h16v11H9l-5 4V5z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  );
}

export function IconTests({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}

export function IconMemoria({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconVocabulario({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <path d="M12 6c-1.5-1.3-4-2-8-2v14c4 0 6.5.7 8 2 1.5-1.3 4-2 8-2V4c-4 0-6.5.7-8 2z" />
      <line x1="12" y1="6" x2="12" y2="20" />
    </svg>
  );
}

export function IconProgreso({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 4v16h16" />
      <line x1="8" y1="16" x2="8" y2="11" />
      <line x1="12" y1="16" x2="12" y2="7" />
      <line x1="16" y1="16" x2="16" y2="13" />
    </svg>
  );
}

export function IconPerfil({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-4 4.5-6 7-6s6 2 7 6" />
    </svg>
  );
}

export function IconVolver({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
