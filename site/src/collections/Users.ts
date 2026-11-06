import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, isAdmin, isStaff } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    // Readers (phase 2) never get into the admin panel.
    admin: ({ req }) => isStaff({ req }),
    read: ({ req }) => {
      if (isAdmin({ req })) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    create: adminOnly,
    update: ({ req }) => {
      if (isAdmin({ req })) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'reader',
      saveToJWT: true,
      access: { update: adminFieldOnly },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Reader', value: 'reader' },
      ],
    },
    {
      name: 'kindleEmail',
      type: 'email',
      admin: { description: 'Saved Send-to-Kindle address (readers, phase 2).' },
    },
  ],
  hooks: {
    beforeChange: [
      // The very first account becomes the admin.
      async ({ req, operation, data }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
        if (totalDocs === 0) data.role = 'admin'
        return data
      },
    ],
  },
}
