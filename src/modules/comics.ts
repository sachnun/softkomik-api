import { request } from './http'
import { extractNextData, transformComicListing, resolveImage } from './utils'
import type { ComicDetail, SearchResult, ListPageData, RawComicDetail } from './types'

/**
 * Scrape comic list page with pagination and search
 */
export const scrapeComicList = async (page: number = 1, search?: string): Promise<SearchResult> => {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (search) params.set('name', search)

  const queryString = params.toString()
  const url = queryString ? `/komik/list?${queryString}` : '/komik/list'

  const html = await request(url)
  const data = extractNextData<ListPageData>(html)

  if (!data) {
    return { comics: [], currentPage: 1, totalPages: 1 }
  }

  return {
    comics: data.data.map(transformComicListing),
    currentPage: data.page,
    totalPages: data.maxPage
  }
}

/**
 * Scrape comic detail page
 */
export const scrapeComicDetail = async (slug: string): Promise<ComicDetail | null> => {
  const html = await request(`/${slug}-bahasa-indonesia`)
  const data = extractNextData<RawComicDetail>(html)

  if (!data) return null

  return {
    title: data.title,
    alternativeTitle: data.title_alt || null,
    type: data.type || null,
    status: data.status || null,
    releaseYear: data.tahun || null,
    author: data.author || null,
    rating: data.rating || null,
    description: data.sinopsis || null,
    genres: data.Genre || [],
    thumbnail: resolveImage(data.gambar),
    visitor: data.visitor || null,
    latestChapter: data.latest_chapter || null,
    updatedAt: data.updated_at || null
  }
}
