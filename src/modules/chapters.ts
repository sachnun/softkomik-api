import { load } from 'cheerio'
import { request } from './http'
import { resolveImage } from './utils'
import type { ChapterImages, RawChapterData } from './types'

/**
 * Generate chapter number variations to try
 * e.g., "8" -> ["8", "08", "008"], "179.5" -> ["179.5"]
 */
const getChapterVariations = (chapter: string): string[] => {
  const variations: string[] = [chapter]

  // Check if it's a simple integer (no decimal)
  const num = parseInt(chapter)
  if (!isNaN(num) && String(num) === chapter) {
    // Add padded versions: 01, 001, 0001
    if (chapter.length < 2) variations.push(num.toString().padStart(2, '0'))
    if (chapter.length < 3) variations.push(num.toString().padStart(3, '0'))
    if (chapter.length < 4) variations.push(num.toString().padStart(4, '0'))
  }

  return [...new Set(variations)] // Remove duplicates
}

/**
 * Try to fetch chapter data with different chapter number formats
 */
const tryFetchChapter = async (comicSlug: string, chapter: string): Promise<{ html: string; usedChapter: string } | null> => {
  const variations = getChapterVariations(chapter)

  for (const chapterVar of variations) {
    try {
      const html = await request(`/${comicSlug}-bahasa-indonesia/chapter/${chapterVar}`)
      const $ = load(html)
      const scriptContent = $('#__NEXT_DATA__').html()

      if (scriptContent) {
        const fullData = JSON.parse(scriptContent)
        const chapterData = fullData.props?.pageProps?.data

        // Check if this variation has actual image data
        if (chapterData?.data?.imageSrc && chapterData.data.imageSrc.length > 0) {
          return { html, usedChapter: chapterVar }
        }
      }
    } catch {
      // Continue to next variation
    }
  }

  // If no variation has images, return the first one that loaded
  for (const chapterVar of variations) {
    try {
      const html = await request(`/${comicSlug}-bahasa-indonesia/chapter/${chapterVar}`)
      return { html, usedChapter: chapterVar }
    } catch {
      // Continue to next variation
    }
  }

  return null
}

/**
 * Scrape chapter images
 */
export const scrapeChapterImages = async (comicSlug: string, chapter: string): Promise<ChapterImages | null> => {
  const result = await tryFetchChapter(comicSlug, chapter)
  if (!result) return null

  const { html, usedChapter } = result
  const $ = load(html)

  // Extract from __NEXT_DATA__
  const scriptContent = $('#__NEXT_DATA__').html()
  if (!scriptContent) return null

  let chapterData: RawChapterData | null = null
  try {
    const fullData = JSON.parse(scriptContent)
    chapterData = fullData.props?.pageProps?.data as RawChapterData
  } catch {
    return null
  }

  if (!chapterData) return null

  // Build image URLs
  const images: string[] = []
  if (chapterData.data?.imageSrc) {
    for (const src of chapterData.data.imageSrc) {
      const fullUrl = resolveImage(src)
      if (fullUrl) images.push(fullUrl)
    }
  }

  // Get prev/next chapter
  const prevChapter = chapterData.prevChapter?.[0]?.chapter || null
  const nextChapter = chapterData.nextChapter?.[0]?.chapter || null

  return {
    title: chapterData.komik?.title || '',
    comicSlug,
    chapterNumber: usedChapter, // Return the actual chapter format used
    images,
    prevChapter,
    nextChapter
  }
}
