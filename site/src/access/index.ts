import type { Access, FieldAccess, PayloadRequest } from 'payload'

type Role = 'admin' | 'editor' | 'reader'

const hasRole = (req: PayloadRequest, roles: Role[]) => {
  const role = (req.user as { role?: Role } | null)?.role
  return Boolean(role && roles.includes(role))
}

export const isStaff = ({ req }: { req: PayloadRequest }) => hasRole(req, ['admin', 'editor'])
export const isAdmin = ({ req }: { req: PayloadRequest }) => hasRole(req, ['admin'])

export const staffOnly: Access = ({ req }) => isStaff({ req })
export const adminOnly: Access = ({ req }) => isAdmin({ req })
export const anyone: Access = () => true

/** Staff see drafts; everyone else only sees published documents. */
export const publishedOrStaff: Access = ({ req }) => {
  if (isStaff({ req })) return true
  return { _status: { equals: 'published' } }
}

export const adminFieldOnly: FieldAccess = ({ req }) => isAdmin({ req })
