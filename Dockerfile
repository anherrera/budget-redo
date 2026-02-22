# Build stage
FROM geoffreybooth/meteor-base:3.3 AS build
WORKDIR /app
COPY . .
RUN meteor npm install
RUN meteor build --directory /output --server-only

# Run stage
FROM node:22-slim
WORKDIR /app
COPY --from=build /output/bundle .
RUN cd programs/server && npm install --production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "main.js"]
