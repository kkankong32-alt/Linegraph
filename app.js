'use strict';
const $=id=>document.getElementById(id);
const EXAMPLES={
 fish:{title:'월별 갈치 어획량',xName:'월',xUnit:'월',yName:'어획량',unit:'t',times:[8,9,10,11,12],values:[700,200,400,500,100],source:'수학 110쪽 자료'},
 classes:{title:'연도별 학교의 학급 수',xName:'연도',xUnit:'년',yName:'학급 수',unit:'학급',times:[2000,2005,2010,2015,2020],values:[21,19,19,17,15],source:'수학 114쪽 자료'},
 jump:{title:'높이뛰기 선수의 월별 최고 기록',xName:'월',xUnit:'월',yName:'기록',unit:'cm',times:[8,9,10,11,12],values:[224,236,228,238,240],source:'수학 115쪽 자료'},
 emotion:{title:'월별 나의 감정 그래프',xName:'월',xUnit:'월',yName:'감정 점수',unit:'점',times:[3,4,5,6,7,8,9,10,11],values:[60,80,50,70,90,80,60,85,95],source:'수학 126~127쪽 연계 · 예시 점수'}
};
const state={...structuredClone(EXAMPLES.fish),step:1,scale:100,useBreak:false,base:0,lineWidth:5,pointSize:7,lineColor:'#e50914',pointColor:'#e50914',paper:'#FFFFFF',showValues:false,progress:1};
const canvas=$('graphCanvas'),ctx=canvas.getContext('2d');let animation=0;
const number=n=>Number(n.toFixed(6)).toLocaleString('ko-KR',{maximumFractionDigits:6});
function error(id,text){$(id).textContent=text;$(id).hidden=!text;}
function dataError(s=state){
 if(![s.title,s.xName,s.xUnit,s.yName,s.unit].every(v=>v.trim()))return '그래프 제목, 가로·세로 이름과 단위를 모두 입력해 주세요.';
 if(s.times.length<2||s.times.length>12||s.times.length!==s.values.length)return '자료는 2개 이상, 12개 이하로 입력해 주세요.';
 if([...s.times,...s.values].some(n=>!Number.isFinite(n)||n<0||n>1000000))return '빈칸 없이 0부터 1,000,000 사이의 수를 입력해 주세요.';
 if(s.times.some((n,i)=>i>0&&n<=s.times[i-1]))return '가로축의 시간은 작은 수부터 순서대로, 겹치지 않게 입력해 주세요.';
 return '';
}
function scaleError(s=state){
 if(!Number.isFinite(s.scale)||s.scale<.01||s.scale>1000000)return '눈금 한 칸의 크기는 0.01 이상, 1,000,000 이하로 입력해 주세요.';
 const base=s.useBreak?s.base:0;
 if(!Number.isFinite(base)||base<0||base>Math.min(...s.values))return '물결선 위의 시작 값은 가장 작은 자료 값 이하여야 해요.';
 if(s.useBreak&&base<=0)return '물결선을 사용하려면 시작 값을 0보다 크게 정해 주세요.';
 if(Math.ceil((Math.max(...s.values)-base)/s.scale)>500)return '눈금이 500칸을 넘어요. 물결선으로 아래 부분을 생략하거나 눈금 한 칸을 더 크게 정해 주세요.';
 return '';
}
function recommendScale(){const base=state.useBreak&&Number.isFinite(state.base)?state.base:0;const raw=Math.max((Math.max(...state.values)-base)/12,.01);const magnitude=10**Math.floor(Math.log10(raw));state.scale=([1,2,5,10].find(n=>n*magnitude>=raw)||10)*magnitude;state.scale=Number(state.scale.toPrecision(10));}
function fitChanges(){
 const min=Math.min(...state.values),max=Math.max(...state.values),range=max-min;
 state.useBreak=min>0&&min>=range*2;
 state.base=state.useBreak?min:0;recommendScale();
 if(state.useBreak){const group=state.scale*5;state.base=Number((Math.floor((min-state.scale)/group)*group).toFixed(6));if(state.base<=0){state.useBreak=false;state.base=0;}recommendScale();}
}
function syncFields(){[['graph-title','title'],['x-axis-name','xName'],['x-unit','xUnit'],['y-axis-name','yName'],['unit-name','unit']].forEach(([id,key])=>$(id).value=state[key]);$('source-note').textContent=state.source;renderRows();}
function renderRows(){
 const tbody=$('table-body');tbody.replaceChildren();
 state.times.forEach((t,i)=>{const tr=document.createElement('tr');for(const [key,label] of [['times',state.xName],['values',state.yName]]){const td=document.createElement('td');const input=document.createElement('input');input.type='number';input.min='0';input.max='1000000';input.step='any';input.value=Number.isFinite(state[key][i])?state[key][i]:'';input.setAttribute('aria-label',`${i+1}번째 ${label}`);input.addEventListener('input',()=>{state[key][i]=input.value===''?NaN:Number(input.value);state.source='직접 입력한 자료';$('source-note').textContent=state.source;error('data-error','');});td.append(input);tr.append(td);}const td=document.createElement('td');const del=document.createElement('button');del.className='btn-delete';del.textContent='삭제';del.setAttribute('aria-label',`${i+1}번째 자료 삭제`);del.disabled=state.times.length<=2;del.onclick=()=>{state.times.splice(i,1);state.values.splice(i,1);renderRows();};td.append(del);tr.append(td);tbody.append(tr);});
 $('th-time').textContent=state.xName+' ('+state.xUnit+')';$('th-value').textContent=state.yName+' ('+state.unit+')';$('btn-add-row').disabled=state.times.length>=12;
}
$('load-example').onclick=()=>{Object.assign(state,structuredClone(EXAMPLES[$('example').value]));fitChanges();syncFields();error('data-error','');};
[['graph-title','title'],['x-axis-name','xName'],['x-unit','xUnit'],['y-axis-name','yName'],['unit-name','unit']].forEach(([id,key])=>$(id).oninput=()=>{state[key]=$(id).value;error('data-error','');$('th-time').textContent=state.xName+' ('+state.xUnit+')';$('th-value').textContent=state.yName+' ('+state.unit+')';});
$('btn-add-row').onclick=()=>{if(state.times.length>=12)return;const last=state.times.at(-1),previous=state.times.at(-2);state.times.push(Number.isFinite(last)?last+(Number.isFinite(previous)?last-previous:1):NaN);state.values.push(0);renderRows();};
function changeStep(step){
 if(step>1){const err=dataError();if(err){error('data-error',err);$('data-error').scrollIntoView({block:'center'});return;}}
 if(state.step===1&&step===2){if(state.useBreak&&(state.base>Math.min(...state.values)||state.base<=0)){state.useBreak=false;state.base=0;}if(scaleError())recommendScale();}
 if(step===3&&scaleError()){changeStep(2);error('scale-error',scaleError());return;}
 state.step=step;
 for(let i=1;i<=3;i++){const el=$('ind-step'+i);el.classList.toggle('active',i===step);if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}
 $('step1-view').hidden=step!==1;$('step23-view').hidden=step===1;$('step2-controls').hidden=step!==2;$('step3-controls').hidden=step!==3;
 if(step>1){syncScaleControls();draw();}window.scrollTo({top:0,behavior:'instant'});
}
$('btn-to-step2').onclick=()=>{const valid=!dataError();changeStep(2);if(valid)animate();};$('btn-to-step3').onclick=()=>changeStep(3);$('btn-back-to-step1').onclick=()=>changeStep(1);$('btn-back-to-step2').onclick=()=>changeStep(2);
function syncScaleControls(){$('custom-scale').value=state.scale;$('use-break').checked=state.useBreak;$('break-settings').hidden=!state.useBreak;$('break-value').value=state.base;$('scale-unit').textContent=state.unit+' / 칸';$('break-unit').textContent=state.unit;document.querySelectorAll('[data-scale]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.scale)===state.scale);b.setAttribute('aria-pressed',String(Number(b.dataset.scale)===state.scale));});error('scale-error',scaleError());$('btn-to-step3').disabled=!!scaleError();}
function updateScale(){cancelAnimationFrame(animation);state.progress=1;error('scale-error',scaleError());$('btn-to-step3').disabled=!!scaleError();draw();}
document.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{state.scale=Number(b.dataset.scale);syncScaleControls();updateScale();});
$('custom-scale').oninput=()=>{state.scale=$('custom-scale').value===''?NaN:Number($('custom-scale').value);document.querySelectorAll('[data-scale]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.scale)===state.scale);b.setAttribute('aria-pressed',String(Number(b.dataset.scale)===state.scale));});updateScale();};
$('auto-scale').onclick=()=>{fitChanges();syncScaleControls();updateScale();};
$('use-break').onchange=()=>{state.useBreak=$('use-break').checked;if(state.useBreak){const min=Math.min(...state.values);const group=Number.isFinite(state.scale)&&state.scale>0?state.scale*5:1;state.base=Math.max(0,Math.floor((min-state.scale)/group)*group);if(state.base===0&&min>0)state.base=Math.max(.01,Math.floor(min*.9*100)/100);}else state.base=0;syncScaleControls();updateScale();};
$('break-value').oninput=()=>{state.base=$('break-value').value===''?NaN:Number($('break-value').value);updateScale();};
function geometry(s=state){const base=s.useBreak?s.base:0;const ticks=Math.max(2,Math.ceil((Math.max(...s.values)-base)/s.scale));const left=270,right=1510,top=170;const extra=Math.max(0,ticks*28-(s.useBreak?570:650));const bottom=(s.useBreak?740:820)+extra,axisBottom=820+extra,height=1000+extra;const xs=s.times.map(t=>left+80+(t-s.times[0])/(s.times.at(-1)-s.times[0])*(right-left-160));return {base,ticks,left,right,top,bottom,axisBottom,xs,height,extra,y:v=>bottom-(v-base)/(ticks*s.scale)*(bottom-top)};}
function text(txt,x,y,size=32,align='center',weight='500',maxWidth){ctx.fillStyle='#171717';ctx.font=`${weight} ${size}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';if(maxWidth)ctx.fillText(txt,x,y,maxWidth);else ctx.fillText(txt,x,y);}
function stroke(x1,y1,x2,y2,color='#647080',width=2){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function draw(){
 const err=dataError()||scaleError();const g=err?null:geometry();const h=g?g.height:1000;
 if(canvas.height!==h)canvas.height=h;const container=canvas.parentElement;container.style.aspectRatio='1600 / '+h;container.style.paddingTop='0';container.style.height='auto';
 ctx.clearRect(0,0,1600,h);ctx.fillStyle=state.paper;ctx.fillRect(0,0,1600,h);
 if(err){text('눈금 설정을 확인해 주세요',800,450,48,'center','700');text(err,800,530,30,'center','500',1400);$('scale-summary').textContent='모든 자료가 표시되도록 눈금을 정해 주세요.';$('graph-caption').textContent='';return;}
 const {base,ticks,left,right,top,bottom,axisBottom,xs,y,extra}=g;
 text(state.title,800,65,48,'center','900',1450);
 text('('+state.unit+')',70,top-32,32,'left','700');
 ctx.strokeStyle='#536070';ctx.lineWidth=2;ctx.strokeRect(60,top,right-60,axisBottom+95-top);
 stroke(left,top,left,axisBottom+95);stroke(60,axisBottom,right,axisBottom);stroke(60,axisBottom+95,left,axisBottom);
 text(state.yName,77,axisBottom+27,27,'left','700',165);text(state.xName,left-15,axisBottom+72,27,'right','700',165);
 const stride=Math.max(1,Math.ceil(42/((bottom-top)/ticks)));
 for(let i=0;i<=ticks;i++){const yy=y(base+i*state.scale);stroke(left,yy,right,yy,'#b3bcc8',1.5);if(i%stride===0||i===ticks)text(number(base+i*state.scale),left-20,yy,32,'right','600',175);}
 const minSpacing=Math.min(...xs.slice(1).map((x,i)=>x-xs[i]));
 xs.forEach((x,i)=>{stroke(x,top,x,axisBottom,'#c0c7d0',1.5);let label=number(state.times[i]);if(minSpacing<85){ctx.save();ctx.translate(x,axisBottom+46);ctx.rotate(-Math.PI/4);text(label,0,0,26,'center','600',100);ctx.restore();}else text(label,x,axisBottom+48,32,'center','700',Math.max(50,minSpacing-8));});
 if(state.useBreak){ctx.fillStyle=state.paper;ctx.fillRect(61,759+extra,right-62,40);for(const offset of [0,11]){ctx.beginPath();for(let x=61;x<=right;x+=2){const yy=771+extra+offset+5*Math.sin((x-61)/14);if(x===61)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.strokeStyle='#586575';ctx.lineWidth=2;ctx.stroke();}text('0',left-20,axisBottom,32,'right','600');}
 text('('+state.xUnit+')',right-8,947+extra,30,'right','700');
 const pointProgress=Math.min(1,state.progress/.4);const pointCount=Math.ceil(pointProgress*state.times.length);
 const lineProgress=Math.max(0,(state.progress-.4)/.6);const totalSegments=(state.times.length-1)*lineProgress;
 ctx.strokeStyle=state.lineColor;ctx.lineWidth=state.lineWidth;ctx.lineJoin='round';ctx.lineCap='round';
 if(totalSegments>0){ctx.beginPath();ctx.moveTo(xs[0],y(state.values[0]));for(let i=0;i<state.times.length-1;i++){const portion=Math.min(1,Math.max(0,totalSegments-i));if(portion===0)break;ctx.lineTo(xs[i]+(xs[i+1]-xs[i])*portion,y(state.values[i])+(y(state.values[i+1])-y(state.values[i]))*portion);}ctx.stroke();}
 for(let i=0;i<pointCount;i++){ctx.beginPath();ctx.arc(xs[i],y(state.values[i]),state.pointSize,0,Math.PI*2);ctx.fillStyle=state.pointColor;ctx.fill();if(state.showValues){const above=y(state.values[i])-25;ctx.font='700 29px "Malgun Gothic",sans-serif';const label=number(state.values[i]),w=ctx.measureText(label).width;ctx.fillStyle=state.paper;ctx.fillRect(xs[i]-w/2-7,above-20,w+14,38);text(label,xs[i],above,29,'center','700');}}
 const summary=`눈금 한 칸: ${number(state.scale)}${state.unit}`+(state.useBreak?` · 물결선: 0~${number(state.base)}${state.unit} 사이 일부 생략`:'');
 $('scale-summary').textContent=`한 칸 ${number(state.scale)}${state.unit}로 적용했어요. ${state.useBreak?number(state.base):'0'}~${number(base+ticks*state.scale)}${state.unit}를 나타내요.`+(extra>0?' 눈금이 많아 그래프를 위아래로 스크롤할 수 있어요.':'');
 $('graph-caption').textContent=summary;
 canvas.setAttribute('aria-label',state.title+'. '+summary+'. '+state.times.map((t,i)=>number(t)+state.xUnit+': '+number(state.values[i])+state.unit).join(', '));
}
function animate(){cancelAnimationFrame(animation);if(scaleError())return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){state.progress=1;draw();return;}const start=performance.now();function frame(now){state.progress=Math.min(1,(now-start)/2100);draw();if(state.progress<1)animation=requestAnimationFrame(frame);}animation=requestAnimationFrame(frame);}
for(let i=1;i<=3;i++)$('ind-step'+i).onclick=()=>changeStep(i);
$('replay').onclick=animate;
[['line-width','lineWidth'],['point-size','pointSize']].forEach(([id,key])=>$(id).oninput=()=>{state[key]=Number($(id).value);$(id+'-value').textContent=state[key];draw();});
[['line-color','lineColor'],['point-color','pointColor']].forEach(([id,key])=>$(id).oninput=()=>{state[key]=$(id).value;draw();});
$('show-values').onchange=()=>{state.showValues=$('show-values').checked;draw();};
document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{state.paper=b.dataset.bg;document.querySelectorAll('[data-bg]').forEach(v=>{v.classList.toggle('active',v===b);v.setAttribute('aria-pressed',String(v===b));});draw();});
$('btn-save-image').onclick=()=>{cancelAnimationFrame(animation);state.progress=1;draw();canvas.toBlob(blob=>{if(!blob){$('save-message').textContent='저장하지 못했어요. 다시 시도해 주세요.';return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=state.title.replace(/[\\/:*?"<>|]/g,'_')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);$('save-message').textContent='이미지를 저장했어요. 다운로드 폴더를 확인해 주세요.';},'image/png');};
const audio=$('bgm');audio.volume=.32;
function musicUI(){const on=!audio.paused;['intro-music','music'].forEach(id=>{$(id).textContent=on?'Ⅱ 배경음악 끄기':'♫ 배경음악 켜기';$(id).setAttribute('aria-pressed',String(on));});}
async function toggleMusic(e){e.stopPropagation();const button=e.currentTarget;if(audio.paused){try{await audio.play();}catch{button.textContent='음악 파일을 확인해 주세요';return;}}else audio.pause();musicUI();}
$('intro-music').onclick=toggleMusic;$('music').onclick=toggleMusic;
function start(){audio.pause();musicUI();$('intro-screen').hidden=true;$('application').inert=false;window.scrollTo(0,0);$('graph-title').focus({preventScroll:true});}
$('intro-screen').onclick=start;$('start').onclick=e=>{e.stopPropagation();start();};
$('back-intro').onclick=()=>{$('intro-screen').hidden=false;$('application').inert=true;$('start').focus();};
$('review').href=window.APP_CONFIG.reviewUrl;
if(/^https?:$/.test(location.protocol)&&!['localhost','127.0.0.1'].includes(location.hostname)){const ids=[window.APP_CONFIG.teacherAnalyticsId,window.APP_CONFIG.kingMathAnalyticsId].filter(id=>/^G-[A-Z0-9]+$/.test(id));if(ids.length){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());[...new Set(ids)].forEach(id=>gtag('config',id));const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ids[0];document.head.append(script);}}
syncFields();
