# SmoothEdit (Node/Express + Vite)

## Quick Start
1) `cp .env.example .env` and fill values
2) Install: `npm install`
3) Dev: `npm run dev`  # uses tsx on server/index.ts
4) Build: `npm run build`  # builds client + server to dist/
5) Start: `npm start`  # runs node dist/index.js

## Env Vars
- DATABASE_URL=postgres://...

## Deploy
- Render Web Service:
  - Build: `npm install && npm run build`
  - Start: `npm start`
  - Root: repository root
- AWS Elastic Beanstalk (Node.js):
  - Zip repo (exclude node_modules) and upload
  - Healthcheck: `/health`
  - PORT is 8080 via .ebextensions