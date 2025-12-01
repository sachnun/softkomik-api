import { load } from 'cheerio'

const BASE_URL = 'https://softkomik.com'
const IMAGE_BASE_URL = 'https://image.softkomik.com'

// === TYPES ===

export type ComicListing = {
  title: string
  slug: string
  url: string
  thumbnail: string | null
  type: string | null // manga, manhwa, manhua
  status: string | null
  latestChapter: string | null
  updatedAt: string | null
}

export type ComicDetail = {
  title: string
  alternativeTitle: string | null
  type: string | null
  status: string | null
  releaseYear: string | null
  author: string | null
  rating: { value: number; member: number } | null
  description: string | null
  genres: string[]
  thumbnail: string | null
  visitor: number | null
  latestChapter: string | null
  updatedAt: string | null
}

export type ChapterInfo = {
  number: string
  url: string
}

export type ChapterImages = {
  title: string
  comicSlug: string
  chapterNumber: string
  images: string[]
  prevChapter: string | null
  nextChapter: string | null
}

export type SearchResult = {
  comics: ComicListing[]
  currentPage: number
  totalPages: number
}

// === RAW DATA TYPES (from __NEXT_DATA__) ===

type RawComicItem = {
  _id?: string
  title: string
  title_slug: string
  type: string
  status: string
  gambar: string
  latest_chapter: string
  updated_at: string
  project?: string
  di_update?: string
  di_update_nama?: string
  latestChapter?: number
  visitor?: number
}

type RawComicDetail = {
  _id: string
  title: string
  title_alt?: string
  title_slug: string
  type: string
  status: string
  tahun?: string | null
  author?: string
  sinopsis?: string
  Genre?: string[]
  gambar: string
  latest_chapter: string
  updated_at: string
  visitor?: number
  rating?: { value: number; member: number }
}

type RawChapterData = {
  komik: {
    title: string
    title_slug: string
    type: string
  }
  chapter: string
  data: {
    chapter: string
    imageSrc: string[]
  } | null
  prevChapter: { chapter: string }[]
  nextChapter: { chapter: string }[]
}

type HomePageData = {
  newKomik: RawComicItem[]
  updateNonProject: RawComicItem[]
}

type ListPageData = {
  page: number
  maxPage: number
  data: RawComicItem[]
}

// === HTTP REQUEST ===

const request = async (path: string): Promise<string> => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': BASE_URL,
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

// === UTILITIES ===

/**
 * Extract __NEXT_DATA__ JSON from HTML
 */
const extractNextData = <T>(html: string): T | null => {
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
const resolveImage = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  
  // For cover images (image-cover/...)
  if (imagePath.startsWith('image-cover/')) {
    return `${IMAGE_BASE_URL}/${imagePath}`
  }
  
  // For chapter images - need /softkomik/ prefix
  // Patterns: NodeJs/new-nodeJs/..., img-file/...
  if (imagePath.startsWith('NodeJs/') || imagePath.startsWith('img-file/')) {
    return `${IMAGE_BASE_URL}/softkomik/${imagePath}`
  }
  
  return `${IMAGE_BASE_URL}/${imagePath}`
}

/**
 * Extract slug without "-bahasa-indonesia" suffix
 */
const extractSlug = (titleSlug: string): string => {
  return titleSlug.replace(/-bahasa-indonesia$/, '')
}

/**
 * Transform raw comic item to ComicListing
 */
const transformComicListing = (item: RawComicItem): ComicListing => ({
  title: item.title,
  slug: extractSlug(item.title_slug),
  url: `${BASE_URL}/${item.title_slug}`,
  thumbnail: resolveImage(item.gambar),
  type: item.type || null,
  status: item.status || null,
  latestChapter: item.latest_chapter || null,
  updatedAt: item.updated_at || null
})

// === PUBLIC API ===

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
 * Get genres list (predefined list based on common genres used on softkomik.com)
 * Note: Genres are loaded dynamically on the website, so we use a static list
 */
export const getGenres = (): string[] => {
  return [
    'Action',
    'Adventure', 
    'Comedy',
    'Cooking',
    'Drama',
    'Ecchi',
    'Fantasy',
    'Harem',
    'Historical',
    'Horror',
    'Isekai',
    'Josei',
    'magic',
    'Martial Arts',
    'Mecha',
    'Military',
    'Music',
    'Mystery',
    'One Shot',
    'Psychological',
    'Romance',
    'School',
    'School Life',
    'Sci-fi',
    'Seinen',
    'Shoujo',
    'Shoujo Ai',
    'Shounen',
    'Shounen Ai',
    'Slice of Life',
    'Sports',
    'Super Power',
    'Supernatural',
    'Thriller',
    'Tragedy',
    'Webtoon'
  ].sort()
}
