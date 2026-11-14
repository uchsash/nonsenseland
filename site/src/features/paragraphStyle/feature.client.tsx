'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $isElementNode,
  $isRangeSelection,
  $setState,
  type BaseSelection,
  createState,
  type ElementNode,
  type LexicalEditor,
  ParagraphNode,
} from '@payloadcms/richtext-lexical/lexical'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

type Space = 'none' | 'more'

const spaceState = createState('space', {
  parse: (value) => (value === 'none' || value === 'more' ? (value as Space) : undefined),
})
const noIndentState = createState('noIndent', {
  parse: (value) => (value === true ? true : undefined),
})
const signatureState = createState('signature', {
  parse: (value) => (value === true ? true : undefined),
})

/** The paragraphs touched by the selection. */
const selectedParagraphs = (selection: BaseSelection | null): ElementNode[] => {
  if (!$isRangeSelection(selection)) return []
  const found = new Map<string, ElementNode>()
  for (const node of selection.getNodes()) {
    const block = $isElementNode(node) && !node.isInline() ? node : node.getTopLevelElement()
    if (block instanceof ParagraphNode) found.set(block.getKey(), block)
  }
  return [...found.values()]
}

const setSpace = (editor: LexicalEditor, value: Space | undefined) =>
  editor.update(() => selectedParagraphs($getSelection()).forEach((p) => $setState(p, spaceState, value)))

const toggleNoIndent = (editor: LexicalEditor) =>
  editor.update(() => {
    const paragraphs = selectedParagraphs($getSelection())
    const allOn = paragraphs.length > 0 && paragraphs.every((p) => $getState(p, noIndentState))
    paragraphs.forEach((p) => $setState(p, noIndentState, allOn ? undefined : true))
  })

const toggleSignature = (editor: LexicalEditor) =>
  editor.update(() => {
    const paragraphs = selectedParagraphs($getSelection())
    const allOn = paragraphs.length > 0 && paragraphs.every((p) => $getState(p, signatureState))
    paragraphs.forEach((p) => $setState(p, signatureState, allOn ? undefined : true))
  })

const spaceIs = (value: Space | undefined) => ({ selection }: { selection: BaseSelection }) => {
  const paragraphs = selectedParagraphs(selection)
  return paragraphs.length > 0 && paragraphs.every((p) => $getState(p, spaceState) === value)
}

/** Shows the settings in the editor: real spacing, and a faint ⇤ for “no indent”. */
function ParagraphStylePlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(
    () =>
      editor.registerMutationListener(ParagraphNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            if (mutation === 'destroyed') continue
            const dom = editor.getElementByKey(key)
            const node = $getNodeByKey(key)
            if (!dom || !node) continue
            const space = $getState(node, spaceState)
            dom.style.marginTop = space === 'none' ? '-0.6em' : space === 'more' ? '1.6em' : ''
            dom.toggleAttribute('data-nl-noindent', Boolean($getState(node, noIndentState)))
            const signature = Boolean($getState(node, signatureState))
            dom.style.fontFamily = signature ? "'Li Mainak Signature', serif" : ''
            dom.style.fontSize = signature ? '1.15em' : ''
          }
        })
      }),
    [editor],
  )
  return null
}

const Icon = () => (
  <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1, padding: '0 2px' }} aria-hidden>
    ¶
  </span>
)

const groups = [
  {
    type: 'dropdown' as const,
    ChildComponent: Icon,
    key: 'paragraphStyle',
    order: 35,
    items: [
      {
        key: 'space-none',
        label: 'Space above: none',
        isActive: spaceIs('none'),
        onSelect: ({ editor }: { editor: LexicalEditor }) => setSpace(editor, 'none'),
        order: 1,
      },
      {
        key: 'space-normal',
        label: 'Space above: normal',
        isActive: spaceIs(undefined),
        onSelect: ({ editor }: { editor: LexicalEditor }) => setSpace(editor, undefined),
        order: 2,
      },
      {
        key: 'space-more',
        label: 'Space above: more',
        isActive: spaceIs('more'),
        onSelect: ({ editor }: { editor: LexicalEditor }) => setSpace(editor, 'more'),
        order: 3,
      },
      {
        key: 'no-indent',
        label: 'No indent (ইনডেন্ট নয়)',
        isActive: ({ selection }: { selection: BaseSelection }) => {
          const paragraphs = selectedParagraphs(selection)
          return paragraphs.length > 0 && paragraphs.every((p) => $getState(p, noIndentState))
        },
        onSelect: ({ editor }: { editor: LexicalEditor }) => toggleNoIndent(editor),
        order: 4,
      },
      {
        key: 'signature',
        label: 'Signature (মৈনাক সিগনেচার)',
        isActive: ({ selection }: { selection: BaseSelection }) => {
          const paragraphs = selectedParagraphs(selection)
          return paragraphs.length > 0 && paragraphs.every((p) => $getState(p, signatureState))
        },
        onSelect: ({ editor }: { editor: LexicalEditor }) => toggleSignature(editor),
        order: 5,
      },
    ],
  },
]

export const ParagraphStyleFeatureClient = createClientFeature({
  plugins: [{ Component: ParagraphStylePlugin, position: 'normal' }],
  toolbarFixed: { groups },
  toolbarInline: { groups },
})
