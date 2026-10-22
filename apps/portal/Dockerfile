FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_ORIGIN=http://localhost:4000
ENV NEXT_PUBLIC_API_ORIGIN=$NEXT_PUBLIC_API_ORIGIN
RUN pnpm --filter @empire/portal build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3300
ENV HOSTNAME=0.0.0.0
WORKDIR /workspace
COPY --from=build --chown=node:node /workspace/apps/portal/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/portal/.next/static ./apps/portal/.next/static
USER node
EXPOSE 3300
CMD ["node", "apps/portal/server.js"]
