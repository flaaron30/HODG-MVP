FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages packages
RUN npm install
COPY apps/api apps/api
CMD ["npm","--workspace","apps/api","run","dev"]
