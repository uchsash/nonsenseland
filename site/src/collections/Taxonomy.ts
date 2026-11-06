import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '../access'
import { slugField } from '../utilities/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'order'],
    group: 'Content',
  },
  defaultSort: 'order',
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Name (Bangla)' },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Articles', value: 'article' },
        { label: 'Videos', value: 'video' },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: { description: 'Optional. Only for real sub-categories.' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    slugField('name'),
  ],
}

export const Topics: CollectionConfig = {
  slug: 'topics',
  labels: { singular: 'Topic', plural: 'Topics' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Topics (বিষয়) work across all categories, e.g. বিজ্ঞান, অর্থনীতি.',
  },
  defaultSort: 'name',
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'name', type: 'text', required: true }, slugField('name')],
}

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Writer', plural: 'Writers' },
  admin: { useAsTitle: 'name', group: 'Content' },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    slugField('name'),
  ],
}
