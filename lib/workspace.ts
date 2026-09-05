import {sampleProjects,validateImport} from './nepsa';
import type {Project} from './nepsa';

// 산식 선택 UI와 별개로, 백업에 적용 모델을 기록해 재계산을 추적한다.
export const MODEL_VERSION='keit-2013-zero-codil-rounded-v1';
export const MAX_BACKUP_BYTES=5*1024*1024;
export function createBackup(projects:Project[]){
 const data={version:1,model:MODEL_VERSION,projects};
 validateImport(data);
 if(new TextEncoder().encode(JSON.stringify(data)).byteLength>MAX_BACKUP_BYTES)throw new Error('백업 크기가 5MB를 초과합니다. 긴 평가 근거나 과제를 줄여 주세요. 마지막 정상 저장값은 유지됩니다.');
 return data;
}
export class WorkspaceConflict extends Error {
 constructor(){super('다른 탭에서 저장값이 변경되었습니다. 현재 작업을 JSON으로 백업한 뒤 새로고침해 최신 저장값을 확인하세요.');}
}
export function saveWorkspace(storage:Pick<Storage,'getItem'|'setItem'>,key:string,projects:Project[],expected:string|null){
 const serialized=JSON.stringify(createBackup(projects));
 const current=storage.getItem(key);
 if(current!==expected&&current!==serialized)throw new WorkspaceConflict();
 storage.setItem(key,serialized);
 return serialized;
}
export function addExamples(projects:Project[]){
 const fresh=sampleProjects.filter(s=>!projects.some(p=>p.id===s.id));
 if(projects.length+fresh.length>1000)throw new Error('예시를 추가하면 1,000개 한도를 초과합니다.');
 const next=[...projects,...structuredClone(fresh)];
 // 원문 예시의 유형이 편집된 경우에도 빈 상세 화면을 선택하지 않는다.
 const selected=next.find(p=>p.id==='sample-CCC'&&p.type==='company')??next.find(p=>p.type==='company');
 return {projects:next,selected:selected?.id||'',added:fresh.length};
}
export function workspaceError(projects:Project[]){
 try{createBackup(projects);return '';}catch(e){return e instanceof Error?e.message:'입력값을 확인하세요.';}
}
export function migrationWarning(data:unknown):string{
 if(!data||typeof data!=='object')return '';
 const d=data as Record<string,unknown>;
 if(d.model===MODEL_VERSION)return '';
 const s=d.settings as {normalization?:unknown}|undefined;
 if(s?.normalization==='five')return '이 백업은 이전 ÷5 환산식을 사용했습니다. 현재 (n−1)÷4 환산식으로 다시 계산하므로 지표 평가의 점수·등급이 달라질 수 있습니다. 직접 입력 점수는 그대로입니다.';
 return d.model?'백업의 평가 모델이 현재 모델과 다릅니다. 현재 기준으로 다시 계산합니다.':'평가 모델 버전이 기록되지 않은 백업입니다. 현재 환산식과 IP 채점 기준으로 다시 계산합니다.';
}
