/** “Preview” button in the admin panel: opens the page on the site with drafts visible. */
export const previewAt =
  (prefix: string) =>
  (doc: Record<string, unknown>) =>
    doc?.slug ? `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/preview?path=${prefix}/${doc.slug}` : null
