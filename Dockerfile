
FROM node:16 AS builder
LABEL stage=build

# Create a folder named function
RUN mkdir -p /home/app

# Wrapper/boot-strapper
WORKDIR /home/app

COPY ./src ./src
COPY ./package.json ./
COPY ./package-lock.json ./
COPY ./tsconfig.json ./
COPY ./.npmrc ./
ARG GH_TOKEN

# Install dependencies for production
RUN npm ci --omit=dev --ignore-scripts

# Build the project
RUN npm run build

FROM gcr.io/distroless/nodejs16-debian11:nonroot
USER nonroot

COPY --from=builder /home/app /home/app

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /home/app

ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"
ENV exec_timeout="10s"
ENV write_timeout="15s"
ENV read_timeout="15s"
ENV prefix_logs="false"
ENV FUNCTION_NAME=data-preparation-rel-1-0-0
ENV NODE_ENV=production
ENV SERVER_URL=
ENV CACHE_TTL=30
ENV CERT_PATH=
ENV REDIS_DB=0
ENV REDIS_AUTH=
ENV REDIS_HOST=
ENV REDIS_PORT=6379
ENV SERVER_URL=0.0.0.0:4222
ENV STARTUP_TYPE=nats
ENV PRODUCER_STREAM=
ENV CONSUMER_STREAM=
ENV STREAM_SUBJECT=
ENV ACK_POLICY=Explicit
ENV PRODUCER_STORAGE=File
ENV PRODUCER_RETENTION_POLICY=Workqueue
ENV PSEUDONYMS_DATABASE=pseudonyms
ENV DATABASE_URL=
ENV DATABASE_USER=root
ENV DATABASE_PASSWORD=''
ENV PSEUDONYMS_COLLECTION=pseudonyms
ENV TRANSACTIONHISTORY_PAIN001_COLLECTION=transactionHistoryPain001
ENV TRANSACTIONHISTORY_PAIN013_COLLECTION=transactionHistoryPain013
ENV TRANSACTIONHISTORY_PACS008_COLLECTION=transactionHistoryPacs008
ENV TRANSACTIONHISTORY_PACS002_COLLECTION=transactionHistoryPacs002
ENV APM_ACTIVE=true
ENV APM_SERVICE_NAME=data-preparation
ENV APM_URL=http://apm-server.development:8200
ENV APM_SECRET_TOKEN=
ENV LOGSTASH_HOST=logstash.development
ENV LOGSTASH_PORT=8080

HEALTHCHECK --interval=60s CMD [ -e /tmp/.lock ] || exit 1

# Execute watchdog command
CMD ["build/index.js"]
