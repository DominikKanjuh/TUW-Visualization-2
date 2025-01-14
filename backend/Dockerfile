FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

EXPOSE 3000

ENV PORT=3000 \
    DB_USER=postgres \
    DB_HOST=database \
    DB_NAME=vis_2_geodb \
    DB_PASSWORD=your_password_here

CMD ["npm", "run", "start"]
