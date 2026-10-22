FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_ORIGIN=/api
ENV NEXT_PUBLIC_API_ORIGIN=$NEXT_PUBLIC_API_ORIGIN
RUN pnpm --filter @empire/command-center... build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3400
ENV HOSTNAME=0.0.0.0
WORKDIR /workspace
COPY --from=build --chown=node:node /workspace/apps/command-center/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/command-center/.next/static ./apps/command-center/.next/static
USER node
EXPOSE 3400
CMD ["node", "apps/command-center/server.js"]
