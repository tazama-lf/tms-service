ARG BUILD_IMAGE=node:20-bullseye
ARG RUN_IMAGE=gcr.io/distroless/nodejs20-debian11:nonroot

FROM ${BUILD_IMAGE} AS builder
LABEL stage=build
# TS -> JS stage

WORKDIR /home/app
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./swagger.yaml ./
COPY .npmrc ./
ARG GH_TOKEN

RUN npm ci --ignore-scripts
RUN npm run build

FROM ${BUILD_IMAGE} AS dep-resolver
LABEL stage=pre-prod
# To filter out dev dependencies from final build

COPY package*.json ./
COPY .npmrc ./
ARG GH_TOKEN
RUN npm ci --omit=dev --ignore-scripts

FROM ${RUN_IMAGE} AS run-env
USER nonroot

WORKDIR /home/app
COPY --from=dep-resolver /node_modules ./node_modules
COPY --from=builder /home/app/build ./build
COPY package.json ./
COPY service.yaml ./
COPY deployment.yaml ./

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"
ENV exec_timeout="10s"
ENV write_timeout="15s"
ENV read_timeout="15s"
ENV prefix_logs="false"

# Service Based variables
ENV FUNCTION_NAME=transaction-monitoring-service
ENV NODE_ENV=production
ENV PORT=3000
ENV QUOTING=false
ENV SERVER_URL=
ENV MAX_CPU=

# Auth
ENV AUTHENTICATED=false
ENV CERT_PATH_PUBLIC=

# Redis
ENV REDIS_DATABASE=0
ENV REDIS_AUTH=
ENV REDIS_SERVERS=
ENV REDIS_IS_CLUSTER=
ENV DISTRIBUTED_CACHETTL=300
ENV DISTRIBUTED_CACHE_ENABLED=true

# NodeCache
ENV LOCAL_CACHETTL=300
ENV LOCAL_CACHE_ENABLED=true

# Nats
ENV SERVER_URL=0.0.0.0:4222
ENV STARTUP_TYPE=nats
ENV PRODUCER_STREAM=
ENV ACK_POLICY=Explicit
ENV PRODUCER_STORAGE=File
ENV PRODUCER_RETENTION_POLICY=Workqueue

# Database
ENV RAW_HISTORY_DATABASE=raw_history
ENV RAW_HISTORY_DATABASE_HOST=
ENV RAW_HISTORY_DATABASE_PORT=
ENV RAW_HISTORY_DATABASE_USER=
ENV RAW_HISTORY_DATABASE_PASSWORD=
ENV RAW_HISTORY_DATABASE_CERT_PATH=/usr/local/share/ca-certificates/ca-certificates.crt

ENV EVENT_HISTORY_DATABASE=event_history
ENV EVENT_HISTORY_DATABASE_HOST=
ENV EVENT_HISTORY_DATABASE_PORT=
ENV EVENT_HISTORY_DATABASE_USER=
ENV EVENT_HISTORY_DATABASE_PASSWORD=
ENV EVENT_HISTORY_DATABASE_CERT_PATH=/usr/local/share/ca-certificates/ca-certificates.crt

# Apm
ENV APM_ACTIVE=true
ENV APM_SERVICE_NAME=transaction-monitoring-service
ENV APM_URL=http://apm-server.development.svc.cluster.local:8200/
ENV APM_SECRET_TOKEN=

# Logging
ENV LOG_LEVEL='info'
ENV SIDECAR_HOST=0.0.0.0:5000

ENV CORS_POLICY=prod

# Execute watchdog command
CMD ["build/index.js"]