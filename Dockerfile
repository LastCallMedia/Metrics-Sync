#
# This project uses a multistage build process.
#
# The `builder` container contains all development dependencies and
# typescript sources, while the `release` image only contains the
# final, compiled product.
# @see https://docs.docker.com/develop/develop-images/multistage-build/

# Base image:
FROM node:9-alpine AS base
WORKDIR /app
COPY package.json .
RUN yarn --production=true

# Typescript builder
FROM base AS builder
RUN yarn
COPY src ./src
COPY tsconfig.json .
RUN yarn run build


FROM base AS release
COPY --from=builder /app/dist ./dist
COPY bin ./bin
CMD /app/bin/metricsync





