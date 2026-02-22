FROM --platform=linux/amd64 node:20-alpine3.20 AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

# Install pnpm first
RUN npm install -g pnpm@9.12.1

# Copy package.json and pnpm-lock.yaml to install turbo at the correct version
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install turbo at the version specified in package.json (install root workspace dependencies)
RUN pnpm install -w --frozen-lockfile

# Copy the rest of the files
COPY . .

# Use the locally installed turbo via pnpm
RUN pnpm turbo prune @repo/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm install -g pnpm@9.12.1
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build --filter=@repo/api

FROM base AS runner
WORKDIR /app
RUN npm install -g pnpm@9.12.1
COPY --from=installer /app .

WORKDIR /app/services/api
RUN pnpm install --prod

EXPOSE 3000

CMD ["pnpm", "start"]
