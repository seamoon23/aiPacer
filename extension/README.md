# AI Pacer Chrome Extension

웹 계산기와 같은 계산 로직과 화면을 사용하는 Manifest V3 팝업입니다. 브라우저 권한과 호스트 권한을 요청하지 않습니다.

## 빌드

접근 경로: Windows PowerShell을 열고 프로젝트 폴더로 이동합니다.

```powershell
Set-Location C:\codex\app\AiPacer
npm run build:extension
```

빌드 결과는 `C:\codex\app\AiPacer\extension\dist`에 생성됩니다.

## Chrome Web Store 패키지

접근 경로: Windows PowerShell에서 프로젝트 루트로 이동한 뒤 아래 명령을 실행합니다.

```powershell
Set-Location C:\codex\app\AiPacer
npm run package:extension
```

업로드 ZIP과 스토어 이미지는 `C:\codex\app\AiPacer\release\chrome-web-store`에서 확인할 수 있습니다. 등록 문구, 개인정보 답변, 대시보드 접근 경로는 `C:\codex\app\AiPacer\docs\chrome-web-store-release.md`에 정리되어 있습니다.

## Chrome에서 로컬 확인

접근 경로: Chrome 주소창에서 `chrome://extensions`를 열고 오른쪽 위의 `개발자 모드`를 켭니다. `압축해제된 확장 프로그램을 로드합니다`를 누른 뒤 아래 폴더를 선택합니다.

```text
C:\codex\app\AiPacer\extension\dist
```

툴바의 AI Pacer 아이콘을 누르면 계산기 팝업이 열립니다.

## 후원 링크

도움말 팝업의 GitHub Sponsors와 Buy Me a Coffee 링크는 사용자가 직접 선택했을 때 새 탭으로 열립니다.
