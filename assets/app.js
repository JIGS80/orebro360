/* Örebro360 – gemensamt skript för alla sidor. Diagram, kartor och varje ämnes funktioner; sidladdningen längst ned. */

const $=s=>document.querySelector(s);
const fmt=(v,d=0)=>Number(v).toLocaleString('sv-SE',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const ymLabel=ym=>{const [y,m]=ym.split(/-|M/);return MON[+m-1]+' '+y};
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function tip(host){let t=host.querySelector('.tip');if(!t){t=document.createElement('div');t.className='tip';t.hidden=true;host.appendChild(t)}return t}
function niceTicks(max,n=4){const raw=max/n,p=Math.pow(10,Math.floor(Math.log10(raw)));const s=[1,2,2.5,5,10].map(x=>x*p).find(x=>x>=raw);const out=[];for(let v=0;v<=max+1e-9;v+=s)out.push(v);if(out[out.length-1]<max)out.push(out[out.length-1]+s);return out}

function hbars(host,rows,{fmtv=v=>fmt(v),max}={}){
  const m=max??Math.max(...rows.map(r=>Math.abs(r.v)),1);
  host.innerHTML=rows.map(r=>`<div class="hbar ${r.cls||''}" title="${esc(r.n)}: ${esc(fmtv(r.v))}"><span class="name">${esc(r.n)}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(0,r.v)/m*100}%"></span></span><span class="val">${esc(fmtv(r.v))}</span></div>`).join('');
}

/* stapeldiagram (månader) */
function barChart(host,labels,values,sel,{unit='mkr'}={}){
  host.innerHTML='';const W=Math.max(340,Math.min(900,host.clientWidth||720)),H=W<500?220:250,L=44,R=8,T=12,B=28;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Stapeldiagram'},host);
  const max=Math.max(...values);const ticks=niceTicks(max);const top=ticks[ticks.length-1];
  const y=v=>T+(H-T-B)*(1-v/top);const g=el('g',{class:'grid'},svg);
  ticks.forEach(t=>{el('line',{x1:L,x2:W-R,y1:y(t),y2:y(t)},g);const tx=el('text',{x:L-6,y:y(t)+4,'text-anchor':'end'},svg);tx.textContent=fmt(t)});
  const bw=(W-L-R)/values.length;const tp=tip(host);
  values.forEach((v,i)=>{
    const x=L+i*bw+2,w=bw-4,h=Math.max(1,y(0)-y(v));
    const r=el('path',{d:`M${x},${y(0)}v${-h+4}q0,-4 4,-4h${w-8}q4,0 4,4v${h-4}z`,fill:sel.has(i)?'var(--accent)':'var(--mark-gray)'},svg);
    const hit=el('rect',{x:L+i*bw,y:T,width:bw,height:H-T-B,fill:'transparent'},svg);
    hit.addEventListener('mouseenter',()=>{tp.hidden=false;tp.innerHTML=`<b>${ymLabel(labels[i])}</b><br>${fmt(v,1)} ${unit}`;const bb=svg.getBoundingClientRect();tp.style.left=((x+w/2)/W*bb.width)+'px';tp.style.top=(y(v)/H*bb.height)+'px'});
    hit.addEventListener('mouseleave',()=>tp.hidden=true);
    if(labels[i].endsWith('-01')||i%(W<500?4:2)===0){const tx=el('text',{x:x+w/2,y:H-10,'text-anchor':'middle'},svg);tx.textContent=labels[i].endsWith('-01')?labels[i].slice(0,4):MON[+labels[i].slice(5)-1]}
  });
}

/* linjediagram */
function lineChart(host,series,{yfmt=v=>fmt(v),xlab,minZero=false,height=260}={}){
  const W=Math.max(320,Math.min(760,host.clientWidth||480));host.innerHTML='';const H=height,L=58,R=62,T=14,B=28;
  const xs=series[0].pts.map(p=>p[0]);const all=series.flatMap(s=>s.pts.map(p=>p[1]));
  let lo=Math.min(...all),hi=Math.max(...all);if(minZero)lo=0;if(hi===lo){hi+=1;lo-=1}
  const span=hi-lo,raw=span/4,pw=Math.pow(10,Math.floor(Math.log10(raw))),st=[1,2,2.5,5,10].map(x=>x*pw).find(x=>x>=raw);
  lo=Math.floor(lo/st)*st;hi=Math.ceil(hi/st)*st;const ticks=[];for(let v=lo;v<=hi+st/1e6;v+=st)ticks.push(v);
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img'},host);
  const x=i=>L+(W-L-R)*(xs.length<2?.5:i/(xs.length-1));const y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  const g=el('g',{class:'grid'},svg);
  ticks.forEach(v=>{el('line',{x1:L,x2:W-R,y1:y(v),y2:y(v)},g);const t=el('text',{x:L-6,y:y(v)+4,'text-anchor':'end'},svg);t.textContent=yfmt(v)})
  const step=Math.ceil(xs.length/5);xs.forEach((xv,i)=>{if((i%step===0&&xs.length-1-i>=step)||i===xs.length-1){const t=el('text',{x:x(i),y:H-8,'text-anchor':'middle'},svg);t.textContent=xlab?xlab(xv):xv}});
  series.forEach(s=>{
    const idx=s.pts.map(p=>xs.indexOf(p[0]));
    el('path',{d:s.pts.map((p,j)=>(j?'L':'M')+x(idx[j])+','+y(p[1])).join(''),fill:'none',stroke:s.color,'stroke-width':2,'stroke-dasharray':s.dash||'','stroke-linejoin':'round'},svg);
    const lp=s.pts[s.pts.length-1],li=idx[idx.length-1];
    el('circle',{cx:x(li),cy:y(lp[1]),r:4,fill:s.color,stroke:'var(--surface)','stroke-width':2},svg);
    if(!s.nolabel){const t=el('text',{x:x(li)+8,y:y(lp[1])+4,style:'fill:var(--ink);font-weight:500'},svg);t.textContent=yfmt(lp[1])}
  });
  const tp=tip(host);const cross=el('line',{y1:T,y2:H-B,stroke:'var(--muted)','stroke-width':1,visibility:'hidden'},svg);
  const ov=el('rect',{x:L,y:T,width:W-L-R,height:H-T-B,fill:'transparent'},svg);
  ov.addEventListener('mousemove',e=>{const bb=svg.getBoundingClientRect();const px=(e.clientX-bb.left)/bb.width*W;const i=Math.max(0,Math.min(xs.length-1,Math.round((px-L)/((W-L-R)/Math.max(1,xs.length-1)))));
    cross.setAttribute('x1',x(i));cross.setAttribute('x2',x(i));cross.setAttribute('visibility','visible');
    tp.hidden=false;tp.innerHTML=`<b>${xlab?xlab(xs[i]):xs[i]}</b>`+series.map(s=>{const p=s.pts.find(p=>p[0]===xs[i]);return p?`<br>${esc(s.name)}: ${yfmt(p[1])}`:''}).join('');
    tp.style.left=(x(i)/W*bb.width)+'px';tp.style.top=(T/H*bb.height+30)+'px'});
  ov.addEventListener('mouseleave',()=>{tp.hidden=true;cross.setAttribute('visibility','hidden')});
}

/* ===== Pengar ===== */
let P,per;
function renderPengar(){
  const p=P.perioder.find(x=>x.id===per);const S=new Set(p.i);
  document.querySelectorAll('#per-chips .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===per));
  let k=`<div class="kpi"><span class="label">Betalt</span><span class="v num">${fmt(p.mkr/1000,2)} mdr kr</span></div>`;
  if(p.forandring!=null){const up=p.forandring>=0;k+=`<div class="kpi"><span class="label">Jämfört med ${p.forra_label}</span><span class="v num delta ${up?'up':'down'}">${up?'+':'−'}${fmt(Math.abs(p.forandring),1)} %</span></div>`}
  k+=`<div class="kpi"><span class="label">Leverantörer</span><span class="v num">${fmt(p.lev)}</span></div><div class="kpi"><span class="label">De 10 största fick</span><span class="v num">${fmt(p.top10,1)} %</span></div>`;
  $('#per-kpis').innerHTML=k;
  barChart($('#ch-month'),P.months,P.monthly,S);
  const sum=a=>p.i.reduce((s,i)=>s+a[i],0);
  hbars($('#hb-namnd'),P.namnder.map(n=>({n:n.n,v:sum(n.m)})).sort((a,b)=>b.v-a.v).filter(r=>Math.abs(r.v)>=0.05),{fmtv:v=>fmt(v,v<10?1:0)});
  hbars($('#hb-kat'),P.kategorier.map(n=>({n:n.n,v:sum(n.m)})).sort((a,b)=>b.v-a.v).filter(r=>Math.abs(r.v)>=0.05),{fmtv:v=>fmt(v,v<10?1:0)});
  renderLev();
}
function renderLev(){
  const p=P.perioder.find(x=>x.id===per);const q=$('#lev-q').value.trim().toLowerCase();
  let rows=P.leverantorer.map(s=>({s,v:p.i.reduce((a,i)=>a+s.m[i],0)}));
  if(q)rows=rows.filter(r=>r.s.n.toLowerCase().includes(q)||r.s.o.includes(q.replace(/\D/g,'')||'§'));
  rows=rows.filter(r=>r.v!==0).sort((a,b)=>b.v-a.v);const shown=rows.slice(0,q?60:25);const tot=p.mkr*1000;
  $('#lev-table tbody').innerHTML=shown.length?shown.map(r=>`<tr><td>${esc(r.s.n)}<span class="sub">${r.s.o?esc(r.s.o.slice(0,6)+'-'+r.s.o.slice(6))+' · ':''}mest via ${esc(r.s.t)}</span></td><td class="r">${r.v>=1000?fmt(r.v/1000,1)+' mkr':fmt(r.v)+' tkr'}</td><td class="r">${fmt(r.v/tot*100,r.v/tot*100<1?2:1)} %</td></tr>`).join(''):`<tr><td colspan="3" class="small">Ingen leverantör matchar ”${esc(q)}” under perioden. Leverantörer som fått mindre än 50 000 kr totalt sedan januari 2025 finns inte med i sökningen.</td></tr>`;
  $('#lev-count').textContent=q?`${fmt(rows.length)} träffar`:`topp 25 av ${fmt(p.lev)}`;
  $('#lev-note').textContent=`Sökbara: ${fmt(P.leverantorer.length)} leverantörer som fått minst 50 000 kr sedan januari 2025, tillsammans ${fmt(P.lev_tackning,1).replace(',',',')} % av alla belopp.`;
}

/* ===== Befolkning ===== */
function renderBef(B){
  const yrs=Object.entries(B.arlig).map(([y,v])=>[+y,v]);
  lineChart($('#ch-pop'),[{name:'Invånare',color:'var(--accent)',pts:yrs}],{yfmt:v=>fmt(v)});
  const m=B.manad;lineChart($('#ch-popm'),[{name:'Invånare',color:'var(--accent)',pts:m.map(r=>[r[0],r[1]])}],{yfmt:v=>fmt(v),xlab:x=>ymLabel(x)});
  const last=m[m.length-1];const dec=m.find(r=>r[0]==='2025M12');const y25=B.arlig['2025'],y15=B.arlig['2015'];
  if($('#st-bef'))$('#st-bef').textContent=fmt(last[1]);if($('#st-bef-s'))$('#st-bef-s').textContent='i '+ymLabel(last[0])+' enligt SCB';
  $('#bef-lead').textContent=`Örebro hade ${fmt(last[1])} invånare i ${ymLabel(last[0])}. Sedan 2015 har kommunen vuxit med ${fmt(y25-y15)} personer (${fmt((y25/y15-1)*100,1)} %), men under 2026 har folkmängden hittills minskat något.`;
  const mx=Math.max(...B.pyramid.flatMap(r=>[r.m,r.k]));
  $('#pyr').innerHTML=B.pyramid.slice().reverse().map(r=>`<div class="row" title="${r.a} år: ${fmt(r.m)} män, ${fmt(r.k)} kvinnor"><div class="l"><div class="bar m" style="width:${r.m/mx*100}%"></div></div><div class="age">${r.a}</div><div><div class="bar k" style="width:${r.k/mx*100}%"></div></div></div>`).join('');
}

/* ===== Jämför ===== */
let J,kid;
function renderKpi(){
  const k=J.kpis.find(x=>x.id===kid);document.querySelectorAll('#kpi-chips .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===kid));
  const yrs=Object.keys(k.data['1880']);const ly=yrs[yrs.length-1];
  const unit=k.enhet==='%'?' %':k.enhet==='kr'?' kr':k.enhet==='år'?' år':'';const f=v=>fmt(v,k.dec)+unit;
  $('#kpi-title').textContent=k.titel;$('#kpi-year').textContent=ly;$('#kpi-desc').textContent=k.beskr[0].toUpperCase()+k.beskr.slice(1)+'.';
  const rows=Object.keys(J.kommuner).filter(c=>k.data[c]&&k.data[c][ly]!=null).map(c=>({n:J.kommuner[c],v:k.data[c][ly],cls:c==='1880'?'hl':c==='0000'?'ref':''})).sort((a,b)=>b.v-a.v);
  hbars($('#hb-kpi'),rows,{fmtv:f});
  const ser=[{name:'Örebro',color:'var(--accent)',pts:Object.entries(k.data['1880']).map(([y,v])=>[+y,v])}];
  if(k.data['0000'])ser.push({name:'Hela Sverige',color:'var(--ink2)',dash:'5 4',pts:Object.entries(k.data['0000']).map(([y,v])=>[+y,v])});
  ser.forEach(s=>s.pts=s.pts.filter(p=>ser[0].pts.some(q=>q[0]===p[0])));
  lineChart($('#ch-kpi'),ser,{yfmt:v=>fmt(v,k.dec)});
}

/* ===== Val ===== */
function renderVal(V){
  const order=['V','S','MP','C','L','KD','M','SD','ÖrP'];
  const seated=V.partier.filter(p=>p.mand>0).sort((a,b)=>order.indexOf(a.k)-order.indexOf(b.k));
  const col=p=>p.f;
  if($('#st-val'))$('#st-val').textContent=fmt(V.deltagande,1)+' %';if($('#st-val-s'))$('#st-val-s').textContent=`${fmt(V.deltagande-V.deltagande22,1)} procentenheter högre än 2022`;
  const big=V.partier.slice().sort((a,b)=>b.a-a.a)[0];const gain=V.partier.slice().sort((a,b)=>(b.a-(b.a22||0))-(a.a-(a.a22||0)))[0];
  $('#val-lead').textContent=`${fmt(V.deltagande,1)} procent av de röstberättigade röstade i valet till kommunfullmäktige den 13 september, upp från ${fmt(V.deltagande22,1)} procent 2022. ${big.n.replace('Arbetarepartiet-','')} är fortfarande största parti, men den stora förändringen är ${gain.n} som gick från ${fmt(gain.a22,1)} till ${fmt(gain.a,1)} procent.`;
  // halvcirkel
  const host=$('#ch-seats');host.innerHTML='';const W=420,H=230,cx=W/2,cy=H-14;const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Mandatfördelning i kommunfullmäktige'},host);
  const N=V.mandat,rows=5,r0=90,r1=200;const radii=[...Array(rows)].map((_,i)=>r0+(r1-r0)*i/(rows-1));const tot=radii.reduce((a,b)=>a+b,0);
  let counts=radii.map(r=>Math.round(N*r/tot));let d=N-counts.reduce((a,b)=>a+b,0);counts[rows-1]+=d;
  const pts=[];radii.forEach((r,i)=>{const n=counts[i];for(let j=0;j<n;j++){const a=Math.PI*(1-(n===1?.5:j/(n-1)));pts.push({a,x:cx+r*Math.cos(a),y:cy-r*Math.sin(a)})}});
  pts.sort((p,q)=>q.a-p.a);let i=0;const tp=tip(host);
  seated.forEach(p=>{for(let s=0;s<p.mand;s++){const q=pts[i++];const c=el('circle',{cx:q.x,cy:q.y,r:9,fill:col(p),stroke:'var(--surface)','stroke-width':2},svg);
    c.addEventListener('mouseenter',()=>{tp.hidden=false;tp.innerHTML=`<b>${esc(p.n)}</b><br>${p.mand} mandat`;const bb=svg.getBoundingClientRect();tp.style.left=(q.x/W*bb.width)+'px';tp.style.top=(q.y/H*bb.height-6)+'px'});
    c.addEventListener('mouseleave',()=>tp.hidden=true)}});
  const t=el('text',{x:cx,y:cy-18,'text-anchor':'middle',style:'fill:var(--ink);font-family:var(--f-display);font-size:30px;font-weight:700'},svg);t.textContent=N;
  const t2=el('text',{x:cx,y:cy,'text-anchor':'middle'},svg);t2.textContent='mandat · 33 för majoritet';
  $('#seat-legend').innerHTML=seated.map(p=>`<span><i class="sw" style="background:${col(p)}"></i>${esc(p.k)} ${p.mand}</span>`).join('');
  const main=V.partier.filter(p=>p.mand>0||p.a>=1).sort((a,b)=>b.a-a.a);const rest=V.partier.filter(p=>!(p.mand>0||p.a>=1));
  const ra=rest.reduce((s,p)=>s+p.a,0),ra22=rest.reduce((s,p)=>s+(p.a22||0),0);
  const dd=v=>(v>=0?'+':'−')+fmt(Math.abs(v),1);
  $('#val-table tbody').innerHTML=main.map(p=>{const ch=p.a-(p.a22||0),mc=p.mand-p.mand22;return `<tr><td><i class="pswatch" style="background:${col(p)}"></i>${esc(p.n.replace('Arbetarepartiet-','').replace(' (tidigare Folkpartiet)',''))}</td><td class="r">${fmt(p.a,1)} %</td><td class="r delta ${ch>=0?'up':'down'}">${dd(ch)}</td><td class="r">${p.mand}${mc?` <span class="delta ${mc>0?'up':'down'}">(${mc>0?'+':'−'}${Math.abs(mc)})</span>`:''}</td></tr>`}).join('')+
    `<tr><td class="small">Övriga (${rest.length} partier)</td><td class="r">${fmt(ra,1)} %</td><td class="r">${dd(ra-ra22)}</td><td class="r">0</td></tr>`;
}

/* ===== Valdistrikt (karta) ===== */
const PNAMN={S:'Socialdemokraterna','ÖrP':'Örebropartiet',M:'Moderaterna',V:'Vänsterpartiet',SD:'Sverigedemokraterna',C:'Centerpartiet',KD:'Kristdemokraterna',L:'Liberalerna',MP:'Miljöpartiet','Övr':'Övriga partier'};
let VD,VDV,vdMode='storst',vdView='stad',vdSel=null,vdBoxes={};
const vdShare=(d,i)=>d.g?d.p[i]/d.g*100:0;
const vdPi=k=>VD.partier.indexOf(k);
const vdWin=d=>{let b=0;for(let i=1;i<9;i++)if(d.p[i]>d.p[b])b=i;return b};
const vdCol=k=>k==='Övr'?'var(--mark-gray)':(VDV.partier.find(p=>p.k===k)||{}).f||'var(--mark-gray)';
const vdKom=k=>{if(k==='Övr'){const main=new Set(VD.partier);return VDV.partier.filter(p=>!main.has(p.k)).reduce((s,p)=>s+p.a,0)}return (VDV.partier.find(p=>p.k===k)||{}).a||0};
function vdValue(d){return vdMode==='deltagande'?d.d:vdShare(d,vdPi(vdMode))}
function vdBreaks(){
  const v=VD.distrikt.map(vdValue).sort((a,b)=>a-b),n=v.length,dec=v[n-1]<10?1:0,f=10**dec;
  const br=[1,2,3,4].map(k=>Math.round(v[Math.floor(n*k/5)]*f)/f);
  return {br:[...new Set(br)],min:v[0],max:v[n-1],dec};
}
function vdClass(x,br){let c=0;while(c<br.length&&x>=br[c])c++;return c}
function initVD(){
  $('#vd-mode').innerHTML=[['storst','Största parti'],...VD.partier.slice(0,9).map(k=>[k,k==='ÖrP'?'Örebropartiet':k]),['deltagande','Valdeltagande']]
    .map(([id,l])=>`<button class="chip" data-m="${id}" aria-pressed="${id===vdMode}"${PNAMN[id]&&id!=='ÖrP'?` title="${PNAMN[id]}"`:''}>${esc(l)}</button>`).join('');
  $('#vd-mode').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vdMode=b.dataset.m;vdPaint()}});
  $('#vd-view').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vdView=b.dataset.v;vdSetView()}});
  $('#vd-names').innerHTML=VD.distrikt.map(d=>`<option value="${esc(d.n)}">`).join('');
  const q=$('#vd-q');const pick=loose=>{const v=q.value.trim().toLowerCase();if(!v)return;const d=VD.distrikt.find(x=>x.n.toLowerCase()===v)||(loose&&VD.distrikt.find(x=>x.n.toLowerCase().includes(v)));if(d){vdSelect(d.k,true);q.value=d.n}};
  q.addEventListener('change',()=>pick(true));q.addEventListener('input',()=>pick(false));
  // karta
  const host=$('#vd-map');host.innerHTML='';
  const svg=el('svg',{viewBox:`0 0 ${VD.w} ${VD.h}`,preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Karta över valdistrikten i Örebro kommun'},host);
  const g=el('g',{},svg);const tp=tip(host);
  VD.distrikt.forEach(d=>{const p=el('path',{d:d.path,class:'d','data-k':d.k,tabindex:'-1'},g);d.el=p;
    p.addEventListener('mousemove',e=>{const r=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=vdTip(d);tp.style.left=(e.clientX-r.left)+'px';tp.style.top=(e.clientY-r.top-8)+'px'});
    p.addEventListener('mouseleave',()=>tp.hidden=true);
    p.addEventListener('click',()=>{tp.hidden=true;vdSelect(d.k===vdSel?null:d.k)});
  });
  VD.distrikt.forEach(d=>{const b=d.el.getBBox();vdBoxes[d.k]=b});
  const small=VD.distrikt.filter(d=>d.km2<4).map(d=>vdBoxes[d.k]);
  const x0=Math.min(...small.map(b=>b.x)),y0=Math.min(...small.map(b=>b.y)),x1=Math.max(...small.map(b=>b.x+b.width)),y1=Math.max(...small.map(b=>b.y+b.height));
  vdBoxes._stad={x:x0,y:y0,width:x1-x0,height:y1-y0};vdBoxes._alla={x:0,y:0,width:VD.w,height:VD.h};
  VD.svg=svg;
  // tabell
  $('#vd-table tbody').addEventListener('click',e=>{const tr=e.target.closest('tr[data-k]');if(tr){vdSelect(tr.dataset.k,true);$('#vd-map').scrollIntoView({behavior:'smooth',block:'center'})}});
  // ingress
  const P=VD.partier,cnt={};VD.distrikt.forEach(d=>{const k=P[vdWin(d)];cnt[k]=(cnt[k]||0)+1});
  const wins=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  const dl=VD.distrikt.slice().sort((a,b)=>a.d-b.d);
  const orp=vdPi('ÖrP'),ob=VD.distrikt.slice().sort((a,b)=>vdShare(b,orp)-vdShare(a,orp))[0];
  $('#vd-lead').textContent=`${PNAMN[wins[0][0]]} blev största parti i ${wins[0][1]} av kommunens ${VD.distrikt.length} valdistrikt, ${wins.slice(1).map(([k,n])=>`${PNAMN[k]} i ${n}`).join(', ').replace(/, ([^,]*)$/,' och $1')}. Örebropartiet fick mest stöd i ${ob.n} (${fmt(vdShare(ob,orp),1)} %). Valdeltagandet gick från ${fmt(dl[0].d,1)} % i ${dl[0].n} till ${fmt(dl[dl.length-1].d,1)} % i ${dl[dl.length-1].n}.`;
  const up=VD.uppsamling.reduce((s,d)=>s+d.tot,0),all=up+VD.distrikt.reduce((s,d)=>s+d.tot,0);
  $('#vd-upps').textContent=`Förtidsröster som kom fram sent räknades i två uppsamlingsdistrikt, ett per valkrets: ${fmt(up)} röster eller ${fmt(up/all*100,1)} % av alla. De går inte att placera på kartan men ingår i kommunens totala resultat.`;
  vdSetView();vdPaint();
}
function vdSetView(){
  document.querySelectorAll('#vd-view .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===vdView));
  const b=vdBoxes['_'+vdView],pad=Math.max(b.width,b.height)*.03;let {x,y,width:w,height:h}=b;x-=pad;y-=pad;w+=2*pad;h+=2*pad;
  if(w<h){x-=(h-w)/2;w=h}else{y-=(w-h)/2;h=w}
  VD.svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
}
function vdTip(d){
  const s=`<b>${esc(d.n)}</b><br>`;
  if(vdMode==='deltagande')return s+`Valdeltagande ${fmt(d.d,1)} %`;
  if(vdMode==='storst'){const i=vdWin(d);return s+`${PNAMN[VD.partier[i]]} ${fmt(vdShare(d,i),1)} %`}
  return s+`${PNAMN[vdMode]} ${fmt(vdShare(d,vdPi(vdMode)),1)} %`;
}
function vdPaint(){
  document.querySelectorAll('#vd-mode .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===vdMode));
  const leg=$('#vd-legend');
  if(vdMode==='storst'){
    $('#vd-title').textContent='Största parti i varje distrikt';
    const cnt={};VD.distrikt.forEach(d=>{const k=VD.partier[vdWin(d)];cnt[k]=(cnt[k]||0)+1;d.el.style.fill=vdCol(k)});
    leg.innerHTML=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<span><i class="sw" style="background:${vdCol(k)}"></i>${PNAMN[k]} <span class="num">${n}</span></span>`).join('');
  }else{
    const {br,min,max,dec}=vdBreaks();
    $('#vd-title').textContent=vdMode==='deltagande'?'Valdeltagande per distrikt':`Andel röster på ${PNAMN[vdMode]}`;
    VD.distrikt.forEach(d=>d.el.style.fill=`var(--seq${vdClass(vdValue(d),br)+1})`);
    const f=v=>fmt(v,dec);const labels=[`<${f(br[0])}`,...br.slice(0,-1).map((b,i)=>`${f(b)}–${f(br[i+1])}`),`≥${f(br[br.length-1])}`];
    leg.innerHTML=`<div style="display:grid;gap:8px"><div class="steps">${labels.map((l,i)=>`<span><i style="background:var(--seq${i+1})"></i>${l}</span>`).join('')}</div>
      <span class="small">Procent. Lägst ${fmt(min,1)} %, högst ${fmt(max,1)} %, hela kommunen ${vdMode==='deltagande'?fmt(VDV.deltagande,1):fmt(vdKom(vdMode),1)} %</span></div>`;
  }
  vdDetail();vdTable();
}
function vdSelect(k,fromOutside){
  vdSel=k;VD.distrikt.forEach(d=>d.el.classList.toggle('sel',d.k===k));
  const d=VD.distrikt.find(x=>x.k===k);
  if(d){d.el.parentNode.appendChild(d.el);
    if(fromOutside){const b=vdBoxes[d.k],s=vdBoxes._stad;const inStad=b.x>=s.x&&b.y>=s.y&&b.x+b.width<=s.x+s.width&&b.y+b.height<=s.y+s.height;if(vdView==='stad'&&!inStad){vdView='alla';vdSetView()}}
    if($('#vd-q').value.trim().toLowerCase()!==d.n.toLowerCase())$('#vd-q').value='';}
  vdDetail();document.querySelectorAll('#vd-table tbody tr').forEach(tr=>tr.classList.toggle('on',tr.dataset.k===k));
}
function vdDetail(){
  const d=VD.distrikt.find(x=>x.k===vdSel);const P=VD.partier;
  const rows=P.map((k,i)=>({k,v:d?vdShare(d,i):vdKom(k),ref:vdKom(k)})).sort((a,b)=>b.ref-a.ref);
  const mx=Math.max(...rows.map(r=>Math.max(r.v,r.ref)));
  const head=d?`<div class="sd-head"><span class="label">Valdistrikt · ${esc(d.kr)} valkrets</span><h3 style="font-size:1.35rem;font-weight:700">${esc(d.n)}</h3>
      <div class="facts vd-facts" style="margin-top:6px"><div class="fact"><span class="v num">${fmt(d.d,1)} %</span><span class="s">valdeltagande (kommunen ${fmt(VDV.deltagande,1)} %)</span></div>
      <div class="fact"><span class="v num">${fmt(d.rb)}</span><span class="s">röstberättigade</span></div>
      <div class="fact"><span class="v num">${fmt(d.km2,d.km2<10?1:0)} km²</span><span class="s">yta</span></div></div></div>`
    :`<div class="sd-head"><span class="label">Hela kommunen</span><h3 style="font-size:1.35rem;font-weight:700">Klicka på ett distrikt</h3><p class="small">Välj ett område på kartan, sök på namnet ovan eller välj i tabellen under kartan. Tills dess visas resultatet för hela kommunen.</p></div>`;
  $('#vd-detail').innerHTML=head+`<div style="display:grid;gap:8px;margin-top:14px">
    <div class="panel-head"><h4 style="margin:0;font-family:var(--f-display);font-weight:500">Andel av rösterna</h4>${d?'<span class="vd-reflegend"><i></i>hela kommunen</span>':''}</div>
    <div class="vd-bars">${rows.map(r=>`<div class="vd-bar${r.k===vdMode?' on':''}" title="${PNAMN[r.k]}: ${fmt(r.v,1)} %${d?` (kommunen ${fmt(r.ref,1)} %)`:''}"><span class="name">${esc(PNAMN[r.k])}</span><span class="track"><span class="fill" style="width:${r.v/mx*100}%;background:${vdCol(r.k)}"></span>${d?`<span class="ref" style="left:calc(${r.ref/mx*100}% - 1px)"></span>`:''}</span><span class="val">${fmt(r.v,1)} %</span></div>`).join('')}</div>
    ${d?`<p class="src">${fmt(d.g)} giltiga röster på partier i distriktet.</p>`:''}</div>`;
}
function vdTable(){
  const P=VD.partier.slice(0,9);
  $('#vd-table thead').innerHTML=`<tr><th>Distrikt</th><th class="r">Deltag.</th>${P.map(k=>`<th class="r" title="${PNAMN[k]}">${esc(k)}</th>`).join('')}</tr>`;
  const key=vdMode==='storst'?(d=>d.n):vdValue;const rows=VD.distrikt.slice().sort(vdMode==='storst'?(a,b)=>a.n.localeCompare(b.n,'sv'):(a,b)=>vdValue(b)-vdValue(a));
  $('#vd-table tbody').innerHTML=rows.map(d=>`<tr data-k="${d.k}"${d.k===vdSel?' class="on"':''}><td>${esc(d.n)}<span class="sub">${esc(d.kr)} · ${fmt(d.rb)} röstber.</span></td><td class="r">${fmt(d.d,1)}</td>${P.map((k,i)=>`<td class="r"${k===vdMode?' style="font-weight:600;color:var(--ink)"':''}>${fmt(vdShare(d,i),1)}</td>`).join('')}</tr>`).join('');
}

/* ===== Skolor ===== */
let SK,skF='gr',skCmp={},skHm='',skSort={},skOpen=null,skAll=false;
const last=a=>Array.isArray(a)&&a.length?(Array.isArray(a[0])?a[a.length-1]:a):null;   // [år,v] eller [[år,v],...] -> [år,v]
const lv=a=>{const l=last(a);return l?l[1]:null};
const ly=a=>{const l=last(a);return l?l[0]:null};
const lasar=y=>`${y-1}/${String(y).slice(2)}`;
const pct=v=>v==null?'–':fmt(v,v%1?1:0)+' %';
const HM={Kommunal:'Kommunal','Fristående':'Fristående',Specialskola:'Statlig specialskola'};
const kom=id=>SK.kommun.find(k=>k.id===id);
function komLast(id,m='1880'){const k=kom(id);if(!k||!k.data[m])return null;const ys=Object.keys(k.data[m]);const y=ys[ys.length-1];return {y,v:k.data[m][y]}}
function arskurser(s){
  const g=s.former.find(f=>f.k==='gr'||f.k==='gran'||f.k==='sp');const f=s.former.some(f=>f.k==='fsk');
  const ak=g?g.ak.map(Number).filter(n=>!isNaN(n)):[];
  if(!ak.length)return f?'förskoleklass':'';
  const lo=Math.min(...ak),hi=Math.max(...ak);return (f?'F':lo)+(hi!==lo||f?'–'+hi:'')}
function trygg(s){const e=s.enkat||{};const x=e.elever_ak8||e.elever_ak5||e.elever_gy2;return x&&x.trygg!=null?x:null}
function modeYear(rows,get){const c={};rows.forEach(r=>{const y=get(r);if(y)c[y]=(c[y]||0)+1});return +Object.keys(c).sort((a,b)=>c[b]-c[a]||b-a)[0]||null}

const FORM={
  fo:{namn:'förskolor',lista:()=>SK.forskolor,hm:false,
      kpis:[['N11732','Barn i förskolan','st'],['N11701','Barn per barngrupp'],['N11102','Barn per anställd'],['N11808','Legitimerade förskollärare']],
      cols:[{k:'n',l:'Förskola',txt:true},{k:'barn',l:'Barn',d:0},{k:'barn_per_grupp',l:'Barn per grupp',d:1},{k:'barn_per_arsarb',l:'Barn per anställd',d:1,cls:'hide-sm'},{k:'leg_forskollarare',l:'Legitimerade förskollärare',d:0,u:'%'}],
      get:(s,k)=>k==='n'?s.n:s[k]},
  gr:{namn:'grundskolor',lista:()=>SK.skolor.filter(s=>s.former.some(f=>['gr','gran','sp'].includes(f.k))),hm:true,
      kpis:[['N15504','Meritvärde åk 9'],['N15424','Behöriga till gymnasiet'],['N15813','Legitimerade lärare'],['N15008','Kostnad per elev']],
      cols:[{k:'n',l:'Skola',txt:true},{k:'merit',l:'Meritvärde',d:1,yr:s=>ly(s.gr?.merit)},{k:'behorig',l:'Behöriga',d:1,u:'%',yr:s=>ly(s.gr?.behorig)},
            {k:'salsa',l:'Mot förväntat',d:0,sign:true,yr:s=>ly(s.gr?.salsa_avv),cls:'hide-sm'},{k:'trygg',l:'Trygga elever',d:0,u:'%',cls:'hide-sm'},{k:'leg',l:'Legitimerade lärare',d:0,u:'%',cls:'hide-sm'}],
      get:(s,k)=>({n:s.n,merit:lv(s.gr?.merit),behorig:lv(s.gr?.behorig),salsa:lv(s.gr?.salsa_avv),trygg:trygg(s)?.trygg,leg:lv(s.gr?.leg_larare)??lv(s.gran?.leg_larare)??lv(s.sp?.leg_larare)})[k]},
  gy:{namn:'gymnasieskolor',lista:()=>SK.skolor.filter(s=>s.former.some(f=>['gy','gyan'].includes(f.k))),hm:true,
      kpis:[['N17448','Examen inom 3 år'],['N17476','Behöriga till högskolan'],['N17825','Legitimerade lärare'],['N17007','Kostnad per elev']],
      cols:[{k:'n',l:'Skola',txt:true},{k:'elever',l:'Elever',d:0},{k:'examen3',l:'Examen inom 3 år',d:1,u:'%',yr:s=>ly(s.gy?.examen3)},{k:'hogsk',l:'Högskole­behöriga',d:1,u:'%',cls:'hide-sm',yr:s=>ly(s.gy?.hogskolebeh)},
            {k:'antag',l:'Lägsta intagnings­poäng',d:1,cls:'hide-sm'},{k:'leg',l:'Legitimerade lärare',d:0,u:'%',cls:'hide-sm'}],
      get:(s,k)=>{const p=(s.gy?.program||[]).map(p=>lv(p.antagning_min)).filter(v=>v!=null);
        return ({n:s.n,elever:lv(s.gy?.elever),examen3:lv(s.gy?.examen3),hogsk:lv(s.gy?.hogskolebeh),antag:p.length?Math.min(...p):null,leg:lv(s.gy?.leg_larare)??lv(s.gyan?.leg_larare)})[k]}},
};

function unitOf(k){return k.enhet==='%'?' %':k.enhet==='kr'?' kr':k.enhet==='p'?'':''}
function renderSkolor(){
  const F=FORM[skF];
  document.querySelectorAll('#sk-form .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===skF));
  // nyckeltal
  $('#sk-kpis').innerHTML=F.kpis.map(([id,lab])=>{const k=kom(id);const o=komLast(id),r=komLast(id,'0000');if(!o)return '';
    const u=unitOf(k);const v=k.enhet==='kr'?fmt(Math.round(o.v/100)*100)+' kr':fmt(o.v,k.enhet==='st'&&o.v>1000?0:k.dec)+u;
    const sub=id==='N11732'?`barn i ${o.y}`:r?`${o.y} · hela Sverige ${k.enhet==='kr'?fmt(Math.round(r.v/100)*100)+' kr':fmt(r.v,k.dec)+u}`:o.y;
    return `<div class="stat"><span class="label">${esc(lab)}</span><span class="v num">${v}</span><span class="s">${esc(sub)}</span></div>`}).join('');
  // jämförelse
  const ks=SK.kommun.filter(k=>k.form===skF&&k.id!=='N11732');
  if(!ks.some(k=>k.id===skCmp[skF]))skCmp[skF]=ks[0].id;
  $('#sk-cmp-chips').innerHTML=ks.map(k=>`<button class="chip" data-id="${k.id}" aria-pressed="${k.id===skCmp[skF]}">${esc(k.titel)}</button>`).join('');
  renderSkCmp();
  renderSkCharts();
  $('#sk-hm').hidden=!F.hm;if(!F.hm||(skF!=='gr'&&skHm==='nara'))skHm='';
  const nb=$('#sk-hm .chip[data-h="nara"]');if(nb)nb.hidden=skF!=='gr';
  document.querySelectorAll('#sk-hm .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.h===skHm));
  $('#sk-list-title').textContent='Alla '+F.namn;
  skOpen=null;skAll=false;renderSkTable();
  const nf=FORM.gr.lista().length,ng=FORM.gy.lista().length,nfo=SK.forskolor.length;
  const fri=SK.skolor.filter(s=>s.hm==='Fristående').length;
  const m=komLast('N15504'),mr=komLast('N15504','0000');
  $('#sk-lead').textContent=`Örebro har ${nfo} förskolor, ${nf} grundskoleenheter och ${ng} gymnasieenheter. ${fri} av skolenheterna drivs av fristående huvudmän. Meritvärdet i åk 9 var ${fmt(m.v,1)} våren ${m.y}, ${m.v<mr.v?'lägre än':'högre än'} rikssnittet ${fmt(mr.v,1)}.`;
}
function renderSkCmp(){
  const k=kom(skCmp[skF]);document.querySelectorAll('#sk-cmp-chips .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===k.id));
  const ys=Object.keys(k.data['1880']);const y=ys[ys.length-1];const u=unitOf(k);const f=v=>k.enhet==='kr'?fmt(Math.round(v/100)*100)+' kr':fmt(v,k.dec)+u;
  $('#sk-cmp-title').textContent=k.titel;$('#sk-cmp-year').textContent=y;$('#sk-cmp-desc').textContent=k.beskr[0].toUpperCase()+k.beskr.slice(1)+'.';
  const rows=Object.keys(SK.kommuner).filter(c=>k.data[c]&&k.data[c][y]!=null).map(c=>({n:SK.kommuner[c],v:k.data[c][y],cls:c==='1880'?'hl':c==='0000'?'ref':''})).sort((a,b)=>b.v-a.v);
  hbars($('#sk-cmp'),rows,{fmtv:f});
  const ser=[{name:'Örebro',color:'var(--accent)',pts:Object.entries(k.data['1880']).map(([y,v])=>[+y,v])}];
  if(k.data['0000'])ser.push({name:'Hela Sverige',color:'var(--ink2)',dash:'5 4',pts:Object.entries(k.data['0000']).map(([y,v])=>[+y,v]).filter(p=>ser[0].pts.some(q=>q[0]===p[0]))});
  lineChart($('#sk-cmp-line'),ser,{yfmt:v=>k.enhet==='kr'?fmt(v/1000)+' tkr':fmt(v,k.dec)});
}
function dbars(host,rows,{fmtv,max}){
  host.innerHTML=rows.map(r=>`<div class="dbar" title="${esc(r.n)}: ${esc(fmtv(r.v))}"><span class="name">${esc(r.n)}</span><span class="track"><span class="fill ${r.v>=0?'pos':'neg'}" style="width:${Math.abs(r.v)/max*50}%"></span></span><span class="val ${r.v>0?'sign-pos':r.v<0?'sign-neg':''}">${esc(fmtv(r.v))}</span></div>`).join('');
}
const hmLegend=`<div class="legend"><span><i class="sw" style="background:var(--accent)"></i>Kommunal</span><span><i class="sw" style="background:var(--second)"></i>Fristående</span><span><i class="sw" style="border:2px solid var(--ink2)"></i>Snitt</span></div>`;
const sgn=v=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),0);
function renderSkCharts(){
  const host=$('#sk-charts');
  if(skF==='gr'){
    const L=FORM.gr.lista();const y=modeYear(L,s=>ly(s.gr?.merit));const ys=modeYear(L,s=>ly(s.gr?.salsa_avv));
    host.innerHTML=`<div class="panel"><div class="panel-head"><h3>Meritvärde i åk 9 per skola</h3><span class="small">våren ${y}</span></div>${hmLegend}<div class="hbars" id="sk-c1"></div></div>
      <div class="panel"><div class="panel-head"><h3>Bättre eller sämre än väntat?</h3><span class="small">våren ${ys}</span></div>
      <p class="small">Skillnaden mellan skolans meritvärde och det värde Skolverket räknar med utifrån elevernas bakgrund. Plus betyder bättre än väntat.</p>
      <div class="axisnote"><span>sämre än väntat</span><span>bättre än väntat</span></div><div class="dbars" id="sk-c2"></div></div>`;
    const m=komLast('N15504'),r=komLast('N15504','0000');
    const rows=L.filter(s=>ly(s.gr?.merit)===y).map(s=>({n:s.n,v:lv(s.gr.merit),cls:s.hm==='Kommunal'?'kom':'fri'}));
    if(m&&+m.y===y)rows.push({n:'Örebro, alla skolor',v:m.v,cls:'ref'});if(r&&+r.y===y)rows.push({n:'Hela Sverige',v:r.v,cls:'ref'});
    hbars($('#sk-c1'),rows.sort((a,b)=>b.v-a.v),{fmtv:v=>fmt(v,1),max:340});
    const d=L.filter(s=>ly(s.gr?.salsa_avv)===ys).map(s=>({n:s.n,v:lv(s.gr.salsa_avv)})).sort((a,b)=>b.v-a.v);
    dbars($('#sk-c2'),d,{fmtv:v=>sgn(v),max:Math.max(10,...d.map(x=>Math.abs(x.v)))});
  }else if(skF==='gy'){
    const L=FORM.gy.lista();const y=modeYear(L,s=>ly(s.gy?.examen3));
    host.innerHTML=`<div class="panel"><div class="panel-head"><h3>Examen inom 3 år per skola</h3><span class="small">${y}</span></div>${hmLegend}<div class="hbars" id="sk-c1"></div></div>
      <div class="panel"><div class="panel-head"><h3>Program och intagningspoäng</h3><span class="small">antagningen 2025</span></div>
      <div class="tools"><label for="sk-pq" class="small">Sök program</label><input id="sk-pq" type="search" placeholder="t.ex. natur, el, vård" autocomplete="off"></div>
      <div class="tablewrap scrollbox"><table class="mini" id="sk-prog"><thead><tr><th>Program och skola</th><th class="r">Lägsta</th><th class="r">Snitt</th></tr></thead><tbody></tbody></table></div>
      <p class="src">Lägsta: poängen som räckte för att komma in. Snitt: genomsnittet för de antagna. Max är 340.</p></div>`;
    const m=komLast('N17448'),r=komLast('N17448','0000');
    const rows=L.filter(s=>ly(s.gy?.examen3)===y).map(s=>({n:s.n,v:lv(s.gy.examen3),cls:s.hm==='Kommunal'?'kom':'fri'}));
    const kk=komLast('N17451');if(kk&&+kk.y===y)rows.push({n:'Kommunens gymnasier, totalt',v:kk.v,cls:'kom'});
    if(m&&+m.y===y)rows.push({n:'Örebro, alla skolor',v:m.v,cls:'ref'});if(r&&+r.y===y)rows.push({n:'Hela Sverige',v:r.v,cls:'ref'});
    hbars($('#sk-c1'),rows.sort((a,b)=>b.v-a.v),{fmtv:v=>fmt(v,1)+' %',max:100});
    $('#sk-c1').insertAdjacentHTML('afterend','<p class="small">Kommunens egna gymnasier är nyligen omorganiserade i nya skolenheter per program. De har därför ännu inga examenssiffror per enhet, bara för kommunens gymnasier sammantaget.</p>');
    $('#sk-pq').addEventListener('input',renderProg);renderProg();
  }else{
    const L=SK.forskolor;
    host.innerHTML=`<div class="panel"><div class="panel-head"><h3>Hur stora är barngrupperna?</h3><span class="small">antal förskolor</span></div><div class="hbars" id="sk-c1"></div>
      <p class="small">Skolverkets riktmärke är 6–12 barn per grupp för barn 1–3 år och 9–15 barn för barn 4–5 år.</p></div>
      <div class="panel"><div class="panel-head"><h3>Andel legitimerade förskollärare</h3><span class="small">antal förskolor</span></div><div class="hbars" id="sk-c2"></div></div>`;
    const bucket=(key,edges,labels)=>labels.map((l,i)=>({n:l,v:L.filter(s=>s[key]!=null&&s[key]>=edges[i]&&s[key]<edges[i+1]).length,cls:'hl'}));
    hbars($('#sk-c1'),bucket('barn_per_grupp',[0,12,15,18,99],['under 12 barn','12–14,9 barn','15–17,9 barn','18 barn eller fler']),{fmtv:v=>fmt(v)+' st'});
    hbars($('#sk-c2'),bucket('leg_forskollarare',[0,25,40,55,70,101],['under 25 %','25–39 %','40–54 %','55–69 %','70 % eller mer']),{fmtv:v=>fmt(v)+' st'});
  }
}
function renderProg(){
  const q=($('#sk-pq').value||'').trim().toLowerCase();
  const rows=[];FORM.gy.lista().forEach(s=>(s.gy?.program||[]).forEach(p=>{if(p.antagning_min)rows.push({p,s})}));
  const f=rows.filter(r=>!q||r.p.namn.toLowerCase().includes(q)||r.s.n.toLowerCase().includes(q)).sort((a,b)=>a.p.namn.localeCompare(b.p.namn,'sv')||lv(b.p.antagning_min)-lv(a.p.antagning_min));
  $('#sk-prog tbody').innerHTML=f.length?f.map(r=>`<tr><td>${esc(r.p.namn)}<span class="sub">${esc(r.s.n)}</span></td><td class="r">${fmt(lv(r.p.antagning_min),1)}</td><td class="r">${r.p.antagning_snitt?fmt(lv(r.p.antagning_snitt),1):'–'}</td></tr>`).join(''):`<tr><td colspan="3" class="small">Inget program matchar ”${esc(q)}”.</td></tr>`;
}
function renderSkTable(){
  const F=FORM[skF];const q=$('#sk-q').value.trim().toLowerCase();
  const all=F.lista();let L=all.filter(s=>(!skHm||(skHm==='nara'?!!miNara&&miNara.skolor.has(s.c):s.hm===skHm))&&(!q||s.n.toLowerCase().includes(q)||(s.org||'').toLowerCase().includes(q)||(s.adr||'').toLowerCase().includes(q)));
  const st=skSort[skF]||(skSort[skF]={k:skF==='fo'?'n':F.cols[1].k,dir:skF==='fo'?1:-1});
  const col=F.cols.find(c=>c.k===st.k);
  L=L.map(s=>({s,v:F.get(s,st.k)})).sort((a,b)=>{if(col.txt)return st.dir*a.v.localeCompare(b.v,'sv');if(a.v==null&&b.v==null)return a.s.n.localeCompare(b.s.n,'sv');if(a.v==null)return 1;if(b.v==null)return -1;return st.dir*(a.v-b.v)}).map(x=>x.s);
  $('#sk-table thead').innerHTML='<tr>'+F.cols.map(c=>{const y=c.yr?modeYear(all,c.yr):null;
    return `<th class="${c.txt?'':'r'} ${c.cls||''}"><button data-k="${c.k}" ${st.k===c.k?`aria-sort="${st.dir>0?'ascending':'descending'}"`:''}>${c.l}<span class="ar">${st.k===c.k?(st.dir>0?'▲':'▼'):''}</span></button>${y?`<span class="yr">${y}</span>`:''}</th>`}).join('')+'</tr>';
  const cell=(s,c)=>{if(c.txt){const sub=skF==='fo'?'':[HM[s.hm]||s.hm,arskurser(s),lv(s.gr?.elever??s.gy?.elever??s.fsk?.elever)?'ca '+fmt(lv(s.gr?.elever??s.gy?.elever??s.fsk?.elever))+' elever':''].filter(Boolean).join(' · ');
      return `<td>${esc(s.n)}${miNara&&miNara.skolor.has(s.c)?miTag('Nära dig'):''}${sub?`<span class="sub">${esc(sub)}</span>`:''}</td>`}
    const v=F.get(s,c.k);if(v==null)return `<td class="r na ${c.cls||''}">–</td>`;
    const t=c.sign?sgn(v):fmt(v,c.d)+(c.u?' '+c.u:'');return `<td class="r ${c.cls||''} ${c.sign?(v>0?'sign-pos':v<0?'sign-neg':''):''}">${t}</td>`};
  const exp=skF!=='fo';const tot=L.length;if(!q&&!skAll&&L.length>25)L=L.slice(0,25);
  const mb=$('#sk-more');mb.hidden=L.length===tot;mb.textContent=`Visa alla ${fmt(tot)}`;
  $('#sk-table tbody').innerHTML=L.length?L.map(s=>`<tr class="${exp?'row':''}" data-c="${s.c||''}" ${exp?`tabindex="0" aria-expanded="${skOpen===s.c}"`:''}>${F.cols.map(c=>cell(s,c)).join('')}</tr>${exp&&skOpen===s.c?`<tr class="detail"><td colspan="${F.cols.length}">${detail(s)}</td></tr>`:''}`).join('')
    :`<tr><td colspan="${F.cols.length}" class="small">Inget matchar ”${esc(q)}”.</td></tr>`;
  $('#sk-count').textContent=L.length<tot?`visar ${fmt(L.length)} av ${fmt(tot)}`:`${fmt(tot)} av ${fmt(all.length)}`;
  $('#sk-note').textContent=exp?'Klicka på en skola för att se allt vi har om den. Klicka på en kolumnrubrik för att sortera.':'Klicka på en kolumnrubrik för att sortera.';
  if(skOpen){const s=all.find(x=>x.c===skOpen);const h=document.getElementById('sd-merit');if(s&&h)meritChart(h,s)}
}
function fact(l,v,s){return v==null?'':`<div class="fact"><span class="label">${esc(l)}</span><span class="v num">${v}</span>${s?`<span class="s">${esc(s)}</span>`:''}</div>`}
function detail(s){
  const g=s.gr,y=s.gy,base=g||y||s.fsk||s.gran||s.gyan||s.sp||{};
  const map=s.lat?`<a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=16/${s.lat}/${s.lon}" target="_blank" rel="noopener">Visa på karta</a>`:'';
  const web=s.web?`<a href="${esc(s.web.startsWith('http')?s.web:'https://'+s.web)}" target="_blank" rel="noopener">Skolans webbplats</a>`:'';
  const skv=`<a href="https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID=${s.c}" target="_blank" rel="noopener">Utbildningsguiden</a>`;
  let h=`<div class="sd"><div class="sd-head"><h3>${esc(s.n)}</h3><span class="small">${esc([HM[s.hm]||s.hm,s.hm!=='Kommunal'?s.org:'',arskurser(s)?'årskurs '+arskurser(s):'',s.adr].filter(Boolean).join(' · '))}</span><div class="links">${[map,web,skv].filter(Boolean).join('')}</div></div>`;
  const el_=lv(base.elever);
  h+=`<div class="facts">${fact('Elever',el_!=null?'ca '+fmt(el_):null,ly(base.elever)?'läsåret '+lasar(ly(base.elever)):'')}${fact('Elever per lärare',lv(base.elever_per_larare)!=null?fmt(lv(base.elever_per_larare),1):null,'heltidstjänster')}${fact('Legitimerade lärare',lv(base.leg_larare)!=null?fmt(lv(base.leg_larare),0)+' %':null,'med behörighet')}`;
  if(g){h+=fact('Föräldrar med högskola',g.foraldrar_hogsk?fmt(g.foraldrar_hogsk[1],0)+' %':null,'eftergymnasial utbildning')+fact('Utländsk bakgrund',g.utl_bakgrund?fmt(g.utl_bakgrund[1],0)+' %':null,'andel av eleverna')}
  if(y){h+=fact('Föräldrar med högskola',y.foraldrar_hogsk?fmt(y.foraldrar_hogsk[1],0)+' %':null,'eftergymnasial utbildning')+fact('Utländsk bakgrund',y.utl_bakgrund?fmt(y.utl_bakgrund[1],0)+' %':null,'andel av eleverna')}
  h+='</div>';
  if(g&&(g.merit||g.alla_amnen6||g.np6)){
    const rows=[['Meritvärde åk 9',g.merit,1,''],['Godkända i alla ämnen, åk 9',g.alla_amnen9,1,' %'],['Behöriga till gymnasiet',g.behorig,1,' %'],['Behöriga till natur/teknik',g.behorig_na,1,' %'],
      ['Förväntat meritvärde (SALSA)',g.salsa_modell,0,''],['Mot förväntat',g.salsa_avv,0,'s'],['Godkända i alla ämnen, åk 6',g.alla_amnen6,1,' %']].filter(r=>r[1]);
    const np=(o,lab)=>o&&Object.values(o).some(Boolean)?`<tr><td>${lab}<span class="sub">provbetygspoäng, max 20 · ${ly(Object.values(o).find(Boolean))}</span></td><td class="r">${['sv','en','ma'].map(k=>o[k]?`${{sv:'Sv',en:'En',ma:'Ma'}[k]}&nbsp;${fmt(o[k][1],1)}`:'').filter(Boolean).join('<br>')}</td></tr>`:'';
    h+=`<div class="grid2">${g.merit&&g.merit.length>1?`<div><h4>Meritvärde i åk 9 över tid</h4><div class="legend"><span><i class="sw" style="background:var(--accent)"></i>Skolan</span><span><i class="sw" style="background:var(--ink2)"></i>Örebro</span></div><div class="chart" id="sd-merit"></div></div>`:''}
      <div><h4>Resultat</h4><table class="mini"><tbody>${rows.map(([l,v,d,u])=>{const x=last(v);return `<tr><td>${l}<span class="sub">våren ${x[0]}</span></td><td class="r ${u==='s'?(x[1]>0?'sign-pos':x[1]<0?'sign-neg':''):''}">${u==='s'?sgn(x[1]):fmt(x[1],d)+u}</td></tr>`}).join('')}${np(g.np9,'Nationella prov åk 9')}${np(g.np6,'Nationella prov åk 6')}</tbody></table></div></div>`;
  }
  if(y&&y.program&&y.program.length){
    h+=`<div><h4>Program</h4><div class="tablewrap"><table class="mini"><thead><tr><th>Program</th><th class="r">Intagning lägsta / snitt</th><th class="r">Examen inom 3 år</th><th class="r hide-sm">Högskole­behöriga</th><th class="r hide-sm">Betygs­poäng</th><th class="r hide-sm">Elever</th></tr></thead><tbody>${
      y.program.map(p=>{const c=(v,d,u='')=>v?`${fmt(v[1],d)}${u}<span class="sub">${v[0]}</span>`:'–';return `<tr><td>${esc(p.namn)}</td><td class="r">${p.antagning_min?fmt(lv(p.antagning_min),1)+' / '+(p.antagning_snitt?fmt(lv(p.antagning_snitt),1):'–'):'–'}</td><td class="r">${c(p.examen3,1,' %')}</td><td class="r hide-sm">${c(p.hogskolebeh,1,' %')}</td><td class="r hide-sm">${c(p.betygspoang,1)}</td><td class="r hide-sm">${p.elever?'ca '+fmt(lv(p.elever)):'–'}</td></tr>`}).join('')}</tbody></table></div>
      <p class="src">Betygspoäng är genomsnittet för elever med examen, max 20. Intagningspoäng från antagningen 2025.</p></div>`;
  }
  const E=s.enkat||{};const grp=[['elever_ak5','Elever i åk 5'],['elever_ak8','Elever i åk 8'],['elever_gy2','Elever i år 2'],['vh_fsk','Vårdnadshavare, förskoleklass'],['vh_gr','Vårdnadshavare, grundskola'],['vh_gran','Vårdnadshavare, anpassad grundskola']].filter(([k])=>E[k]);
  if(grp.length){
    const Q=[['trygg','Trygga'],['nojd','Nöjda med skolan'],['arbetsro','Arbetsro'],['stod','Får hjälp de behöver'],['intresse','Lärare väcker intresse']];
    h+=`<div><h4>Skolenkäten</h4><div class="enk">${grp.map(([k,l])=>{const e=E[k];return `<div><div class="small"><b>${l}</b> · ${e.termin.replace('VT','våren 20')}${e.svar?` · ${fmt(e.svar)} svar`:''}</div><div class="hbars">${Q.filter(([q])=>e[q]!=null).map(([q,ql])=>`<div class="hbar hl" title="${ql}: ${e[q]} %"><span class="name">${ql}</span><span class="track"><span class="fill" style="display:block;width:${e[q]}%"></span></span><span class="val">${e[q]} %</span></div>`).join('')}</div></div>`}).join('')}</div></div>`;
  }
  return h+'</div>';
}
function meritChart(host,s){
  const k=kom('N15504');const sp=s.gr.merit;
  const ser=[{name:'Skolan',color:'var(--accent)',pts:sp},{name:'Örebro',color:'var(--ink2)',dash:'5 4',pts:Object.entries(k.data['1880']).map(([y,v])=>[+y,v]).filter(p=>sp.some(q=>q[0]===p[0]))}];
  lineChart(host,ser,{yfmt:v=>fmt(v),height:220});
}
function initSkolor(){
  $('#sk-form').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b&&b.dataset.f!==skF){skF=b.dataset.f;renderSkolor()}});
  $('#sk-cmp-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){skCmp[skF]=b.dataset.id;renderSkCmp()}});
  if(miNara)$('#sk-hm').insertAdjacentHTML('beforeend','<button class="chip" data-h="nara" aria-pressed="false">Nära dig</button>');
  $('#sk-hm').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){skHm=b.dataset.h;document.querySelectorAll('#sk-hm .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));renderSkTable()}});
  $('#sk-q').addEventListener('input',renderSkTable);
  $('#sk-more').addEventListener('click',()=>{skAll=true;renderSkTable()});
  $('#sk-table thead').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const st=skSort[skF];const c=FORM[skF].cols.find(c=>c.k===b.dataset.k);
    if(st.k===c.k)st.dir*=-1;else{st.k=c.k;st.dir=c.txt?1:-1}renderSkTable()});
  const toggle=tr=>{const c=tr.dataset.c;skOpen=skOpen===c?null:c;renderSkTable();const n=document.querySelector(`#sk-table tr.row[data-c="${c}"]`);if(n)n.focus({preventScroll:true})};
  $('#sk-table tbody').addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr.row');if(tr)toggle(tr)});
  $('#sk-table tbody').addEventListener('keydown',e=>{const tr=e.target.closest('tr.row');if(tr&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggle(tr)}});
  renderSkolor();
}


/* ===== Områden ===== */
let OM,omSel,omMat='inkomst',omZoom='stad',omBox={};
const OMAT=[
  {k:'inkomst',l:'Medianinkomst',u:' tkr',d:0,s:'ekonomisk standard per person och år, 2024'},
  {k:'lag_ek',l:'Låg ekonomisk standard',u:' %',d:0,s:'andel av invånarna, 2024'},
  {k:'hogskola',l:'Eftergymnasial utbildning',u:' %',d:0,s:'andel av 25–65-åringarna, 2025'},
  {k:'syss',l:'Sysselsatta',u:' %',d:0,s:'andel av 20–64-åringarna som har jobb, 2024'},
  {k:'utl',l:'Utländsk bakgrund',u:' %',d:0,s:'utrikes födda eller båda föräldrarna utrikes födda, 2025'},
  {k:'barnfam',l:'Barnfamiljer',u:' %',d:0,s:'andel av hushållen, 2025'},
  {k:'barn',l:'Barn och unga, 0–19 år',u:' %',d:0,s:'andel av invånarna, 2025'},
  {k:'aldre',l:'65 år och äldre',u:' %',d:0,s:'andel av invånarna, 2025'},
  {k:'hyres',l:'Hyresrätter',u:' %',d:0,s:'andel av lägenheterna, 2025'},
  {k:'bilar',l:'Bilar per 1 000 invånare',u:'',d:0,s:'personbilar i trafik, 2025'},
  {k:'tathet',l:'Invånare per km²',u:'',d:0,s:'landareal, 2025'},
];
const omFmt=(m,v)=>v==null?'–':fmt(v,m.d)+m.u;
function pathBox(d){let x=0,y=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;d.replace(/([Ml])(-?\d+) (-?\d+)/g,(_,c,a,b)=>{a=+a;b=+b;if(c==='M'){x=a;y=b}else{x+=a;y+=b}x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)});return [x0,y0,x1,y1]}
function omMatDef(){const m=OMAT.find(m=>m.k===omMat);return {...m,get:o=>o[m.k]}}
function quantBreaks(vals){const v=vals.filter(x=>x!=null).sort((a,b)=>a-b);if(!v.length)return [];return [.2,.4,.6,.8].map(q=>v[Math.min(v.length-1,Math.floor(q*v.length))])}
function renderOmMap(){
  const host=$('#om-map');const M=omMatDef();const W=OM.karta.w,H=OM.karta.h;
  const items=M.dist?OM.distrikt:OM.omraden;const br=quantBreaks(items.map(M.get));
  const cls=v=>v==null?null:1+br.filter(b=>v>b).length;
  const vb=omZoom==='stad'?omBox.stad:[0,0,W,H];
  host.innerHTML='';const svg=el('svg',{viewBox:vb.join(' '),role:'img','aria-label':'Karta över Örebros områden färgade efter '+M.l},host);
  const tp=tip(host);const scale=vb[2]/Math.max(280,svg.getBoundingClientRect().width||host.clientWidth||600);
  const show=(e,t)=>{const bb=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=t;tp.style.left=(e.clientX-bb.left)+'px';tp.style.top=(e.clientY-bb.top-8)+'px'};
  items.forEach(it=>{const v=M.get(it);const c=cls(v);
    const p=el('path',{d:it.svg,class:'a',fill:c?`var(--q${c})`:'var(--line)','fill-rule':'evenodd'},svg);
    const oid=M.dist?it.omr:it.kod;const o=OM.omraden.find(x=>x.kod===oid);
    p.addEventListener('mousemove',e=>show(e,`<b>${esc(M.dist?it.namn:it.namn)}</b>${M.dist?`<br><span style="opacity:.8">${esc(o?.namn||'')}</span>`:''}<br>${esc(M.l)}: ${omFmt(M,v)}`));
    p.addEventListener('mouseleave',()=>tp.hidden=true);
    p.addEventListener('click',()=>{if(oid){omSel=oid;renderOm()}});});
  if(M.dist)OM.omraden.forEach(o=>el('path',{d:o.svg,class:'outline','fill-rule':'evenodd'},svg));
  const s=OM.omraden.find(o=>o.kod===omSel);
  if(s){el('path',{d:s.svg,class:'seloutline','fill-rule':'evenodd'},svg);
    OM.skolpos.filter(p=>s.skolor.includes(p[0])).forEach(p=>el('circle',{cx:p[1],cy:p[2],r:5*scale,class:'sk'},svg));
    const t=el('text',{x:s.lx,y:s.ly-9*scale,'text-anchor':'middle',class:'lbl',style:`font-size:${14*scale}px;stroke-width:${4*scale}px`},svg);t.textContent=s.namn}
  $('#om-map-title').textContent=M.l;
  const lo=Math.min(...items.map(M.get).filter(v=>v!=null)),hi=Math.max(...items.map(M.get).filter(v=>v!=null));
  const edges=[lo,...br,hi];
  $('#om-legend').innerHTML=[1,2,3,4,5].map(i=>`<span><i class="sw" style="background:var(--q${i})"></i>${fmt(edges[i-1],M.d)}–${fmt(edges[i],M.d)}${M.u}</span>`).join('')+`<span><i class="sw" style="background:var(--surface);border:2px solid var(--ink)"></i>valt område</span>`+(s&&s.skolor.length?`<span><i class="sw" style="border-radius:50%;background:var(--surface);border:1.5px solid var(--ink);width:10px;height:10px"></i>skola</span>`:'');
  $('#om-map-note').textContent='Fem lika stora grupper: varje färg har ungefär lika många områden. Klicka på ett område för att välja det.';
}
function strip(m,o){
  const vals=OM.omraden.map(x=>x[m.k]).filter(v=>v!=null);const lo=Math.min(...vals,OM.kommun[m.k]??Infinity),hi=Math.max(...vals,OM.kommun[m.k]??-Infinity);
  const x=v=>((v-lo)/((hi-lo)||1)*100).toFixed(2)+'%';const v=o[m.k],k=OM.kommun[m.k],r=OM.riket[m.k];
  const rank=v==null?null:OM.omraden.filter(z=>z[m.k]!=null&&z[m.k]>v).length+1;
  return `<div class="strip"><div class="top"><span>${m.l}</span><b>${omFmt(m,v)}</b></div>
    <div class="sc" title="Lägst ${omFmt(m,Math.min(...vals))}, högst ${omFmt(m,Math.max(...vals))}"><span class="base"></span>${vals.map(z=>`<span class="t" style="left:${x(z)}"></span>`).join('')}${k!=null?`<span class="k" style="left:${x(k)}"></span>`:''}${v!=null?`<span class="me" style="left:${x(v)}"></span>`:''}</div>
    <span class="sub">${esc(m.s)} · Örebro ${omFmt(m,k)}${r!=null?' · Sverige '+omFmt(m,r):''}${rank?` · plats ${rank} av ${vals.length}`:''}</span></div>`;
}
function bars2(host,rows,{mx}){
  host.innerHTML=rows.map(r=>`<div class="agebar" title="${esc(r.n)}: området ${fmt(r.v,1)} %, hela kommunen ${fmt(r.k,1)} %"><span>${esc(r.n)}</span><span class="tr"><span class="f" style="width:${r.v/mx*100}%"></span><span class="k" style="left:${r.k/mx*100}%"></span></span><span class="v">${fmt(r.v,0)} %</span></div>`).join('');
}
function renderOm(){
  const o=OM.omraden.find(x=>x.kod===omSel);const K=OM.kommun;$('#om-sel').value=omSel;
  renderOmMap();
  const inv=o.bef[o.bef.length-1][1];
  $('#om-namn').textContent=o.namn;
  $('#om-mitt').innerHTML=miHamta()===o.kod?`${miTag('Ditt område')} <a href="mitt.html">Se Mitt Örebro</a>`:`<button type="button" class="knapp-l liten" data-spara>Spara som mitt område</button>`;
  $('#om-sum').textContent=`${fmt(inv)} invånare (${fmt(inv/K.bef[K.bef.length-1][1]*100,1)} % av kommunen) · ${o.hushall?fmt(o.hushall)+' hushåll · ':''}${o.km2!=null?fmt(o.km2,o.km2<10?1:0)+' km²':''}`;
  $('#om-strips').innerHTML=OMAT.map(m=>strip(m,o)).join('');
  // val
  const v=o.val;const order=['S','M','SD','V','C','KD','L','MP','ÖrP'];
  const KORT={S:'Socialdemokraterna',M:'Moderaterna',SD:'Sverigedemokraterna',V:'Vänsterpartiet',C:'Centerpartiet',KD:'Kristdemokraterna',L:'Liberalerna',MP:'Miljöpartiet','ÖrP':'Örebropartiet'};
  const kv=(VAL?.partier||[]);const kAnd=k=>{const p=kv.find(p=>p.k===k);return p?p.a:null};
  if(v){const rows=order.filter(k=>v.andel[k]!=null).map(k=>({k,n:KORT[k]||k,v:v.andel[k],kk:kAnd(k),f:OM.partier[k]?.f}));
    const ov=100-rows.reduce((s,r)=>s+r.v,0);const mx=Math.max(...rows.map(r=>Math.max(r.v,r.kk||0)),ov);
    const top=rows.slice().sort((a,b)=>b.v-a.v)[0];
    $('#om-val-sum').textContent=`Valdeltagande ${fmt(v.deltagande,1)} % (hela kommunen ${fmt(VAL?VAL.deltagande:0,1)} %). Största parti: ${top.n}, ${fmt(top.v,1)} %. Baserat på ${v.distrikt} valdistrikt.`;
    $('#om-val').innerHTML=`<div class="pbar small" style="color:var(--muted)"><span></span><span></span><span class="v">Område</span><span class="v d">Kommun</span></div>`+rows.map(r=>`<div class="pbar" title="${esc(r.n)}: ${fmt(r.v,1)} % i området, ${fmt(r.kk,1)} % i hela kommunen"><span><span class="lng">${esc(r.n)}</span><span class="krt">${esc(r.k)}</span></span><span class="tr"><span class="f" style="width:${r.v/mx*100}%;background:${r.f}"></span>${r.kk!=null?`<span class="k" style="left:${r.kk/mx*100}%"></span>`:''}</span><span class="v">${fmt(r.v,1)}</span><span class="v d">${r.kk!=null?fmt(r.kk,1):'–'}</span></div>`).join('')+
      `<div class="pbar"><span>Övriga partier</span><span class="tr"><span class="f" style="width:${ov/mx*100}%;background:var(--mark-gray)"></span></span><span class="v">${fmt(ov,1)}</span><span class="v d"></span></div>`;
  }else{$('#om-val-sum').textContent='Inget valdistrikt ligger huvudsakligen i det här området.';$('#om-val').innerHTML=''}
  // ålder
  const AL=['0–4','5–9','10–14','15–19','20–24','25–29','30–34','35–39','40–44','45–49','50–54','55–59','60–64','65–69','70–74','75–79','80+'];
  const sa=o.alder.reduce((a,b)=>a+b,0)||1,sKom=K.alder.reduce((a,b)=>a+b,0);
  const ar=AL.map((n,i)=>({n,v:o.alder[i]/sa*100,k:K.alder[i]/sKom*100}));
  bars2($('#om-age'),ar,{mx:Math.max(...ar.flatMap(r=>[r.v,r.k]))});
  // hushåll
  const HT=['Sambo med barn','Sambo utan barn','Ensamstående med barn','Ensamstående utan barn','Övriga hushåll'];
  if(o.hush_typ){const hr=HT.map((n,i)=>({n,v:o.hush_typ[i]||0,k:K.hush_typ[i]||0}));bars2($('#om-hush'),hr,{mx:Math.max(...hr.flatMap(r=>[r.v,r.k]))});$('#om-hush-n').textContent=fmt(o.hushall)+' hushåll 2025'}
  document.querySelectorAll('#om-hush .agebar').forEach(e=>e.style.gridTemplateColumns='minmax(0,10rem) minmax(0,1fr) 3rem');
  // bostäder
  if(o.lgh){const seg=[['Hyresrätt',o.hyres,'var(--accent)'],['Bostadsrätt',o.bostadsratt,'var(--second)'],['Äganderätt',o.agande,'var(--ink2)']];
    $('#om-lgh-n').textContent=fmt(o.lgh)+' lägenheter 2025';
    $('#om-lgh').innerHTML=`<div class="stack" role="img" aria-label="${seg.map(s=>s[0]+' '+fmt(s[1],0)+' %').join(', ')}">${seg.filter(s=>s[1]>0).map(s=>`<span style="width:${s[1]}%;background:${s[2]}" title="${s[0]}: ${fmt(s[1],1)} %"></span>`).join('')}</div>
      <div class="legend" style="margin-top:8px">${seg.map(s=>`<span><i class="sw" style="background:${s[2]}"></i>${s[0]} ${fmt(s[1],0)} %</span>`).join('')}</div>
      <p class="small" style="margin-top:6px">Hela kommunen: hyresrätt ${fmt(K.hyres,0)} %, bostadsrätt ${fmt(K.bostadsratt,0)} %, äganderätt ${fmt(K.agande,0)} %. Lägenheter i småhus räknas också.</p>`}
  const BY=['före 1921','1921–30','1931–40','1941–50','1951–60','1961–70','1971–80','1981–90','1991–2000','2001–10','2011–20','2021–'];
  if(o.bygg)hbars($('#om-bygg'),BY.map((n,i)=>({n,v:o.bygg[i]||0,cls:'hl'})),{fmtv:v=>fmt(v,0)+' %'});
  // skolor
  const iList=SK?new Set([...FORM.gr.lista(),...FORM.gy.lista()]):new Set();
  const sk=(SK?SK.skolor:[]).filter(s=>o.skolor.includes(s.c)&&iList.has(s));
  $('#om-sk-n').textContent=sk.length?`${sk.length} skolenheter`:'';
  $('#om-sk').innerHTML=sk.length?sk.map(s=>{const f=s.former.some(x=>['gy','gyan'].includes(x.k))?'gy':'gr';const extra=f==='gr'&&lv(s.gr?.merit)!=null?` · meritvärde ${fmt(lv(s.gr.merit),1)}`:'';
      return `<div><button data-c="${s.c}" data-f="${f}">${esc(s.n)}</button><span class="small"> · ${esc(HM[s.hm]||s.hm)}${arskurser(s)?' · '+arskurser(s):''}${extra}</span></div>`}).join('')
    :'<p class="small">Det finns ingen grundskola eller gymnasieskola i området enligt Skolverket. Förskolor saknar adresser i den öppna datan.</p>';
  const vcs=VA?VA.vc.filter(v=>v.omr===o.kod):[];
  $('#om-vc').innerHTML=!VA?'':vcs.length?vcs.map(v=>`<div><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.n)}</a><span class="small"> · ${esc(v.adr||'')}${v.tel!=null?` · telefonen besvarad samma dag ${fmt(v.tel)} %`:''}${v.npe!=null?` · helhetsintryck ${fmt(v.npe)} %`:''}</span></div>`).join('')
    :'<p class="small">Det ligger ingen vårdcentral i området. Man kan lista sig på vilken vårdcentral som helst i länet, se <a href="vard.html">sidan om vården</a>.</p>';
}
function omStad(){
  OM.omraden.forEach(o=>{if(!o._box)o._box=pathBox(o.svg)});
  const st=OM.omraden.filter(o=>o.tathet>=1000);const b=st.reduce((a,o)=>[Math.min(a[0],o._box[0]),Math.min(a[1],o._box[1]),Math.max(a[2],o._box[2]),Math.max(a[3],o._box[3])],[1e9,1e9,-1e9,-1e9]);
  const pad=40;omBox.stad=[b[0]-pad,b[1]-pad,b[2]-b[0]+2*pad,b[3]-b[1]+2*pad];
}
function initOm(){
  OM.omraden.forEach(o=>o._box=pathBox(o.svg));
  omStad();
  $('#om-sel').innerHTML=OM.omraden.slice().sort((a,b)=>a.namn.localeCompare(b.namn,'sv')).map(o=>`<option value="${o.kod}">${esc(o.namn)}</option>`).join('');
  $('#om-mat').innerHTML=`${OMAT.map(m=>`<option value="${m.k}">${m.l}</option>`).join('')}`;
  const mk=miHamta();omSel=OM.omraden.some(o=>o.kod===mk)?mk:(OM.omraden.find(o=>o.namn==='Örebro city')||OM.omraden[0]).kod;
  $('#om-mitt').addEventListener('click',e=>{if(e.target.closest('button[data-spara]')){miSpara(omSel);renderOm()}});
  $('#om-sel').addEventListener('change',e=>{omSel=e.target.value;renderOm()});
  $('#om-mat').addEventListener('change',e=>{omMat=e.target.value;renderOmMap()});
  $('#om-zoom').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;omZoom=b.dataset.z;document.querySelectorAll('#om-zoom .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));renderOmMap()});
  $('#om-sk').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;location.href='skolor.html#s'+b.dataset.c});
  $('#om-upps').textContent=fmt(OM.uppsamling_roster);
  renderOm();
}


/* ===== Vård och omsorg ===== */
let VA,vaScope='kommun',vaR=null,vaK=null,vaTyp='sabo',vaSort={k:null,dir:-1};
const vaUnit=k=>k.enhet==='%'?' %':k.enhet==='kr'?' kr':k.enhet==='dagar'?' dagar':'';
const vaF=(k,v)=>v==null?'–':k.enhet==='kr'?fmt(Math.round(v/100)*100)+' kr':fmt(v,k.dec)+vaUnit(k);
const vaLast=(k,m)=>{const d=k.data[m];if(!d)return null;const ys=Object.keys(d);return {y:ys[ys.length-1],v:d[ys[ys.length-1]]}};
const MANAD=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const vaPer=p=>p?MANAD[+p.slice(5)-1]+' '+p.slice(0,4):'';
function vaCmp(pre,list,sel,ents,main){
  const k=list.find(x=>x.id===sel);document.querySelectorAll(`#${pre}chips .chip`).forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===sel));
  const L=vaLast(k,main);const y=L.y;
  $(`#${pre}-title`).textContent=k.titel;$(`#${pre}-year`).textContent=y;$(`#${pre}-desc`).textContent=k.beskr[0].toUpperCase()+k.beskr.slice(1)+'.';
  const rows=Object.keys(ents).filter(c=>k.data[c]&&k.data[c][y]!=null).map(c=>({n:ents[c],v:k.data[c][y],cls:c===main?'hl':c==='0000'?'ref':''})).sort((a,b)=>b.v-a.v);
  hbars($(`#${pre}`),rows,{fmtv:v=>vaF(k,v)});
  const ser=[{name:ents[main],color:'var(--accent)',pts:Object.entries(k.data[main]).map(([y,v])=>[+y,v])}];
  if(k.data['0000'])ser.push({name:'Hela Sverige',color:'var(--ink2)',dash:'5 4',pts:Object.entries(k.data['0000']).map(([y,v])=>[+y,v]).filter(p=>ser[0].pts.some(q=>q[0]===p[0]))});
  const host=$(`#${pre}line`);
  if(ser[0].pts.length<2){host.innerHTML=`<p class="small">Bara ett år (${y}) finns, så det går inte att visa någon utveckling.</p>`;return}
  lineChart(host,ser,{yfmt:v=>k.enhet==='kr'?fmt(v/1000)+' tkr':fmt(v,k.dec)});
}
function renderVaVC(){
  document.querySelectorAll('#va-scope .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===vaScope));
  const vcs=VA.vc.filter(v=>vaScope==='lan'||v.orebro);const kort=n=>n.replace(/ ?vårdcentral ?/i,' ').replace(/\s+/g,' ').trim();
  const mk=(key,snitt,lab)=>{const r=vcs.filter(v=>v[key]!=null).map(v=>({n:kort(v.n)+(vaScope==='lan'&&!v.orebro?', '+v.ort:''),v:v[key],cls:vaScope==='lan'?(v.orebro?'hl':''):'hl'}));
    r.push({n:lab,v:snitt,cls:'ref'});return r.sort((a,b)=>b.v-a.v)};
  hbars($('#va-tel'),mk('tel',VA.tel_snitt,'Snitt i länet'),{fmtv:v=>fmt(v)+' %',max:100});
  hbars($('#va-npe'),mk('npe',VA.npe_snitt,'Snitt i länet'),{fmtv:v=>fmt(v)+' %',max:100});
  const leg=vaScope==='lan'?`<span><i class="sw" style="background:var(--accent)"></i>I Örebro kommun</span><span><i class="sw" style="background:var(--mark-gray)"></i>Övriga länet</span><span><i class="sw" style="border:2px solid var(--ink2)"></i>Snitt</span>`:`<span><i class="sw" style="border:2px solid var(--ink2)"></i>Snitt för alla vårdcentraler i länet</span>`;
  $('#va-leg1').innerHTML=leg;$('#va-leg2').innerHTML=leg;
  const saknas=vcs.filter(v=>v.npe==null).map(v=>kort(v.n));
  $('#va-npe').insertAdjacentHTML('beforeend',saknas.length?`<p class="src">${esc(saknas.join(', '))}: för få svar.</p>`:'');
}
function renderVaAldre(){
  document.querySelectorAll('#va-atyp .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===vaTyp));
  const A=VA.aldre[vaTyp];const M=A.matt;if(!vaSort.k||!M.some(m=>m.id===vaSort.k))vaSort={k:M[0].id,dir:-1};
  const kom=id=>{const k=VA.kommun.find(x=>x.id===id);return k?{o:vaLast(k,'1880'),r:vaLast(k,'0000')}:null};
  $('#va-a-n').textContent=`${A.enheter.length} ${vaTyp==='sabo'?'boenden':'hemtjänstgrupper'} med svar`;
  $('#va-a-desc').textContent=vaTyp==='sabo'?'Särskilda boenden för äldre (äldreboenden) i kommunal och privat regi.':'Hemtjänstgrupper, både kommunens egna och privata utförare som man kan välja genom valfrihetssystemet.';
  $('#va-atab thead').innerHTML='<tr><th><button data-k="n">'+(vaTyp==='sabo'?'Äldreboende':'Hemtjänst')+'<span class="ar">'+(vaSort.k==='n'?(vaSort.dir>0?'▲':'▼'):'')+'</span></button></th>'+M.map((m,i)=>`<th class="r${i>2?' hide-sm':''}"><button data-k="${m.id}" ${vaSort.k===m.id?`aria-sort="${vaSort.dir>0?'ascending':'descending'}"`:''}>${esc(m.l)}<span class="ar">${vaSort.k===m.id?(vaSort.dir>0?'▲':'▼'):''}</span></button></th>`).join('')+'</tr>';
  const rows=A.enheter.slice().sort((a,b)=>{if(vaSort.k==='n')return vaSort.dir*a.n.localeCompare(b.n,'sv');const x=a.v[vaSort.k]?.[1],y=b.v[vaSort.k]?.[1];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return vaSort.dir*(x-y)});
  const ref=['1880','0000'].map(m=>`<tr class="va-ref"><td>${m==='1880'?'Hela Örebro':'Hela Sverige'}</td>${M.map((mm,i)=>{const k=kom(mm.id);const v=k&&(m==='1880'?k.o:k.r);return `<td class="r${i>2?' hide-sm':''}">${v?fmt(v.v,0)+' %':''}</td>`}).join('')}</tr>`).join('');
  $('#va-atab tbody').innerHTML=ref+rows.map(r=>`<tr><td>${esc(r.n)}</td>${M.map((m,i)=>{const x=r.v[m.id];return `<td class="r${i>2?' hide-sm':''}${x?'':' na'}"><span class="va-cell" style="--w:${x?x[1]:0}%">${x?x[1]+' %':'–'}</span></td>`}).join('')}</tr>`).join('');
}
function initVa(){
  const K=VA.kommun,R=VA.region;const g=id=>R.find(k=>k.id===id);const gk=id=>K.find(k=>k.id===id);
  // nyckeltal
  const tiles=[];
  tiles.push({l:'Telefonen besvarad samma dag',v:fmt(VA.tel_snitt)+' %',s:`snitt för länets vårdcentraler, ${vaPer(VA.tel_period)}`});
  const b3=g('N79173');if(b3){const o=vaLast(b3,'0018'),r=vaLast(b3,'0000');tiles.push({l:'Bedömning inom tre dagar',v:fmt(o.v,0)+' %',s:`${o.y} · hela Sverige ${fmt(r.v,0)} %`})}
  const ft=g('U71458');if(ft){const o=vaLast(ft,'0018'),r=vaLast(ft,'0000');tiles.push({l:'Förtroende för vårdcentralen',v:fmt(o.v,0)+' %',s:`${o.y} · hela Sverige ${fmt(r.v,0)} %`})}
  const vs=gk('U23401');if(vs){const o=vaLast(vs,'1880');tiles.push({l:'Väntan på äldreboende',v:fmt(o.v,0)+' dagar',s:`i snitt ${o.y}, från ansökan till erbjuden plats`})}
  $('#va-kpis').innerHTML=tiles.map(t=>`<div class="stat"><span class="label">${esc(t.l)}</span><span class="v num">${t.v}</span><span class="s">${esc(t.s)}</span></div>`).join('');
  const ob=VA.vc.filter(v=>v.orebro);
  const bO=b3?vaLast(b3,'0018'):null,bR=b3?vaLast(b3,'0000'):null;
  $('#va-lead').textContent=`Det finns ${ob.length} vårdcentraler i Örebro kommun och ${VA.vc.length} i hela länet. `+(bO?`${fmt(bO.v,0)} procent av patienterna i regionens primärvård fick en medicinsk bedömning inom tre dagar ${bO.y}, jämfört med ${fmt(bR.v,0)} procent i hela Sverige. `:'')+`Här finns också väntetider, förtroendet för vården, folkhälsan och vad de äldre tycker om hemtjänsten och äldreboendena.`;
  $('#va-tel-per').textContent=vaPer(VA.tel_period);$('#va-npe-ar').textContent=VA.npe_ar;
  $('#va-scope').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vaScope=b.dataset.s;renderVaVC()}});
  $('#va-vc tbody').innerHTML=VA.vc.slice().sort((a,b)=>(b.orebro-a.orebro)||a.n.localeCompare(b.n,'sv')).map(v=>`<tr><td><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.n)}</a>${miNara&&miNara.vc.has(v.n)?miTag('Nära dig'):''}<span class="sub">${esc(v.adr||'')}${v.omr_namn?' · område '+esc(v.omr_namn):''}</span></td><td class="r">${v.tel!=null?fmt(v.tel)+' %':'–'}</td><td class="r">${v.npe!=null?fmt(v.npe)+' %':'–'}</td></tr>`).join('');
  // jämförelser
  vaR=R[0].id;vaK=K[0].id;
  $('#va-rchips').innerHTML=R.map(k=>`<button class="chip" data-id="${k.id}" aria-pressed="false">${esc(k.titel)}</button>`).join('');
  const grp={halsa:'Hälsa',aldre:'Äldreomsorg'};
  $('#va-kchips').innerHTML=Object.keys(grp).map(gid=>`<span class="va-grp">${grp[gid]}</span>`+K.filter(k=>k.grupp===gid).map(k=>`<button class="chip" data-id="${k.id}" aria-pressed="false">${esc(k.titel)}</button>`).join('')).join('');
  $('#va-rchips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vaR=b.dataset.id;vaCmp('va-r',R,vaR,VA.regioner,'0018')}});
  $('#va-kchips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vaK=b.dataset.id;vaCmp('va-k',K,vaK,VA.kommuner,'1880')}});
  $('#va-atyp').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){vaTyp=b.dataset.t;vaSort={k:null,dir:-1};renderVaAldre()}});
  $('#va-atab thead').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(vaSort.k===b.dataset.k)vaSort.dir*=-1;else vaSort={k:b.dataset.k,dir:b.dataset.k==='n'?1:-1};renderVaAldre()});
  renderVaVC();vaCmp('va-r',R,vaR,VA.regioner,'0018');vaCmp('va-k',K,vaK,VA.kommuner,'1880');renderVaAldre();
}


/* ===== Vädret ===== */
let VE,VED=null;
const MAN_K=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const dagTxt=d=>{const [y,m,dd]=d.split('-');return `${+dd} ${MANAD[+m-1]} ${y}`};
const grad=(v,d=1)=>v==null?'–':(v<0?'−':'')+fmt(Math.abs(v),d)+' °C';
const RDBU=[[33,102,172],[67,147,195],[146,197,222],[209,229,240],[247,247,247],[253,219,199],[244,165,130],[214,96,77],[178,24,43]];
function stripeColor(a){const x=Math.max(-2.5,Math.min(2.5,a));const f=(x+2.5)/5*(RDBU.length-1);const i=Math.min(RDBU.length-2,Math.floor(f)),t=f-i;const c=RDBU[i].map((v,k)=>Math.round(v+(RDBU[i+1][k]-v)*t));return `rgb(${c.join(',')})`}
function veBase(){const a=VE.ar.filter(r=>r[0]>=1961&&r[0]<=1990);return a.reduce((s,r)=>s+r[1],0)/a.length}
function renderVeStripes(){
  const host=$('#ve-stripes');host.innerHTML='';const y0=VE.ar[0][0],y1=VE.ar[VE.ar.length-1][0],n=y1-y0+1;const base=veBase();
  const W=Math.max(320,host.clientWidth||900),H=W<500?90:130,B=18;const bw=W/n;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':`Årsmedeltemperatur i Örebro ${y0}–${y1} som färgade streck`},host);const tp=tip(host);
  const m=new Map(VE.ar.map(r=>[r[0],r[1]]));
  for(let y=y0;y<=y1;y++){const v=m.get(y);const x=(y-y0)*bw;
    const r=el('rect',{x:x,y:0,width:bw+.6,height:H-B,fill:v==null?'var(--bg)':stripeColor(v-base)},svg);
    if(v==null)el('line',{x1:x+bw/2,x2:x+bw/2,y1:0,y2:H-B,stroke:'var(--mark-gray)','stroke-dasharray':'2 3'},svg);
    r.addEventListener('mousemove',e=>{const bb=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=`<b>${y}</b><br>${v==null?'mätning saknas':grad(v)+` (${v-base>=0?'+':'−'}${fmt(Math.abs(v-base),1)} mot 1961–1990)`}`;tp.style.left=(e.clientX-bb.left)+'px';tp.style.top=(e.clientY-bb.top-8)+'px'});
    r.addEventListener('mouseleave',()=>tp.hidden=true);
    if(y%(W<500?50:20)===0){const t=el('text',{x:x+bw/2,y:H-4,'text-anchor':'middle'},svg);t.textContent=y}}
  $('#ve-str-span').textContent=`${y0}–${y1}`;
}
function renderVeCharts(){
  const pts=VE.ar.map(r=>[r[0],r[1]]);const m=new Map(pts);
  const roll=[];for(let y=VE.ar[0][0]+9;y<=VE.ar[VE.ar.length-1][0];y++){const w=[];for(let k=y-9;k<=y;k++)if(m.has(k))w.push(m.get(k));if(w.length>=8&&m.has(y))roll.push([y,w.reduce((a,b)=>a+b,0)/w.length])}
  lineChart($('#ve-ar'),[{name:'Årsmedel',color:'var(--mark-gray)',nolabel:true,pts},{name:'Medel för tio år',color:'var(--accent)',pts:roll}],{yfmt:v=>fmt(v,1)+'°'});
  const mk=(arr)=>arr.map((v,i)=>[i+1,v]);
  lineChart($('#ve-man'),[{name:'1991–2020',color:'var(--accent)',pts:mk(VE.normal_1991)},{name:'1961–1990',color:'var(--second)',nolabel:true,pts:mk(VE.normal_1961)},{name:'1861–1890',color:'var(--ink2)',dash:'5 4',nolabel:true,pts:mk(VE.normal_1861)}],{yfmt:v=>{const r=Math.round(v);return (r===0?'0':fmt(r,0))+'°'},xlab:x=>MAN_K[x-1]});
}
function renderVe(){
  const R=VE.rekord,a=VE.ar,base=veBase();const mean=(p0,p1)=>{const r=a.filter(x=>x[0]>=p0&&x[0]<=p1);return r.reduce((s,x)=>s+x[1],0)/r.length};
  const tidig=mean(1861,1890),sen=mean(a[a.length-1][0]-9,a[a.length-1][0]);const I=VE.i_ar;
  const diffI=I.medel-I.normal;const iTxt=Math.abs(diffI)<0.3?'ungefär som normalt':diffI>0?`${fmt(diffI,1)} grader varmare än normalt`:`${fmt(-diffI,1)} grader kallare än normalt`;
  $('#ve-kpis').innerHTML=[
    ['Värmerekord',grad(R.max[0]),dagTxt(R.max[1])],['Köldrekord',grad(R.min[0]),dagTxt(R.min[1])],
    ['Varmaste året',String(R.varmast_ar[0]),`medeltemperatur ${grad(R.varmast_ar[1])}`],
    [`${VE.senaste_dag.slice(0,4)} hittills`,grad(I.medel),`jan–${MAN_K[I.manader-1]}, ${iTxt}`]].map(([l,v,s])=>`<div class="stat"><span class="label">${esc(l)}</span><span class="v num">${v}</span><span class="s">${esc(s)}</span></div>`).join('');
  $('#ve-lead').textContent=`SMHI har mätt temperaturen i Örebro varje dag sedan december 1858. Under de senaste tio åren (${a[a.length-1][0]-9}–${a[a.length-1][0]}) var årets medeltemperatur ${grad(sen)}, jämfört med ${grad(tidig)} under 1861–1890. Det är ${fmt(sen-tidig,1)} grader varmare.`;
  $('#ve-just').textContent=fmt(VE.justering,2);
  renderVeStripes();renderVeCharts();
  // senaste 13 månaderna
  const rows=VE.senaste_man.map(([ym,v])=>({n:`${MAN_K[+ym.slice(5)-1]} ${ym.slice(0,4)}`,v:v-VE.normal_1991[+ym.slice(5)-1],t:v}));
  dbars($('#ve-senaste'),rows,{fmtv:v=>(v>0?'+':v<0?'−':'±')+fmt(Math.abs(v),1)+'°',max:Math.max(2,...rows.map(r=>Math.abs(r.v)))});
  document.querySelectorAll('#ve-senaste .dbar').forEach((d,i)=>d.title=`${rows[i].n}: ${grad(rows[i].t)}, normalt ${grad(VE.normal_1991[+VE.senaste_man[i][0].slice(5)-1])}`);
  // vit jul
  const years=Object.keys(VE.per_ar).map(Number).filter(y=>y>=1947);const yMax=Math.max(...years);
  const cells=[];let vit=0,n=0;for(let y=1947;y<=yMax;y++){const v=VE.per_ar[y]?.vitjul;if(v!=null){n++;if(v>=1)vit++}cells.push({y,v})}
  const dec={};cells.forEach(c=>{if(c.v==null)return;const d=Math.floor(c.y/10)*10;dec[d]=dec[d]||[0,0];dec[d][1]++;if(c.v>=1)dec[d][0]++});
  const cm=new Map(cells.map(c=>[c.y,c.v]));let rader='';
  for(let d=1940;d<=yMax;d+=10){rader+=`<span class="lab">${d}</span>`;for(let y=d;y<d+10;y++){if(y<1947||y>yMax){rader+='<span class="tom"></span>';continue}const v=cm.get(y);rader+=`<span class="${v==null?'na':v>=1?'vit':'gron'}" title="${y}: ${v==null?'mätning saknas':v>=1?v+' cm snö':'ingen snö'}"></span>`}}
  $('#ve-jul').innerHTML=`<div class="ve-jul">${rader}</div>
    <p class="small" style="margin-top:8px">${Object.entries(dec).map(([d,[v,t]])=>`${d}-talet ${v} av ${t}`).join(' · ')}</p>`;
  $('#ve-jul-n').textContent=`${vit} av ${n} år med mätning`;
  // år-väljare
  const ys=Object.keys(VE.per_ar).map(Number).sort((a,b)=>b-a);
  $('#ve-ar-sel').innerHTML=ys.map(y=>`<option>${y}</option>`).join('');$('#ve-ar-sel').value=String(ys.find(y=>VE.per_ar[y].max&&VE.ar.some(r=>r[0]===y))||ys[0]);
  $('#ve-ar-sel').addEventListener('change',renderVeAr);renderVeAr();
  const d=$('#ve-dag');d.max=VE.senaste_dag;d.addEventListener('change',visaDag);
}
function renderVeAr(){
  const y=+$('#ve-ar-sel').value;const o=VE.per_ar[y]||{};const am=VE.ar.find(r=>r[0]===y);
  const rank=am?VE.ar.filter(r=>r[1]>am[1]).length+1:null;const nY=VE.ar.length;
  const rows=[];
  if(am)rows.push(['Medeltemperatur',grad(am[1],1),`plats ${rank} av ${nY} år räknat från varmaste`]);
  if(o.max)rows.push(['Varmaste dagen',grad(o.max[0]),dagTxt(o.max[1])]);
  if(o.min)rows.push(['Kallaste dagen',grad(o.min[0]),dagTxt(o.min[1])]);
  if(o.sommardagar!=null)rows.push(['Sommardagar',fmt(o.sommardagar),`dagar med minst 25 °C${o.hetta?`, varav ${o.hetta} med minst 30 °C`:''}`]);
  if(o.tropiska)rows.push(['Tropiska nätter',fmt(o.tropiska),'nätter då det inte blev kallare än 20 °C']);
  if(o.frost!=null)rows.push(['Frostdygn',fmt(o.frost),'dygn då temperaturen gick under 0 °C']);
  if(o.neder!=null)rows.push(['Nederbörd',fmt(o.neder)+' mm',o.blotast?`blötast ${dagTxt(o.blotast[1])} med ${fmt(o.blotast[0],1)} mm`:'']);
  if(o.vitjul!=null)rows.push(['Julen',o.vitjul>=1?'Vit jul':'Grön jul',o.vitjul>=1?`${o.vitjul} cm snö på juldagens morgon`:'ingen snö på juldagens morgon']);
  $('#ve-ar-info').innerHTML=rows.length?`<table class="mini"><tbody>${rows.map(r=>`<tr><td>${r[0]}<span class="sub">${esc(r[2])}</span></td><td class="r">${r[1]}</td></tr>`).join('')}</tbody></table>`+(y===+VE.senaste_dag.slice(0,4)?`<p class="src">Året är inte slut. Siffrorna gäller till och med ${dagTxt(VE.senaste_dag)}.</p>`:''):'<p class="small">Inga fullständiga mätningar det här året.</p>';
}
async function visaDag(){
  const v=$('#ve-dag').value;const box=$('#ve-dag-info');if(!v)return;
  if(v<'1858-12-01'||v>VE.senaste_dag){box.innerHTML=`<p class="small">Mätningarna finns från 1 december 1858 till ${dagTxt(VE.senaste_dag)}.</p>`;return}
  if(!VED){box.innerHTML='<p class="loading">Hämtar mätningar …</p>';try{VED=await load('vader_dagar')}catch(e){box.innerHTML='<p class="small">Kunde inte hämta dagsvärdena.</p>';return}}
  const s0=Date.UTC(1858,11,1),[Y,M,D]=v.split('-').map(Number);const i=Math.round((Date.UTC(Y,M-1,D)-s0)/864e5);
  const g=(k,f=10)=>VED[k][i]==null?null:VED[k][i]/f;const t=g('t'),tn=g('tn'),tx=g('tx'),p=g('p'),s=g('s',1);
  // samma datum alla år
  const same=[];for(let y=1859;y<=+VE.senaste_dag.slice(0,4);y++){const j=Math.round((Date.UTC(y,M-1,D)-s0)/864e5);if(j>=0&&j<VED.t.length&&VED.t[j]!=null&&!(M===2&&D===29&&y%4))same.push([y,VED.t[j]/10])}
  let jmf='';if(t!=null&&same.length>20){const kall=same.filter(x=>x[1]<t).length;const p=Math.round(kall/(same.length)*100);const w=same.reduce((a,b)=>b[1]>a[1]?b:a),c=same.reduce((a,b)=>b[1]<a[1]?b:a);
    const dn=`${D} ${MANAD[M-1]}`;const forsta=`sedan ${same[0][0]}`;
    const omd=w[0]===Y?`Det var den varmaste ${dn} ${forsta}.`:c[0]===Y?`Det var den kallaste ${dn} ${forsta}.`:`Dagen var varmare än ${p} % av alla ${dn} ${forsta}.`;
    jmf=`<p class="small" style="margin-top:8px">${omd} ${w[0]===Y?'':`Varmast var ${dn} ${w[0]} (${grad(w[1])}). `}${c[0]===Y?'':`Kallast var ${dn} ${c[0]} (${grad(c[1])}).`}</p>`}
  const rows=[['Medeltemperatur',grad(t)],['Högsta temperatur',grad(tx)],['Lägsta temperatur',grad(tn)],['Nederbörd',p==null?'–':fmt(p,1)+' mm'],['Snödjup på morgonen',s==null?'–':fmt(s)+' cm']];
  box.innerHTML=`<h4 style="margin:4px 0 6px;font-family:var(--f-display);font-weight:500">${dagTxt(v)}</h4><table class="mini"><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')}</tbody></table>${jmf}<p class="src">${v<'2005-07-01'?'Temperatur från stationen i Örebro stad.':'Temperatur från Örebro flygplats.'} ”–” betyder att mätning saknas.</p>`;
}


/* ===== Handeln ===== */
let HD,hdK='N52004',hdB='el';
const hdF=(k,v)=>v==null?'–':k.enhet==='mkr'?(v>=1000?fmt(v/1000,1)+' mdr kr':fmt(v)+' mkr'):k.enhet==='%'?fmt(v,k.dec)+' %':fmt(v,k.dec);
function hdAndel(kod,y,typ){const r=HD.bilar[kod]?.[y];if(!r)return null;const t=Object.values(r).reduce((a,b)=>a+b,0);if(t<50)return null;const n=(r['120']||0)+(typ==='ladd'?(r['140']||0):0);return n/t*100}
function renderHdCmp(){
  const k=HD.kpis.find(x=>x.id===hdK);document.querySelectorAll('#hd-chips .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===hdK));
  const ys=Object.keys(k.data['1880']);const y=ys[ys.length-1];
  $('#hd-title').textContent=k.titel;$('#hd-year').textContent=y;$('#hd-desc').textContent=k.beskr[0].toUpperCase()+k.beskr.slice(1)+'.';
  const rows=Object.keys(HD.kommuner).filter(c=>k.data[c]&&k.data[c][y]!=null).map(c=>({n:HD.kommuner[c],v:k.data[c][y],cls:c==='1880'?'hl':c==='0000'?'ref':''}));
  if(k.enhet==='index'&&!rows.some(r=>r.cls==='ref'))rows.push({n:'Jämnt (100)',v:100,cls:'ref'});
  hbars($('#hd-cmp'),rows.sort((a,b)=>b.v-a.v),{fmtv:v=>hdF(k,v)});
  const ser=[{name:'Örebro',color:'var(--accent)',pts:Object.entries(k.data['1880']).map(([y,v])=>[+y,v])}];
  if(k.data['0000'])ser.push({name:'Hela Sverige',color:'var(--ink2)',dash:'5 4',pts:Object.entries(k.data['0000']).map(([y,v])=>[+y,v]).filter(p=>ser[0].pts.some(q=>q[0]===p[0]))});
  $('#hd-leg').innerHTML=`<span><i class="sw" style="background:var(--accent)"></i>Örebro</span>`+(k.data['0000']?`<span><i class="sw" style="background:var(--ink2)"></i>Hela Sverige</span>`:'');
  lineChart($('#hd-line'),ser,{yfmt:v=>k.enhet==='mkr'?fmt(v/1000,1)+' mdr':fmt(v,k.dec)});
}
function renderHdMap(){
  const host=$('#hd-map');host.innerHTML='';if(!OM){host.innerHTML='<p class="small">Kartan kräver områdesdatan.</p>';return}
  const H=HD.handelsomraden;const bx=H.map(h=>pathBox(h.svg));const cx=[Math.min(...bx.map(b=>b[0])),Math.min(...bx.map(b=>b[1])),Math.max(...bx.map(b=>b[2])),Math.max(...bx.map(b=>b[3]))];
  const pad=Math.max(cx[2]-cx[0],cx[3]-cx[1])*.12;let vb=[cx[0]-pad,cx[1]-pad,cx[2]-cx[0]+2*pad,cx[3]-cx[1]+2*pad];if(vb[2]<vb[3]){vb[0]-=(vb[3]-vb[2])/2;vb[2]=vb[3]}else{vb[1]-=(vb[2]-vb[3])/2;vb[3]=vb[2]}
  const svg=el('svg',{viewBox:vb.join(' '),role:'img','aria-label':'Karta över handelsområdena i Örebro'},host);svg.style.overflow='hidden';
  const sc=vb[2]/Math.max(280,svg.getBoundingClientRect().width||400);const tp=tip(host);
  OM.omraden.forEach(o=>el('path',{d:o.svg,fill:'var(--surface)',stroke:'var(--mark-gray)','stroke-width':1,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},svg));
  H.forEach(h=>{const p=el('path',{d:h.svg,fill:'var(--accent)',stroke:'var(--accent)','stroke-width':2,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},svg);
    p.addEventListener('mousemove',e=>{const bb=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=`<b>${esc(h.omr_namn||h.kod)}</b><br>${fmt(h.anstallda)} anställda i handeln<br>${fmt(h.arbetsstallen)} arbetsställen · ${fmt(h.hektar)} hektar`;tp.style.left=(e.clientX-bb.left)+'px';tp.style.top=(e.clientY-bb.top-8)+'px'});
    p.addEventListener('mouseleave',()=>tp.hidden=true)});
  H.filter(h=>h.anstallda>=300).forEach(h=>{const t=el('text',{x:h.lx,y:h.ly-10*sc,'text-anchor':'middle',class:'lbl',style:`font:600 ${13*sc}px var(--f-body);fill:var(--ink);paint-order:stroke;stroke:var(--surface);stroke-width:${4*sc}px;stroke-linejoin:round`},svg);t.textContent=h.omr_namn})
}
function renderHdBil(){
  document.querySelectorAll('#hd-bil-chips .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.b===hdB));
  const yrs=Object.keys(HD.bilar['1880']).map(Number).filter(y=>y>=2010);
  const ser=[{name:'Örebro',color:'var(--accent)',pts:yrs.map(y=>[y,hdAndel('1880',y,hdB)]).filter(p=>p[1]!=null)},{name:'Hela Sverige',color:'var(--ink2)',dash:'5 4',pts:yrs.map(y=>[y,hdAndel('0000',y,hdB)]).filter(p=>p[1]!=null)}];
  lineChart($('#hd-bil'),ser,{yfmt:v=>fmt(v,0)+' %',minZero:true});
  const sm=HD.bilar_sista_manad;const ly=+sm.slice(0,4);const lm=+sm.slice(5);
  $('#hd-bil-note').textContent=`Andel av alla nyregistrerade personbilar. ${ly}: januari–${MANAD[lm-1]}. Laddhybrider har både elmotor och bensin- eller dieselmotor och kan laddas från elnätet.`;
  const lab=hdB==='el'?'Elbilar':'El + laddhybrider';const yy=lm>=6?ly:ly-1;
  $('#hd-bil2-title').textContent=`${lab} av nya bilar ${yy}${yy===ly?` (jan–${MAN_K[lm-1]})`:''}`;
  hbars($('#hd-bil2'),Object.keys(HD.kommuner).map(c=>({n:HD.kommuner[c],v:hdAndel(c,yy,hdB),cls:c==='1880'?'hl':c==='0000'?'ref':''})).filter(r=>r.v!=null).sort((a,b)=>b.v-a.v),{fmtv:v=>fmt(v,0)+' %',max:100});
}
function initHd(){
  const g=id=>HD.kpis.find(k=>k.id===id);const L=(k,m='1880')=>{const d=k?.data[m];if(!d)return null;const ys=Object.keys(d);return {y:ys[ys.length-1],v:d[ys[ys.length-1]]}};
  const si=L(g('N52004')),di=L(g('N52002')),ss=L(g('N52003')),ds=L(g('N52001'));
  const sm=HD.bilar_sista_manad,ly=+sm.slice(0,4),lm=+sm.slice(5);const el_=hdAndel('1880',ly,'el'),elR=hdAndel('0000',ly,'el');
  const tiles=[['Sällanköpsvaror',fmt(si.v),`försäljningsindex ${si.y} · 100 = jämnt`],['Dagligvaror',fmt(di.v),`försäljningsindex ${di.y} · 100 = jämnt`],
    ['Såldes i Örebros butiker',fmt((ss.v+ds.v)/1000,1)+' mdr kr',`${ss.y}, sällanköps- och dagligvaror`],['Nya bilar som är elbilar',fmt(el_,0)+' %',`jan–${MAN_K[lm-1]} ${ly} · hela Sverige ${fmt(elR,0)} %`]];
  $('#hd-kpis').innerHTML=tiles.map(([l,v,s])=>`<div class="stat"><span class="label">${esc(l)}</span><span class="v num">${v}</span><span class="s">${esc(s)}</span></div>`).join('');
  const top=HD.handelsomraden[0];
  $('#hd-lead').textContent=`För varje hundralapp som örebroarna själva kan väntas lägga på kläder, elektronik, möbler och andra sällanköpsvaror säljer butikerna i Örebro för ${fmt(si.v)} kronor ${si.y}. Skillnaden kommer i praktiken från kunder som bor utanför kommunen. Maten handlar örebroarna däremot i stort sett lokalt (index ${fmt(di.v)}). Störst är handelsområdet i ${top.omr_namn} med ${fmt(top.anstallda)} anställda.`;
  $('#hd-chips').innerHTML=HD.kpis.map(k=>`<button class="chip" data-id="${k.id}" aria-pressed="false">${esc(k.titel)}</button>`).join('');
  $('#hd-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){hdK=b.dataset.id;renderHdCmp()}});
  $('#hd-bil-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){hdB=b.dataset.b;renderHdBil()}});
  $('#hd-ho-ar').textContent=`SCB ${HD.handelsomraden_ar}`;
  hbars($('#hd-ho'),HD.handelsomraden.map(h=>({n:h.omr_namn||h.kod,v:h.anstallda,cls:'hl'})),{fmtv:v=>fmt(v)});
  renderHdCmp();renderHdMap();renderHdBil();
}

/* ===== Restaurangkollen ===== */
let RK,rkTyp=()=>{},rkGrp='Restaurang och café',rkSel=null,rkZoom='stad',rkQ='',rkOmr=null;
const RK_TYP={Restaurang:'Restaurang',Café:'Café',Pizzeria:'Pizzeria',Butik:'Butik',Tillagning:'Kök i skola, vård eller omsorg',Buffert:'Producent, distributör eller annat'};
const RK_ORD=['A','K','Å','S','U'];
const rkDatum=d=>{const [y,m,dd]=d.split('-');return `${+dd} ${MON[+m-1]} ${y}`};
const rkNorm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-̧̃]/g,'').normalize('NFC');
function rkRes(k){return k.res?k.res.split(',').filter(Boolean).map(s=>({nr:s.slice(0,3),c:s.slice(3)})):[]}
function rkFilter(){
  const q=rkNorm(rkQ.trim());
  return RK.verksamheter.filter(v=>(rkGrp==='Alla'||RK.grupper[v.t]===rkGrp)&&(!rkOmr||v.o===rkOmr)&&(!q||v._s.includes(q)));
}
function rkPills(res){
  const n={};res.forEach(r=>n[r.c]=(n[r.c]||0)+1);
  return RK_ORD.filter(c=>n[c]).map(c=>`<span class="rk-pill rk-${c==='Å'?'O':c}">${n[c]} ${esc(RK.koder[c])}</span>`).join('');
}
function renderRkList(){
  const rows=rkFilter();const max=60;
  $('#rk-count').textContent=`${fmt(rows.length)} träffar`;
  $('#rk-list').innerHTML=rows.length?rows.slice(0,max).map(v=>{const s=v.k[0];
    return `<li><button type="button" data-id="${v.id}" aria-pressed="${v.id===rkSel}"><b>${esc(v.n)}</b><span>${v.h?'Adress visas inte':esc(v.a||'')}${s?` · senast kontrollerad ${rkDatum(s.d)}`:' · ingen kontroll visas'}</span></button></li>`}).join('')
    +(rows.length>max?`<li class="more small">Visar ${max} av ${fmt(rows.length)}. Sök på namn eller gata för att hitta fler.</li>`:'')
    :'<li class="more small">Inga verksamheter matchar sökningen.</li>';
  renderRkMap(rows);
}
function renderRkMap(rows){
  const host=$('#rk-map');host.innerHTML='';if(!OM){host.innerHTML='<p class="small">Kartan kräver områdesdatan.</p>';return}
  rows=rows||rkFilter();
  const vb=rkZoom==='stad'&&omBox.stad?omBox.stad:[0,0,OM.karta.w,OM.karta.h];
  const svg=el('svg',{viewBox:vb.join(' '),role:'img','aria-label':'Karta över livsmedelsverksamheterna'},host);svg.style.overflow='hidden';
  const sc=vb[2]/Math.max(280,svg.getBoundingClientRect().width||host.clientWidth||500);const tp=tip(host);
  OM.omraden.forEach(o=>el('path',{d:o.svg,fill:'var(--surface)',stroke:'var(--mark-gray)','stroke-width':1,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'},svg));
  const g=el('g',{},svg);
  rows.filter(v=>v.x!=null&&v.id!==rkSel).forEach(v=>{const c=el('circle',{cx:v.x,cy:v.y,r:4*sc,class:'rk-pt'},g);
    c.addEventListener('mousemove',e=>{const bb=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=`<b>${esc(v.n)}</b><br>${esc(v.a||'')}`;tp.style.left=(e.clientX-bb.left)+'px';tp.style.top=(e.clientY-bb.top-8)+'px'});
    c.addEventListener('mouseleave',()=>tp.hidden=true);c.addEventListener('click',()=>rkVal(v.id,true))});
  const s=RK.verksamheter.find(v=>v.id===rkSel);
  if(s&&s.x!=null){el('circle',{cx:s.x,cy:s.y,r:7*sc,class:'rk-sel'},svg);
    const t=el('text',{x:s.x,y:s.y-11*sc,'text-anchor':'middle',style:`font:600 ${13*sc}px var(--f-body);fill:var(--ink);paint-order:stroke;stroke:var(--surface);stroke-width:${4*sc}px;stroke-linejoin:round`},svg);t.textContent=s.n}
}
function rkVal(id,scroll){
  rkSel=id;const v=RK.verksamheter.find(x=>x.id===id);if(!v)return;
  document.querySelectorAll('#rk-list button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id));
  const omr=v.o&&RK.omraden[v.o];const pk=RK.punkter;
  let first=true;
  const ktr=v.k.map(k=>{const res=rkRes(k);
    const head=`<span class="rk-d">${rkDatum(k.d)}</span><span class="rk-r">${esc(k.r)}${k.p?'':k.an?' · anmäld':' · oanmäld'}</span>`;
    if(k.p)return `<div class="rk-k"><div class="rk-kh">${head}</div><p class="small">Handläggning pågår. Kommunen visar resultatet fyra veckor efter kontrollen.</p></div>`;
    if(!res.length)return `<div class="rk-k"><div class="rk-kh">${head}</div><p class="small">Kommunen visar inga kontrollpunkter för den här kontrollen.</p></div>`;
    const rader=res.slice().sort((a,b)=>RK_ORD.indexOf(a.c)-RK_ORD.indexOf(b.c)||a.nr.localeCompare(b.nr)).map(r=>{const p=pk[r.nr]||['',''];
      return `<tr><td>${esc(p[0])}<span class="sub">${esc(r.nr)} · ${esc(p[1])}</span></td><td class="rk-res"><span class="rk-dot rk-${r.c==='Å'?'O':r.c}"></span>${esc(RK.koder[r.c]||r.c)}</td></tr>`}).join('');
    const op=first;first=false;
    return `<details class="rk-k"${op?' open':''}><summary><span class="rk-kh">${head}</span><span class="rk-pills">${rkPills(res)}</span></summary>
      <div class="tablewrap"><table><thead><tr><th>Kontrollpunkt</th><th>Resultat</th></tr></thead><tbody>${rader}</tbody></table></div></details>`}).join('');
  const sen=v.k[0];
  $('#rk-det').innerHTML=`<div class="rk-top">
      <div><h3>${esc(v.n)}</h3><p class="small">${v.h?'Hemlik miljö, adressen visas inte':esc(v.a||'')} · ${esc(RK_TYP[v.t]||v.t)}${v.reg?` · registrerad ${rkDatum(v.reg)}`:''}</p></div>
      <div class="rk-sen"><span class="label">Senast kontrollerad</span><span class="v num">${sen?rkDatum(sen.d):'–'}</span><span class="s">${sen?esc(sen.r):'Kommunen visar ingen kontroll ännu'}</span></div>
    </div>
    ${ktr||''}
    <p class="src">${v.k.length?`${v.k.length} ${v.k.length===1?'kontroll':'kontroller'} visas. `:''}<a href="${esc(RK.sida+v.id)}" target="_blank" rel="noopener">Se verksamheten hos Örebro kommun</a>${omr?` · Ligger i <a href="omrade.html#${v.o}">${esc(omr)}</a>`:''}</p>`;
  renderRkMap();
  if(scroll)$('#rk-det').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function initRk(){
  RK.verksamheter.forEach(v=>v._s=rkNorm(v.n+' '+(v.a||'')));
  const V=RK.verksamheter,alla=V.flatMap(v=>v.k.map(k=>({...k,t:v.t}))),medRes=alla.filter(k=>k.res);
  const rest=V.filter(v=>RK.grupper[v.t]==='Restaurang och café').length;
  const oanm=medRes.filter(k=>!k.an).length/medRes.length*100;
  const utan=medRes.filter(k=>rkRes(k).every(r=>r.c!=='A'&&r.c!=='K')).length/medRes.length*100;
  const tiles=[['Livsmedelsverksamheter',fmt(V.length),`varav ${fmt(rest)} restauranger, kaféer och pizzerior`],['Kontroller som visas',fmt(alla.length),`de senaste sex åren, högst tio per verksamhet`],
    ['Oanmälda kontroller',fmt(oanm,0)+' %','av kontrollerna med resultat'],['Utan anmärkning',fmt(utan,0)+' %',`av ${fmt(medRes.length)} kontroller: ingen Avvikelse och inget som Kvarstår`]];
  $('#rk-kpis').innerHTML=tiles.map(([l,v,s])=>`<div class="stat"><span class="label">${esc(l)}</span><span class="v num">${v}</span><span class="s">${esc(s)}</span></div>`).join('');
  $('#rk-lead').textContent=`Kommunens miljöavdelning kontrollerar Örebros ${fmt(V.length)} livsmedelsverksamheter, från pizzerior och kaféer till butiker och skolkök. Här ser du när varje verksamhet senast kontrollerades och vad kommunen noterade, med kommunens egna ord. Vi sätter inga egna betyg.`;
  const grp=['Restaurang och café','Butik','Skola, vård och omsorg','Producenter, distributörer och övrigt','Alla'];
  $('#rk-grp').innerHTML=grp.map(g=>`<button class="chip" data-g="${g}" aria-pressed="${g===rkGrp}">${esc(g)}</button>`).join('');
  $('#rk-grp').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;rkGrp=b.dataset.g;document.querySelectorAll('#rk-grp .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));renderRkList();rkTyp()});
  const mk=rkOmr||miHamta();
  if(mk&&RK.omraden[mk]){const c=$('#rk-omr');c.hidden=false;
    c.innerHTML=`<button class="chip" data-o="" aria-pressed="${!rkOmr}">Hela kommunen</button><button class="chip" data-o="${mk}" aria-pressed="${rkOmr===mk}">${mk===miHamta()?'Mitt område: ':''}${esc(RK.omraden[mk])}</button>`;
    c.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;rkOmr=b.dataset.o||null;c.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b));renderRkList()})}
  let tmo;$('#rk-q').addEventListener('input',e=>{clearTimeout(tmo);tmo=setTimeout(()=>{rkQ=e.target.value;renderRkList()},120)});
  $('#rk-list').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)rkVal(b.dataset.id,true)});
  $('#rk-zoom').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;rkZoom=b.dataset.z;document.querySelectorAll('#rk-zoom .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));renderRkMap()});
  // vad kontrollerna hittar: antal avvikelser per kontrollpunkt
  const n={},kontr={};medRes.forEach(k=>rkRes(k).forEach(r=>{kontr[r.nr]=(kontr[r.nr]||0)+1;if(r.c==='A')n[r.nr]=(n[r.nr]||0)+1}));
  const tot=Object.values(n).reduce((a,b)=>a+b,0);
  $('#rk-top-desc').textContent=`Kontrollpunkterna där kommunen oftast noterade Avvikelse, som andel av alla ${fmt(tot)} avvikelser i kontrollerna som visas.`;
  hbars($('#rk-top'),Object.entries(n).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([nr,c])=>({n:`${(RK.punkter[nr]||[nr])[0]}`,v:c/tot*100,cls:'hl'})),{fmtv:v=>fmt(v,0)+' %'});
  // andel planerade kontroller helt utan avvikelse per grupp
  const gr=grp.slice(0,4).map(g=>{const ks=medRes.filter(k=>RK.grupper[k.t]===g&&/planerad/i.test(k.r));return {n:g,v:ks.length?ks.filter(k=>rkRes(k).every(r=>r.c!=='A'&&r.c!=='K')).length/ks.length*100:null,cnt:ks.length}}).filter(r=>r.v!=null);
  rkTyp=()=>hbars($('#rk-typ'),gr.map(r=>({n:r.n,v:r.v,cls:r.n===rkGrp?'hl':''})),{fmtv:v=>fmt(v,0)+' %',max:100});rkTyp();
  $('#rk-typ-note').textContent='Antal planerade kontroller: '+gr.map(r=>`${r.n.toLowerCase()} ${fmt(r.cnt)}`).join(', ')+`. Kommunens uppgifter hämtade ${rkDatum(RK.uppdaterad)}.`;
  renderRkList();
}

async function load(name){const r=await fetch('data/'+name+'.json');if(!r.ok)throw new Error(name);return r.json()}

/* ===== Var finns leverantörerna? (Bolagsverkets grunddata) ===== */
let LOK,lokPens='utan';
const LOK_G=[['kommun','Örebro kommun','var(--accent)','#fff'],['lan','Övriga Örebro län','var(--second)','#fff'],['sverige','Övriga Sverige','var(--mark-gray)','var(--ink)'],
  ['off','Myndigheter, regioner och kommuner','var(--q2)','var(--ink)'],['okand','Ort saknas','var(--line)','var(--ink2)'],['utland','Utlandet','var(--ink2)','var(--bg)']];
const lokGrupp=x=>(LOK.ort[x.o||x.n]||['okand'])[0];
const lokMed=x=>lokPens==='med'||!LOK.pension.includes(x.o);
function renderLokal(){
  if(!LOK||!P)return;
  const p=P.perioder.find(x=>x.id===per);const I=p.i;
  document.querySelectorAll('#lok-pens .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===lokPens));
  const sum={};let tot=0,pens=0;
  P.leverantorer.forEach(x=>{const v=I.reduce((s,i)=>s+x.m[i],0);if(!lokMed(x)){pens+=v;return}const g=lokGrupp(x);sum[g]=(sum[g]||0)+v;tot+=v});
  const G=LOK_G.filter(([g])=>sum[g]>0);const pc=g=>sum[g]/tot*100;
  $('#lok-per').textContent=p.label;
  $('#lok-bar').setAttribute('aria-label',G.map(([g,n])=>`${n} ${fmt(pc(g),0)} %`).join(', '));
  $('#lok-bar').innerHTML=G.map(([g,n,c,tc])=>`<span style="width:${pc(g)}%;background:${c};color:${tc}" title="${esc(n)}: ${fmt(pc(g),1)} %">${pc(g)>=7?fmt(pc(g),0)+' %':''}</span>`).join('');
  $('#lok-leg').innerHTML=G.map(([g,n,c])=>`<div><i class="sw" style="background:${c}"></i><span>${esc(n)}</span><b class="num">${fmt(pc(g),1)} %</b><span class="small num">${fmt(sum[g]/1000,0)} mkr</span></div>`).join('');
  const kom=pc('kommun'),lan=pc('lan')||0;
  $('#lok-lead').textContent=`${p.label}: av kommunens köp${lokPens==='utan'?' (utan pensionsavgifter)':''} gick ${fmt(kom,0)} % till företag och föreningar med adress i Örebro kommun och ${fmt(lan,0)} % till övriga länet. ${fmt(pc('sverige'),0)} % gick till leverantörer med adress i resten av Sverige, där många har verksamhet i Örebro trots att huvudkontoret ligger någon annanstans.${lokPens==='utan'?` Pensionsavgifterna till KPA, ${fmt(pens/1000,0)} mkr, är inte med.`:''}`;
  const rad=g=>P.leverantorer.filter(x=>lokMed(x)&&g(lokGrupp(x))).map(x=>({x,v:I.reduce((s,i)=>s+x.m[i],0)})).sort((a,b)=>b.v-a.v).slice(0,10);
  hbars($('#lok-top-kom'),rad(g=>g==='kommun').map(({x,v})=>({n:x.n,v:v/1000,cls:'hl'})),{fmtv:v=>fmt(v,1)+' mkr'});
  hbars($('#lok-top-ut'),rad(g=>g==='sverige'||g==='utland').map(({x,v})=>({n:`${x.n} (${(LOK.ort[x.o]||['',''])[1]})`,v:v/1000})),{fmtv:v=>fmt(v,1)+' mkr'});
  const mon=P.months.map((m,i)=>{let t=0,k=0;P.leverantorer.forEach(x=>{if(LOK.pension.includes(x.o))return;const v=x.m[i];t+=v;if(lokGrupp(x)==='kommun')k+=v});return [i,t?k/t*100:0]});
  lineChart($('#lok-man'),[{name:'Örebro kommun',color:'var(--accent)',pts:mon}],{yfmt:v=>fmt(v,0)+' %',xlab:i=>ymLabel(P.months[i]),minZero:true});
}

/* ===== Vart går din skatt? ===== */
let SKT,sktVisa='kr';
function grundavdrag(ffi,pbb){
  // under 66 år, enligt Skatteverkets skikt (andelar av prisbasbeloppet); avrundas uppåt till hela 100-tal
  const b=pbb;let g;
  if(ffi<=0.99*b)g=0.423*b;else if(ffi<=2.72*b)g=0.225*b+0.2*ffi;else if(ffi<=3.11*b)g=0.77*b;else if(ffi<=7.88*b)g=1.081*b-0.1*ffi;else g=0.293*b;
  return Math.min(ffi,Math.ceil(g/100)*100);
}
function renderSkatt(){
  const lon=Math.max(0,+$('#sk-lon').value||0);$('#sk-reglage').value=Math.min(100000,lon);
  const ffi=Math.floor(lon*12/100)*100,ga=grundavdrag(ffi,SKT.pbb),bi=Math.max(0,ffi-ga);
  const kom=bi*SKT.kommun/100/12,reg=bi*SKT.region/100/12;
  $('#sk-kom').textContent=fmt(Math.round(kom))+' kr/mån';$('#sk-reg').textContent=fmt(Math.round(reg))+' kr/mån';
  $('#sk-kom-s').textContent=`${fmt(SKT.kommun,2)} % av ${fmt(Math.round(bi/12))} kr, din lön efter grundavdraget · ${fmt(Math.round(kom*12))} kr om året`;
  $('#sk-exempel').hidden=lon!==35000;
  document.querySelectorAll('#sk-visa .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===sktVisa));
  const max=Math.max(...SKT.delar.map(d=>d.kr));
  $('#sk-lista').innerHTML=SKT.delar.map(d=>{const andel=d.kr/SKT.total_kr_inv;const v=sktVisa==='kr'?fmt(Math.round(kom*andel))+' kr':fmt(andel*100,andel<.1?1:0)+' kr';
    return `<div class="sk-rad${d.n==='Övrigt'?' ovr':''}"><div class="sk-namn"><b>${esc(d.n)}</b><span>${esc(d.b)}</span></div><div class="sk-bar"><span style="width:${Math.max(0,d.kr)/max*100}%"></span></div><div class="sk-v num">${v}</div></div>`}).join('');
  $('#sk-src').textContent=`Fördelningen bygger på kommunens nettokostnader ${SKT.kostnad_ar}, sammanlagt ${fmt(SKT.total_kr_inv)} kr per invånare (Kolada). Skattesatser ${SKT.skatt_ar}: kommunen ${fmt(SKT.kommun,2)} %, regionen ${fmt(SKT.region,2)} %.`;
}
function initSkatt(){
  const lon=$('#sk-lon'),reg=$('#sk-reglage');
  lon.addEventListener('input',renderSkatt);reg.addEventListener('input',()=>{lon.value=reg.value;renderSkatt()});
  $('#sk-visa').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){sktVisa=b.dataset.v;renderSkatt()}});
  renderSkatt();
}

/* ===== Örebro som 100 personer ===== */
let HU;
const HU_FARG=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
const HU_GRA=/^(Har inget jobb|Röstade inte|Övriga partier|Övriga hushåll)$/;
function initHundra(){
  $('#hu-lead').textContent=`Örebro kommun hade ${fmt(HU.invanare)} invånare vid slutet av ${HU.ar}. Tänk dig att de vore 100 personer. Så här skulle de se ut.`;
  $('#hu-grid').innerHTML=HU.fragor.map(f=>{let i=0;
    const ut=f.delar.map(([n])=>HU_GRA.test(n));
    const col=f.delar.map(([n],j)=>ut[j]?'transparent':(f.farger&&f.farger[n])||HU_FARG[i++%HU_FARG.length]);
    const prick=j=>ut[j]?'<i class="ut"></i>':`<i style="background:${col[j]}"></i>`;
    const prickar=f.delar.flatMap(([n,k],j)=>Array.from({length:k},()=>prick(j))).join('');
    const leg=f.delar.filter(([,k])=>k>0).map(([n,k,a])=>{const j=f.delar.findIndex(d=>d[0]===n);return `<li><i class="sw${ut[j]?' ut':''}" style="background:${col[j]}"></i><b class="num">${k}</b><span>${esc(n)} <span class="small">(${fmt(a,1)}\u00a0%)</span></span></li>`}).join('');
    return `<article class="panel hu-kort" id="${f.id}"><h2 class="hu-h">${esc(f.fraga)}</h2><p class="small">100 ${esc(f.om)} · ${esc(f.kalla)}</p>
      <div class="hu-prickar" role="img" aria-label="${esc(f.delar.map(([n,k])=>`${k} ${n}`).join(', '))}">${prickar}</div><ul class="hu-leg">${leg}</ul>${f.not?`<p class="src">${esc(f.not)}</p>`:''}</article>`}).join('');
  const k=hashKod();if(k&&document.getElementById(k))requestAnimationFrame(()=>document.getElementById(k).scrollIntoView({block:'start'}));
}

/* ===== Månadens Örebro ===== */
let MA;
const maPer=ym=>{const [y,m]=ym.split('-');return MANAD[+m-1].replace(/^./,c=>c.toUpperCase())+' '+y};
function initManaden(){
  const u=MA.utgavor[0];
  const kort=u.punkter.map(p=>`<a class="panel ma-kort" href="${esc(p.lank)}"><span class="label">${esc(maPer(p.period))}</span><span class="ma-rubrik">${esc(p.rubrik)}</span><p>${esc(p.text)}</p><span class="ma-pil">Läs mer →</span></a>`).join('');
  $('#ma-senaste').innerHTML=`<h2 class="ma-utg" id="u${u.utgava}">Månadens Örebro, ${esc(u.namn)}</h2><p class="small">Uppdaterad ${datumText(u.datum)}</p><div class="ma-grid">${kort}</div>`;
  const ark=MA.utgavor.slice(1);
  if(ark.length){$('#ma-arkiv-wrap').hidden=false;
    $('#ma-arkiv').innerHTML=ark.map(a=>`<details id="u${a.utgava}"><summary>Månadens Örebro, ${esc(a.namn)}</summary><ul>${a.punkter.map(p=>`<li>${esc(p.text)}</li>`).join('')}</ul></details>`).join('')}
}

/* ===== Ladda ner datan ===== */
const TEMA_NAMN={pengar:'Kommunens pengar',befolkning:'Befolkning',omrade:'Områden',jamfor:'Jämför städer',skolor:'Skolor',vard:'Vård och omsorg',handel:'Handeln',restauranger:'Restaurangkollen',vader:'Vädret',valet:'Valet 2026',skatt:'Vart går din skatt?',hundra:'Örebro som 100 personer'};
const kbText=kb=>kb>=1024?fmt(kb/1024,1)+' MB':fmt(Math.max(1,kb))+' kB';
const filRad=(f,kol)=>`<li class="dl-fil"><div><b>${esc(f.titel)}</b><span class="small">${esc(f.beskr)}</span><span class="src">Källa: ${esc(f.kalla)} · ${fmt(f.rader)} rader · ${kbText(f.kb)}</span>${kol?`<details><summary>Kolumner</summary><p class="num small">${f.kolumner.map(esc).join(' · ')}</p></details>`:''}</div><a class="dl-knapp" href="data/csv/${esc(f.fil)}" download>Ladda ner CSV</a></li>`;
async function renderLadda(){
  const box=$('#ladda'),lista=$('#dt-lista');if(!box&&!lista)return;
  let N;try{N=await load('nedladdning')}catch(e){console.error(e);return}
  if(box){const fs=N.filer.filter(f=>f.tema===box.dataset.tema);if(!fs.length)return;
    box.innerHTML=`<div class="panel"><div class="panel-head"><h2 class="sk-h">Ladda ner datan</h2><a class="small" href="data.html">All data på Örebro360 →</a></div><ul class="dl-lista">${fs.map(f=>filRad(f,false)).join('')}</ul><p class="src">CSV för Excel, uppdaterad ${datumText(N.uppdaterad)}. Ange Örebro360 och originalkällan när du använder datan.</p></div>`}
  if(lista){$('#dt-zip-s').textContent=`${N.filer.length} tabeller, ${kbText(N.zip_kb)} packat. Uppdaterad ${datumText(N.uppdaterad)}.`;
    const teman=[...new Set(N.filer.map(f=>f.tema))];
    lista.innerHTML=teman.map(t=>`<div class="panel dl-tema" id="d-${t}"><div class="panel-head"><h2 class="sk-h">${esc(TEMA_NAMN[t]||t)}</h2><a class="small" href="${t==='hundra'?'hundra':t}.html">Till sidan →</a></div><ul class="dl-lista">${N.filer.filter(f=>f.tema===t).map(f=>filRad(f,true)).join('')}</ul></div>`).join('')}
}

/* ===== Menyn: pilar när alla ämnen inte får plats ===== */
(function(){
  const nav=document.querySelector('.meny');if(!nav)return;
  const v=document.querySelector('.meny-pil.vanster'),h=document.querySelector('.meny-pil.hoger');
  const upd=()=>{const max=nav.scrollWidth-nav.clientWidth;v.hidden=nav.scrollLeft<=4;h.hidden=nav.scrollLeft>=max-4};
  v.addEventListener('click',()=>nav.scrollBy({left:-nav.clientWidth*.7}));
  h.addEventListener('click',()=>nav.scrollBy({left:nav.clientWidth*.7}));
  nav.addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);
  const akt=nav.querySelector('[aria-current="page"]');
  if(akt){const l=akt.offsetLeft-nav.offsetLeft;if(l+akt.offsetWidth>nav.clientWidth-40)nav.scrollLeft=l-nav.clientWidth/2+akt.offsetWidth/2}
  upd();if(document.fonts)document.fonts.ready.then(upd);
})();

/* ===== Mitt Örebro: besökarens eget område. Valet sparas bara i webbläsaren (localStorage), aldrig hos oss. ===== */
const MI_NYCKEL='orebro360.omrade';let miMinne=null,MI=null,miVisad=null;
function miHamta(){try{const v=localStorage.getItem(MI_NYCKEL);if(v)return v}catch(e){}return miMinne}
function miSpara(k){miMinne=k;try{localStorage.setItem(MI_NYCKEL,k)}catch(e){}miMeny()}
function miGlom(){miMinne=null;try{localStorage.removeItem(MI_NYCKEL)}catch(e){}miMeny()}
function miMeny(){const a=document.querySelector('.meny a.mitt-lank');if(a)a.classList.toggle('har-val',!!miHamta())}
async function miData(){if(!MI)MI=await load('mitt');return MI}
const miGiltig=k=>!!(k&&MI&&MI.omraden[k]);
const miAvst=x=>x.i?'i ditt område':x.km<1?'under 1 km':'ca '+fmt(x.km,x.km<10?1:0)+' km';
const miStatus=r=>r.p?['vant','Handläggning pågår']:r.avv?['avv',r.avv===1?'1 avvikelse':r.avv+' avvikelser']:['ok','Utan anmärkning'];
const miTag=t=>`<span class="mi-tag">${esc(t)}</span>`;
let miNara=null;   // koder/namn som får märket "Nära dig" på ämnessidorna
async function miNaraLadda(){const k=miHamta();if(!k)return null;try{await miData();const m=MI.omraden[k];if(!m)return null;
  miNara={kod:k,namn:m.namn,skolor:new Set(m.skolor.map(s=>s.c)),vc:new Set(m.vc.map(v=>v.n))};return miNara}catch(e){return null}}

function miKarta(){
  const host=$('#mi-karta');host.innerHTML='';const tp=tip(host);
  const o=OM.omraden.find(x=>x.kod===miVisad),m=o&&MI.omraden[o.kod];
  let vb;
  if(o){const b=o._box,w=b[2]-b[0],h=b[3]-b[1];let pad=Math.max(w,h)*.3+60;let x0=b[0]-pad,y0=b[1]-pad,W=w+2*pad,H=h+2*pad;
    if(W/H<1.25){const nw=H*1.25;x0-=(nw-W)/2;W=nw}else{const nh=W/1.25;y0-=(nh-H)/2;H=nh}vb=[x0,y0,W,H]}
  else vb=omBox.stad;
  const svg=el('svg',{viewBox:vb.map(Math.round).join(' '),role:'img','aria-label':o?'Karta över '+o.namn+' med skolor, vårdcentraler och kontrollerade restauranger':'Karta över Örebros områden. Klicka på ditt område.'},host);
  const sc=vb[2]/Math.max(280,svg.getBoundingClientRect().width||host.clientWidth||480);
  const show=(e,t)=>{const bb=host.getBoundingClientRect();tp.hidden=false;tp.innerHTML=t;tp.style.left=(e.clientX-bb.left)+'px';tp.style.top=(e.clientY-bb.top-8)+'px'};
  OM.omraden.forEach(a=>{const p=el('path',{d:a.svg,class:'mi-a'+(o&&a.kod===o.kod?' mi-a-sel':''),'fill-rule':'evenodd'},svg);
    p.addEventListener('mousemove',e=>show(e,`<b>${esc(a.namn)}</b>${o&&a.kod===o.kod?'':'<br>Klicka för att välja'}`));p.addEventListener('mouseleave',()=>tp.hidden=true);
    p.addEventListener('click',()=>{tp.hidden=true;miValj(a.kod)})});
  if(!o){$('#mi-legend').hidden=true;$('#mi-karta-h').textContent='Klicka på ditt område';$('#mi-karta-s').textContent='eller välj det i listan';return}
  $('#mi-legend').hidden=false;$('#mi-karta-h').textContent=o.namn;$('#mi-karta-s').textContent='och närmaste omgivning';
  const pt=(x,y,cls,r,t)=>{const c=el('circle',{cx:x,cy:y,r:r*sc,class:'mi-pt-'+cls},svg);
    c.addEventListener('mousemove',e=>show(e,t));c.addEventListener('mouseleave',()=>tp.hidden=true)};
  const sp=Object.fromEntries(OM.skolpos.map(p=>[p[0],p]));
  m.rk.filter(r=>r.x!=null).forEach(r=>pt(r.x,r.y,'rk',4.5,`<b>${esc(r.n)}</b><br>kontrollerad ${rkDatum(r.d)}`));
  m.skolor.forEach(s=>{const p=sp[s.c];if(p)pt(p[1],p[2],'sk',5,`<b>${esc(s.n)}</b><br>${esc(miAvst(s))}`)});
  m.vc.forEach(v=>pt(v.x,v.y,'vc',6,`<b>${esc(v.n)}</b><br>${esc(miAvst(v))}`));
  const t=el('text',{x:o.lx,y:o.ly,'text-anchor':'middle',class:'mi-lbl',style:`font-size:${14*sc}px;stroke-width:${4*sc}px`},svg);t.textContent=o.namn;
}
function miValj(k){miVisad=k;miSpara(k);try{history.replaceState(null,'','#'+k)}catch(e){}renderMitt();
  if(matchMedia('(max-width:900px)').matches)$('#mi-h').scrollIntoView({behavior:'smooth',block:'start'})}
function renderMitt(){
  const k=miVisad,o=k&&OM.omraden.find(x=>x.kod===k),m=o&&MI.omraden[k],K=OM.kommun,sparad=miHamta();
  $('#mi-sel').value=o?k:'';
  $('#mi-spara').hidden=!o||k===sparad;$('#mi-glom').hidden=!sparad;
  $('#mi-not').textContent=o&&k!==sparad?`Du tittar på ${o.namn}. Spara det som ditt område så visas det här och på startsidan nästa gång.`:
    sparad?'Ditt val sparas bara i den här webbläsaren. Vi får aldrig veta vilket område du har valt.':'Valet sparas bara i den här webbläsaren. Vi får aldrig veta vilket område du har valt.';
  miKarta();
  $('#mi-kpis').hidden=!o;$('#mi-innehall').hidden=!o;
  if(!o){$('#mi-h').textContent='Ditt Örebro, samlat på ett ställe';
    $('#mi-lead').textContent='Välj området där du bor, så samlar vi det viktigaste nära dig: hur området ser ut, de senaste restaurangkontrollerna och skolorna och vårdcentralerna närmast. Resten av sidan ser ut som vanligt.';return}
  $('#mi-h').textContent=o.namn;
  $('#mi-lead').textContent=`Ett av Örebros 36 områden, med ${fmt(m.inv)} invånare. Här har vi samlat det viktigaste nära dig. Allt annat på sidan finns kvar som vanligt.`;
  // nyckeltal
  const M=kk=>OMAT.find(x=>x.k===kk);
  const tile=(l,v,s)=>`<div class="stat"><span class="label">${esc(l)}</span><span class="v num">${v}</span><span class="s">${esc(s)}</span></div>`;
  const d=m.inv_forra!=null?m.inv-m.inv_forra:null;
  const t=[tile('Invånare',fmt(m.inv),`${m.inv_ar}${d!=null?`, ${d>0?'+':d<0?'−':'±'}${fmt(Math.abs(d))} på ett år`:''}`)];
  [['inkomst','Medianinkomst'],['barnfam','Barnfamiljer'],['aldre','65 år och äldre'],['hyres','Hyresrätter']].forEach(([kk,l])=>{const d=M(kk);if(o[kk]!=null)t.push(tile(l,omFmt(d,o[kk]),`hela kommunen ${omFmt(d,K[kk])}`))});
  if(o.val)t.push(tile('Röstade i valet',fmt(o.val.deltagande,1)+' %',`hela kommunen ${VAL?fmt(VAL.deltagande,1)+' %':'–'}`));
  $('#mi-kpis').innerHTML=t.join('');
  // restauranger
  $('#mi-rk-s').textContent='i ditt område';
  $('#mi-rk-sum').textContent=m.rk90?`Kommunen har gjort ${fmt(m.rk30)} ${m.rk30===1?'kontroll':'kontroller'} i området de senaste 30 dagarna och ${fmt(m.rk90)} de senaste 90 dagarna.`:'Kommunen har inte gjort några kontroller i området de senaste 90 dagarna.';
  $('#mi-rk').innerHTML=m.rk.map(r=>{const [c,txt]=miStatus(r);return `<li><a href="restauranger.html#v=${esc(r.id)}"><b>${esc(r.n)}</b><span class="sub">${esc(r.a||'')}${r.a?' · ':''}${esc(r.r)}, ${rkDatum(r.d)}</span></a><span class="mi-st mi-st-${c}">${txt}</span></li>`}).join('');
  $('#mi-rk-not').innerHTML=`Den senaste kontrollen för varje verksamhet, med kommunens egna ord. <a href="restauranger.html#omr=${k}">Alla verksamheter i området</a> · uppgifterna hämtades ${rkDatum(MI.rk_uppdaterad)}.`;
  // skolor
  $('#mi-sk').innerHTML=m.skolor.map(s=>`<li><a href="skolor.html#s${s.c}"><b>${esc(s.n)}</b><span class="sub">${[s.ak?'åk '+s.ak:'',HM[s.hm]||s.hm,s.merit!=null?'meritvärde '+fmt(s.merit,1):''].filter(Boolean).map(esc).join(' · ')}</span></a><span class="mi-avst">${esc(miAvst(s))}</span></li>`).join('');
  const gy=m.gymn;$('#mi-gy').innerHTML=gy.length?`Gymnasieskolor i området: ${gy.slice(0,4).map(s=>`<a href="skolor.html#s${s.c}">${esc(s.n)}</a>`).join(', ')}${gy.length>4?` och ${gy.length-4} till`:''}.`:'';
  // vård
  $('#mi-vc-s').textContent=MI.tel_period?`telefonen ${vaPer(MI.tel_period)}`:'';
  $('#mi-vc').innerHTML=m.vc.map(v=>`<li><a href="${esc(v.url)}" target="_blank" rel="noopener"><b>${esc(v.n)}</b><span class="sub">${esc(v.adr||'')}${v.ort&&!(v.adr||'').includes(v.ort)?', '+esc(v.ort):''}${v.tel!=null?` · telefonen besvarad samma dag ${fmt(v.tel)} %`:''}${v.npe!=null?` · helhetsintryck ${fmt(v.npe)} %`:''}</span></a><span class="mi-avst">${esc(miAvst(v))}</span></li>`).join('')
    +(MI.tel_snitt!=null?`<li class="mi-ref small">Snitt för länets vårdcentraler: telefonen besvarad samma dag ${fmt(MI.tel_snitt)} %${MI.npe_snitt!=null?`, helhetsintryck ${fmt(MI.npe_snitt)} %`:''}.</li>`:'');
  // valet
  const v=o.val;const order=['S','M','SD','V','C','KD','L','MP','ÖrP'];
  const KORT={S:'Socialdemokraterna',M:'Moderaterna',SD:'Sverigedemokraterna',V:'Vänsterpartiet',C:'Centerpartiet',KD:'Kristdemokraterna',L:'Liberalerna',MP:'Miljöpartiet','ÖrP':'Örebropartiet'};
  const kAnd=kk=>{const p=(VAL?.partier||[]).find(p=>p.k===kk);return p?p.a:null};
  if(v){const rows=order.filter(kk=>v.andel[kk]!=null).map(kk=>({k:kk,n:KORT[kk],v:v.andel[kk],kk:kAnd(kk),f:OM.partier[kk]?.f})).sort((a,b)=>b.v-a.v);
    const mx=Math.max(...rows.map(r=>Math.max(r.v,r.kk||0)));
    $('#mi-val-sum').textContent=`Största parti: ${rows[0].n}, ${fmt(rows[0].v,1)} %. Baserat på ${v.distrikt} valdistrikt.`;
    $('#mi-val').innerHTML=`<div class="pbar small" style="color:var(--muted)"><span></span><span></span><span class="v">Område</span><span class="v d">Kommun</span></div>`+rows.map(r=>`<div class="pbar" title="${esc(r.n)}: ${fmt(r.v,1)} % i området, ${r.kk!=null?fmt(r.kk,1):'–'} % i hela kommunen"><span><span class="lng">${esc(r.n)}</span><span class="krt">${esc(r.k)}</span></span><span class="tr"><span class="f" style="width:${r.v/mx*100}%;background:${r.f}"></span>${r.kk!=null?`<span class="k" style="left:${r.kk/mx*100}%"></span>`:''}</span><span class="v">${fmt(r.v,1)}</span><span class="v d">${r.kk!=null?fmt(r.kk,1):'–'}</span></div>`).join('');
  }else{$('#mi-val-sum').textContent='Inget valdistrikt ligger huvudsakligen i det här området, så vi kan inte visa hur det röstade.';$('#mi-val').innerHTML=''}
  // vidare
  const L=[[`omrade.html#${k}`,'Allt om '+o.namn,'Inkomster, ålder, boende och hushåll jämfört med resten av Örebro.'],[`restauranger.html#omr=${k}`,'Restaurangerna i området','Alla livsmedelsverksamheter och deras kontroller.'],
    ['skatt.html','Vart går din skatt?','Skriv in din lön och se vad kommunalskatten går till.'],['manaden.html','Månadens Örebro','Det senaste i siffror, varje månad.']];
  $('#mi-vidare').innerHTML=L.map(([h,n,s])=>`<a class="mi-v" href="${h}"><b>${esc(n)}</b><span>${esc(s)}</span></a>`).join('');
}
function initMitt(){
  OM.omraden.forEach(o=>o._box=pathBox(o.svg));omStad();
  $('#mi-sel').innerHTML='<option value="">Välj ditt område</option>'+OM.omraden.slice().sort((a,b)=>a.namn.localeCompare(b.namn,'sv')).map(o=>`<option value="${o.kod}">${esc(o.namn)}</option>`).join('');
  const h=hashKod(),s=miHamta();miVisad=miGiltig(h)?h:miGiltig(s)?s:null;
  $('#mi-sel').addEventListener('change',e=>{if(e.target.value)miValj(e.target.value)});
  $('#mi-form').addEventListener('submit',e=>e.preventDefault());
  $('#mi-spara').addEventListener('click',()=>{miSpara(miVisad);renderMitt()});
  $('#mi-glom').addEventListener('click',()=>{miGlom();miVisad=null;try{history.replaceState(null,'',location.pathname)}catch(e){}renderMitt()});
  addEventListener('hashchange',()=>{const h=hashKod();if(miGiltig(h)){miVisad=h;renderMitt()}});
  renderMitt();
}
async function miRemsa(S){
  const host=$('#mi-remsa'),sel=$('#hitta-omr');if(!host)return;
  const k=miHamta();let m=null;
  if(k){try{await miData();m=MI.omraden[k]}catch(e){}}
  if(!m){host.hidden=true;host.innerHTML='';if(sel)sel.value='';$('#hitta-lbl').textContent='Var bor du?';return}
  if(sel)sel.value=k;$('#hitta-lbl').textContent='Ditt område';
  const vc=m.vc[0];const fakta=[`${fmt(m.inv)} invånare`,`${fmt(m.rk30)} ${m.rk30===1?'restaurangkontroll':'restaurangkontroller'} senaste 30 dagarna`,vc?`närmaste vårdcentral ${vc.n.replace(/ ?vårdcentral ?/i,' ').trim()} (${miAvst(vc)})`:''].filter(Boolean);
  host.innerHTML=`<div class="wrap mi-remsa-in"><a class="mi-remsa-txt" href="mitt.html"><span class="label">Ditt område</span><b>${esc(m.namn)}</b><span class="mi-remsa-fakta">${fakta.map(esc).join(' · ')}</span></a>
    <span class="mi-remsa-knappar"><a class="mi-remsa-ga" href="mitt.html">Mitt Örebro →</a><button type="button" data-g="byt">Byt</button><button type="button" data-g="glom">Glöm</button></span></div>`;
  host.hidden=false;
}


/* ===== Sidladdning: varje sida hämtar bara sin egen data (body data-sida) ===== */
let BEF,VAL,rt;
const SIDA=document.body.dataset.sida;
async function load(name){const r=await fetch('data/'+name+'.json');if(!r.ok)throw new Error(name);return r.json()}
const datumText=d=>{const [y,m,dd]=d.split('-');return `${+dd} ${MANAD[+m-1]} ${y}`};
const RITA={
  pengar:()=>{if(P){renderPengar();renderLokal()}}, befolkning:()=>BEF&&renderBef(BEF), jamfor:()=>J&&renderKpi(),
  omrade:()=>OM&&renderOmMap(), handel:()=>{if(HD){renderHdCmp();renderHdMap();renderHdBil()}},
  vader:()=>{if(VE){renderVeStripes();renderVeCharts()}},
  vard:()=>{if(VA){renderVaVC();vaCmp('va-r',VA.region,vaR,VA.regioner,'0018');vaCmp('va-k',VA.kommun,vaK,VA.kommuner,'1880')}},
  skolor:()=>{if(SK){renderSkCmp();if(skF!=='fo')renderSkCharts();renderSkTable()}},
  restauranger:()=>RK&&renderRkMap(), mitt:()=>OM&&MI&&miKarta()
};
addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{(RITA[SIDA]||(()=>{}))()},200)});
const felText=(sel,t)=>{const e=$(sel);if(e)e.textContent=t};
const hashKod=()=>decodeURIComponent(location.hash.slice(1));

function renderStart(S){
  document.querySelectorAll('[data-tema]').forEach(a=>{const t=S.teman[a.dataset.tema];if(!t)return;
    a.querySelector('.v').textContent=t.v;a.querySelector('.s').textContent=t.s});
  document.querySelectorAll('[data-utf]').forEach(a=>{const t=(S.utforska||{})[a.dataset.utf];if(t)a.querySelector('.utf-v').textContent=t});
  const sel=$('#hitta-omr');if(!sel)return;
  sel.innerHTML='<option value="">Välj ditt område</option>'+S.omraden.map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join('');
  $('#hitta').addEventListener('submit',e=>{e.preventDefault();if(sel.value)miSpara(sel.value);location.href='mitt.html'+(sel.value?'#'+sel.value:'')});
  $('#mi-remsa').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;
    if(b.dataset.g==='glom'){miGlom();miRemsa(S)}else{$('#hitta').scrollIntoView({behavior:'smooth',block:'center'});sel.focus({preventScroll:true})}});
  miRemsa(S);
}

(async()=>{
  miMeny();
  try{const S=await load('start');['#fot-datum','#fot-datum2'].forEach(id=>{const f=$(id);if(f)f.textContent=datumText(S.uppdaterad)});if(SIDA==='start')renderStart(S)}catch(e){console.error(e)}
  renderLadda();
  switch(SIDA){
  case 'mitt':
    try{[OM,MI,VAL]=await Promise.all([load('omraden'),load('mitt'),load('val').catch(()=>null)]);initMitt()}catch(e){console.error(e);felText('#mi-karta','Kunde inte läsa in datan för Mitt Örebro. Ladda om sidan.')}
    break;
  case 'pengar':
    try{P=await load('pengar');per='12m';
      $('#per-chips').innerHTML=P.perioder.map(p=>`<button class="chip" data-id="${p.id}" aria-pressed="false">${esc(p.label)}</button>`).join('');
      $('#per-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){per=b.dataset.id;renderPengar();renderLokal()}});
      $('#lev-q').addEventListener('input',renderLev);
      renderPengar();
      try{LOK=await load('leverantorsort');
        $('#lok-pens').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){lokPens=b.dataset.p;renderLokal()}});
        renderLokal()}catch(e){console.error(e);felText('#lok-lead','Kunde inte läsa in uppgifterna om leverantörernas orter.')}
    }catch(e){console.error(e);felText('#per-kpis','Kunde inte läsa in datan om kommunens pengar. Ladda om sidan.')}
    break;
  case 'befolkning':
    try{BEF=await load('befolkning');renderBef(BEF)}catch(e){console.error(e);felText('#bef-lead','Kunde inte läsa in befolkningsdatan.')}
    break;
  case 'jamfor':
    try{J=await load('jamforelse');kid=J.kpis[0].id;
      $('#kpi-chips').innerHTML=J.kpis.map(k=>`<button class="chip" data-id="${k.id}" aria-pressed="false">${esc(k.titel)}</button>`).join('');
      $('#kpi-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){kid=b.dataset.id;renderKpi()}});
      renderKpi();
    }catch(e){console.error(e);felText('#kpi-desc','Kunde inte läsa in jämförelsedatan.')}
    break;
  case 'skolor':
    try{[SK]=await Promise.all([load('skolor'),miNaraLadda()]);initSkolor();
      const m=/^s(\d+)$/.exec(hashKod());const s=m&&SK.skolor.find(x=>x.c===m[1]);
      if(s){skF=s.former.some(x=>['gy','gyan'].includes(x.k))?'gy':'gr';renderSkolor();$('#sk-q').value=s.n;skOpen=s.c;renderSkTable();
        requestAnimationFrame(()=>$('#sk-table').scrollIntoView({block:'start'}))}
    }catch(e){console.error(e);felText('#sk-lead','Kunde inte läsa in skoldatan.')}
    break;
  case 'vard':
    try{[VA]=await Promise.all([load('vard'),miNaraLadda()]);initVa()}catch(e){console.error(e);felText('#va-lead','Kunde inte läsa in vårddatan.')}
    break;
  case 'omrade':
    try{[VAL,SK,VA,OM]=await Promise.all([load('val'),load('skolor').catch(()=>null),load('vard').catch(()=>null),load('omraden')]);
      initOm();
      const k=hashKod();if(OM.omraden.some(o=>o.kod===k)){omSel=k;renderOm()}
      addEventListener('hashchange',()=>{const k=hashKod();if(OM.omraden.some(o=>o.kod===k)){omSel=k;renderOm()}});
    }catch(e){console.error(e);felText('#om-lead','Kunde inte läsa in områdesdatan.')}
    break;
  case 'handel':
    try{[HD,OM]=await Promise.all([load('handel'),load('omraden').catch(()=>null)]);initHd()}catch(e){console.error(e);felText('#hd-lead','Kunde inte läsa in handelsdatan.')}
    break;
  case 'restauranger':
    try{[RK,OM]=await Promise.all([load('restauranger'),load('omraden').catch(()=>null)]);if(OM)omStad();
      const h=hashKod();if(h.startsWith('omr=')&&RK.omraden[h.slice(4)]){rkOmr=h.slice(4);rkGrp='Alla'}
      initRk();if(h.startsWith('v=')&&RK.verksamheter.some(v=>v.id===h.slice(2)))rkVal(h.slice(2),true)}catch(e){console.error(e);felText('#rk-lead','Kunde inte läsa in kontrollresultaten.')}
    break;
  case 'vader':
    try{VE=await load('vader');renderVe()}catch(e){console.error(e);felText('#ve-lead','Kunde inte läsa in väderdatan.')}
    break;
  case 'skatt':
    try{SKT=await load('skatt');initSkatt()}catch(e){console.error(e);felText('#sk-kom','Kunde inte läsa in uppgifterna.')}
    break;
  case 'hundra':
    try{HU=await load('hundra');initHundra()}catch(e){console.error(e);felText('#hu-lead','Kunde inte läsa in uppgifterna.')}
    break;
  case 'manaden':
    try{MA=await load('manaden');initManaden()}catch(e){console.error(e);felText('#ma-senaste','Kunde inte läsa in sammanfattningen.')}
    break;
  case 'valet':
    try{VDV=await load('val');renderVal(VDV)}catch(e){console.error(e);felText('#val-lead','Kunde inte läsa in valresultatet.')}
    try{VD=await load('valdistrikt');initVD()}catch(e){console.error(e);felText('#vd-map','Kunde inte läsa in kartan över valdistrikten.')}
    break;
  }
})();
