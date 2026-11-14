import type { Field } from 'payload'

/**
 * Where a file sits in R2. The R2 storage plugin adds this field on Cloudflare only; declaring
 * it here too keeps the database columns the same in development and on the live site.
 */
export const objectKeyField: Field = {
  name: '_objectKey',
  type: 'text',
  admin: { hidden: true, readOnly: true, disableBulkEdit: true, disableListColumn: true, disableListFilter: true },
}
