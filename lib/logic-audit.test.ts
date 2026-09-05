import {describe,expect,it} from 'vitest';
import {autoScores,axisScore,classify,criteria,distributionWarnings,newProject,regionOrder,sampleProjects} from './nepsa';
import {addExamples,createBackup,saveWorkspace,WorkspaceConflict} from './workspace';

describe('기술격차 소수점 경계',()=>{
 it('83.1−63.1의 이진 소수 오차로 격차 20을 낮게 채점하지 않는다',()=>{
  expect(83.1-63.1).toBeLessThan(20);
  expect(autoScores({current:63.1,target:83.1}).gap).toBe(3);
  expect(autoScores({current:63.1,target:83.0999}).gap).toBe(2);
 });
 it('소수 둘째 자리의 모든 유효한 현재수준에서 경계 위·아래를 검증한다',()=>{
  for(let c=1;c<10000;c++){
   const current=c/100;
   const cuts=current>=90?[2,4,6,8]:current>=80?[5,8,12,15]:current>=70?[10,15,20,25]:[15,20,25,30];
   cuts.forEach((gap,index)=>{
    const target=(c+gap*100)/100;if(target>100)return;
    expect(autoScores({current,target}).gap,`${current} → ${target}`).toBe(index+2);
    expect(autoScores({current,target:target-.00001}).gap).toBe(index+1);
   });
  }
 });
 it('경계 아래의 고정밀 입력을 허용 오차로 경계 안에 넣지 않는다',()=>{
  expect(autoScores({current:2.24,target:17.24}).gap).toBe(2);
  expect(autoScores({current:2.24,target:17.239999999999995}).gap).toBe(1);
  expect(autoScores({current:1e-7,target:15.0000001}).gap).toBe(2);
 });
});

describe('등급 매트릭스 전역 불변식',()=>{
 for(const type of ['company','research']as const){
  it(`${type}: 전 영역 도달, 기대성과 증가·위험 감소가 우선영역을 악화시키지 않는다`,()=>{
   const seen=new Set<string>(),minimum=type==='research'?{r:60,k:40}:{r:0,k:0};
   for(let r=minimum.r;r<=100;r++)for(let k=minimum.k;k<=100;k++){
    const now=classify(r,k,type);seen.add(now.region);
    expect(now.eligible).toBe(true);
    if(r<100)expect(regionOrder.indexOf(classify(r+1,k,type).region)).toBeLessThanOrEqual(regionOrder.indexOf(now.region));
    if(k>minimum.k)expect(regionOrder.indexOf(classify(r,k-1,type).region)).toBeLessThanOrEqual(regionOrder.indexOf(now.region));
   }
   expect([...seen].sort()).toEqual([...regionOrder].sort());
  });
 }
 it('정성 분포에 오류 점수를 유효한 응답으로 포함하지 않는다',()=>{
  const p=newProject('x','company');
  expect(distributionWarnings([{...p,scores:{excellence:99,infrastructure:-1}}])).toEqual([]);
 });
 it('가져오기 검사를 거치지 않은 비정수 지표도 채점하지 않는다',()=>{
  const p={...newProject('x','company'),scores:Object.fromEntries(criteria.map(c=>[c.id,3])),raw:{world:0,marketSize:2000,growth:8,margin:4,current:70,target:85,years:2,cost:50}};
  expect(axisScore({...p,scores:{...p.scores,excellence:3.5}},'return')).toBeNull();
 });
});

describe('실제 저장 절차의 오류 경로',()=>{
 const makeStore=()=>{
  const data=new Map<string,string>();
  return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
 };
 it('다른 탭에서 갱신한 저장본을 덮어쓰지 않는다',()=>{
  const store=makeStore(),p=newProject('x','company');
  const old=saveWorkspace(store,'work',[p],null);
  const newest=saveWorkspace(store,'work',[{...p,name:'다른 탭 수정'}],old);
  expect(()=>saveWorkspace(store,'work',[{...p,name:'현재 탭 수정'}],old)).toThrow(WorkspaceConflict);
  expect(store.getItem('work')).toBe(newest);
 });
 it('입력이 잘못된 경우 저장 호출이 기존 원본을 보존한다',()=>{
  const store=makeStore(),p=newProject('x','company');
  const old=saveWorkspace(store,'work',[p],null);
  expect(()=>saveWorkspace(store,'work',[{...p,directRisk:101}],old)).toThrow();
  expect(store.getItem('work')).toBe(old);
  expect(()=>saveWorkspace(store,'work',[{...p,directRisk:100}],old)).not.toThrow();
 });
 it('내용이 동일한 중복 저장은 충돌로 취급하지 않는다',()=>{
  const store=makeStore(),p=newProject('x','company');
  const old=saveWorkspace(store,'work',[p],null);
  expect(saveWorkspace(store,'work',[p],null)).toBe(old);
 });
 it('저장소 쓰기 실패는 호출자에게 전달한다',()=>{
  const store={getItem:()=>null,setItem:()=>{throw new Error('quota');}};
  expect(()=>saveWorkspace(store,'work',[],null)).toThrow('quota');
 });
 it('복원 한도를 초과하는 백업을 생성하지 않는다',()=>{
  const projects=Array.from({length:30},(_,i)=>({...newProject(`p${i}`,'company'),notes:Object.fromEntries(criteria.map(c=>[c.id,'가'.repeat(20000)]))}));
  expect(()=>createBackup(projects)).toThrow('5MB');
 });
});

describe('원문 예시 불러오기',()=>{
 it('CCC를 원천기술형으로 바꿔도 기업주관형의 유효한 과제를 선택한다',()=>{
  const projects=sampleProjects.map(p=>p.id==='sample-CCC'?{...p,type:'research' as const}:p);
  const next=addExamples(projects);
  expect(next.projects.find(p=>p.id===next.selected)?.type).toBe('company');
  expect(next.projects.find(p=>p.id==='sample-CCC')?.type).toBe('research');
 });
 it('모든 예시가 다른 유형이면 빈 선택을 명시한다',()=>{
  const next=addExamples(sampleProjects.map(p=>({...p,type:'research'})));
  expect(next.selected).toBe('');
  expect(next.added).toBe(0);
 });
 it('불러온 예시를 수정해도 원본과 다음 불러오기에 영향을 주지 않는다',()=>{
  const next=addExamples([]);next.projects[0].notes.summary='편집';
  expect(addExamples([]).projects[0].notes.summary).not.toBe('편집');
 });
 it('한도를 초과하면 일부만 추가하지 않고 오류를 반환한다',()=>{
  const projects=Array.from({length:995},(_,i)=>newProject(`p${i}`,'company'));
  expect(()=>addExamples(projects)).toThrow('1,000');
  expect(projects).toHaveLength(995);
 });
});
