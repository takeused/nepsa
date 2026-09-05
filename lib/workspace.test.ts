import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {autoScores,axisScore,classify,newProject,scoresFor,validateImport} from './nepsa';
import {createBackup,migrationWarning,MODEL_VERSION,workspaceError} from './workspace';

describe('작업 저장과 복원 회귀',()=>{
 it('기존 14개 예제의 점수와 평가값을 백업·복원 후 보존한다',()=>{
  const example:unknown=JSON.parse(readFileSync(new URL('../docs/example-portfolio.json',import.meta.url),'utf8'));
  const before=validateImport(example).projects;
  const after=validateImport(JSON.parse(JSON.stringify(createBackup(before)))).projects;
  expect(before).toHaveLength(14);
  expect(after).toEqual(before);
  expect(after.map(p=>[axisScore(p,'return'),axisScore(p,'risk')])).toEqual(before.map(p=>[axisScore(p,'return'),axisScore(p,'risk')]));
  expect(after.every(p=>axisScore(p,'return')!==null&&axisScore(p,'risk')!==null)).toBe(true);
 });
 it('이름 편집 중 비운 상태는 저장하지 않고 수정 후 저장을 재개할 수 있다',()=>{
  const p=newProject('test','company');const original=JSON.stringify(createBackup([p]));
  expect(workspaceError([{...p,name:''}])).not.toBe('');
  expect(()=>createBackup([{...p,name:''}])).toThrow();
  expect(validateImport(JSON.parse(original)).projects[0].name).toBe(p.name);
  expect(workspaceError([{...p,name:'수정한 과제'}])).toBe('');
 });
 it('UI에서 입력 가능한 범위 밖 종합점수는 백업으로 내보내지 않는다',()=>{
  const p={...newProject('test','company'),mode:'direct' as const,directReturn:101,directRisk:40};
  expect(()=>createBackup([p])).toThrow();
  expect(()=>createBackup([{...p,directReturn:100}])).not.toThrow();
 });
 it('빈 평가와 유효한 지표 평가를 모델 식별자와 함께 복원한다',()=>{
  const backup=createBackup([newProject('test','company')]);
  expect(backup.model).toBe(MODEL_VERSION);
  expect(migrationWarning(backup)).toBe('');
  expect(validateImport(JSON.parse(JSON.stringify(backup))).projects).toMatchObject(backup.projects);
 });
 it('구 ÷5 백업은 현재 점수로 바뀔 수 있음을 명시한다',()=>{
  expect(migrationWarning({version:1,projects:[],settings:{normalization:'five'}})).toContain('점수·등급');
  expect(migrationWarning({version:1,projects:[]})).toContain('기록되지 않은');
  expect(migrationWarning({model:'future-model'})).toContain('다릅니다');
 });
});

describe('IP 부상도 자동/수동 전환',()=>{
 const p={...newProject('test','company'),scores:{ip:5}};
 it('하나만 입력하면 예전 수동 점수를 쓰지 않는다',()=>{
  expect(scoresFor({...p,raw:{ipFilings:72}}).ip).toBeNull();
 });
 it('네 수치 중 한 개를 지우면 자동 채점을 미완료로 돌린다',()=>{
  const raw={ipFilings:72,ipDomestic:124,ipShare:38,ipMarket:48};
  expect(scoresFor({...p,raw}).ip).toBe(4);
  expect(scoresFor({...p,raw:{...raw,ipShare:null}}).ip).toBeNull();
 });
 it('모든 수치를 지우면 수동 점수를 다시 사용한다',()=>{
  expect(scoresFor({...p,raw:{ipFilings:null,ipDomestic:null,ipShare:null,ipMarket:null}}).ip).toBe(5);
 });
 it('점유율 100% 초과나 증가율 −100% 미만을 채점하지 않는다',()=>{
  const raw={ipFilings:72,ipDomestic:124,ipShare:38,ipMarket:48};
  for(const invalid of [{ipShare:101},{ipShare:-1},{ipFilings:-101}]){
   expect(autoScores({...raw,...invalid}).ip).toBeNull();
   expect(scoresFor({...p,raw:{...raw,...invalid}}).ip).toBeNull();
   expect(()=>validateImport({version:1,projects:[{...p,raw:{...raw,...invalid}}]})).toThrow();
  }
 });
});

describe('입력 제약과 구현 가정',()=>{
 it('잘못된 시장 구분을 국내시장으로 조용히 해석하지 않는다',()=>{
  expect(autoScores({world:2,marketSize:1000,growth:8}).market).toBeNull();
  expect(autoScores({marketSize:1000,growth:8}).market).toBe(3); // legacy domestic
 });
 it('기술 목표 역전과 음수 비용을 백업에서 거부한다',()=>{
  const invalid:Record<string,number|null>[]=[{current:90,target:80},{years:-1},{cost:-2},{world:0.5}];
  for(const raw of invalid){
   expect(()=>createBackup([{...newProject('test','company'),raw}])).toThrow();
  }
 });
 it('손실률은 허용하며 시장 감소율 −100%도 유효하다',()=>{
  expect(autoScores({margin:-30}).profit).toBe(1);
  expect(autoScores({world:0,marketSize:0,growth:-100}).market).toBe(1);
 });
 it('구 ÷5 환산도 위험 최저 20점으로 S 영역에 도달할 수 있다',()=>{
  expect(classify(100,20,'company').region).toBe('S');
  expect(classify(20,20,'company').region).toBe('B4');
 });
 it('현재 고정 환산의 최저는 0점이며 직접 입력은 환산하지 않는다',()=>{
  expect(axisScore({...newProject('test','company'),mode:'direct',directReturn:85},'return')).toBe(85);
 });
});
