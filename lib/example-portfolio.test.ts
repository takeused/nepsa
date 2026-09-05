import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {rank,scoresFor,validateImport,criteria} from './nepsa';

// 2026-09-05: 앱 모듈을 호출하지 않는 별도 Python 계산으로 확인한 기대값.
// 현재 채택한 환산·IP 반올림 가정의 회귀 기준이며 KEIT의 공식 평가 결과가 아니다.
const expected = [
 ['demo-01',90,60,'B1',3],
 ['demo-02',86.25,61.25,'B1',4],
 ['demo-03',73.75,47.5,'B2',6],
 ['demo-04',61.25,47.5,'B2',7],
 ['demo-05',45,33.75,'B3',8],
 ['demo-06',82.5,52.5,'B1',5],
 ['demo-07',76.25,47.5,'A1',1],
 ['demo-08',26.25,20,'B3',9],
 ['demo-09',3.75,28.75,'C3',11],
 ['demo-10',71.25,11.25,'A2',2],
 ['demo-11',36.25,53.75,'C2',10],
 ['demo-12',96.25,70,'B1',1],
 ['demo-13',90,80,'B1',2],
 ['demo-14',75,63.75,'B3',3],
] as const;
const data:unknown=JSON.parse(readFileSync(new URL('../docs/example-portfolio.json',import.meta.url),'utf8'));
const projects=validateImport(data).projects;
describe('Claude 가상 포트폴리오 독립 검산 기준',()=>{
 it('기업주관 11개와 원천기술 3개의 평가값이 모두 채워져 있다',()=>{
  expect(projects.filter(p=>p.type==='company')).toHaveLength(11);
  expect(projects.filter(p=>p.type==='research')).toHaveLength(3);
  for(const p of projects){
   expect(p.mode).toBe('criteria');
   const scores=scoresFor(p);
   expect(criteria.every(c=>typeof scores[c.id]==='number'),p.id).toBe(true);
  }
 });
 it.each(expected)('%s: 독립 검산한 기대성과 %s, 위험 %s, 영역 %s, 유형 내 순위 %s와 일치한다',(id,ret,risk,region,priority)=>{
  const project=projects.find(p=>p.id===id)!;
  const actual=rank(projects.filter(p=>p.type===project.type)).find(p=>p.id===id)!;
  expect([actual.ret,actual.risk,actual.region,actual.rank]).toEqual([ret,risk,region,priority]);
 });
});
