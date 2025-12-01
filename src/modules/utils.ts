import { load } from 'cheerio'
import { BASE_URL, IMAGE_BASE_URL, COVER_BASE_URL } from './constants'
import type { ComicListing, RawComicItem } from './types'

/**
 * Extract __NEXT_DATA__ JSON from HTML
 */
export const extractNextData = <T>(html: string): T | null => {
  const $ = load(html)
  const scriptContent = $('#__NEXT_DATA__').html()

  if (!scriptContent) return null

  try {
    const data = JSON.parse(scriptContent)
    return data.props?.pageProps?.data as T
  } catch {
    return null
  }
}

/**
 * Resolve image URL to full path
 */
export const resolveImage = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath

  // Normalize path - remove leading slash
  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath

  // For cover images (image-cover/..., uploads-cover/..., uploads-cover-2/...)
  if (normalizedPath.startsWith('image-cover/') || normalizedPath.startsWith('uploads-cover')) {
    return `${COVER_BASE_URL}/${normalizedPath}`
  }

  // For chapter images - need /softkomik/ prefix
  // Patterns: NodeJs/new-nodeJs/..., img-file/...
  if (normalizedPath.startsWith('NodeJs/') || normalizedPath.startsWith('img-file/')) {
    return `${IMAGE_BASE_URL}/softkomik/${normalizedPath}`
  }

  return `${IMAGE_BASE_URL}/${normalizedPath}`
}

/**
 * Extract slug without "-bahasa-indonesia" suffix
 */
export const extractSlug = (titleSlug: string): string => {
  return titleSlug.replace(/-bahasa-indonesia$/, '')
}

/**
 * Transform raw comic item to ComicListing
 */
export const transformComicListing = (item: RawComicItem): ComicListing => ({
  title: item.title,
  slug: extractSlug(item.title_slug),
  url: `${BASE_URL}/${item.title_slug}`,
  thumbnail: resolveImage(item.gambar),
  type: item.type || null,
  status: item.status || null,
  latestChapter: item.latest_chapter || null,
  updatedAt: item.updated_at || null
})
