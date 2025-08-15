FROM node:23-slim

WORKDIR /app

# ソースコードをコピー
COPY . .

RUN npm install -g pnpm
