# 🏥 병원 스코어링 시스템 완전 가이드

## 📋 목차
1. [개요](#개요)
2. [KTAS 1-4급 응급실 스코어링](#ktas-1-4급-응급실-스코어링)
3. [KTAS 5급 병원 정렬](#ktas-5급-병원-정렬)
4. [스코어링 공식 상세](#스코어링-공식-상세)
5. [검색 전략](#검색-전략)

---

## 개요

우리 서비스는 **KTAS 급수에 따라 다른 병원 선정 알고리즘**을 사용합니다:

- **KTAS 1-4급 (응급 환자)**: 복합 스코어링 시스템 + 실시간 병상 정보
- **KTAS 5급 (비응급 환자)**: 진료과목 기반 + 거리순 정렬

---

## KTAS 1-4급 응급실 스코어링

### 📍 위치: `src/utils/emergencyHospitalApi.js`

### 🎯 스코어링 알고리즘

**기본 점수: 1000점** (모든 병원 동일 시작)

#### 1️⃣ 거리 패널티 (-N점)
```javascript
패널티 = 거리(km) × 1점
예시:
- 5.2km 거리 → -5점
- 15.8km 거리 → -16점
```

#### 2️⃣ 병원 등급 보너스 (+N점)
```javascript
권역응급의료센터 (typeCode: A) → +10점
지역응급의료센터 (typeCode: C) → +5점
지역응급의료기관 (typeCode: D) → 0점
```

#### 3️⃣ 응급실 병상 가용성 (+/- N점)
```javascript
병상 있음 (usable > 0):
  점수 = usable × 0.5점
  예시: 5개 가용 → +2.5점 (반올림 +3점)

병상 없음 (usable = 0):
  → -100점 (대폭 감점)

정보 없음:
  → -30점
```

#### 4️⃣ 중증응급질환 가용성 (+/- N점)
**LLM이 요청한 경우에만 평가**

```javascript
availableLevel: "Y" (가능) → +10점
availableLevel: "N" 또는 "N1" (불가/제한) → -100점
availableLevel: "NONE" (없음) → -50점

요청했는데 정보 없음 → -50점
요청하지 않았으면 → 0점 (감점 없음)
```

**중증응급질환 코드 예시:**
- Y0010: 심근경색
- Y0020: 뇌경색
- Y0031: 거미막하출혈
- Y0160: 안과응급

#### 5️⃣ 입원병상 가용성 (+/- N점)
**LLM이 요청한 경우에만 평가**

```javascript
availableLevel: "Y" (가능) → +5점
availableLevel: "N" 또는 "N1" (불가/제한) → -100점
availableLevel: "NONE" (없음) → -50점

요청했는데 정보 없음 → -50점
요청하지 않았으면 → 0점 (감점 없음)
```

**입원병상 코드 예시:**
- O006: 내과중환자실
- O017: 일반중환자실
- O023: 외상수술

#### 6️⃣ 장비 가용성 (+/- N점)
**LLM이 요청한 경우에만 평가**

```javascript
availableLevel: "Y" (가능) → +5점
availableLevel: "N" 또는 "N1" (불가/제한) → -40점
availableLevel: "NONE" (없음) → -30점

요청했는데 정보 없음 → -30점
요청하지 않았으면 → 0점 (감점 없음)
```

**장비 코드 예시:**
- O027: CT
- O028: MRI
- O034: ECMO

#### 7️⃣ 병원 메시지 페널티 (-N점)
**현재 상태: 사용하지 않음**

```javascript
// API 응답의 code 필드에 N/N1 정보가 포함되어 있어
// elements에서 이미 감점 처리됨
messagePenalty = 0
```

---

## KTAS 5급 병원 정렬

### 📍 위치: `src/utils/hospitalApi.js`

### 🎯 정렬 알고리즘

**스코어링 없음, 단순 거리순 정렬**

```javascript
1. LLM이 진료과목 코드 판단 (D001-D026)
2. 국립중앙의료원 API로 해당 진료과목 병원 검색
3. Haversine 공식으로 거리 계산
4. 거리순 오름차순 정렬
5. 상위 20개 병원 표시
```

**거리 계산 공식 (Haversine):**
```javascript
R = 6371km (지구 반지름)
distance = 2 × R × atan2(√a, √(1-a))
where:
  a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
```

---

## 스코어링 공식 상세

### 📊 KTAS 1-4급 최종 점수 계산 예시

**예시 1: 서울대학교병원 (권역, 5km 거리)**

```
기본 점수: 1000점

1. 거리 패널티: -5점 (5km × 1)
2. 병원 등급: +10점 (권역)
3. 응급실 병상: +3점 (6개 가용 × 0.5)
4. 중증응급질환(뇌출혈): +10점 (Y)
5. 입원병상(신경외과중환자실): +5점 (Y)
6. 장비(CT): +5점 (Y)
7. 메시지 페널티: 0점

최종 점수: 1028점
```

**예시 2: 응급실 병상 없는 센터 (10km 거리)**

```
기본 점수: 1000점

1. 거리 패널티: -10점 (10km × 1)
2. 병원 등급: +5점 (센터)
3. 응급실 병상: -100점 (0개 가용)
4. 중증응급질환: +10점 (Y)
5. 입원병상: +5점 (Y)
6. 장비(CT): -40점 (N - 불가)
7. 메시지 페널티: 0점

최종 점수: 870점
```

### 📉 점수 범위 분석

**일반적인 점수 범위:**
- **상위권 (1000-1100점)**: 가까운 권역센터, 병상 충분
- **중위권 (900-1000점)**: 거리 있거나 일부 제약
- **하위권 (800점 이하)**: 병상 부족 또는 필수 장비 없음

**치명적 감점 요인:**
- 응급실 병상 0개: **-100점**
- 중증응급질환 불가(N): **-100점**
- 입원병상 불가(N): **-100점**

---

## 검색 전략

### KTAS 1-4급: 점진적 확장 검색

**현재 전략: 100km 단일 검색**

```javascript
// src/utils/emergencyHospitalApi.js
progressiveSearch() {
  strategies = [
    { radius: 100km, filters: 전체 필터 }
  ];

  // 10개 이상 병원 발견 시 종료
  if (results.length >= 10) break;
}
```

**검색 조건:**
- 반경: 100km (고정)
- 필터: LLM이 판단한 응급실병상/입원병상/중증응급질환/장비
- 최소 목표: 10개 이상 병원

### KTAS 5급: 지역 기반 검색

```javascript
// src/utils/llmService.js
getRegionsForSearch(currentLocation) {
  regions = [시도코드, 시군구코드];

  // 예시: 서울특별시 종로구
  regions = ['110000', '110110'];
}
```

**검색 조건:**
- 지역: 현재 위치의 시도 + 시군구
- 필터: LLM이 판단한 진료과목 코드 (D001-D026)
- 최대: 20개 병원 표시

---

## 핵심 파일 위치

### KTAS 1-4급 (응급실)
- **스코어링 엔진**: `src/utils/emergencyHospitalApi.js`
  - `filterAndScoreHospitals()`: 점수 계산 (Line 168-360)
  - `progressiveSearch()`: 검색 전략 (Line 430-467)

- **UI 컴포넌트**: `src/app/result/components/HospitalListLevel1to4.js`
  - 병원 목록 표시 및 점수 상세 토글

### KTAS 5급 (일반 병원)
- **검색 엔진**: `src/utils/hospitalApi.js`
  - `searchAndSortHospitals()`: 거리순 정렬

- **UI 컴포넌트**: `src/app/result/components/HospitalListLevel5.js`
  - 병원 목록 표시 (거리 중심)

### 공통
- **LLM 서비스**: `src/utils/llmService.js`
  - KTAS 1-4급: `determineEmergencyFilters()` (필터 코드 판단)
  - KTAS 5급: `determineDepartmentCode()` (진료과목 판단)

---

## 개선 아이디어

### 1️⃣ 거리 반경 조정
**현재**: 100km 단일 검색
**제안**: 10km → 20km → 50km 점진적 확장

```javascript
strategies = [
  { radius: 10, filters: 전체 필터 },
  { radius: 20, filters: 전체 필터 },
  { radius: 50, filters: 전체 필터 },
];
```

### 2️⃣ 스코어링 가중치 조정
**현재 문제**: 거리 1km당 -1점은 너무 약함
**제안**: 거리 가중치 증가

```javascript
// 현재
distancePenalty = distance × 1

// 제안
distancePenalty = distance × 3  // 또는 5
```

### 3️⃣ 병상 가용률 고려
**현재**: usable 개수만 반영
**제안**: usable/total 비율 반영

```javascript
// 제안
const availabilityRatio = usable / total;
if (availabilityRatio >= 0.5) {
  score += 20;  // 충분함
} else if (availabilityRatio >= 0.2) {
  score += 5;   // 보통
} else {
  score -= 10;  // 부족
}
```

### 4️⃣ KTAS 급수별 가중치 차별화
**현재**: 모든 급수 동일 스코어링
**제안**: 급수별 우선순위 차등

```javascript
// KTAS 1-2급: 병상 가용성 최우선
if (ktasLevel <= 2) {
  emergencyBedBonus *= 3;  // 병상 가중치 3배
}

// KTAS 3-4급: 거리 중요도 증가
if (ktasLevel >= 3) {
  distancePenalty *= 2;  // 거리 가중치 2배
}
```

### 5️⃣ 실시간 혼잡도 반영
**제안**: 현재 응급실 혼잡도 API 활용

```javascript
// 혼잡도 데이터 (erMessages에 포함 가능)
if (hospital.congestionLevel === 'HIGH') {
  score -= 50;  // 혼잡
} else if (hospital.congestionLevel === 'LOW') {
  score += 20;  // 여유
}
```

---

## 결론

우리 서비스의 병원 스코어링 시스템은:

✅ **KTAS 1-4급**: 복합 스코어링 (거리 + 등급 + 병상 + 질환 + 장비)
✅ **KTAS 5급**: 단순 거리순 정렬
✅ **LLM 기반 필터링**: 환자 상태에 따른 맞춤형 필터
✅ **실시간 병상 정보**: 국립중앙의료원 API 활용

🎯 **핵심 장점**: 환자 중증도에 따라 다른 알고리즘 사용
⚠️ **개선 필요**: 거리 가중치, 병상 가용률, 급수별 차등화
