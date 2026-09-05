import {describe,it,expect} from 'vitest';
import {compareScenario,contributions,csvCell,detailedCsv,historyChanges,parseHistory,parseScenarios,persistHistory,regionBounds,serializeHistory,serializeScenarios,snapshot} from './analysis';
import type {ScenarioSet} from './analysis';
import {sampleProjects,newProject,axisScore,validateImport} from './nepsa';

describe('분석과 원본 보존',()=>{
 it('기여점수 합은 축 점수와 같다',()=>{const p=newProject('x','company');p.scores={excellence:4,application:3,ip:2,impact:5};p.raw={world:0,marketSize:3000,growth:10,margin:8};expect(contributions(p).filter(c=>c.axis==='return').reduce((n,c)=>n+c.points!,0)).toBe(axisScore(p,'return'));});
 it('직접입력 과제의 지표 기여를 생성하지 않는다',()=>expect(contributions(sampleProjects[0])).toEqual([]));
 it('시나리오가 다른 과제 순위를 바꾸어도 원본은 그대로다',()=>{const original=structuredClone(sampleProjects),draft={...original[0],directReturn:100,directRisk:0};const c=compareScenario(original,draft);expect(c.find(x=>x.after.id===draft.id)?.after.rank).toBe(1);expect(c.find(x=>x.after.id==='sample-CCC')?.after.rank).toBe(2);expect(original).toEqual(sampleProjects);});
 it('다른 유형 또는 없는 과제 비교를 거절한다',()=>{expect(()=>compareScenario(sampleProjects,{...sampleProjects[0],type:'research'})).toThrow();expect(()=>compareScenario([] ,sampleProjects[0])).toThrow();});
 it('원천기술형이 영역 밖으로 이동하면 순위를 비운다',()=>{const p={...sampleProjects[0],type:'research' as const,directReturn:95,directRisk:45};const c=compareScenario([p],{...p,directRisk:39});expect(c[0].before.region).toBe('S');expect(c[0].after.rank).toBeNull();});
 it('유형별 실제 좌표의 영역 범위를 반환한다',()=>{expect(regionBounds(sampleProjects[2])).toEqual({returnMin:75,returnMax:100,riskMin:0,riskMax:25});expect(regionBounds({...sampleProjects[2],type:'research',directReturn:95,directRisk:45})).toEqual({returnMin:90,returnMax:100,riskMin:40,riskMax:55});});
 it('영역 밖은 경계값을 제시하지 않는다',()=>expect(regionBounds({...sampleProjects[0],type:'research',directReturn:59})).toBeNull());
});
describe('분석 저장 경계와 복구',()=>{
 const data=():ScenarioSet=>({version:1,kind:'nepsa-scenarios',model:'test',base:sampleProjects[0],draft:{...sampleProjects[0],directReturn:99},name:'낙관',scenarios:[{name:'비관',project:sampleProjects[0]}]});
 it('시나리오 백업은 기준·편집 중인 값·이름을 모두 복원한다',()=>expect(parseScenarios(serializeScenarios(data()))).toEqual(data()));
 it('시나리오 타입 혼합과 중복 이름을 거절한다',()=>{const s=data();s.draft.type='research';expect(()=>serializeScenarios(s)).toThrow();const t=data();t.scenarios.push(t.scenarios[0]);expect(()=>serializeScenarios(t)).toThrow();});
 it('누락된 기준·잘못된 점수·포트폴리오 백업 혼동을 거절한다',()=>{expect(()=>parseScenarios('{"version":1,"projects":[]}')).toThrow();const s=data();s.draft.directRisk=101;expect(()=>serializeScenarios(s)).toThrow();expect(()=>parseScenarios(JSON.stringify({...data(),base:null}))).toThrow();});
 it('다른 탭이 이력을 갱신했으면 기존 저장값을 보존한다',()=>{let value='other';const storage={getItem:()=>value,setItem:(_key:string,v:string)=>{value=v;}};expect(()=>persistHistory(storage,'h',[] ,null)).toThrow();expect(value).toBe('other');});
 it('이력은 저장 공간 부족 시 성공으로 처리하지 않는다',()=>{const storage={getItem:()=>null,setItem:()=>{throw new Error('quota');}};expect(()=>persistHistory(storage,'h',[],null)).toThrow('quota');});
 it('유효한 이력만 저장하고 반환한 값을 다음 저장 기준으로 사용한다',()=>{let value:string|null=null;const storage={getItem:()=>value,setItem:(_key:string,v:string)=>{value=v;}};const first=persistHistory(storage,'h',[],null);expect(parseHistory(first)).toEqual([]);const second=persistHistory(storage,'h',[snapshot(sampleProjects,'검토','1','2026-09-05')],first);expect(parseHistory(second)).toHaveLength(1);});
 it('범위 밖 지표는 기여점수로 표시하지 않는다',()=>{const p=newProject('x','company');p.scores.excellence=6;expect(contributions(p).find(c=>c.id==='excellence')?.points).toBeNull();});
});
describe('이력과 출력',()=>{
 const make=()=>snapshot(sampleProjects,'1차 검토','s1','2026-09-05T12:00:00Z');
 it('스냅숏은 중첩 근거까지 원본과 분리된다',()=>{const s=make();s.projects[0].notes.summary='변경';expect(sampleProjects[0].notes.summary).not.toBe('변경');});
 it('이력 백업 왕복이 모델과 근거를 보존한다',()=>expect(parseHistory(serializeHistory([make()]))).toEqual([make()]));
 it('중복 고유번호와 20회 초과는 거절한다',()=>{expect(()=>serializeHistory([make(),make()])).toThrow();expect(()=>serializeHistory(Array.from({length:21},(_,i)=>({...make(),id:String(i)})))).toThrow();});
 it('잘못된 점수와 날짜를 거절한다',()=>{const s=make();s.projects[0].directReturn=101;expect(()=>serializeHistory([s])).toThrow();expect(()=>serializeHistory([{...make(),createdAt:'invalid'}])).toThrow();});
 it('5MB 초과 이력을 거절한다',()=>expect(()=>parseHistory(' '.repeat(5*1024*1024+1))).toThrow());
 it('추가·삭제·직접점수·근거·유형 변경을 추적한다',()=>{const p=structuredClone(sampleProjects[0]),q={...p,directReturn:99,notes:{summary:'갱신'},type:'research' as const};const diff=historyChanges([p,sampleProjects[1]],[q,sampleProjects[2]]);expect(diff.find(d=>d.id===p.id)!.changes.join(' ')).toContain('직접입력 성과');expect(diff.find(d=>d.id===p.id)!.changes.join(' ')).toContain('갱신');expect(diff.find(d=>d.id===sampleProjects[1].id)!.current).toBeUndefined();expect(diff.find(d=>d.id===sampleProjects[2].id)!.previous).toBeUndefined();expect(diff.find(d=>d.id===p.id)!.current?.rank).toBe(1);});
 it('Excel 수식 실행문자와 인용부호를 안전하게 출력한다',()=>{expect(csvCell(' =1+1')).toBe('"\' =1+1"');expect(csvCell('a"b\nc')).toBe('"a""b\nc"');});
 it('직접입력 근거와 모델을 CSV에 기록한다',()=>{const csv=detailedCsv(sampleProjects);expect(csv.startsWith('\uFEFF')).toBe(true);expect(csv).toContain('직접 입력');expect(csv).toContain('2013 KEIT');});
 it('추가한 출처·확신도 필드는 기존 백업으로 보존된다',()=>{const p=structuredClone(sampleProjects[0]);p.notes['market:source']='보고서';p.notes['market:confidence']='낮음';expect(validateImport({version:1,projects:[p]}).projects[0].notes).toEqual(p.notes);});
});
