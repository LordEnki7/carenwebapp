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
RUN echo "BUILD_TIMESTAMP: 2026-04-20T12:28:42Z"

COPY . .

# dist/public/ is pre-built in Replit and committed to git.
# Only build the server-side bundle here — no vite in Docker.
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
