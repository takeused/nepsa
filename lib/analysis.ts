import {criteria,evaluate,rank,regions,scoresFor,validateImport} from './nepsa';
import type {Project} from './nepsa';
import {createBackup,MAX_BACKUP_BYTES,MODEL_VERSION} from './workspace';

export function contributions(p:Project){
 if(p.mode==='direct')return [];
 const scores=scoresFor(p);
 return criteria.map(c=>({...c,score:scores[c.id],points:Number.isInteger(scores[c.id])&&scores[c.id]!>=1&&scores[c.id]!<=5?((scores[c.id]!-1)/4)*c.weight:null}));
}
export function regionBounds(p:Project){
 const result=evaluate(p),r=regions.find(x=>x.name===result.region);
 if(!r)return null;
 const x=p.type==='research'?40:0,y=p.type==='research'?60:0;
 return {returnMin:y+r.y*(100-y)/100,returnMax:y+(r.y+r.h)*(100-y)/100,riskMin:x+r.x*(100-x)/100,riskMax:x+(r.x+r.w)*(100-x)/100};
}
export function compareScenario(projects:Project[],draft:Project){
 const original=projects.find(p=>p.id===draft.id);
 if(!original||original.type!==draft.type)throw new Error('같은 과제 유형 안에서 비교하세요.');
 const group=projects.filter(p=>p.type===draft.type);
 const before=rank(group),after=rank(group.map(p=>p.id===draft.id?draft:p));
 const byId=new Map(after.map(p=>[p.id,p]));
 return before.map(p=>({before:p,after:byId.get(p.id)!}));
}
export type ScenarioSet={version:1;kind:'nepsa-scenarios';model:string;base:Project;draft:Project;name:string;scenarios:{name:string;project:Project}[]};
export function parseScenarios(text:string):ScenarioSet{
 if(new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw new Error('시나리오 백업은 5MB 이하만 지원합니다.');
 const s=JSON.parse(text) as ScenarioSet;
 if(!s||s.version!==1||s.kind!=='nepsa-scenarios'||typeof s.model!=='string'||!Array.isArray(s.scenarios)||s.scenarios.length>3)throw new Error('올바른 시나리오 백업이 아닙니다.');
 const project=(p:Project)=>validateImport({version:1,projects:[p]}).projects[0];
 const base=project(s.base),draft=project(s.draft),names=new Set<string>();
 const name=(v:string)=>{if(typeof v!=='string'||!v.trim()||v.length>100)throw new Error('시나리오 이름은 1~100자여야 합니다.');return v.trim();};
 const same=(p:Project)=>{if(p.id!==base.id||p.type!==base.type)throw new Error('시나리오의 과제와 유형이 기준 과제와 다릅니다.');return p;};
 return {version:1,kind:'nepsa-scenarios',model:s.model,base,draft:same(draft),name:name(s.name),scenarios:s.scenarios.map(v=>{const n=name(v?.name);if(names.has(n))throw new Error('시나리오 이름이 중복됩니다.');names.add(n);return {name:n,project:same(project(v.project))};})};
}
export function serializeScenarios(data:ScenarioSet){const text=JSON.stringify(data);parseScenarios(text);return text;}
export function persistHistory(storage:Pick<Storage,'getItem'|'setItem'>,key:string,next:Snapshot[],expected:string|null){
 const text=serializeHistory(next);
 if(storage.getItem(key)!==expected)throw new Error('다른 탭의 이력이 변경되었습니다. 이력 새로 불러오기를 눌러 주세요.');
 storage.setItem(key,text);return text;
}
export function historyChanges(before:Project[],after:Project[]){
 const ranked=(ps:Project[])=>new Map((['company','research']as const).flatMap(type=>rank(ps.filter(p=>p.type===type))).map(p=>[p.id,p]));
 const a=ranked(before),b=ranked(after);
 return Array.from(new Set([...a.keys(),...b.keys()])).map(id=>{
  const previous=a.get(id),current=b.get(id),changes:string[]=[];
  if(previous&&current){
   for(const [key,label]of [['name','과제명'],['type','유형'],['mode','평가 방식'],['directReturn','직접입력 성과'],['directRisk','직접입력 위험']]as const)if(previous[key]!==current[key])changes.push(`${label}: ${previous[key]??'미입력'} → ${current[key]??'미입력'}`);
   for(const key of ['scores','raw','notes']as const){
    for(const field of new Set([...Object.keys(previous[key]),...Object.keys(current[key])]))if(previous[key][field]!==current[key][field])changes.push(`${criteria.find(c=>c.id===field)?.name||field}: ${previous[key][field]??'미입력'} → ${current[key][field]??'미입력'}`);
   }
  }
  return {id,previous,current,changes};
 });
}
export type Snapshot={id:string;label:string;createdAt:string;model:string;projects:Project[]};
export function snapshot(projects:Project[],label:string,id:string,createdAt:string):Snapshot{
 if(!label.trim()||label.length>200)throw new Error('이력 이름을 1~200자로 입력하세요.');
 return {id,label:label.trim(),createdAt,model:MODEL_VERSION,projects:structuredClone(createBackup(projects).projects)};
}
export function parseHistory(value:string):Snapshot[]{
 if(new TextEncoder().encode(value).byteLength>MAX_BACKUP_BYTES)throw new Error('평가 이력은 5MB 이하만 지원합니다.');
 const data=JSON.parse(value) as {version:number;history:Snapshot[]};
 if(data?.version!==1||!Array.isArray(data.history)||data.history.length>20)throw new Error('평가 이력 백업 형식을 확인하세요(최대 20회).');
 const ids=new Set<string>();
 return data.history.map(s=>{
  if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||typeof s.label!=='string'||!s.label.trim()||s.label.length>200||typeof s.createdAt!=='string'||!Number.isFinite(Date.parse(s.createdAt))||typeof s.model!=='string')throw new Error('평가 이력 항목이 올바르지 않습니다.');
  ids.add(s.id);return {...s,projects:validateImport({version:1,projects:s.projects}).projects};
 });
}
export function serializeHistory(history:Snapshot[]){const text=JSON.stringify({version:1,history});parseHistory(text);return text;}
export function csvCell(value:string|number|null|undefined){let s=value===null||value===undefined?'':String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function detailedCsv(projects:Project[]){
 const rows=rank(projects.filter(p=>p.type==='company')).concat(rank(projects.filter(p=>p.type==='research')));
 const header=['과제명','유형','순위','기대성과','위험','영역','평가모델','지표','점수','가중치(%)','축 기여점수','근거','출처','기준연도','가정','확신도'];
 return '\uFEFF'+[header,...rows.flatMap(p=>(p.mode==='direct'?[{id:'summary',name:'종합점수 직접 입력',score:null,weight:null,points:null}]:contributions(p)).map(c=>[p.name,p.type,p.rank,p.ret,p.risk,p.region,MODEL_VERSION,c.name,c.score,c.weight,c.points,...['',':source',':year',':assumption',':confidence'].map(s=>p.notes[c.id+s]||'')]))].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
