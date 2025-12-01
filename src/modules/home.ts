import { request } from './http'
import { extractNextData, transformComicListing } from './utils'
import type { ComicListing, HomePageData } from './types'

/**
 * Scrape new comics from homepage ("Komik Baru" section)
 */
export const scrapeNewComics = async (): Promise<ComicListing[]> => {
  const html = await request('/')
  const data = extractNextData<HomePageData>(html)

  if (!data?.newKomik) return []

  return data.newKomik.map(transformComicListing)
}

/**
 * Scrape latest updates from homepage ("Update Terbaru" section)
 */
export const scrapeLatestUpdates = async (): Promise<ComicListing[]> => {
  const html = await request('/')
  const data = extractNextData<HomePageData>(html)

  if (!data?.updateNonProject) return []

  return data.updateNonProject.map(transformComicListing)
}
