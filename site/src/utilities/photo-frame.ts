/** The picture area inside the article header's frame, in pixels. */
export const FRAME_INNER = { w: 644, h: 564 }

export type Framing = { zoom?: number | null; focusX?: number | null; focusY?: number | null }

/**
 * Where a photo sits in the frame. Zoom 1 just fills the frame; `fit` (below 1 for photos of
 * another shape) shows the whole photo. focusX/focusY are the point of the photo kept at the
 * middle of the frame, 0–1. The admin preview and the final image both use this.
 */
export function framePhoto(size: { width: number; height: number }, { zoom, focusX, focusY }: Framing) {
  const cover = Math.max(FRAME_INNER.w / size.width, FRAME_INNER.h / size.height)
  const contain = Math.min(FRAME_INNER.w / size.width, FRAME_INNER.h / size.height)
  const fit = contain / cover
  const z = Math.min(3, Math.max(fit, zoom ?? 1))
  const width = size.width * cover * z
  const height = size.height * cover * z
  const cx = focusX ?? 0.5
  const cy = focusY ?? 0.5
  // No empty gap on a side the photo is big enough to cover; centred on a side it is not.
  const place = (span: number, frame: number, centre: number) =>
    span <= frame ? (frame - span) / 2 : Math.min(0, Math.max(frame - span, frame / 2 - centre * span))
  return {
    fit,
    zoom: z,
    cx,
    cy,
    width,
    height,
    left: place(width, FRAME_INNER.w, cx),
    top: place(height, FRAME_INNER.h, cy),
  }
}
