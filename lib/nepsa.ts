export type ProjectType = 'company' | 'research';
// 평가 산식·정렬은 모두 원문 근거로 확정되어 사용자 설정이 없다.
// 100점 환산은 (가중평균 − 1) ÷ 4 × 100 하나로 고정한다. 원문에 산식이 없어
// 한때 ÷5×100도 선택지로 뒀으나, ÷5는 지표 최저가 1점이라 산출 범위가
// 20~100으로 눌려 매트릭스의 S 영역(위험<25)과 최하단 행에 도달할 수 없다.
// 자세한 근거는 README와 context-notes.md 참고.
export const normalizationLabel = '(가중평균 − 1) ÷ 4 × 100';
// 우선순위는 원문 3-2)·3-3)이 두 과제유형 모두에 대해 명시한 12개 영역 순서를
// 따른다: S›A(A1›A2)›B(B1›B2›B3›B4)›C(C1›C2›C3)›D(D1›D2).
// 이 순서는 기준 3의 대등급 순서(S›A›B›C›D)를 그대로 보존하면서 영역 단위로
// 더 세분한 것이므로 두 조항이 충돌하지 않는다. 동일 영역 내에서는 기준 3에
// 따라 기대성과가 높은 과제를 앞세운다.
export const sortingLabel = '12개 영역 순서 (S›A1›A2›B1…D2), 동일 영역은 기대성과 순';
export type Project = { id: string; name: string; type: ProjectType; mode: 'direct' | 'criteria'; scores: Record<string, number | null>; raw: Record<string, number | null>; notes: Record<string, string>; directReturn: number | null; directRisk: number | null; sample?: boolean };
export const criteria = [
 { id:'excellence',name:'기술적 수월성',axis:'return',weight:15,qualitative:true,description:'기술의 독창성 및 차별성',labels:['아주 낮음','낮음','보통','높음','매우 높음'] },
 { id:'application',name:'타 분야 응용가능성',axis:'return',weight:10,qualitative:true,description:'다른 분야에 적용·활용될 가능성',labels:['아주 낮음','낮음','보통','높음','매우 높음'] },
 { id:'ip',name:'IP 부상도',axis:'return',weight:15,qualitative:false,description:'특허분석 4개 항목의 구간 대비 증가율·점유율 평균. 2013년 원문에는 기준표가 없어 CODIL 보고서 표 3-10을 따릅니다.',labels:[] },
 { id:'market',name:'시장규모 및 성장률',axis:'return',weight:25,qualitative:false,description:'시장규모 점수와 성장률 점수 중 높은 점수',labels:[] },
 { id:'profit',name:'연관업종 영업이익률',axis:'return',weight:15,qualitative:false,description:'관련 업종의 영업이익률',labels:[] },
 { id:'impact',name:'파급효과',axis:'return',weight:20,qualitative:true,description:'타 산업·기술에 미치는 긍정적 외부효과',labels:['아주 낮음','낮음','보통','높음','매우 높음'] },
 { id:'gap',name:'기술수준 및 기술격차',axis:'risk',weight:20,qualitative:false,description:'현 기술수준 구간별로 목표와의 격차 평가',labels:[] },
 { id:'infrastructure',name:'기술인프라',axis:'risk',weight:15,qualitative:true,description:'인력·장비·법·제도 등 개발 역량',labels:['아주 우수','우수','보통','미흡','매우 미흡'] },
 { id:'barrier',name:'IP 장벽도',axis:'risk',weight:15,qualitative:true,description:'선행특허로 인한 권리 확보의 어려움',labels:['아주 낮음','낮음','보통','높음','매우 높음'] },
 { id:'competition',name:'시장경쟁강도',axis:'risk',weight:25,qualitative:true,description:'경쟁자 수·진입장벽·경쟁구조',labels:['아주 낮음','낮음','보통','높음','매우 높음'] },
 { id:'resources',name:'사업화 요구자원',axis:'risk',weight:10,qualitative:false,description:'기간·비용 점수 평균을 사사오입',labels:[] },
 { id:'lifecycle',name:'기술(제품) 수명주기',axis:'risk',weight:15,qualitative:true,description:'개발 기술이 적용될 제품의 시장 위치',labels:['성장기','성숙기','도입기','쇠퇴기','신시장'] },
] as const;
export const regions = [
 {name:'S',x:0,y:75,w:25,h:25},{name:'A1',x:25,y:75,w:25,h:25},{name:'B1',x:50,y:75,w:50,h:25},
 {name:'A2',x:0,y:50,w:25,h:25},{name:'B2',x:25,y:50,w:50,h:25},{name:'C1',x:75,y:50,w:25,h:25},
 {name:'B3',x:0,y:25,w:50,h:25},{name:'C2',x:50,y:25,w:25,h:25},{name:'D1',x:75,y:25,w:25,h:25},
 {name:'B4',x:0,y:0,w:25,h:25},{name:'C3',x:25,y:0,w:25,h:25},{name:'D2',x:50,y:0,w:50,h:25},
];
export const regionOrder=['S','A1','A2','B1','B2','B3','B4','C1','C2','C3','D1','D2'];
// 색상값은 app/globals.css의 토큰을 참조한다. 라이트/다크 전환을 CSS가 처리하도록
// 하드코딩 hex 대신 var()를 쓴다. SVG에서는 presentation attribute가 아니라
// style 속성으로 넘겨야 var()가 해석된다.
export const gradeColors:Record<string,string>={S:'var(--grade-s)',A:'var(--grade-a)',B:'var(--grade-b)',C:'var(--grade-c)',D:'var(--grade-d)'};
export const gradeTints:Record<string,string>={S:'var(--grade-s-tint)',A:'var(--grade-a-tint)',B:'var(--grade-b-tint)',C:'var(--grade-c-tint)',D:'var(--grade-d-tint)'};
export const gradeNone='var(--grade-none)',gradeNoneTint='var(--grade-none-tint)';
export function isNumber(n:unknown):n is number{return typeof n==='number'&&Number.isFinite(n);}
export function band(n:number,cuts:number[]){return cuts.filter(c=>n>=c).length+1;}
export const ipCuts=[0,20,60,80];
export const ipParts=[{id:'ipFilings',label:'출원증가율'},{id:'ipDomestic',label:'국내출원인 출원건수 증가율'},{id:'ipShare',label:'최근구간 점유율'},{id:'ipMarket',label:'특허 시장확보력'}] as const;
export function autoScores(raw:Project['raw']):Record<string,number|null>{
 const valid=(...keys:string[])=>keys.every(k=>isNumber(raw[k]));
 return {
 market:valid('marketSize','growth')&&raw.marketSize!>=0?Math.max(band(raw.marketSize!,raw.world===1?[20,50,100,150]:[1000,2000,3500,5000]),band(raw.growth!,[3,8,13,20])):null,
 profit:valid('margin')?band(raw.margin!,[2,4,8,12]):null,
 // IP 부상도 — 네 항목 모두 같은 구간표(0% 미만 / 0~20 / 20~60 / 60~80 / 80 이상)를
 // 쓰고 평균을 사사오입한다. 2013년 원문에 기준표가 없어 CODIL 연구보고서
 // OTKCRK230019 표 3-10 "NEPSA 중 특허평가지표"를 근거로 삼았다.
 ip:valid('ipFilings','ipDomestic','ipShare','ipMarket')?Math.round(([raw.ipFilings!,raw.ipDomestic!,raw.ipShare!,raw.ipMarket!].reduce((t,n)=>t+band(n,ipCuts),0))/4):null,
 gap:valid('current','target')&&raw.current!>=0&&raw.current!<=100&&raw.target!>=raw.current!&&raw.target!<=100?band(raw.target!-raw.current!,raw.current!>=90?[2,4,6,8]:raw.current!>=80?[5,8,12,15]:raw.current!>=70?[10,15,20,25]:[15,20,25,30]):null,
 resources:valid('years','cost')&&raw.years!>=0&&raw.cost!>=0?Math.round((band(raw.years!,[1.5,2,2.5,3])+band(raw.cost!,[20,50,100,200]))/2):null,
 };
}
export function scoresFor(p:Project):Record<string,number|null>{
 const auto=autoScores(p.raw);
 // ip는 특허분석 4개 값이 모두 있을 때만 자동 채점하고, 없으면 직접 입력한
 // 점수를 유지한다. 기준표 도입 이전 백업이 그대로 열리도록 하기 위함이다.
 return {...p.scores,...auto,ip:auto.ip??p.scores.ip??null};
}
export function axisScore(p:Project,axis:'return'|'risk'):number|null{
 if(p.mode==='direct'){const n=axis==='return'?p.directReturn:p.directRisk;return isNumber(n)&&n>=0&&n<=100?n:null;}
 const scores=scoresFor(p),cs=criteria.filter(c=>c.axis===axis);
 if(cs.some(c=>!isNumber(scores[c.id])||scores[c.id]!<1||scores[c.id]!>5))return null;
 return cs.reduce((sum,c)=>sum+((scores[c.id]!-1)/4)*c.weight,0);
}
export function classify(ret:number|null,risk:number|null,type:ProjectType){
 if(!isNumber(ret)||!isNumber(risk)||ret<0||ret>100||risk<0||risk>100)return {grade:'미완료',region:'—',eligible:false};
 if(type==='research'&&(ret<60||risk<40))return {grade:'영역 밖',region:'—',eligible:false};
 const y=type==='research'?(ret-60)/40*100:ret,x=type==='research'?(risk-40)/60*100:risk;
 // Equality: higher Return row, right-hand Risk column. Declared implementation assumption.
 const row=y>=75?0:y>=50?1:y>=25?2:3,col=x>=75?3:x>=50?2:x>=25?1:0;
 const region=[['S','A1','B1','B1'],['A2','B2','B2','C1'],['B3','B3','C2','D1'],['B4','C3','D2','D2']][row][col];
 return {grade:region[0],region,eligible:true};
}
export function evaluate(p:Project){const ret=axisScore(p,'return'),risk=axisScore(p,'risk');return {...p,ret,risk,...classify(ret,risk,p.type)};}
export function rank(projects:Project[]){
 return projects.map(p=>evaluate(p)).sort((a,b)=>{
  if(a.eligible!==b.eligible)return a.eligible?-1:1;
  if(!a.eligible)return a.name.localeCompare(b.name,'ko');
  const ord=(r:typeof a)=>regionOrder.indexOf(r.region);
  return ord(a)-ord(b)||(b.ret!-a.ret!)||a.name.localeCompare(b.name,'ko')||a.id.localeCompare(b.id);
 }).map((p,i)=>({...p,rank:p.eligible?i+1:null}));
}
export function distributionWarnings(projects:Project[]){
 const assessed=projects.filter(p=>p.mode==='criteria');
 return criteria.filter(c=>c.qualitative).flatMap(c=>{
  const complete=assessed.filter(p=>isNumber(p.scores[c.id]));
  const good=complete.filter(p=>c.axis==='return'?p.scores[c.id]!>=3:p.scores[c.id]!<3).length;
  return complete.length&&good/complete.length>0.6?[`${c.name}: ${good}/${complete.length}개 (${Math.round(good/complete.length*100)}%) — 60% 초과${complete.length<assessed.length?' · 미입력 제외 잠정치':''}`]:[];
 });
}
export function newProject(id:string,type:ProjectType):Project{return {id,name:'새 R&D 과제',type,mode:'criteria',scores:{},raw:{world:0},notes:{},directReturn:null,directRisk:null};}
export const sampleProjects:Project[]=[['AAA',70.83,42.5],['BBB',72.5,26.67],['CCC',85,22],['DDD',60,51],['EEE',77,49],['FFF',74,36],['GGG',56,64],['HHH',62,69],['III',44,64],['JJJ',67,61]].map(([n,r,k])=>({id:`sample-${n}`,name:`${n} 기술개발`,type:'company',mode:'direct',scores:{},raw:{},notes:{summary:'2013 KEIT 보고서 PDF 25쪽 표의 점수. 지표별 원점수는 제공되지 않습니다.'},directReturn:r as number,directRisk:k as number,sample:true}));
export function validateImport(data:unknown):{projects:Project[]}{
 if(!data||typeof data!=='object')throw new Error('올바른 JSON 백업이 아닙니다.');
 const d=data as Record<string,unknown>;
 if(d.version!==1||!Array.isArray(d.projects)||d.projects.length>1000)throw new Error('버전 1의 NEPSA 백업(최대 1,000개)만 지원합니다.');
 // 구버전 백업의 settings(normalization·sorting)는 무시하고 받아들인다.
 // 산식과 정렬이 모두 원문 근거로 고정되어 더 이상 선택 항목이 아니다.
 const ids=new Set<string>();
 const projects=d.projects.map((v:unknown)=>{
  if(!v||typeof v!=='object')throw new Error('과제 형식 오류');
  const p=v as Project;
  if(typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>300||!['company','research'].includes(p.type)||!['direct','criteria'].includes(p.mode))throw new Error('과제 이름·유형·고유번호를 확인하세요.');
  ids.add(p.id);
  for(const map of [p.scores,p.raw,p.notes])if(!map||typeof map!=='object'||Array.isArray(map))throw new Error('평가값 형식 오류');
  for(const [k,n]of Object.entries(p.scores))if(!criteria.some(c=>c.id===k)||n!==null&&(!Number.isInteger(n)||n<1||n>5))throw new Error('지표 점수는 1~5 사이의 정수여야 합니다.');
  for(const n of Object.values(p.raw))if(n!==null&&!isNumber(n))throw new Error('정량 입력값은 숫자여야 합니다.');
  for(const n of [p.directReturn,p.directRisk])if(n!==null&&(!isNumber(n)||n<0||n>100))throw new Error('종합점수는 0~100점이어야 합니다.');
  for(const n of Object.values(p.notes))if(typeof n!=='string'||n.length>20000)throw new Error('평가 근거 형식 오류');
  return {id:p.id,name:p.name,type:p.type,mode:p.mode,scores:{...p.scores},raw:{...p.raw},notes:{...p.notes},directReturn:p.directReturn,directRisk:p.directRisk,sample:Boolean(p.sample)};
 });
 return {projects};
}
