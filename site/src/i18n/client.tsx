'use client'

import { createContext, use } from 'react'

import { defaults, type UiText } from './bn'

const UiTextContext = createContext<UiText>(defaults)

/** Makes the admin-edited interface text available to browser-side components. */
export function UiTextProvider({ value, children }: { value: UiText; children: React.ReactNode }) {
  return <UiTextContext value={value}>{children}</UiTextContext>
}

export const useT = () => use(UiTextContext)
