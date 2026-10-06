FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ledger_loop" pnpm prisma generate

COPY src ./src

EXPOSE 5000

CMD ["pnpm", "start"]