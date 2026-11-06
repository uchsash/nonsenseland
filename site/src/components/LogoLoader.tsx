/**
 * The Nonsenseland icon, animated: the big ring draws itself, the small ring turns,
 * the leaves sway and the play arrow pulses. Shown while a page is loading.
 */
export function LogoLoader({ label }: { label: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <svg viewBox="0 0 220 220" width="96" height="96" aria-hidden="true">
        <polygon className="ld-play" points="105.81 173.16 92.92 165.71 92.92 180.6 105.81 173.16" fill="#f47335" />
        <circle className="ld-ring" cx="128.57" cy="100.92" r="66.12" fill="none" stroke="#f15a24" strokeWidth="10" />
        <g className="ld-small">
          <circle cx="62.14" cy="161.45" r="23.76" fill="none" stroke="#f19224" strokeWidth="10" />
          <path
            d="m66.49,184.8c-6.02,1.12-12.48-.07-17.91-3.85-6.73-4.68-10.3-12.22-10.2-19.84"
            fill="none"
            stroke="#f15a24"
            strokeWidth="10"
          />
        </g>
        <path
          className="ld-arc"
          d="m175.32,147.68c-25.82,25.82-67.69,25.82-93.51,0"
          fill="none"
          stroke="#f19224"
          strokeWidth="10"
        />
        <line x1="38.38" y1="161.91" x2="38.38" y2="139.45" stroke="#f15a24" strokeWidth="10" />
        <g className="ld-leaves" fill="#f15a24">
          <path d="m33.39,122.12c2.26,3.73,3.38,7.88,3.49,12,.02.64-.65,1.04-1.17.7-2.71-1.79-5.08-4.22-6.91-7.25-2.26-3.73-3.38-7.88-3.49-12-.02-.64.65-1.04,1.17-.7,2.71,1.79,5.08,4.22,6.91,7.25Z" />
          <path d="m44.6,128.52c-1.16,3.22-3.17,5.83-5.67,7.66-.36-2.64-.11-5.41.85-8.08,1.16-3.22,3.17-5.83,5.67-7.66.36,2.64.11,5.41-.85,8.08Z" />
        </g>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
