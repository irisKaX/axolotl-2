import type { SVGProps } from "react";
const paths = {
  poznamky: (
    <>
      <rect x="5" y="3" width="15" height="18" rx="2"></rect>
      <path d="M3 7h4m-4 5h4m-4 5h4M11 8h5m-5 4h5m-5 4h3"></path>
    </>
  ),
  "konvertor-obrazku": (
    <>
      <rect x="3" y="3" width="14" height="14" rx="3"></rect>
      <path d="m3 13 4-4 4 4m4 8h6m-3-3 3 3-3 3"></path>
      <circle cx="12" cy="7" r="1"></circle>
    </>
  ),
  "obrazky-z-webu": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3"></rect>
      <path d="m3 16 5-5 4 4 3-3 6 6M8 4v3m8-3v3"></path>
    </>
  ),
  "pdf-scout": (
    <>
      <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M13 3v6h6l-6-6Z"></path>
      <circle cx="17" cy="16" r="3"></circle>
      <path d="m19 18 3 3M8 12h3m-3 4h2"></path>
    </>
  ),
  screenshot: (
    <>
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"></path>
      <rect x="7" y="7" width="10" height="10" rx="2"></rect>
    </>
  ),
  qr: (
    <>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3m6-3v-3M12 3v3m0 6h3M3 12h3m6 6v3"></path>
    </>
  ),
  metadata: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3"></rect>
      <path d="M3 9h18M7 13h5m-5 3h10"></path>
    </>
  ),
  nadpisy: (
    <>
      <path d="M5 5v14M15 5v14M5 12h10M19 15v4m-1-3 1-1"></path>
    </>
  ),
  "strukturovana-data": (
    <>
      <rect x="9" y="3" width="6" height="5" rx="1"></rect>
      <rect x="3" y="16" width="6" height="5" rx="1"></rect>
      <rect x="15" y="16" width="6" height="5" rx="1"></rect>
      <path d="M12 8v4H6v4m6-4h6v4"></path>
    </>
  ),
  obrazky: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3"></rect>
      <circle cx="8" cy="8" r="1.5"></circle>
      <path d="m21 15-5-5L5 21"></path>
    </>
  ),
  "hledani-na-webu": (
    <>
      <circle cx="10" cy="10" r="7"></circle>
      <path d="m15 15 6 6M3 10h14M10 3a14 14 0 0 1 0 14 14 14 0 0 1 0-14Z"></path>
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z"></path>
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12a2 2 0 0 0 4 0"></path>
    </>
  ),
  settings: (
    <>
      <path d="m9.5 3-.6 2a8 8 0 0 0-1.6.9l-2-.5-2.5 4.2 1.5 1.5a8 8 0 0 0 0 1.8l-1.5 1.5 2.5 4.2 2-.5a8 8 0 0 0 1.6.9l.6 2h5l.6-2a8 8 0 0 0 1.6-.9l2 .5 2.5-4.2-1.5-1.5a8 8 0 0 0 0-1.8l1.5-1.5-2.5-4.2-2 .5a8 8 0 0 0-1.6-.9l-.6-2h-5Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </>
  ),
  link: (
    <>
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"></path>
    </>
  ),
  tabs: (
    <>
      <rect x="7" y="7" width="14" height="14" rx="3"></rect>
      <path d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"></path>
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21v-2a8 8 0 0 1 16 0v2"></path>
    </>
  ),
  appearance: (
    <>
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9"></path>
      <circle cx="15" cy="7" r="2"></circle>
      <circle cx="9" cy="17" r="2"></circle>
    </>
  ),
  integrations: (
    <>
      <path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"></path>
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"></path>
      <path d="m8 12 3 3 5-5"></path>
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2"></rect>
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"></path>
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 11v6m0-10h.01"></path>
    </>
  ),
  chevron: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M6 18 18 6" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  bolt: (
    <>
      <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  empty: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="4" />
      <path d="M4 14h5l2 2h2l2-2h5M9 9h6" />
    </>
  ),
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`axolotl-nav-icon ${className}`}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
