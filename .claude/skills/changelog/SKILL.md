---
name: changelog
description: Record development session to CHANGELOG.md and update CLAUDE.md recent summary
user-invocable: true
---

# /changelog 스킬

현재 세션의 변경 이력을 `todo-app-main/CHANGELOG.md`에 기록하고, `todo-app-main/CLAUDE.md`의 최근 변경사항 섹션을 업데이트한다.

## 입력

- `$ARGUMENTS` — 이번 세션에서 사용자가 요청한 내용 (따옴표 포함 가능)
- 인수가 없으면 실행 전에 사용자에게 기록할 요약 내용을 묻는다

## 실행 단계

### 1단계: 컨텍스트 수집

아래 명령을 실행해 정보를 모은다.

**브랜치명**
```bash
git branch --show-current
```

**현재 날짜/시간** — Windows이므로 PowerShell 사용
```powershell
Get-Date -Format "yyyy-MM-dd HH:mm"
```

**변경 파일 상태 코드** (todo-app-main/ 기준)
```bash
git status --porcelain -- todo-app-main/
```
출력 예: `M  todo-app-main/app/page.tsx`, `?? todo-app-main/src/client/hooks/useTickets.ts`

**행 수 변화** (추적된 파일만)
```bash
git diff HEAD --numstat -- todo-app-main/
```
출력 형식: `추가행\t제거행\t파일경로`

**신규 파일(Untracked) 행 수** — `??` 상태 파일에 대해 개별 실행
```bash
# PowerShell (파일당)
(Get-Content "파일경로" | Measure-Object -Line).Lines
```

### 2단계: 파일 분류

`git status --porcelain` 출력의 첫 두 글자로 Change 레이블을 결정한다:

| git 코드 | Change 레이블 | 의미 |
|----------|--------------|------|
| `A ` `AA` | `**Addon**` | 새로 추적된 파일 |
| `??` | `**Addon**` | 미추적 신규 파일 |
| `M ` ` M` `MM` | `**Modified**` | 기존 파일 수정 |
| `D ` ` D` | `**Deleted**` | 파일 삭제 |
| `R ` | `**Renamed**` | 파일 이름 변경 |

표시할 파일 경로는 `todo-app-main/` 접두사를 제거한다.
- 변환 전: `todo-app-main/app/api/tickets/route.ts`
- 변환 후: `app/api/tickets/route.ts`

### 3단계: 테스트 결과 (선택)

다음 중 하나에 해당하면 테스트를 실행한다:
- `*.test.ts` 또는 `*.test.tsx` 파일이 변경됨
- 사용자가 "테스트 포함"을 요청함

```bash
npm --prefix todo-app-main test -- --passWithNoTests 2>&1
```

출력에서 `Tests: N passed, N total` 패턴을 추출한다.
테스트를 실행하지 않으면 `### Test Results` 섹션 전체를 생략한다.

### 4단계: 엔트리 포맷 작성

아래 형식을 **정확히** 따른다. 이모지 없음. 섹션 제목 동일하게 유지.

```
## [브랜치명] - YYYY-MM-DD HH:MM

### Prompt
> "사용자가 입력한 요청"

### Change
- **Addon** : 추가한 기능 설명 (`파일경로`)
- **Modified** : 수정 내용 요약 (`파일경로`)
- **Deleted** : 삭제 이유 (`파일경로`)

### Files Modified
- `파일명` (+N, -M lines)

### Test Results
- N/N passed (X suites)

---
```

**작성 규칙:**
- `### Change`: 파일명 나열 대신 변경 내용을 한 줄로 요약한다
- `### Change`는 Addon/Modified/Deleted 중 해당하는 것만 포함한다
- `### Test Results`: 테스트 실행 시에만 포함, 없으면 섹션 생략
- `### Files Modified`: `todo-app-main/` 접두사 제거, 행 수 없으면 `(binary)` 표기
- 엔트리 마지막에 `---` 구분선 추가

### 5단계: CHANGELOG.md 업데이트

파일: `todo-app-main/CHANGELOG.md`

현재 내용을 읽는다. 헤더 블록 다음의 `---` 구분선 직후, 기존 첫 번째 엔트리 바로 앞에 새 엔트리를 삽입한다.

삽입 위치 (현재 구조 기준):
```
...헤더...

---        ← 이 줄 바로 다음 줄에 빈 줄 + 새 엔트리 삽입

## [main] - ...  ← 기존 첫 번째 엔트리 (자동으로 뒤로 밀림)
```

Edit 도구로 기존 첫 번째 엔트리 헤더(`## [`) 앞에 새 엔트리 + 빈 줄을 삽입한다.

### 6단계: CLAUDE.md 최근 변경사항 업데이트

파일: `todo-app-main/CLAUDE.md`

1. CHANGELOG.md에서 오늘 기준 **14일 이내** 엔트리를 수집한다  
   판단 기준: `## [브랜치] - YYYY-MM-DD` 헤더의 날짜
2. CLAUDE.md 하단의 `## 최근 변경사항` 섹션을 찾아 전체 교체한다  
   섹션이 없으면 문서 맨 끝에 추가한다

**CLAUDE.md에 삽입할 형식:**
```markdown
---

## 최근 변경사항

> `/changelog "요약"` 으로 자동 업데이트 — 최근 14일 이력

| 날짜 | 브랜치 | 변경 요약 |
|------|--------|-----------|
| YYYY-MM-DD | 브랜치명 | 변경 요약 한 줄 |
```

- `변경 요약`: `$ARGUMENTS` 텍스트를 그대로 사용 (따옴표 제거)
- 최신 엔트리가 테이블 첫 행에 오도록 정렬한다
- 14일 이전 엔트리는 테이블에서 제외한다

## 완료 보고

실행 완료 후 다음 형식으로 보고한다:

```
Changelog 기록 완료

브랜치  : main
날짜    : 2026-06-06 15:30
파일    : N개 (Addon M, Modified P)
테스트  : N/N passed   (실행한 경우)
CHANGELOG.md : 새 엔트리 추가됨
CLAUDE.md    : 최근 변경사항 N개 항목 업데이트
```
