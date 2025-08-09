# Dynamic Interface Compiler — Backend

Node.js + Express + MongoDB backend that generates UI schemas from natural language (via Google Gemini) and persists them. Exposes REST endpoints to generate, store, query, update, and delete schemas.

## Tech Stack
- Express (`server.js`)
- MongoDB via Mongoose
- Google Generative AI (Gemini) SDK
- dotenv, cors

## Getting Started

### 1) Prerequisites
- Node.js 18+ (Node 22 used in Dockerfile)
- MongoDB connection string
- Google Gemini API key

### 2) Install
```bash
npm install
```

### 3) Environment Variables
Create a `.env` file in `backend/` with:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
PORT=3001                # optional, defaults to 3001
NODE_ENV=development     # optional
```

### 4) Run
- Development (with nodemon):
```bash
npm run dev
```
- Production:
```bash
npm start
```
Server starts on `http://localhost:<PORT>` (default `3001`). Health check at `GET /health`.

## API
Base URL prefix for feature routes: `/api`

- POST `/api/generate-schema`
  - Body: `{ "prompt": "Create a contact form with name, email, and message" }`
  - Returns: `{ success, schema: Array, prompt }`

- GET `/api/schemas`
  - Query latest up to 50 schemas.

- GET `/api/schemas/:id`
  - Returns one schema by Mongo ObjectId.

- POST `/api/schemas`
  - Body: `{ name: string, description?: string, schema: Array }`
  - Validates component types: `form | text | image`.

- PUT `/api/schemas/:id`
  - Update `name`, `description`, `schema`.

- DELETE `/api/schemas/:id`
  - Remove schema by id.

- GET `/health`
  - `{ status: 'OK', message: 'Dynamic Interface Compiler API is running' }`

### Example cURL
Generate a schema:
```bash
curl -X POST http://localhost:3001/api/generate-schema \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a contact form with name, email, and message"}'
```

Create a schema:
```bash
curl -X POST http://localhost:3001/api/schemas \
  -H "Content-Type: application/json" \
  -d '{"name":"Contact Form","description":"Basic contact page","schema":[{"type":"text","content":"Contact Us","variant":"h1"}]}'
```

## Project Structure
```
backend/
  server.js
  routes/
    gemini.js      # POST /api/generate-schema
    schemas.js     # CRUD: /api/schemas
  models/
    UISchema.js    # Mongoose model (referenced in routes)
  package.json
  Dockerfile
  vercel.json
  .env (local only)
```

## Deployment Notes
- Dockerfile exposes port `3000`, while the app defaults to `PORT=3001`.
  - Either set `PORT=3000` in the container or publish the correct internal port when running Docker.
  - Example:
    ```bash
    docker build -t dic-backend .
    docker run --env-file .env -p 3000:3001 dic-backend  # host:container
    ```
- `vercel.json` currently points to `index.js`, but the entrypoint is `server.js`. If deploying on Vercel, update the config or create an adapter/entry that aligns with `server.js`.
- `package.json` scripts already start `server.js` (`npm start`).


