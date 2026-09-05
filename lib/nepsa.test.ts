// NEPSA 산식이 KEIT PD Issue Report 13-10 원문과 어긋나지 않는지 검증하는 회귀 테스트
import { describe, expect, it } from 'vitest';
import {
  autoScores,
  axisScore,
  classify,
  criteria,
  defaultSettings,
  distributionWarnings,
  evaluate,
  newProject,
  rank,
  regionOrder,
  sampleProjects,
  scoresFor,
  validateImport,
} from './nepsa';
import type { Project, Settings } from './nepsa';

const settings = defaultSettings;
const project = (over: Partial<Project> = {}): Project => ({
  ...newProject('t', 'company'),
  ...over,
});

/**
 * 정량지표 4개가 n점이 되도록 원시 입력값을 만든다.
 * scoresFor()가 raw 기반 자동 채점으로 scores를 덮어쓰므로, 정량지표는
 * scores에 직접 넣어도 반영되지 않고 반드시 raw로 채워야 한다.
 */
const rawFor = (n: number): Project['raw'] => ({
  world: 0,
  marketSize: 0,
  growth: [0, 3, 8, 13, 20][n - 1],
  margin: [0, 2, 4, 8, 12][n - 1],
  current: 60,
  target: 60 + [0, 15, 20, 25, 30][n - 1],
  years: [0, 1.5, 2, 2.5, 3][n - 1],
  cost: [0, 20, 50, 100, 200][n - 1],
});

/** 12개 지표를 모두 같은 점수로 채운 과제 */
const flat = (n: number, over: Partial<Project> = {}) =>
  project({
    scores: Object.fromEntries(criteria.map((c) => [c.id, n])),
    raw: rawFor(n),
    ...over,
  });

// ────────────────────────────────────────────────────────────
// 원문 25쪽 · 등급부여 예시 10개 과제
// ────────────────────────────────────────────────────────────
describe('원문 25쪽 등급부여 예시', () => {
  // 과제명, 기대성과, 위험, 등급, 우선순위 — PDF 25쪽 표 그대로.
  const expected = [
    ['AAA', 70.83, 42.5, 'B', 5],
    ['BBB', 72.5, 26.67, 'B', 4],
    ['CCC', 85, 22, 'S', 1],
    ['DDD', 60, 51, 'B', 8],
    ['EEE', 77, 49, 'A', 2],
    ['FFF', 74, 36, 'B', 3],
    ['GGG', 56, 64, 'B', 9],
    ['HHH', 62, 69, 'B', 7],
    ['III', 44, 64, 'C', 10],
    ['JJJ', 67, 61, 'B', 6],
  ] as const;

  it('sampleProjects의 점수가 원문 표와 일치한다', () => {
    expect(sampleProjects).toHaveLength(10);
    for (const [name, ret, risk] of expected) {
      const p = sampleProjects.find((s) => s.id === `sample-${name}`);
      expect(p, name).toBeDefined();
      expect([p!.directReturn, p!.directRisk], name).toEqual([ret, risk]);
    }
  });

  it('10개 과제의 등급과 우선순위가 원문과 일치한다', () => {
    const rows = rank(sampleProjects, settings);
    for (const [name, , , grade, priority] of expected) {
      const row = rows.find((r) => r.id === `sample-${name}`)!;
      expect([row.grade, row.rank], name).toEqual([grade, priority]);
    }
  });

  it('정렬 방식을 세부 영역 기준으로 바꿔도 같은 순위가 나온다', () => {
    // 예시 10개는 B등급이 모두 B2라 두 정렬 기준의 결과가 같아야 한다.
    const byGrade = rank(sampleProjects, { ...settings, sorting: 'grade' });
    const byRegion = rank(sampleProjects, { ...settings, sorting: 'region' });
    expect(byRegion.map((p) => p.id)).toEqual(byGrade.map((p) => p.id));
  });
});

// ────────────────────────────────────────────────────────────
// 원문 21~22쪽 · 정량지표 점수기준
// ────────────────────────────────────────────────────────────
describe('정량지표 자동 채점 (원문 21~22쪽)', () => {
  const score = (raw: Project['raw'], key: string) => autoScores(raw)[key];

  it('시장규모 국내 — 1,000/2,000/3,500/5,000억원 경계', () => {
    const at = (marketSize: number) => score({ world: 0, marketSize, growth: 0 }, 'market');
    expect([at(999), at(1000), at(1999), at(2000)]).toEqual([1, 2, 2, 3]);
    expect([at(3499), at(3500), at(4999), at(5000)]).toEqual([3, 4, 4, 5]);
  });

  it('시장규모 세계 — 20/50/100/150억 달러 경계', () => {
    const at = (marketSize: number) => score({ world: 1, marketSize, growth: 0 }, 'market');
    expect([at(19), at(20), at(49), at(50)]).toEqual([1, 2, 2, 3]);
    expect([at(99), at(100), at(149), at(150)]).toEqual([3, 4, 4, 5]);
  });

  it('시장성장률 — 3/8/13/20% 경계', () => {
    const at = (growth: number) => score({ world: 0, marketSize: 0, growth }, 'market');
    expect([at(2.9), at(3), at(7.9), at(8)]).toEqual([1, 2, 2, 3]);
    expect([at(12.9), at(13), at(19.9), at(20)]).toEqual([3, 4, 4, 5]);
  });

  it('시장규모와 성장률 중 높은 점수를 적용한다', () => {
    // 규모 1점(500억) · 성장률 5점(25%) → 5점
    expect(score({ world: 0, marketSize: 500, growth: 25 }, 'market')).toBe(5);
    // 규모 5점(6,000억) · 성장률 1점(1%) → 5점
    expect(score({ world: 0, marketSize: 6000, growth: 1 }, 'market')).toBe(5);
  });

  it('연관업종 영업이익률 — 2/4/8/12% 경계', () => {
    const at = (margin: number) => score({ margin }, 'profit');
    expect([at(1.9), at(2), at(3.9), at(4)]).toEqual([1, 2, 2, 3]);
    expect([at(7.9), at(8), at(11.9), at(12)]).toEqual([3, 4, 4, 5]);
  });

  it('기술격차 — 현 기술수준 구간별로 기준표가 달라진다', () => {
    const at = (current: number, diff: number) =>
      score({ current, target: current + diff }, 'gap');
    // 90 이상: 2/4/6/8 — 목표수준이 100을 넘으면 안 되므로 현 수준 90으로 확인
    expect([at(90, 1), at(90, 2), at(90, 4), at(90, 6), at(90, 8)]).toEqual([1, 2, 3, 4, 5]);
    // 80~90 미만: 5/8/12/15
    expect([at(85, 4), at(85, 5), at(85, 8), at(85, 12), at(85, 15)]).toEqual([1, 2, 3, 4, 5]);
    // 70~80 미만: 10/15/20/25
    expect([at(75, 9), at(75, 10), at(75, 15), at(75, 20), at(75, 25)]).toEqual([1, 2, 3, 4, 5]);
    // 70 미만: 15/20/25/30
    expect([at(60, 14), at(60, 15), at(60, 20), at(60, 25), at(60, 30)]).toEqual([1, 2, 3, 4, 5]);
  });

  it('기술격차 — 90/80/70 경계는 해당 구간에 포함된다', () => {
    // 격차 8이면 90 이상 기준표에서 5점, 80대 기준표에서는 3점.
    expect(score({ current: 90, target: 98 }, 'gap')).toBe(5);
    expect(score({ current: 89, target: 97 }, 'gap')).toBe(3);
  });

  it('사업화 요구자원 — 기간·비용 점수의 평균을 사사오입한다', () => {
    const at = (years: number, cost: number) => score({ years, cost }, 'resources');
    // 기간 1점(1년) + 비용 1점(10억) → 1
    expect(at(1, 10)).toBe(1);
    // 기간 5점(3년) + 비용 5점(200억) → 5
    expect(at(3, 200)).toBe(5);
    // 기간 2점(1.5년) + 비용 3점(50억) → 2.5 → 사사오입 3
    expect(at(1.5, 50)).toBe(3);
    // 기간 1점(1년) + 비용 4점(100억) → 2.5 → 사사오입 3
    expect(at(1, 100)).toBe(3);
  });

  it('입력이 비었거나 범위를 벗어나면 null을 돌려준다', () => {
    expect(autoScores({}).market).toBeNull();
    expect(autoScores({ world: 0, marketSize: 100 }).market).toBeNull(); // 성장률 없음
    expect(autoScores({ current: 50, target: 40 }).gap).toBeNull(); // 목표 < 현재
    expect(autoScores({ current: -1, target: 50 }).gap).toBeNull();
    expect(autoScores({ current: 50, target: 101 }).gap).toBeNull();
    expect(autoScores({ years: -1, cost: 10 }).resources).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// 지표 가중치
// ────────────────────────────────────────────────────────────
describe('지표 정의 (원문 20~21쪽)', () => {
  it('기대성과·위험 각각 6개 지표이고 가중치 합이 100이다', () => {
    for (const axis of ['return', 'risk'] as const) {
      const cs = criteria.filter((c) => c.axis === axis);
      expect(cs, axis).toHaveLength(6);
      expect(cs.reduce((s, c) => s + c.weight, 0), axis).toBe(100);
    }
  });

  it('원문에 명시된 가중치를 유지한다', () => {
    const w = Object.fromEntries(criteria.map((c) => [c.id, c.weight]));
    expect(w).toEqual({
      excellence: 15, application: 10, ip: 15, market: 25, profit: 15, impact: 20,
      gap: 20, infrastructure: 15, barrier: 15, competition: 25, resources: 10, lifecycle: 15,
    });
  });
});

// ────────────────────────────────────────────────────────────
// 100점 환산
// ────────────────────────────────────────────────────────────
describe('100점 환산', () => {
  it('[테스트 전제] flat(n)은 12개 지표를 실제로 n점으로 채운다', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const s = scoresFor(flat(n));
      expect(criteria.map((c) => s[c.id]), `flat(${n})`).toEqual(criteria.map(() => n));
    }
  });

  it('÷5×100 방식 — 1점→20, 3점→60, 5점→100', () => {
    const s: Settings = { ...settings, normalization: 'five' };
    expect(axisScore(flat(1), 'return', s)).toBeCloseTo(20);
    expect(axisScore(flat(3), 'return', s)).toBeCloseTo(60);
    expect(axisScore(flat(5), 'return', s)).toBeCloseTo(100);
  });

  it('(n−1)÷4×100 방식 — 1점→0, 3점→50, 5점→100', () => {
    const s: Settings = { ...settings, normalization: 'zero' };
    expect(axisScore(flat(1), 'return', s)).toBeCloseTo(0);
    expect(axisScore(flat(3), 'return', s)).toBeCloseTo(50);
    expect(axisScore(flat(5), 'return', s)).toBeCloseTo(100);
  });

  it('가중치를 반영한다', () => {
    // 시장규모(25%)만 5점, 나머지 기대성과 지표는 1점
    const p = flat(1, { raw: { ...rawFor(1), marketSize: 6000 } });
    // five: 5점 지표 25% × 100 + 1점 지표 75% × 20 = 25 + 15 = 40
    expect(axisScore(p, 'return', { ...settings, normalization: 'five' })).toBeCloseTo(40);
    // zero: 5점 지표 25% × 100 + 1점 지표 75% × 0 = 25
    expect(axisScore(p, 'return', { ...settings, normalization: 'zero' })).toBeCloseTo(25);
  });

  it('지표가 하나라도 비면 null이다', () => {
    const p = flat(3);
    delete p.scores.impact;
    expect(axisScore(p, 'return', settings)).toBeNull();
    expect(axisScore(p, 'risk', settings)).toBeCloseTo(50); // 기본 환산에서 3점 → 50
  });

  it('기본 환산은 (n−1)÷4×100이고 0~100 전 구간을 쓴다', () => {
    // ÷5×100은 최저가 20점이라 매트릭스의 S 영역(위험<25)과 최하단 행에
    // 사실상 도달할 수 없다. 기본값을 되돌리면 이 테스트가 실패한다.
    expect(defaultSettings.normalization).toBe('zero');
    expect(axisScore(flat(1), 'risk', defaultSettings)).toBeCloseTo(0);
    expect(axisScore(flat(5), 'risk', defaultSettings)).toBeCloseTo(100);
    expect(axisScore(flat(1), 'risk', { ...settings, normalization: 'five' })).toBeCloseTo(20);
    // 전 지표 최저점인 과제가 기본 환산에서는 S 영역에 들어간다
    expect(classify(100, axisScore(flat(1), 'risk', defaultSettings)!, 'company').region).toBe('S');
  });

  it('직접 입력 모드는 0~100 범위만 받는다', () => {
    const direct = (n: number | null) =>
      axisScore(project({ mode: 'direct', directReturn: n }), 'return', settings);
    expect(direct(70.83)).toBe(70.83);
    expect(direct(101)).toBeNull();
    expect(direct(-1)).toBeNull();
    expect(direct(null)).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// 12개 영역 등급 판정 (원문 23~24쪽)
// ────────────────────────────────────────────────────────────
describe('등급 판정 — 기업주관형', () => {
  const grid = [
    // 기대성과 높은 행부터. 위험 낮은 열부터.
    [87.5, ['S', 'A1', 'B1', 'B1']],
    [62.5, ['A2', 'B2', 'B2', 'C1']],
    [37.5, ['B3', 'B3', 'C2', 'D1']],
    [12.5, ['B4', 'C3', 'D2', 'D2']],
  ] as const;

  it('12개 영역이 원문 배치와 일치한다', () => {
    for (const [ret, row] of grid) {
      row.forEach((region, col) => {
        const risk = col * 25 + 12.5;
        expect(classify(ret, risk, 'company').region, `${ret}/${risk}`).toBe(region);
      });
    }
  });

  it('경계값은 위쪽 행·오른쪽 열에 포함된다 (구현 가정)', () => {
    // 기대성과 75는 위쪽 행(S/A1 행), 위험 25는 오른쪽 열
    expect(classify(75, 10, 'company').region).toBe('S');
    expect(classify(74.99, 10, 'company').region).toBe('A2');
    expect(classify(87.5, 25, 'company').region).toBe('A1');
    expect(classify(87.5, 24.99, 'company').region).toBe('S');
  });

  it('등급은 영역 이름의 첫 글자다', () => {
    expect(classify(87.5, 12.5, 'company')).toMatchObject({ grade: 'S', eligible: true });
    expect(classify(12.5, 87.5, 'company')).toMatchObject({ grade: 'D', region: 'D2' });
  });

  it('점수가 없거나 범위 밖이면 미완료다', () => {
    for (const [ret, risk] of [[null, 50], [50, null], [-1, 50], [50, 101]] as const) {
      expect(classify(ret, risk, 'company')).toEqual({
        grade: '미완료', region: '—', eligible: false,
      });
    }
  });
});

describe('등급 판정 — 원천기술형 (도전적 R&D 영역)', () => {
  it('기대성과 60 미만 또는 위험 40 미만이면 영역 밖이다', () => {
    expect(classify(59.9, 50, 'research').grade).toBe('영역 밖');
    expect(classify(70, 39.9, 'research').grade).toBe('영역 밖');
    expect(classify(60, 40, 'research').eligible).toBe(true);
  });

  it('축이 기대성과 60~100 · 위험 40~100으로 재척도된다', () => {
    // 원문 24쪽 눈금: 기대성과 60/70/80/90/100, 위험 40/55/70/85/100
    expect(classify(95, 47, 'research').region).toBe('S'); // 최상단·최좌측
    expect(classify(65, 95, 'research').region).toBe('D2'); // 최하단·최우측
    expect(classify(95, 95, 'research').region).toBe('B1');
    expect(classify(65, 47, 'research').region).toBe('B4');
  });

  it('재척도 눈금 경계 — 기대성과 90 / 위험 70 · 85', () => {
    // 기대성과 90 = 재척도 75 → 위쪽 행
    expect(classify(90, 47, 'research').region).toBe('S');
    expect(classify(89.9, 47, 'research').region).toBe('A2');
    // 위험 70 = 재척도 50 → 오른쪽 열
    expect(classify(95, 70, 'research').region).toBe('B1');
    expect(classify(95, 69.9, 'research').region).toBe('A1');
    // 위험 85 = 재척도 75 → 최우측 열 (기대성과 75 = 재척도 37.5 행에서 확인)
    expect(classify(75, 85, 'research').region).toBe('D1');
    expect(classify(75, 84.9, 'research').region).toBe('C2');
  });

  it('같은 점수라도 과제 유형이 다르면 등급이 다르다', () => {
    expect(classify(65, 47, 'company').region).toBe('B2');
    expect(classify(65, 47, 'research').region).toBe('B4');
  });
});

// ────────────────────────────────────────────────────────────
// 우선순위 정렬
// ────────────────────────────────────────────────────────────
describe('우선순위 정렬', () => {
  const make = (name: string, ret: number, risk: number): Project =>
    project({ id: name, name, mode: 'direct', directReturn: ret, directRisk: risk });

  it('대등급 → 기대성과 순으로 정렬한다', () => {
    const rows = rank([make('저', 30, 30), make('고', 90, 10), make('중', 65, 20)], settings);
    expect(rows.map((r) => r.name)).toEqual(['고', '중', '저']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('세부 영역 정렬은 regionOrder를 따른다', () => {
    // A2(기대 62.5·위험 12.5) 와 B1(기대 87.5·위험 62.5)
    const a2 = make('A2과제', 62.5, 12.5);
    const b1 = make('B1과제', 87.5, 62.5);
    // 대등급 기준이면 B1(B) 보다 A2(A) 가 앞선다
    expect(rank([b1, a2], { ...settings, sorting: 'grade' }).map((r) => r.name))
      .toEqual(['A2과제', 'B1과제']);
    // 세부 영역 기준이어도 A2가 B1보다 앞선다
    expect(regionOrder.indexOf('A2')).toBeLessThan(regionOrder.indexOf('B1'));
    expect(rank([b1, a2], { ...settings, sorting: 'region' }).map((r) => r.name))
      .toEqual(['A2과제', 'B1과제']);
  });

  it('동률이면 과제명 순으로 표시한다', () => {
    const rows = rank([make('나', 70, 30), make('가', 70, 30)], settings);
    expect(rows.map((r) => r.name)).toEqual(['가', '나']);
  });

  it('미완료·영역 밖 과제는 뒤로 보내고 순위를 주지 않는다', () => {
    const rows = rank([project({ id: 'x', name: '미완료' }), make('완료', 80, 20)], settings);
    expect(rows.map((r) => r.name)).toEqual(['완료', '미완료']);
    expect(rows.map((r) => r.rank)).toEqual([1, null]);
  });
});

// ────────────────────────────────────────────────────────────
// 정성평가 분포 검증
// ────────────────────────────────────────────────────────────
describe('정성평가 분포 검증', () => {
  const many = (n: number, scores: Record<string, number>) =>
    Array.from({ length: n }, (_, i) => project({ id: `p${i}`, scores: { ...scores } }));

  it('기대성과 정성지표의 3점 이상 비율이 60%를 넘으면 경고한다', () => {
    // 10개 중 7개가 4점 → 70%
    const ps = [...many(7, { excellence: 4 }), ...many(3, { excellence: 2 }).map(
      (p, i) => ({ ...p, id: `q${i}` }),
    )];
    expect(distributionWarnings(ps).some((w) => w.includes('기술적 수월성'))).toBe(true);
  });

  it('60% 이하면 경고하지 않는다', () => {
    const ps = [...many(6, { excellence: 4 }), ...many(4, { excellence: 2 }).map(
      (p, i) => ({ ...p, id: `q${i}` }),
    )];
    expect(distributionWarnings(ps).some((w) => w.includes('기술적 수월성'))).toBe(false);
  });

  it('위험 지표는 3점 미만 비율을 본다', () => {
    const ps = many(10, { competition: 1 });
    expect(distributionWarnings(ps).some((w) => w.includes('시장경쟁강도'))).toBe(true);
  });

  it('직접 입력 과제는 제외한다', () => {
    const ps = many(10, { excellence: 5 }).map((p) => ({ ...p, mode: 'direct' as const }));
    expect(distributionWarnings(ps)).toEqual([]);
  });

  it('미입력 과제가 섞이면 잠정치임을 알린다', () => {
    const ps = [...many(3, { excellence: 5 }), project({ id: 'blank' })];
    const w = distributionWarnings(ps).find((x) => x.includes('기술적 수월성'));
    expect(w).toContain('잠정치');
  });
});

// ────────────────────────────────────────────────────────────
// 백업 검증
// ────────────────────────────────────────────────────────────
describe('JSON 백업 검증', () => {
  const backup = (over: Record<string, unknown> = {}) => ({
    version: 1,
    settings: defaultSettings,
    projects: [project({ id: 'a', name: '과제' })],
    ...over,
  });

  it('정상 백업을 통과시킨다', () => {
    const r = validateImport(backup());
    expect(r.projects).toHaveLength(1);
    expect(r.settings).toEqual(defaultSettings);
  });

  it('되돌아온 값은 원본과 참조를 공유하지 않는다', () => {
    const src = backup();
    const r = validateImport(src);
    r.projects[0].scores.excellence = 5;
    expect((src.projects as Project[])[0].scores.excellence).toBeUndefined();
  });

  it('버전·형식이 다르면 거부한다', () => {
    for (const bad of [null, 'x', {}, backup({ version: 2 }), backup({ projects: 'x' })]) {
      expect(() => validateImport(bad)).toThrow();
    }
  });

  it('과제 고유번호가 중복되면 거부한다', () => {
    const p = project({ id: 'dup', name: '과제' });
    expect(() => validateImport(backup({ projects: [p, { ...p }] }))).toThrow();
  });

  it('지표 점수는 1~5 사이의 정수만 받는다', () => {
    // 원문 기준표가 1~5점 정수라 소수·범위 밖·비정상 값은 모두 거부한다.
    for (const n of [0, 6, -1, 2.5, 4.999, Number.NaN, Number.POSITIVE_INFINITY]) {
      const p = project({ id: 'a', name: '과제', scores: { excellence: n } });
      expect(() => validateImport(backup({ projects: [p] })), String(n)).toThrow();
    }
    // 1~5 정수와 미입력(null)은 통과해야 한다.
    for (const n of [1, 2, 3, 4, 5, null]) {
      const ok = project({ id: 'a', name: '과제', scores: { excellence: n } });
      expect(() => validateImport(backup({ projects: [ok] })), String(n)).not.toThrow();
    }
  });

  it('알 수 없는 지표 이름은 거부한다', () => {
    const p = project({ id: 'a', name: '과제', scores: { unknown: 3 } });
    expect(() => validateImport(backup({ projects: [p] }))).toThrow();
  });

  it('종합점수는 0~100점만 받는다', () => {
    const p = project({ id: 'a', name: '과제', directReturn: 101 });
    expect(() => validateImport(backup({ projects: [p] }))).toThrow();
  });

  it('이름이 비었거나 과제 유형이 잘못되면 거부한다', () => {
    for (const over of [{ name: '  ' }, { type: 'x' as Project['type'] }, { mode: 'x' as Project['mode'] }]) {
      const p = project({ id: 'a', name: '과제', ...over });
      expect(() => validateImport(backup({ projects: [p] }))).toThrow();
    }
  });

  it('평가 설정이 유효하지 않으면 거부한다', () => {
    expect(() => validateImport(backup({ settings: { normalization: 'x', sorting: 'grade' } }))).toThrow();
    expect(() => validateImport(backup({ settings: undefined }))).toThrow();
  });

  it('백업 → 복원이 평가 결과를 바꾸지 않는다', () => {
    const before = rank(sampleProjects, settings);
    const round = validateImport(JSON.parse(
      JSON.stringify({ version: 1, projects: sampleProjects, settings }),
    ));
    const after = rank(round.projects, round.settings);
    expect(after.map((p) => [p.id, p.grade, p.rank]))
      .toEqual(before.map((p) => [p.id, p.grade, p.rank]));
  });
});

// ────────────────────────────────────────────────────────────
// 표시용 반올림이 판정에 영향을 주지 않는지
// ────────────────────────────────────────────────────────────
describe('반올림 정책', () => {
  it('등급은 반올림 전 값으로 판정한다', () => {
    // 74.999…는 표시상 75.00이지만 등급은 아래 행이어야 한다.
    const p = project({ mode: 'direct', directReturn: 74.999, directRisk: 10 });
    const r = evaluate(p, settings);
    expect(r.ret!.toFixed(2)).toBe('75.00');
    expect(r.region).toBe('A2');
  });
});
