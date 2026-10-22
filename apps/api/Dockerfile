FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @empire/api... build

FROM base AS runtime
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=4000
WORKDIR /workspace
COPY --from=build --chown=node:node /workspace /workspace
RUN mkdir -p /workspace/var/private-files && chown -R node:node /workspace/var
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
