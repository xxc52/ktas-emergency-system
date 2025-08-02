# 데이터베이스 마이그레이션 가이드

## 🏗️ 1단계: Supabase에서 테이블 생성

1. Supabase 대시보드로 이동: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "SQL Editor" 클릭
4. `database/schema.sql` 파일의 내용을 복사해서 실행

## 📦 2단계: 마이그레이션 스크립트 실행

```bash
# 프로젝트 루트에서
node database/migrate.js
```

## ✅ 3단계: 데이터 확인

Supabase 대시보드에서 "Table Editor" → "ktas_data" 테이블에서 데이터가 잘 들어갔는지 확인

## 🔧 트러블슈팅

### 환경변수 오류가 나는 경우:
- `.env.local` 파일이 제대로 있는지 확인
- 개발 서버를 다시 시작해보세요

### import 오류가 나는 경우:
- Node.js 버전이 14 이상인지 확인
- 또는 migrate.js를 CommonJS로 변경

## 📊 예상 결과

- `ktas_data`: ~2000개 행
- `rescuers`: 4명의 샘플 구조대원
- `custom_presets`: 빈 테이블
- `patient_assessments`: 빈 테이블