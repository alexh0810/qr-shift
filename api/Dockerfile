FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci validates every workspace listed in the lockfile, so web's manifest is needed too.
COPY web/package.json web/
COPY api/package.json api/
RUN npm ci -w api
COPY api api
RUN npm run build -w api

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY api/package.json api/
RUN npm ci -w api --omit=dev
COPY --from=build /app/api/dist api/dist
USER node
CMD ["node", "api/dist/server.js"]
