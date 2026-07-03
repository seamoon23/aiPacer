# Codex Handover

## Project

AiPacer

## Project Root

```text
C:\codex\app\AiPacer
```

## Goal

AI/Codex 사용량, 쿨다운, 작업 흐름을 추적하고 다음 작업 타이밍을 관리하는 개인 생산성 유틸.

## Current Situation

- 이전 Codex 프로젝트명은 AiPacer 또는 app 하위 대화 step01.API_PACER로 섞여 있을 수 있다.
- 앞으로는 C:\codex\app\AiPacer 폴더만 프로젝트 루트로 사용한다.

## Do Not Touch

```text
C:\codex\app
C:\codex\app\AiPacer
C:\codex\app\BlockObbyMvp
C:\codex\app\niceQR
C:\codex\app\PocketGallery
C:\codex\app\sonsapps
C:\codex\app\sontube
C:\codex\app\vibegraph
```

단, 위 목록 중 현재 프로젝트 폴더만 수정 가능하다.

## Migration Note

이 문서는 기존에 `C:\codex\app` 상위 프로젝트 또는 이름이 섞인 Codex 프로젝트에서 진행된 대화를 정리하고, 앞으로 실제 프로젝트 폴더 기준으로 새로 시작하기 위한 인계 문서다.

## Next Tasks

- [ ] 현재 실행 방식과 패키지 매니저 확인
- [ ] MVP 기능 범위 재정리
- [ ] README와 실행 명령 정리
- [ ] 로컬 저장/백업 방식 결정

## First Prompt For New Codex Chat

```text
이 프로젝트 루트는 C:\codex\app\AiPacer 입니다.

상위 C:\codex\app 폴더와 형제 프로젝트는 수정하지 마세요.
작업 전 pwd, git status, 주요 폴더 구조를 먼저 확인하세요.
그다음 현재 프로젝트 상태와 수정 대상 파일 목록을 제안해 주세요.

현재 목표:
AI/Codex 사용량, 쿨다운, 작업 흐름을 추적하고 다음 작업 타이밍을 관리하는 개인 생산성 유틸.
```
