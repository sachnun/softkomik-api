# Softkomik API

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sachnun/softkomik-api)

REST API for scraping comic data from softkomik.com. Built with Hono on Cloudflare Workers.

## Requirements

- Node.js 18+
- Cloudflare account

## Development

```bash
npm install
npm run dev
```

Server runs at http://localhost:8787

## Deploy to Cloudflare Workers

1. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Worker will be live at: `https://softkomik-api.<username>.workers.dev`

## API Documentation

Interactive API docs available at `/docs` (Swagger UI).

## License

MIT
