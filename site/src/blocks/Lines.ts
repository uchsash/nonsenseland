import type { Block } from 'payload'

/** Lines shown together with no gap between them: signatures, addresses, poems. */
export const LinesBlock: Block = {
  slug: 'lines',
  labels: { singular: 'Lines without gaps', plural: 'Lines without gaps' },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: { description: 'One line per row. Shown together, without paragraph gaps.' },
    },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Centre', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
}
