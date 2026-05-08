# AI Acting Studio

이미지와 영상을 조합하여 새로운 영상을 만들고, AI 목소리를 입혀주는 웹 애플리케이션입니다.

## 주요 기능

- **Motion Control 비디오 생성**: 이미지와 참조 비디오를 조합하여 새로운 비디오 생성 (Kling AI)
- **AI 목소리 변환**: 음성을 등록된 AI 목소리로 변환 (ElevenLabs Speech-to-Speech)
- **립싱크**: 생성된 비디오에 변환된 음성을 동기화

---

## 프로젝트 구조

```
ai-acting-studio/
├── backend/            # Python FastAPI 서버
├── frontend/           # React 프론트엔드 (CRA 스타일)
├── server.js           # Node.js 통합 서버 (선택 사항)
└── .env                # API 키 및 설정
```

---

## 필수 요구 사항

- Python 3.9 이상
- ffmpeg (필수)
- API Keys: Kling AI, ElevenLabs

---

## 1단계: 환경 변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
vi .env
```

### .env 항목 설명

```env
# Kling AI API
KLING_ACCESS_KEY=your_kling_access_key_here
KLING_SECRET_KEY=your_kling_secret_key_here

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# 참조 영상 목록 (형식: 이름::영상URL::썸네일URL)
# 여러 개는 콤마(,)로 구분
VIDEO_SOURCES=chief::https://버킷.s3.amazonaws.com/chief.mp4::https://버킷.s3.amazonaws.com/chief.png,deputy::https://버킷.s3.amazonaws.com/deputy.mp4::https://버킷.s3.amazonaws.com/deputy.png
```

> **주의:** `.env` 파일을 수정한 후에는 반드시 백엔드를 재실행해야 변경사항이 반영됩니다.

---

## 2단계: 참조 영상 및 썸네일 S3 업로드

참조 영상(`.mp4`)과 썸네일 이미지(`.png`)를 S3 버킷에 업로드합니다.

```bash
aws s3 cp chief.mp4 s3://버킷명/chief.mp4
aws s3 cp chief.png s3://버킷명/chief.png
```

업로드 후 S3 URL을 `.env`의 `VIDEO_SOURCES`에 등록합니다.

---

## 3단계: 백엔드 배포 (EC2 Amazon Linux 2023)

### 필수 패키지 설치

```bash
sudo dnf update -y
sudo dnf install git python3 python3-pip nodejs -y
```

### ffmpeg 설치

Amazon Linux 2023 기본 레포지토리에는 ffmpeg가 없으므로 정적 바이너리를 설치합니다.

```bash
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xvf ffmpeg-release-amd64-static.tar.xz
sudo mv ffmpeg-*-static/ffmpeg /usr/local/bin/
sudo mv ffmpeg-*-static/ffprobe /usr/local/bin/
ffmpeg -version
```

### 저장소 클론 및 백엔드 실행

```bash
git clone https://github.com/YOUR_USERNAME/ai-acting-studio.git
cd ai-acting-studio

cp .env.example .env
vi .env  # API 키 및 VIDEO_SOURCES 입력

cd backend
pip install -r requirements.txt
nohup uvicorn main:app --host 0.0.0.0 --port 3000 &
```

> EC2 보안 그룹에서 3000번 포트를 열어주세요.

### 백엔드 재실행 방법 (.env 변경 후)

```bash
# 실행 중인 프로세스 확인
ps aux | grep uvicorn

# PID 종료 후 재실행
kill <PID>
nohup uvicorn main:app --host 0.0.0.0 --port 3000 &
```

---

## 4단계: 프론트엔드 빌드 및 S3 배포

### S3 업로드를 위한 IAM Role 설정

EC2에서 `aws s3 cp` 명령 실행 시 `Unable to locate credentials` 오류가 발생하면 EC2에 IAM Role이 연결되지 않은 것입니다.

1. AWS 콘솔 → EC2 → 인스턴스 선택
2. **Actions → Security → Modify IAM role**
3. `AmazonS3FullAccess` 권한이 포함된 Role 연결

### 빌드 및 업로드

```bash
# 로컬 PC에서 작업
cd frontend
npm install       # node_modules 없으면 반드시 먼저 실행
npm run build

# EC2에서 S3로 업로드
aws s3 cp build s3://버킷명 --recursive
```

> `npm install` 없이 `npm run build`를 실행하면 `react-scripts: command not found` 오류가 발생합니다.

---

## 5단계: HTTPS 설정 (마이크 접근 권한)

S3 정적 웹사이트는 기본적으로 HTTP로 서빙되며, 브라우저는 보안 정책상 **HTTP 환경에서 마이크 접근을 차단**합니다.

### CloudFront로 HTTPS 적용 (권장)

1. AWS 콘솔 → **CloudFront** → Create Distribution
2. Origin: S3 버킷 웹사이트 엔드포인트 선택
3. Viewer Protocol Policy: **Redirect HTTP to HTTPS**
4. 배포 후 `https://xxxx.cloudfront.net` 주소로 접속

### 개발/테스트 환경에서 임시 허용 (Chrome)

```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

해당 S3 URL을 추가하고 Enable 후 재시작합니다. (본인 브라우저에서만 동작)

---

## 라이선스

MIT License
