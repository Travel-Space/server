FROM ubuntu:22.04

# 패키지 업데이트 및 필요한 패키지 설치
RUN apt update && apt install -y \
    wget \
    curl \
    build-essential \
    && curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh \
    && bash nodesource_setup.sh \
    && apt install -y nodejs

# 전역 npm 패키지 설치
RUN npm install -g pm2
RUN npm install -g typescript

WORKDIR /root/expressapp/

# 프로젝트 파일을 Docker 이미지에 복사
COPY ./ ./

# npm 패키지 설치 및 보안 패치
RUN npm install 

RUN npx prisma migrate dev
# TypeScript 빌드
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 애플리케이션 실행
CMD ["pm2-runtime", "start", "npm", "--name", "travelSpace", "--", "run", "start"]
