# 🌏Travel Space: 다녀온 여행을 기록하는 나만의 공간

![image](https://github.com/Travel-Space/server/assets/110807563/fba003c3-9a96-4c48-8cf0-030d01a8384b)

# 🚀 프로젝트 소개 
어쩌구 저쩌구

# 💡 프로젝트 기획 의도
의도가 멀까? 후 진짜 머지

# 팀 소개

</br>

| 김현규 | 문수민 | 이슬 | 예은선 | 조아연 | 최형욱 |
| :-----------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: |
| <img src="https://avatars.githubusercontent.com/u/110807563?v=4" width="90px"/> | <img src="https://avatars.githubusercontent.com/u/125293472?v=4" width="90px" /> | <img src="https://avatars.githubusercontent.com/u/55569192?v=4" width="90px" /> | <img src="https://avatars.githubusercontent.com/u/118370673?v=4" width="90px" /> | <img src="https://avatars.githubusercontent.com/u/92145151?v=4" width="90px" /> | <img src="https://avatars.githubusercontent.com/u/130480277?v=4" width="90px" /> |
| [Hyeongyu-619](https://github.com/Hyeongyu-619) | [BEARSUM](https://github.com/BEARSUM) | [helloleesul](https://github.com/helloleesul) | [Ysvln](https://github.com/Ysvln) | [zn](https://github.com/salmeungyelan) | [wook888](https://github.com/wook888)


#### 1. 김현규(BE) - 백엔드 총괄 및 배포
#### 2. 문수민(FE) - 마이페이지, 프로필 페이지
#### 3. 이슬(FE) - 로그인 및 회원가입 페이지, 행성 생성/관리 & 우주선 생성/관리 & 행성 멤버 관리 페이지
#### 4. 예은선(FE) - 관리자 페이지, 알림(socket)
#### 5. 조아연(FE) - 구글 맵 API, 채팅(socket)
#### 6. 최형욱(FE) - 메인 페이지, 게시글 작성/조회/수정, 랜덤 행성 페이지

</br>

## [ 프로젝트 기간 ]
2023.10.01 ~ 2023.11.29

# URL

프로젝트 배포 주소 : <a href=https://travelspace.world target=_blank>https://travelspace.world/</a>
</br>
클라이언트 레포지토리 :
<a href=https://github.com/Travel-Space/client target=_blank>https://github.com/Travel-Space/client</a>

# 🛸 기능 목록

### 로그인/회원가입
- 구글 oAuth를 사용한 회원가입 및 로그인 기능
- 일반 회원가입 및 로그인 기능
- nodemailer를 사용해 회원가입/비밀번호 변경 시 이메일 인증 기능
### 게시글/댓글 작성/조회/수정
- 게시글 작성/수정
   - 작성/수정 글 실시간 미리보기
- 게시글 조회
  - 행성 미가입시 공개 행성만 조회
- 게시글 좋아요
- 게시글 삭제
- 댓글/대댓글 작성/수정
- 댓글/대댓글 조회
- 댓글/대댓글 삭제
- 게시글/댓글 신고
   - 신고 내용
   - 신고 사유
   - 신고 사진
### 마이 페이지
- 행성 이름으로 조회
  - 일간 방문수/주간 방문수
  - 금일까지의 누적 방문수
  - 게시글 수
- 내가 작성한 게시글 조회
  - 월간 조회수 기준으로 10개의 게시글 정렬
  - 작성일
  - 행성
- 프로필 정보 수정
  - 프로필 이미지
  - 닉네임
  - 비밀번호
- 내가 생성한 행성/여행 중인 행성 조회
- 내가 작성한 게시글/댓글 조회
- 친구 목록(팔로잉/팔로워) 조회
- 친구 추천 기능(랜덤 유저)
- 내가 좋아요한 행성/게시글 및 좋아요 횟수 조회
### 프로필 페이지
- 회원 프로필 정보 조회
   - 팔로워한 유저
   - 팔로잉한 유저
   - 여행중인 행성
   - 작성한 게시글
### 행성 생성 및 관리
 - 행성 생성 및 수정
  - 공개 여부(공개/비공개)
  - 행성 이미지
  - 행성 이름
  - 행성 소개글
  - 해시태그
  - 최대 인원 수
  - 최대 우주선 갯수
- 행성 삭제
- 행성 탈출
  - 행성 관리자 위임(관리자가 탈출할시)
### 행성 멤버 관리
 - 유저 조회
 - 유저 검색
 - 행성 가입 승인/거절
 - 행성 초대
 - 행성 멤버 역할 수정(관리자/부관리자/멤버)
 - 행성 멤버 추방
### 우주선 생성 및 관리
 - 우주선 목록 조회
    - 우주선 대표 이미지
    - 우주선 이름
    - 탑승 인원수(현재 탑승 인원/최대 탑승 인원)
- 우주선 상세 조회
   - 우주선 이름
   - 우주선 설명글
   - 여행 상태(여행 준비/여행 중/여행 끝/여행 취소)
   - 여행 시작일자/종료일자
   - 탑승 멤버
- 우주선 생성 및 수정
  - 여행 상태(여행 준비/여행 중/여행 끝/여행 취소)
  - 우주선 대표 이미지
  - 우주선 이름
  - 우주선 설명
  - 여행 시작일자/종료일자
- 우주선 삭제
### 지도 (Google Map)
- 행성별 지도
  - 행성별 지도 클릭시 게시글 마커 위치 및 게시글 수 조회
  - 게시글 마커 클릭시 행성 소개 및 글 리스트 조회
  - 가입한 우주선에 해당하는 게시글 조회
### 채팅(Socket)
- 행성/우주선 생성 시 채팅방 자동 생성
- 채팅방 목록 조회
- 채팅방 멤버 조회
- 실시간 채팅 기능
- 사진 전송 및 수신
- 채팅 신고
- 행성/우주선 탈퇴 시 채팅방 자동 탈퇴
### 관리자
 - 사용자 관리
    - 사용자 검색
    - 전체 사용자 수 조회
    - 사용자 활동 제한(사유 전송)
- 게시글 관리
   - 게시글 검색
   - 게시글 삭제(사유 전송)
- 행성 관리
   - 행성 검색
   - 행성 삭제(사유 전송)
- 신고 관리
  - 신고 처리(승낙/거절)
    - 신고 유저 정보(닉네임/이메일/계정 상태 - 신고 횟수)
    - 요청 승낙 사유
### 알림(Socket)
- 알림 전송
   - 작성한 게시글 좋아요
   - 작성한 게시글 댓글
   - 작성한 댓글 대댓글
   - 가입한 행성 새로운 게시글
   - 본인 팔로우
   - 사용자 활동 제한(기간/사유)
   - 행성 초대(수락/거절 기능)
- 알림 클릭시 해당 페이지(게시글/댓글/마이 페이지)로 이동
### 사용자 활동 제한
- 활동 제한시 서비스 이용 불가
- 매일 crontab으로 사용자 활동 제한 여부 판단 및 갱신
### 공통
- 페이지네이션
- 무한 스크롤
- 유효성 검사
- Markdown 문법 지원

# 🛠 기술 스택
#### :hammer: 프론트엔드

<br />

![ReactJS](https://img.shields.io/badge/ReactJS-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Styled-Components](https://img.shields.io/badge/StyledComponents-DB7093?style=for-the-badge&logo=styled-components&logoColor=white)<br  />
![Recoil](https://img.shields.io/badge/Recoil-007af4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI1MDAiIHdpZHRoPSIyMzY4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjMwIDExIDI3LjUgNzgiPjxyZWN0IGZpbGw9IiMwMDdhZjQiIGhlaWdodD0iOTUiIHJ4PSIxMCIgd2lkdGg9IjkwIi8+PGNpcmNsZSBjeD0iNDMuNSIgY3k9IjE4LjUiIGZpbGw9IiNmZmYiIHI9IjcuNSIvPjxjaXJjbGUgY3g9IjQzLjUiIGN5PSI4MS41IiBmaWxsPSIjZmZmIiByPSI3LjUiLz48ZyBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMyI+PHBhdGggZD0iTTQzLjk5OSAyNUM0Mi41IDM3IDU3LjUgMzQgNTcuNSA0Mi41YzAgNS01Ljg3OCA2LjM2NS0xMy41MDEgN0MzNy45OTkgNTAgMzAgNTAgMzAgNThzMTYgNS41IDEzLjk5OSAxN00zNC4xMzIgMzMuMzUzYzAgMTUuMjg5IDIzLjE1IDE4LjI4OSAyMy4xNSAzMi42MiIvPjwvZz48L3N2Zz4=&logoColor=white)
![NextJS](https://img.shields.io/badge/Nextjs-000000?style=for-the-badge&logo=next.js&logoColor=white)


#### :wrench: 백엔드

<br />

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)<br/>
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)
![Amazon EC2](https://img.shields.io/badge/AmazonEC2-FF9900?style=for-the-badge&logo=amazonEC2&logoColor=white)
![Amazon S3](https://img.shields.io/badge/AmazonS3-569A31?style=for-the-badge&logo=AmazonS3&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=Socket.io&logoColor=white)
![nginx](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=NGINX&logoColor=white)

<br />

# 협업 방법
- Notion
- Discord
- Gather Town

## 🌐 Browser Support

| ![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/main/src/safari/safari_48x48.png) | ![Edge](https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png) |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Latest ✔ | Latest ✔ | Latest ✔ |
