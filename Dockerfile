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

# BUILD_CACHE_BUST — updated by deploy-to-dokploy.sh on every deploy.
# RUN echo creates a real Docker layer whose cache key includes the timestamp string.
# When the timestamp changes, this layer and ALL subsequent layers (COPY, esbuild) are
# invalidated, guaranteeing Docker always copies the fresh dist/public/ bundle from git.
RUN echo "BUILD_TIMESTAMP: 2026-05-01T11:59:57Z"

COPY . .

# dist/public/ is pre-built in Replit (where VITE_* secrets are available) and committed to git.
# client/src/buildTimestamp.ts is written with a unique timestamp by deploy-to-dokploy.sh on
# every deploy, guaranteeing Docker's COPY layer is always a content-hash cache MISS.
# Only build the server-side bundle here — Vite MUST NOT run in Docker (no VITE_* env vars).
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
