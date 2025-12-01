// === PUBLIC TYPES ===

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

export type RawComicItem = {
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

export type RawComicDetail = {
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

export type RawChapterData = {
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

export type HomePageData = {
  newKomik: RawComicItem[]
  updateNonProject: RawComicItem[]
}

export type ListPageData = {
  page: number
  maxPage: number
  data: RawComicItem[]
}
