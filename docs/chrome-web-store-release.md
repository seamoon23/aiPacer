# AI Pacer Chrome Web Store Release

## 준비된 제출 파일

- 업로드 ZIP: `C:\codex\app\AiPacer\release\chrome-web-store\AI-Pacer-v0.2.0.zip`
- 스토어 아이콘: `C:\codex\app\AiPacer\release\chrome-web-store\assets\store-icon-128.png`
- 스크린샷 1: `C:\codex\app\AiPacer\release\chrome-web-store\assets\screenshot-1-overview.png`
- 스크린샷 2: `C:\codex\app\AiPacer\release\chrome-web-store\assets\screenshot-2-results.png`
- 소형 프로모션 타일: `C:\codex\app\AiPacer\release\chrome-web-store\assets\small-promo-440x280.png`

ZIP은 `extension/dist`의 내용만 담으며 `manifest.json`이 압축 최상단에 오도록 생성됩니다.

## 패키지 다시 만들기

접근 경로: Windows PowerShell을 열고 프로젝트 루트로 이동한 뒤 아래 명령을 실행합니다.

```powershell
Set-Location C:\codex\app\AiPacer
npm run package:extension
```

명령은 확장을 다시 빌드하고 버전에 맞는 ZIP을 `release/chrome-web-store`에 생성한 뒤 `manifest.json`의 위치를 검사합니다.

## 스토어 등록 문구

### 기본 정보

- 이름: `AI Pacer`
- 기본 언어: `한국어`
- 카테고리: `생산성`
- 짧은 설명: `주간 남은 AI 용량과 초기화 요일을 입력하면 오늘 가능한 소·중·대 작업 횟수를 계산합니다.`
- 홈페이지 또는 지원 URL: `https://github.com/seamoon23/aiPacer`

### 상세 설명

```text
AI Pacer는 주간 남은 AI 사용 용량을 오늘 실행할 수 있는 작업 횟수로 바꾸어 보여주는 가벼운 계산기입니다.

주간 남은 용량과 초기화 요일을 입력하면 기본 사용시간 09:00~18:00을 기준으로 오늘 권장 용량을 계산합니다. 사용시간은 필요에 맞게 바꿀 수 있습니다.

주요 기능
• 오늘 권장 용량 계산
• 소형·중형·대형 작업 추천 횟수
• 초기화까지 남은 시간과 작업일 표시
• 상황에 맞는 달콤이 코치 이미지와 안내
• 계산 기준을 확인할 수 있는 도움말

AI 서비스 API나 계정에 연결하지 않습니다. 입력값을 저장하거나 외부 서버로 전송하지 않으며 브라우저 권한과 호스트 권한을 요청하지 않습니다. 결과는 공식 사용량이 아닌 작업 계획을 위한 보수적인 추정치입니다.
```

## 개인정보 탭 입력안

### 단일 목적

```text
사용자가 직접 입력한 주간 남은 AI 용량, 초기화 요일, 사용시간을 바탕으로 오늘 가능한 소형·중형·대형 작업 횟수를 계산해 보여줍니다.
```

### 데이터와 권한

- 사용자 데이터 수집: `없음`
- 사용자 데이터 판매 또는 제3자 제공: `없음`
- 외부 서버 전송: `없음`
- 브라우저 저장소 사용: `없음`
- 원격 코드 사용: `아니요`
- 요청 권한: `없음`
- 호스트 권한: `없음`
- 입력 처리: 팝업 메모리에서 계산할 때만 사용하며 팝업을 닫으면 폐기
- 제한적 사용 정책 준수 확인: 체크

개인정보처리방침은 웹 앱의 `/privacy/`에 준비되어 있습니다. 대시보드에서 공개 URL을 요구하면 실제 배포 도메인 뒤에 `/privacy/`를 붙여 등록합니다. 현재 프로젝트의 배포 도메인은 아직 `https://example.com` 자리표시자이므로 제출 전 실제 주소로 교체해야 합니다.

## 업로드 순서

1. 접근 경로: [Chrome Web Store 개발자 대시보드](https://chrome.google.com/webstore/devconsole/)에 로그인합니다.
2. `새 항목`을 누르고 `AI-Pacer-v0.2.0.zip`을 업로드합니다.
3. `스토어 등록정보`에서 한국어, 생산성 카테고리, 짧은 설명과 상세 설명을 입력합니다.
4. 같은 화면에서 1280×800 스크린샷 2장과 440×280 소형 프로모션 타일을 업로드합니다.
5. `개인정보 보호`에서 위 단일 목적과 데이터 처리 답변을 입력하고 제한적 사용 정책 준수를 확인합니다.
6. `배포`에서 첫 검수는 `미등록`을 권장합니다. 검수 통과와 실제 사용 확인 뒤 `공개`로 바꿀 수 있습니다.
7. 모든 탭의 필수 항목이 완료되면 `검토를 위해 제출`을 누릅니다.

`공개`, `미등록`, `비공개` 모두 웹스토어 검토 대상입니다. 계정 등록비, 개발자 연락처 인증, 웹사이트 소유권 확인처럼 계정에 종속된 항목은 개발자 대시보드에서 직접 완료합니다.

## 사용자가 확인할 두 경로

### 1. GitHub에서 소스와 커밋 확인

접근 경로: [AI Pacer GitHub 저장소](https://github.com/seamoon23/aiPacer)를 열고 `Commits`를 선택합니다. `main` 브랜치의 최신 커밋에서 변경 파일과 빌드 준비 문서를 확인할 수 있습니다.

로컬에서는 Windows PowerShell에서 다음 명령으로 같은 상태를 확인합니다.

```powershell
Set-Location C:\codex\app\AiPacer
git status
git log -1 --oneline
```

### 2. Chrome에서 확장 확인

로컬 확인 접근 경로: Chrome 주소창에서 `chrome://extensions`를 열고 `개발자 모드`를 켠 뒤 `압축해제된 확장 프로그램을 로드합니다`를 선택합니다. 폴더는 `C:\codex\app\AiPacer\extension\dist`입니다. 툴바의 AI Pacer 아이콘을 눌러 계산기를 확인합니다.

제출 후 확인 접근 경로: [Chrome Web Store 개발자 대시보드](https://chrome.google.com/webstore/devconsole/)에서 `AI Pacer` 항목을 열고 `패키지`, `스토어 등록정보`, `개인정보 보호`, `배포`, `상태` 탭을 차례로 확인합니다. 심사 결과와 반려 사유도 `상태` 및 등록된 개발자 이메일로 전달됩니다.

## 공식 요구사항 참고

- [확장 프로그램 준비와 ZIP 구조](https://developer.chrome.com/docs/webstore/prepare)
- [Chrome Web Store 게시 절차](https://developer.chrome.com/docs/webstore/publish/)
- [이미지 규격](https://developer.chrome.com/docs/webstore/images/)
- [스토어 등록정보 작성](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [사용자 데이터 정책](https://developer.chrome.com/docs/webstore/program-policies/user-data)
- [배포 방식](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution/)
