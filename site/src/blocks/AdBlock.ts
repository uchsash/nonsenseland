import type { Block } from 'payload'

/**
 * An ad placed by hand inside a text. In articles it shows where it is placed;
 * in book chapters it is always moved to the end of the chapter.
 */
export const AdBlock: Block = {
  slug: 'ad',
  labels: { singular: 'Ad', plural: 'Ads' },
  fields: [
    {
      name: 'ad',
      type: 'relationship',
      relationTo: 'ads',
      admin: {
        description:
          'Pick an ad from “Ads & promos”, or leave empty to show any active ad. Hidden automatically when ads are off or the ad has expired.',
      },
    },
  ],
}
