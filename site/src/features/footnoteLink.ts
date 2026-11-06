import { LinkFeature } from '@payloadcms/richtext-lexical'
import type { Field, FieldAffectingData, TextFieldSingleValidation } from 'payload'

/**
 * The editor's link button with an extra type, “টীকা (Footnote)”: select a word, click
 * the link button, choose টীকা and write the note. No URL is needed for footnotes.
 */
export const FootnoteLinkFeature = LinkFeature({
  // “Internal link” lists only things that have a page on the site.
  enabledCollections: ['articles', 'books', 'videos', 'topics', 'pages'],
  fields: ({ defaultFields }) => {
    const fields: (Field | FieldAffectingData)[] = defaultFields.map((field) => {
      if (field.name === 'linkType' && field.type === 'radio') {
        return { ...field, options: [...field.options, { label: 'টীকা (Footnote)', value: 'footnote' }] }
      }
      if (field.name === 'url' && field.type === 'text') {
        const validate = field.validate as TextFieldSingleValidation | undefined
        return {
          ...field,
          required: false,
          admin: {
            ...field.admin,
            condition: (_data, sibling) => sibling?.linkType !== 'internal' && sibling?.linkType !== 'footnote',
          },
          validate: ((value, options) => {
            if (options?.siblingData && (options.siblingData as { linkType?: string }).linkType === 'footnote') {
              return true
            }
            if (!value && (options?.siblingData as { linkType?: string })?.linkType !== 'internal') {
              return 'Enter a link (URL).'
            }
            return validate ? validate(value, options) : true
          }) as TextFieldSingleValidation,
        } as FieldAffectingData
      }
      if (field.name === 'newTab') {
        return {
          ...field,
          admin: { ...field.admin, condition: (_data, sibling) => sibling?.linkType !== 'footnote' },
        } as FieldAffectingData
      }
      return field
    })
    return [
      ...fields,
      {
        name: 'note',
        type: 'textarea',
        label: 'Footnote text (টীকা)',
        admin: { condition: (_data, sibling) => sibling?.linkType === 'footnote' },
        validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
          (siblingData as { linkType?: string })?.linkType === 'footnote' && !String(value ?? '').trim()
            ? 'Write the footnote text.'
            : true,
      } as Field,
    ]
  },
})
