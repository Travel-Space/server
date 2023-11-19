FROM ubuntu:22.04

RUN apt update && apt install -y \
    wget \
    curl \
    build-essential \
    && curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh \
    && bash nodesource_setup.sh \
    && apt install -y nodejs

RUN npm install -g pm2
RUN npm install -g typescript

WORKDIR /root/expressapp/

COPY ./ ./

RUN npm install 

RUN npx prisma migrate dev

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

CMD ["pm2-runtime", "start", "npm", "--name", "travelSpace", "--", "run", "start"]
