import type { Metadata } from 'next'

import { ArticleCard } from '@/components/Cards'
import { CategoryChips, Pager, pageHref } from '@/components/ListPage'
import { getT } from '@/i18n/server'
import { getCategories, listArticles } from '@/lib/data'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.nav.articles }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const t = await getT()
  const { category, page } = await searchParams
  const categories = await getCategories('article')
  const active = categories.find((c) => c.slug === category)
  const current = Math.max(1, Number(page) || 1)
  const articles = await listArticles({ category: active?.id, page: current, limit: 18 })

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>{active?.name ?? t.nav.articles}</h1>
      </header>
      <CategoryChips base="/articles" categories={categories} active={active?.slug ?? undefined} />
      {articles.docs.length ? (
        <div className="grid">
          {articles.docs.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <p className="empty">{t.common.empty}</p>
      )}
      <Pager page={current} totalPages={articles.totalPages} href={pageHref('/articles', active?.slug ?? undefined)} />
    </div>
  )
}
