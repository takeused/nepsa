// NEPSA 방법론을 처음 접하는 사람에게 개념을 설명하는 개요 화면
import {ArrowUpRight,ClipboardList,Compass,Layers,Scale,Sparkles,TriangleAlert} from 'lucide-react';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {criteria,gradeColors,gradeTints,regionGrid} from '@/lib/nepsa';

// 원문 20쪽(인쇄 100쪽)의 지표 묶음. Return은 성과가 나타나는 시점 순으로,
// Risk는 위험이 어디서 오는지에 따라 나뉜다.
const groups:Record<string,string>={excellence:'Output · 1차 성과',application:'Output · 1차 성과',ip:'Output · 1차 성과',market:'Outcome · 2차 성과',profit:'Outcome · 2차 성과',impact:'Impact · 파급효과',gap:'Technology Risk · 기술위험',infrastructure:'Technology Risk · 기술위험',barrier:'Technology Risk · 기술위험',competition:'Market Risk · 시장위험',resources:'Market Risk · 시장위험',lifecycle:'Market Risk · 시장위험'};
const grades=[
 {g:'S',text:'기대성과가 가장 높고 위험이 가장 낮은 한 칸. 먼저 착수할 후보입니다.'},
 {g:'A',text:'성과가 좋거나 위험이 낮은 편. S 다음 우선순위입니다.'},
 {g:'B',text:'중간 지대. 조건을 바꿀 여지가 있는지 따져볼 구간입니다.'},
 {g:'C',text:'성과에 비해 위험이 큰 편. 보완 없이는 밀리는 구간입니다.'},
 {g:'D',text:'성과가 낮으면서 위험도 큰 구간. 후순위입니다.'},
];
function Indicators({axis,title,caption}:{axis:'return'|'risk';title:string;caption:string}){
 return <section className="panel"><div className="panel-title"><div><h2>{title}</h2><p className="caption">{caption}</p></div><span className="tiny-label">가중치 합계 100</span></div>
 <div className="overview-scroll"><Table><TableHeader><TableRow>{['묶음','지표','무엇을 보는가','채점 방식','가중치'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{criteria.filter(c=>c.axis===axis).map(c=><TableRow key={c.id}><TableCell className="caption">{groups[c.id]}</TableCell><TableCell><strong>{c.name}</strong></TableCell><TableCell className="caption">{c.description}</TableCell><TableCell className="caption">{c.qualitative?'정성 · 사람이 1~5점 선택':'정량 · 숫자를 넣으면 자동 채점'}</TableCell><TableCell className="numeric">{c.weight}%</TableCell></TableRow>)}</TableBody></Table></div></section>;
}
export default function Overview(){
 return <div className="overview">
 <section className="panel"><div className="panel-title"><h2>한 문장으로</h2><Compass size={20}/></div><div className="method-body">
  <p className="lead">NEPSA는 <strong>내년에 시작할 R&amp;D 과제 후보들을 같은 잣대로 채점해 순서를 매기는 방법</strong>입니다. &ldquo;잘 되면 얼마나 좋은가&rdquo;와 &ldquo;얼마나 어려운가&rdquo; 두 가지를 따로 묻고, 그 답을 좌표 위의 점으로 찍어 등급을 붙입니다.</p>
  <div className="definition"><span className="source-tag">이름 풀이</span><p><strong>NEPSA</strong> = <em>Nest yEar Projects Selection Analysis</em>. 2013년 KEIT 보고서 18쪽(인쇄 098쪽)에 이렇게 적혀 있습니다. 문맥상 &ldquo;Next Year&rdquo;를 뜻하는 것으로 보이지만 표기는 원문 그대로 옮겼습니다.</p></div>
  <div className="keypoints">
   <div className="keypoint"><Scale size={18}/><strong>두 축으로 본다</strong><p>기대성과(Return)와 위험(Risk). 각각 0~100점입니다.</p></div>
   <div className="keypoint"><Layers size={18}/><strong>12개 지표로 채운다</strong><p>축마다 6개씩. 가중평균해 축 점수를 만듭니다.</p></div>
   <div className="keypoint"><Sparkles size={18}/><strong>격자 위에 놓는다</strong><p>4×4 격자의 12개 영역, S~D 5개 등급으로 갈립니다.</p></div>
  </div></div></section>

 <div className="overview-grid">
  <section className="panel"><div className="panel-title"><h2>왜 이런 게 필요한가요?</h2></div><div className="method-body">
   <p>내년에 할 R&amp;D 후보는 수십 개인데 예산과 인력은 정해져 있습니다. 무엇을 먼저 할지 정해야 하는데 담당자마다 중요하게 보는 지점이 다르면 회의는 인상 비평으로 흐르기 쉽습니다.</p>
   <p>NEPSA는 <strong>모든 과제에 똑같은 12개 질문을 던지는 방식</strong>으로 이 문제를 다룹니다. 과제 A는 시장 이야기로 설득하고 과제 B는 기술 이야기로 설득하는 상황을 막고, 같은 자리에서 비교하게 만듭니다.</p>
   <p className="analogy"><strong>비유하자면</strong> 등산 코스를 고르는 일과 비슷합니다. 정상에서 보이는 경치가 얼마나 좋은지(기대성과)와 코스가 얼마나 험한지(위험)를 따로 매긴 다음, 두 값을 지도에 찍어 어느 코스부터 갈지 정하는 셈입니다.</p>
  </div></section>
  <section className="panel"><div className="panel-title"><h2>두 개의 질문</h2></div><div className="method-body">
   <div className="axis-card"><span className="source-tag">Return</span><h3>기대성과 — 잘 되면 얼마나 좋은가</h3><p>기술이 얼마나 앞서 있는지, 다른 분야에도 쓸 수 있는지, 특허가 힘을 받고 있는지, 시장이 큰지와 얼마나 남는 장사인지, 주변 산업에 얼마나 번지는지를 봅니다. 점수가 높을수록 좋습니다.</p></div>
   <div className="axis-card risk"><span className="source-tag">Risk</span><h3>위험 — 얼마나 어렵고 불확실한가</h3><p>목표 기술수준까지의 거리, 인력·장비·제도 같은 준비 상태, 남의 특허가 앞을 막고 있는지, 경쟁이 얼마나 치열한지, 사업화에 얼마나 오래·많이 들어가는지, 제품 수명주기의 어디쯤인지를 봅니다. <strong>점수가 높을수록 위험이 큽니다.</strong></p></div>
   <p className="caption">두 축은 서로 상쇄되지 않습니다. 하나의 종합점수로 합치지 않고 끝까지 두 값을 나란히 들고 갑니다.</p>
  </div></section>
 </div>

 <Indicators axis="return" title="기대성과 지표 6개" caption="성과가 나타나는 시점에 따라 Output → Outcome → Impact로 묶입니다"/>
 <Indicators axis="risk" title="위험 지표 6개" caption="위험이 어디서 오는지에 따라 기술위험과 시장위험으로 묶입니다"/>

 <div className="overview-grid">
  <section className="panel"><div className="panel-title"><h2>점수가 등급이 되기까지</h2><ClipboardList size={20}/></div><div className="method-body">
   <ol className="steps">
    <li><strong>지표마다 1~5점을 매깁니다.</strong> 정량지표는 시장규모·성장률 같은 숫자를 넣으면 앱이 구간표를 보고 자동으로 채점합니다. 정성지표는 &lsquo;아주 낮음&rsquo;부터 &lsquo;매우 높음&rsquo;까지 골라 넣습니다.</li>
    <li><strong>가중평균을 냅니다.</strong> 지표마다 중요도가 다릅니다. 시장규모 25%가 가장 무겁고 타 분야 응용가능성 10%가 가장 가볍습니다.</li>
    <li><strong>0~100점으로 환산합니다.</strong> 1점을 0점, 5점을 100점으로 늘립니다. 기대성과와 위험 각각 하나의 점수가 나옵니다.</li>
    <li><strong>격자 위에 찍습니다.</strong> 세로가 기대성과, 가로가 위험입니다. 왼쪽 위(성과 높고 위험 낮음)가 가장 좋은 자리입니다.</li>
   </ol>
   <p className="caption">환산식은 원문에 실려 있지 않아 이 앱이 정한 가정입니다. 근거는 &lsquo;평가 기준·출처&rsquo; 탭에 있습니다.</p>
  </div></section>
  <section className="panel"><div className="panel-title"><h2>12개 영역과 5개 등급</h2></div><div className="method-body">
   <div className="mini-matrix">
    <p className="mini-axis">기대성과 높음 ↑</p>
    <p className="sr-only">세로축은 기대성과, 가로축은 위험인 4×4 격자입니다. 왼쪽 위부터 차례로 S, A1, B1, B1 / A2, B2, B2, C1 / B3, B3, C2, D1 / B4, C3, D2, D2 영역이 배치됩니다.</p>
    <div className="mini-cells" aria-hidden="true">{regionGrid.flat().map((r,i)=><span key={i} className="mini-cell" style={{background:gradeTints[r[0]],color:gradeColors[r[0]],borderColor:gradeColors[r[0]]}}>{r}</span>)}</div>
    <p className="mini-axis">← 위험 낮음 · 위험 높음 →</p>
   </div>
   <ul className="grade-list">{grades.map(({g,text})=><li key={g}><span className="grade" style={{background:gradeTints[g],color:gradeColors[g]}}>{g}</span><p>{text}</p></li>)}</ul>
   <p className="caption">같은 등급 안에서도 영역이 갈립니다(A1이 A2보다 앞). 우선순위는 S › A1 › A2 › B1 … D2 순이고, 같은 영역이면 기대성과가 높은 과제가 먼저 옵니다.</p>
  </div></section>
 </div>

 <section className="panel"><div className="panel-title"><h2>과제 유형이 두 가지인 이유</h2></div><div className="method-body two-col">
  <div className="axis-card"><span className="source-tag">기업주관 · 혁신제품형</span><p>기업이 주관해 곧 제품이 될 기술을 개발하는 과제입니다. 격자 전체를 그대로 씁니다. 위험이 낮고 성과가 높은 왼쪽 위가 유리합니다.</p></div>
  <div className="axis-card risk"><span className="source-tag">제한없음 · 원천기술형</span><p>당장의 제품보다 원천기술을 노리는 과제입니다. <strong>기대성과 60점 이상이면서 위험 40점 이상</strong>인 구간만 평가 대상입니다. 어렵더라도 크게 될 기술(High Risk, High Return)을 골라내려는 취지이고, 이 조건 밖의 과제는 등급 대신 &lsquo;영역 밖&rsquo;으로 표시합니다.</p></div>
 </div></section>

 <div className="overview-grid">
  <section className="panel"><div className="panel-title"><h2>이 앱으로 해보기</h2></div><div className="method-body">
   <ol className="steps">
    <li><strong>포트폴리오</strong> 탭에서 &lsquo;원문 예시 불러오기&rsquo;를 누르면 보고서에 실린 10개 과제가 들어옵니다. 매트릭스가 어떻게 생겼는지 먼저 보세요.</li>
    <li><strong>과제 추가</strong>로 평가할 과제를 만들고 아래 평가 화면에서 12개 지표를 채웁니다. 지표마다 판단 근거를 메모로 남길 수 있습니다.</li>
    <li>점수를 다 넣으면 등급과 순위가 자동으로 나옵니다. <strong>분석·이력·비교</strong> 탭에서 지표별 기여도와 시나리오 비교를 볼 수 있습니다.</li>
    <li>결과는 CSV로 내보내거나 인쇄/PDF로 뽑고, 작업은 JSON 백업으로 옮깁니다.</li>
   </ol>
   <p className="caption">모든 데이터는 이 브라우저에만 저장됩니다. 서버로 전송되지 않습니다.</p>
  </div></section>
  <section className="panel"><div className="panel-title"><h2>헷갈리기 쉬운 말</h2></div><div className="method-body"><dl className="glossary">
   <dt>기대성과(Return)</dt><dd>성공했을 때 얻는 것. 높을수록 좋습니다.</dd>
   <dt>위험(Risk)</dt><dd>성공하기까지의 어려움과 불확실성. 높을수록 나쁩니다.</dd>
   <dt>정량지표 / 정성지표</dt><dd>정량은 데이터에 근거해 객관적으로 판단하는 지표, 정성은 데이터와 전문가 의견을 종합해 주관적으로 판단하는 지표입니다.</dd>
   <dt>IP 부상도</dt><dd>특허 출원이 늘고 점유율이 오르는지, 즉 그 기술의 특허가 &lsquo;뜨고 있는지&rsquo;를 봅니다.</dd>
   <dt>IP 장벽도</dt><dd>반대로 남이 이미 쳐놓은 특허가 우리 권리 확보를 얼마나 막는지를 봅니다.</dd>
   <dt>영역 / 등급</dt><dd>영역은 격자의 칸 이름(S, A1, B2 …), 등급은 그 첫 글자(S, A, B, C, D)입니다.</dd>
  </dl></div></section>
 </div>

 <section className="panel"><div className="panel-title"><h2>읽기 전에 알아둘 점</h2><TriangleAlert size={20}/></div><div className="method-body">
  <ul className="method-list">
   <li><strong>2013년 문서를 재현한 것입니다.</strong> 출처는 KEIT PD Issue Report 13-10(2013년 10월)입니다. 현재 KEIT가 운영하는 절차와 세부 산식이 같다는 근거는 확인하지 못했습니다.</li>
   <li><strong>원문에 없는 부분은 가정입니다.</strong> 100점 환산식, 경계값 처리, IP 부상도 기준표(후속 CODIL 보고서 인용) 등은 구현 가정이며 &lsquo;평가 기준·출처&rsquo; 탭에 전부 밝혀 두었습니다.</li>
   <li><strong>점수가 결정을 대신하지 않습니다.</strong> 같은 등급이라도 사정은 다릅니다. 이 도구는 논의의 출발점을 같게 만드는 용도입니다.</li>
   <li><strong>공식 도구가 아닙니다.</strong> KEIT가 만들거나 승인한 소프트웨어가 아니라, 공개 보고서를 읽고 만든 별개의 구현입니다.</li>
  </ul>
  <p className="caption"><ArrowUpRight size={14}/> 더 자세한 근거와 출처 링크는 &lsquo;평가 기준·출처&rsquo; 탭에 있습니다.</p>
 </div></section>
 </div>;
}
