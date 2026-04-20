FROM node:20-bullseye-slim

WORKDIR /app

# Install native build dependencies for packages like canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# dist/public/ is pre-built in Replit and committed to git — do NOT re-run vite build here.
# Re-running vite in Docker caused stale Docker layer cache to serve old bundles (missing features).
# Only build the server-side bundle which is fast and has no caching issues.
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
