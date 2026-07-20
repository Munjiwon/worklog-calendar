FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

COPY --chown=node:node . .
RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 3000

CMD ["npm", "start"]
