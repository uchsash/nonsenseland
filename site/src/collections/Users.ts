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
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
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
      admin: { description: 'Saved Send-to-Kindle address.' },
    },
    {
      // Set by Google sign-in or a password-reset email: this address is proven to be theirs.
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      access: { create: adminFieldOnly, update: adminFieldOnly },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'googleId',
      type: 'text',
      index: true,
      access: { read: adminFieldOnly, create: adminFieldOnly, update: adminFieldOnly },
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  hooks: {
    beforeDelete: [
      // A reader's own records go with the account; the like totals they touched are corrected.
      async ({ id, req }) => {
        const mine = { user: { equals: id } }
        const { docs } = await req.payload.find({ collection: 'likes', where: mine, limit: 5000, depth: 0, pagination: false, req })
        await req.payload.delete({ collection: 'likes', where: mine, req })
        await req.payload.delete({ collection: 'bookmarks', where: mine, req })
        await req.payload.delete({ collection: 'reading-progress', where: mine, req })
        for (const like of docs) {
          const alap = typeof like.alap === 'object' ? like.alap.id : like.alap
          const { totalDocs } = await req.payload.count({ collection: 'likes', where: { alap: { equals: alap } }, req })
          await req.payload.db.updateOne({ collection: 'alap', id: alap, data: { likeCount: totalDocs }, req, returning: false })
        }
      },
    ],
    beforeChange: [
      // The very first account becomes the admin.
      async ({ req, operation, data, originalDoc, context }) => {
        if (operation === 'update') {
          // A changed address is no longer proven.
          if (data.email && data.email !== originalDoc?.email && !context.keepVerified) data.emailVerified = false
          return data
        }
        if (operation !== 'create' || context.readerSignup) return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
        if (totalDocs === 0) data.role = 'admin'
        return data
      },
    ],
  },
}
