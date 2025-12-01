import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import { 
  scrapeNewComics, 
  scrapeLatestUpdates,
  scrapeComicList,
  scrapeComicDetail,
  scrapeChapterImages,
  scrapeByType,
  scrapeByGenre,
  getGenres
} from './modules'

const app = new Hono()

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

// Error handler
app.onError((err, c) => {
  console.error('Error:', err.message)
  return c.json({
    success: false,
    error: err.message || 'Internal server error'
  }, 500)
})

// OpenAPI Specification
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Softkomik API',
    version: '1.0.0',
    description: 'REST API for scraping comic data from softkomik.com. Built with Hono and runs on Cloudflare Workers.',
    contact: {
      name: 'Softkomik API'
    }
  },
  servers: [
    { url: '/', description: 'Current server' }
  ],
  tags: [
    { name: 'Home', description: 'Homepage data endpoints' },
    { name: 'Comics', description: 'Comic list, detail, and chapter endpoints' },
    { name: 'Browse', description: 'Browse by type and genre' }
  ],
  paths: {
    '/api/home/new': {
      get: {
        tags: ['Home'],
        summary: 'Get new comics',
        description: 'Returns list of new comics from homepage "Komik Baru" section',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComicListResponse' },
                example: {
                  success: true,
                  source: 'softkomik.com',
                  type: 'new_comics',
                  count: 6,
                  data: [
                    {
                      title: 'Solo Leveling',
                      slug: 'solo-leveling',
                      url: 'https://softkomik.com/solo-leveling-bahasa-indonesia',
                      thumbnail: 'https://image.softkomik.com/image-cover/solo-leveling.webp',
                      type: 'manhwa',
                      status: 'ongoing',
                      latestChapter: '179.5',
                      updatedAt: '2025-11-21T12:53:06.341Z'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/home/latest': {
      get: {
        tags: ['Home'],
        summary: 'Get latest updates',
        description: 'Returns list of recently updated comics from homepage "Update Terbaru" section',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComicListResponse' }
              }
            }
          }
        }
      }
    },
    '/api/comics': {
      get: {
        tags: ['Comics'],
        summary: 'List comics',
        description: 'Returns paginated list of comics with optional search',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search keyword',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedComicResponse' }
              }
            }
          }
        }
      }
    },
    '/api/comics/{slug}': {
      get: {
        tags: ['Comics'],
        summary: 'Get comic detail',
        description: 'Returns detailed information about a comic including genres, description, and latest chapter',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Comic slug (e.g., solo-leveling)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComicDetailResponse' },
                example: {
                  success: true,
                  source: 'softkomik.com',
                  slug: 'solo-leveling',
                  data: {
                    title: 'Solo Leveling',
                    alternativeTitle: 'Aku Level Up Sendiri, I Alone Level Up',
                    type: 'manhwa',
                    status: 'ongoing',
                    releaseYear: null,
                    author: 'Chugong',
                    rating: { value: 5, member: 5 },
                    description: '10 tahun yang lalu...',
                    genres: ['Action', 'Adventure', 'Fantasy'],
                    thumbnail: 'https://image.softkomik.com/image-cover/solo-leveling.webp',
                    visitor: 5802,
                    latestChapter: '179.5',
                    updatedAt: '2025-11-21T12:53:06.341Z'
                  }
                }
              }
            }
          },
          '404': {
            description: 'Comic not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/comics/{slug}/chapter/{chapter}': {
      get: {
        tags: ['Comics'],
        summary: 'Get chapter images',
        description: 'Returns all image URLs for a specific chapter, with prev/next chapter navigation',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Comic slug',
            schema: { type: 'string' }
          },
          {
            name: 'chapter',
            in: 'path',
            required: true,
            description: 'Chapter number (e.g., 1, 179, 179.5)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChapterImagesResponse' },
                example: {
                  success: true,
                  source: 'softkomik.com',
                  data: {
                    title: 'Solo Leveling',
                    comicSlug: 'solo-leveling',
                    chapterNumber: '179',
                    images: [
                      'https://image.softkomik.com/NodeJs/new-nodeJs/solo-leveling-bahasa-indonesia/chapter-179/softkomik-0.webp',
                      'https://image.softkomik.com/NodeJs/new-nodeJs/solo-leveling-bahasa-indonesia/chapter-179/softkomik-1.webp'
                    ],
                    prevChapter: '178',
                    nextChapter: '179.5'
                  }
                }
              }
            }
          },
          '404': {
            description: 'Chapter not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/genres': {
      get: {
        tags: ['Browse'],
        summary: 'Get genres list',
        description: 'Returns list of available genres for filtering',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenresResponse' },
                example: {
                  success: true,
                  source: 'softkomik.com',
                  count: 36,
                  data: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy']
                }
              }
            }
          }
        }
      }
    },
    '/api/type/{type}': {
      get: {
        tags: ['Browse'],
        summary: 'Browse by type',
        description: 'Returns comics filtered by type (manga, manhwa, or manhua)',
        parameters: [
          {
            name: 'type',
            in: 'path',
            required: true,
            description: 'Comic type',
            schema: { type: 'string', enum: ['manga', 'manhwa', 'manhua'] }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedComicResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/genre/{genre}': {
      get: {
        tags: ['Browse'],
        summary: 'Browse by genre',
        description: 'Returns comics filtered by genre',
        parameters: [
          {
            name: 'genre',
            in: 'path',
            required: true,
            description: 'Genre name (e.g., Action, Romance, Fantasy)',
            schema: { type: 'string' }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedComicResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ComicListing: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Comic title' },
          slug: { type: 'string', description: 'Comic slug for URL' },
          url: { type: 'string', description: 'Full URL to comic page' },
          thumbnail: { type: 'string', nullable: true, description: 'Cover image URL' },
          type: { type: 'string', nullable: true, enum: ['manga', 'manhwa', 'manhua'] },
          status: { type: 'string', nullable: true, description: 'ongoing or completed' },
          latestChapter: { type: 'string', nullable: true, description: 'Latest chapter number' },
          updatedAt: { type: 'string', nullable: true, description: 'Last update timestamp' }
        }
      },
      ComicDetail: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          alternativeTitle: { type: 'string', nullable: true },
          type: { type: 'string', nullable: true },
          status: { type: 'string', nullable: true },
          releaseYear: { type: 'string', nullable: true },
          author: { type: 'string', nullable: true },
          rating: {
            type: 'object',
            nullable: true,
            properties: {
              value: { type: 'number' },
              member: { type: 'number' }
            }
          },
          description: { type: 'string', nullable: true },
          genres: { type: 'array', items: { type: 'string' } },
          thumbnail: { type: 'string', nullable: true },
          visitor: { type: 'number', nullable: true },
          latestChapter: { type: 'string', nullable: true },
          updatedAt: { type: 'string', nullable: true }
        }
      },
      ChapterImages: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          comicSlug: { type: 'string' },
          chapterNumber: { type: 'string' },
          images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs' },
          prevChapter: { type: 'string', nullable: true },
          nextChapter: { type: 'string', nullable: true }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' }
        }
      },
      ComicListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          source: { type: 'string' },
          type: { type: 'string' },
          count: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/ComicListing' } }
        }
      },
      PaginatedComicResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          source: { type: 'string' },
          search: { type: 'string', nullable: true },
          pagination: { $ref: '#/components/schemas/Pagination' },
          count: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/ComicListing' } }
        }
      },
      ComicDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          source: { type: 'string' },
          slug: { type: 'string' },
          data: { $ref: '#/components/schemas/ComicDetail' }
        }
      },
      ChapterImagesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          source: { type: 'string' },
          data: { $ref: '#/components/schemas/ChapterImages' }
        }
      },
      GenresResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          source: { type: 'string' },
          count: { type: 'integer' },
          data: { type: 'array', items: { type: 'string' } }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' }
        }
      }
    }
  }
}

// Swagger UI endpoint
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

// OpenAPI JSON endpoint
app.get('/openapi.json', (c) => c.json(openApiSpec))

// Root - redirect to docs
app.get('/', (c) => c.redirect('/docs'))

// === HOME ENDPOINTS ===

// Get new comics from homepage
app.get('/api/home/new', async (c) => {
  const comics = await scrapeNewComics()
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    type: 'new_comics',
    count: comics.length,
    data: comics
  })
})

// Get latest updates from homepage
app.get('/api/home/latest', async (c) => {
  const comics = await scrapeLatestUpdates()
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    type: 'latest_updates',
    count: comics.length,
    data: comics
  })
})

// === COMICS ENDPOINTS ===

// List comics with pagination and search
app.get('/api/comics', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const search = c.req.query('search') || undefined
  
  const result = await scrapeComicList(page, search)
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    search: search || null,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      hasNext: result.currentPage < result.totalPages,
      hasPrev: result.currentPage > 1
    },
    count: result.comics.length,
    data: result.comics
  })
})

// Get comic detail
app.get('/api/comics/:slug', async (c) => {
  const { slug } = c.req.param()
  const detail = await scrapeComicDetail(slug)
  
  if (!detail) {
    return c.json({
      success: false,
      error: 'Comic not found'
    }, 404)
  }
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    slug,
    data: detail
  })
})

// Get chapter images
app.get('/api/comics/:slug/chapter/:chapter', async (c) => {
  const { slug, chapter } = c.req.param()
  const images = await scrapeChapterImages(slug, chapter)
  
  if (!images) {
    return c.json({
      success: false,
      error: 'Chapter not found or has no images'
    }, 404)
  }
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    data: images
  })
})

// === BROWSE ENDPOINTS ===

// Get genres list
app.get('/api/genres', (c) => {
  const genres = getGenres()
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    count: genres.length,
    data: genres
  })
})

// Browse by type
app.get('/api/type/:type', async (c) => {
  const { type } = c.req.param()
  const page = parseInt(c.req.query('page') || '1')
  
  // Validate type
  const validTypes = ['manga', 'manhwa', 'manhua']
  if (!validTypes.includes(type.toLowerCase())) {
    return c.json({
      success: false,
      error: `Invalid type. Valid types: ${validTypes.join(', ')}`
    }, 400)
  }
  
  const result = await scrapeByType(type.toLowerCase(), page)
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    type,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      hasNext: result.currentPage < result.totalPages,
      hasPrev: result.currentPage > 1
    },
    count: result.comics.length,
    data: result.comics
  })
})

// Browse by genre
app.get('/api/genre/:genre', async (c) => {
  const { genre } = c.req.param()
  const page = parseInt(c.req.query('page') || '1')
  
  const result = await scrapeByGenre(genre, page)
  
  return c.json({
    success: true,
    source: 'softkomik.com',
    genre,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      hasNext: result.currentPage < result.totalPages,
      hasPrev: result.currentPage > 1
    },
    count: result.comics.length,
    data: result.comics
  })
})

export default app
