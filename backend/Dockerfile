FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./


# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 5000

CMD ["pnpm", "start"]