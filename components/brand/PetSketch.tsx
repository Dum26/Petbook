export function PetSketch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 220" fill="none" aria-hidden="true" className={className}>
      <circle cx="158" cy="111" r="87" fill="#D6E3D5" />
      <path d="m227 25 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#BD674E" />
      <path d="m42 105 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#BE9B64" />
      <g transform="rotate(-9 113 120)">
        <path d="M61 87c-13-5-24 1-26 16-2 19 10 39 24 34l11-27-9-23Z" fill="#BB7953" />
        <path d="M138 85c14-6 26 0 29 15 3 19-7 39-21 36l-13-26 5-25Z" fill="#BB7953" />
        <rect x="53" y="73" width="100" height="105" rx="44" fill="#E2AE7F" />
        <path d="M94 76c-19 15-20 44-12 61l20-1 11-58-19-2Z" fill="#F1CDA6" />
        <ellipse cx="104" cy="148" rx="32" ry="25" fill="#FAE8D0" />
        <ellipse cx="80" cy="120" rx="4" ry="6" fill="#353C36" />
        <ellipse cx="127" cy="120" rx="4" ry="6" fill="#353C36" />
        <path d="M97 140c0-7 15-7 15 0 0 4-7 8-7 8s-8-4-8-8Z" fill="#353C36" />
        <path d="M105 148v9m0 0c-4 4-10 2-12-1m12 1c4 4 10 2 12-1" stroke="#353C36" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M97 162h16c0 15-16 15-16 0Z" fill="#D78179" />
        <path d="M70 177c19 7 46 7 67-1" stroke="#6F8875" strokeWidth="10" strokeLinecap="round" />
        <circle cx="105" cy="183" r="7" fill="#D5AE67" />
      </g>
      <g transform="rotate(11 203 130)">
        <path d="m156 104 3-49 34 31m28 0 28-28 2 48" fill="#F8F5EE" stroke="#E7E0D3" strokeWidth="2" strokeLinejoin="round" />
        <path d="m164 86 1-18 14 15m51 0 12-13 1 18" fill="#E9B5A4" />
        <rect x="151" y="82" width="104" height="100" rx="43" fill="#F8F5EE" />
        <path d="M193 82v20m13-20v20m13-17v16" stroke="#C9C7BC" strokeWidth="5" strokeLinecap="round" />
        <path d="m173 125 5 2 5-2m39 0 5 2 5-2" stroke="#353C36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m198 141 6 6 6-6h-12Z" fill="#D99180" />
        <path d="M204 147v7m0 0c-5 4-9 1-11-1m11 1c5 4 9 1 11-1" stroke="#353C36" strokeWidth="2" strokeLinecap="round" />
        <path d="m158 141 23 4m-25 5 24 1m67-10-22 4m24 5-23 1" stroke="#A9B1A7" strokeWidth="2" strokeLinecap="round" />
        <path d="M167 179c22 6 49 6 70-2" stroke="#C76F53" strokeWidth="9" strokeLinecap="round" />
        <circle cx="205" cy="184" r="7" fill="#D5AE67" />
      </g>
      <path d="M57 48c-6-9-18-4-15 4 2 7 15 14 15 14s13-7 15-14c3-8-9-13-15-4Z" fill="#C76F53" />
      <path d="M68 207c36-5 125-7 177-1" stroke="#B9CDBA" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
