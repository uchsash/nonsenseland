import Link from 'next/link'

import type { Topic } from '@/payload-types'

export function TopicLinks({ topics }: { topics?: (number | Topic)[] | null }) {
  const list = (topics ?? []).filter((x): x is Topic => typeof x === 'object')
  if (!list.length) return null
  return (
    <div className="chips" style={{ margin: '16px 0' }}>
      {list.map((topic) => (
        <Link key={topic.id} className="chip" href={`/topics/${topic.slug}`}>
          {topic.name}
        </Link>
      ))}
    </div>
  )
}
