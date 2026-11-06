import { createServerFeature } from '@payloadcms/richtext-lexical'

/**
 * Paragraph settings stored on each paragraph ($.space, $.noIndent):
 * space above (none / normal / more) and “no indent”. Rendered by components/RichText.tsx.
 */
export const ParagraphStyleFeature = createServerFeature({
  feature: { ClientFeature: '/features/paragraphStyle/feature.client#ParagraphStyleFeatureClient' },
  key: 'paragraphStyle',
})
