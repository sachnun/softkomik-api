import { GENRES } from './constants'
import { request } from './http'
import { extractNextData, transformComicListing } from './utils'
import type { SearchResult, ListPageData } from './types'

/**
 * Scrape by type (manga/manhwa/manhua)
 */
export const scrapeByType = async (type: string, page: number = 1): Promise<SearchResult> => {
  const url = page > 1 ? `/komik/type/${type}?page=${page}` : `/komik/type/${type}`
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
 * Scrape by genre
 */
export const scrapeByGenre = async (genre: string, page: number = 1): Promise<SearchResult> => {
  const url = page > 1 ? `/komik/genre/${genre}?page=${page}` : `/komik/genre/${genre}`
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
 * Get genres list
 */
export const getGenres = (): string[] => {
  return GENRES
}
