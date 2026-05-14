FROM node:20-bullseye-slim

WORKDIR /app

# Install native build dependencies for packages like canvas
RUN apt-get update && apt-get install -y \
    git \
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

# .dockerignore allows .git/HEAD + .git/refs + .git/packed-refs into the build context
# (the full 3GB .git history is still excluded). This gives git enough to run
# "git rev-parse HEAD", so write-build-info.cjs can stamp the real commit hash into
# build-info.json without any hardcoded value in this file.
RUN node scripts/write-build-info.cjs

# Only build the server-side bundle here — Vite MUST NOT run in Docker (no VITE_* env vars).
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
