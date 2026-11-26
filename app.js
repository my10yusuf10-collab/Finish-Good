'use strict';
const $=s=>document.querySelector(s),KEY='fga_v1';
const ROM=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
const emptyOcr=()=>Array.from({length:11},(_,i)=>({n:i+1,s:[0,1,2].map(()=>({t:'',u:0}))}));
const fresh=()=>({cfg:{lt:'Line',ft:'Flavour',cols:[{id:'c1',t:'Kolom 1',d:'-',on:1},{id:'c2',t:'Kolom 2',d:'8',on:1},{id:'c3',t:'Manual 1',d:'',on:1},{id:'c4',t:'Manual 2',d:'',on:1}]},info:{day:'',date:'',no:''},ocr:emptyOcr(),book:[[],[],[]]});
let S;try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const vis=()=>S.cfg.cols.filter(c=>c.on);

/* ---------- Tab & info ---------- */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
 ['ocr','book','exp'].forEach(v=>$('#v-'+v).hidden=v!==b.dataset.v);
 if(b.dataset.v==='book')rBook();if(b.dataset.v==='exp')rPrev()});
[['iDay','day'],['iDate','date'],['iNo','no']].forEach(([id,k])=>{$('#'+id).value=S.info[k];$('#'+id).oninput=e=>{S.info[k]=e.target.value;save()}});

/* ---------- Tabel hasil OCR ---------- */
function rOcr(){$('#ocrT tbody').innerHTML=S.ocr.map((r,i)=>`<tr><th>${r.n}</th>${r.s.map((c,j)=>`<td><input data-i="${i}" data-j="${j}" class="${c.u?'warn':''}" value="${esc(c.t)}" placeholder="-"></td>`).join('')}</tr>`).join('')}
$('#ocrT').oninput=e=>{const t=e.target;if(t.dataset.i==null)return;const c=S.ocr[t.dataset.i].s[t.dataset.j];c.t=t.value.toUpperCase();c.u=0;t.classList.remove('warn');save()};
$('#bFix').onclick=()=>{const w=document.querySelector('#ocrT input.warn')||document.querySelector('#ocrT input');w.scrollIntoView({block:'center'});w.focus()};
$('#bEmpty').onclick=()=>{S.ocr=emptyOcr();save();rOcr()};
$('#bUse').onclick=()=>{
 S.book=[0,1,2].map(s=>S.ocr.filter(r=>r.s[s].t.trim()).map(r=>{const f=r.s[s].t.trim(),n=f.split('/').length,v={};
  S.cfg.cols.forEach(c=>v[c.id]=c.d===''?'':Array(n).fill(c.d).join('/'));return{n:r.n,f,v}}));
 save();document.querySelector('nav [data-v=book]').click()};

/* ---------- Foto ---------- */
let img=null;
function pick(f){if(!f)return;const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{img=im;$('#pv').src=u;$('#pv').hidden=false;$('#bGo').disabled=false};im.src=u}
$('#fGal').onchange=e=>pick(e.target.files[0]);$('#fCam').onchange=e=>pick(e.target.files[0]);
$('#bGo').onclick=$('#bRe').onclick=()=>img?runOCR():alert('Pilih foto dulu.');
const stat=(p,t)=>{$('#st').hidden=false;$('#pb').style.width=Math.round(p*100)+'%';$('#stt').textContent=t};

function prep(im){const W=Math.min(2400,Math.max(1800,im.naturalWidth)),H=Math.round(im.naturalHeight*W/im.naturalWidth);
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.filter='grayscale(1) contrast(1.35)';x.drawImage(im,0,0,W,H);return c}

async function runOCR(){
 $('#bGo').disabled=$('#bRe').disabled=true;
 try{
  stat(.02,'Menyiapkan gambar…');const cv=prep(img);
  const w=await Tesseract.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')stat(.15+m.progress*.8,'Membaca teks… '+Math.round(m.progress*100)+'%');else stat(.08,'Memuat OCR (butuh internet pertama kali)…')}});
  await w.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1'});
  const r=await w.recognize(cv);await w.terminate();
  const ws=r.data.words.filter(x=>x.text.trim()).map(x=>({t:x.text.trim(),c:x.confidence,x0:x.bbox.x0/cv.width,x1:x.bbox.x1/cv.width,y:(x.bbox.y0+x.bbox.y1)/2/cv.width}));
  ws.forEach(x=>x.x=(x.x0+x.x1)/2);
  const res=parse(ws);
  if(res.ok){S.ocr=res.rows;save();rOcr();stat(1,'Selesai. Periksa hasil, terutama sel kuning.')}
  else stat(1,res.msg);
  readInfo(ws);
 }catch(e){stat(0,'Gagal: '+(e.message||e)+'. Cek koneksi internet lalu coba lagi.')}
 $('#bGo').disabled=$('#bRe').disabled=false;
}

/* ---------- Parser tabel berbasis koordinat ---------- */
function roman(t){t=t.toUpperCase().replace(/[L1|!]/g,'I');return ROM.indexOf(t)}
function parse(ws){
 const fl=ws.filter(w=>/^flavou?r$/i.test(w.t.replace(/[^A-Za-z]/g,''))),op=ws.filter(w=>/^output$/i.test(w.t.replace(/[^A-Za-z]/g,'')));
 let cen,d;
 if(fl.length){const my=Math.min(...fl.map(w=>w.y));const h=fl.filter(w=>w.y<my+.03).sort((a,b)=>a.x-b.x).slice(0,3);
  if(h.length===3){cen=h.map(w=>w.x);const ds=h.map(f=>{const o=op.filter(o=>o.x>f.x&&Math.abs(o.y-f.y)<.03).sort((a,b)=>a.x-b.x)[0];return o?o.x-f.x:0}).filter(Boolean);
   d=ds.length?ds.reduce((a,b)=>a+b)/ds.length:(cen[1]-cen[0])/2.6}}
 if(!cen)return{ok:false,msg:'Header tabel (Flavour ×3) tidak terbaca. Foto ulang lebih lurus & terang, atau isi manual.'};
 const left=cen[0]-d*.6;
 /* label Line di kolom kiri */
 let lab=ws.filter(w=>w.x1<left+.01&&/^l[il1|]ne/i.test(w.t)).sort((a,b)=>a.y-b.y);
 lab=lab.filter((w,i)=>!i||w.y-lab[i-1].y>.012);
 if(lab.length<3)return{ok:false,msg:'Label "Line" kurang terbaca ('+lab.length+'). Foto ulang atau isi manual.'};
 const p=lab.slice(1).map((w,i)=>w.y-lab[i].y).sort((a,b)=>a-b)[Math.floor((lab.length-1)/2)];
 lab.forEach((L,i)=>{let n=0;const m=L.t.match(/^l[il1|]ne([ivxl1|]+)$/i);if(m)n=roman(m[1]);
  if(!n){const r=ws.filter(w=>w.x0>=L.x1-.01&&w.x1<left+.01&&Math.abs(w.y-L.y)<p*.4&&roman(w.t)>0).sort((a,b)=>a.x-b.x)[0];if(r)n=roman(r.t)}
  L.n=n||i+1});
 const rows=emptyOcr(),cells={};
 ws.forEach(w=>{
  const j=cen.findIndex(c=>Math.abs(w.x-c)<d*.55);if(j<0)return;
  if(/^flavou?r$/i.test(w.t))return;
  if(w.y<lab[0].y-p*.5||w.y>lab[lab.length-1].y+p*1.0)return;
  let L=null;lab.forEach(l=>{if(l.y<=w.y+p*.3)L=l});if(!L)return;
  (cells[L.n+'_'+j]=cells[L.n+'_'+j]||[]).push(w)});
 Object.entries(cells).forEach(([k,list])=>{
  const [n,j]=k.split('_').map(Number);const row=rows.find(r=>r.n===n);if(!row)return;
  list.sort((a,b)=>a.y-b.y);const lines=[];
  list.forEach(w=>{const l=lines.find(l=>Math.abs(l.y-w.y)<p*.3);if(l)l.w.push(w);else lines.push({y:w.y,w:[w]})});
  let unsure=false;const codes=[];
  lines.forEach(l=>{l.w.sort((a,b)=>a.x-b.x);
   let s=l.w.map(w=>w.t.toUpperCase().replace(/[^A-Z0-9]/g,'')).filter(Boolean).join(' ');
   s=s.replace(/^(\S+)/,m=>m.replace(/0/g,'O').replace(/1/g,'I').replace(/5/g,'S'));
   if(!s)return;
   if(!/^[A-Z]{2,7}( \d{2,3})?$/.test(s)||Math.min(...l.w.map(w=>w.c))<60)unsure=true;
   codes.push(s)});
  row.s[j]={t:codes.join('/'),u:unsure?1:0}});
 return{ok:true,rows}}

function readInfo(ws){
 const dt=ws.find(w=>/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/.test(w.t));if(dt)S.info.date=dt.t;
 const dy=ws.find(w=>/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)$/i.test(w.t.replace(/[^A-Za-z]/g,'')));
 if(dy){const t=dy.t.replace(/[^A-Za-z]/g,'');S.info.day=t[0].toUpperCase()+t.slice(1).toLowerCase()}
 const nm=ws.find(w=>/^(nomer|nomor)/i.test(w.t));
 if(nm){const n=ws.filter(w=>/^\d{2,5}$/.test(w.t)&&w.x>nm.x&&Math.abs(w.y-nm.y)<.02).sort((a,b)=>a.x-b.x)[0];if(n)S.info.no=n.t}
 $('#iDay').value=S.info.day;$('#iDate').value=S.info.date;$('#iNo').value=S.info.no;save()}

/* ---------- Buku digital ---------- */
function rBook(){
 const cols=vis();
 $('#bookBox').innerHTML=[0,1,2].map(s=>`<div class="shift"><h3>SHIFT ${s+1}</h3><div class="sc"><table><thead><tr><th>${esc(S.cfg.lt)}</th><th>${esc(S.cfg.ft)}</th>${cols.map(c=>`<th>${esc(c.t)}</th>`).join('')}<th></th></tr></thead><tbody>
 ${S.book[s].map((r,i)=>`<tr><td><input data-s="${s}" data-i="${i}" data-k="n" value="${esc(r.n)}" style="min-width:50px"></td><td><input data-s="${s}" data-i="${i}" data-k="f" value="${esc(r.f)}" style="min-width:110px"></td>${cols.map(c=>`<td><input data-s="${s}" data-i="${i}" data-k="${c.id}" value="${esc(r.v[c.id])}"></td>`).join('')}<td><button data-del="${s}_${i}">✕</button></td></tr>`).join('')}
 </tbody></table></div><div class="row"><button data-add="${s}">+ Baris</button></div></div>`).join('')}
$('#bookBox').oninput=e=>{const t=e.target.dataset;if(t.k==null)return;const r=S.book[t.s][t.i];if(t.k==='n'||t.k==='f')r[t.k]=e.target.value;else r.v[t.k]=e.target.value;save()};
$('#bookBox').onclick=e=>{const t=e.target.dataset;
 if(t.add!=null){S.book[t.add].push({n:'',f:'',v:{}});}
 else if(t.del!=null){const[s,i]=t.del.split('_');S.book[s].splice(i,1)}else return;save();rBook()};

/* ---------- Pengaturan kolom ---------- */
function rSet(){const c=S.cfg;
 $('#setBox').innerHTML=`<div class="sr" style="grid-template-columns:1fr 1fr"><input data-f="lt" value="${esc(c.lt)}" aria-label="Judul kolom Line"><input data-f="ft" value="${esc(c.ft)}" aria-label="Judul kolom Flavour"></div><p class="hint">Setiap kolom: tampil, judul, nilai awal, naik, turun, hapus.</p>`+
 c.cols.map((k,i)=>`<div class="sr"><input type="checkbox" data-i="${i}" data-f="on" ${k.on?'checked':''} style="width:22px"><input data-i="${i}" data-f="t" value="${esc(k.t)}"><input data-i="${i}" data-f="d" value="${esc(k.d)}" placeholder="awal"><button data-up="${i}">↑</button><button data-dn="${i}">↓</button><button data-rm="${i}">✕</button></div>`).join('')}
$('#setBox').oninput=e=>{const t=e.target,f=t.dataset.f;if(!f)return;if(t.dataset.i==null)S.cfg[f]=t.value;else S.cfg.cols[t.dataset.i][f]=f==='on'?(t.checked?1:0):t.value;save()};
$('#setBox').onclick=e=>{const t=e.target.dataset,a=S.cfg.cols;
 if(t.up!=null&&+t.up>0){const i=+t.up;[a[i-1],a[i]]=[a[i],a[i-1]]}
 else if(t.dn!=null&&+t.dn<a.length-1){const i=+t.dn;[a[i+1],a[i]]=[a[i],a[i+1]]}
 else if(t.rm!=null){if(confirm('Hapus kolom ini?'))a.splice(+t.rm,1)}else return;save();rSet()};
$('#bAdd').onclick=()=>{S.cfg.cols.push({id:'c'+Date.now(),t:'Kolom baru',d:'',on:1});save();rSet()};
$('#bSet').onclick=()=>{rSet();$('#dSet').showModal()};
$('#bSetOk').onclick=()=>{$('#dSet').close();rBook();rPrev()};
$('#bClear').onclick=()=>{if(confirm('Hapus semua data (hasil OCR, buku digital, info jadwal)? Pengaturan kolom tetap disimpan.')){const c=S.cfg;S=fresh();S.cfg=c;save();location.reload()}};

/* ---------- Ekspor (digambar langsung ke canvas) ---------- */
function pages(){
 const W=1240,H=1754,M=60,RH=48,cols=vis(),pgs=[];let cv,g,y;
 const cw=cols.length?(W-2*M-440)/cols.length:0,wd=[110,330,...cols.map(()=>cw)],hd=[S.cfg.lt,S.cfg.ft,...cols.map(c=>c.t)];
 const np=()=>{cv=document.createElement('canvas');cv.width=W;cv.height=H;g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,H);
  const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'#111');gr.addColorStop(1,'#c9a227');g.fillStyle=gr;g.fillRect(0,0,W,110);
  g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.font='bold 46px sans-serif';g.fillText('FINISH GOOD ANALYSIS',M,56);
  g.fillStyle='#111';g.font='28px sans-serif';g.fillText('Hari/Tanggal: '+(S.info.day+' '+S.info.date).trim(),M,152);g.textAlign='right';g.fillText('No. Jadwal: '+S.info.no,W-M,152);
  pgs.push(cv);y=195};
 const row=(a,head)=>{let x=M;a.forEach((t,i)=>{const w=wd[i];if(head){g.fillStyle='#111';g.fillRect(x,y,w,RH)}
  g.strokeStyle='#999';g.lineWidth=1.5;g.strokeRect(x,y,w,RH);g.fillStyle=head?'#f5d76e':'#111';let s=28;g.textAlign='center';
  do{g.font=(head?'bold ':'')+s+'px sans-serif';s-=2}while(g.measureText(t).width>w-14&&s>12);g.fillText(String(t??''),x+w/2,y+RH/2+2);x+=w});y+=RH};
 np();
 S.book.forEach((rows,s)=>{
  const bar=c=>{if(y+RH*3>H-M-30)np();g.fillStyle='#c9a227';g.fillRect(M,y,W-2*M,RH);g.fillStyle='#111';g.font='bold 30px sans-serif';g.textAlign='left';g.fillText('SHIFT '+(s+1)+(c?' (lanjutan)':''),M+14,y+RH/2);y+=RH;row(hd,1)};
  bar(0);rows.forEach(r=>{if(y+RH>H-M-30){np();bar(1)}row([r.n,r.f,...cols.map(c=>r.v[c.id]||'')],0)});y+=34});
 if(pgs.length>1)pgs.forEach((c,i)=>{const k=c.getContext('2d');k.fillStyle='#555';k.font='24px sans-serif';k.textAlign='center';k.textBaseline='middle';k.fillText('Halaman '+(i+1)+' / '+pgs.length,W/2,H-35)});
 return pgs}
function rPrev(){const b=$('#prev');b.innerHTML='';pages().forEach(c=>b.appendChild(c))}
const blobs=cs=>Promise.all(cs.map(c=>new Promise(r=>c.toBlob(r,'image/png'))));
const fname=()=>'FinishGood_'+(S.info.date||'jadwal').replace(/[^\w-]/g,'-');
function dl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$('#bPng').onclick=async()=>{const bs=await blobs(pages());bs.forEach((b,i)=>setTimeout(()=>dl(b,fname()+(bs.length>1?'_h'+(i+1):'')+'.png'),i*400))};
$('#bShare').onclick=async()=>{const bs=await blobs(pages()),fs=bs.map((b,i)=>new File([b],fname()+'_'+(i+1)+'.png',{type:'image/png'}));
 if(navigator.canShare&&navigator.canShare({files:fs})){try{await navigator.share({files:fs,title:'Finish Good Analysis'})}catch(e){}}
 else{alert('Perangkat tidak mendukung berbagi langsung. Gambar diunduh, silakan kirim lewat WhatsApp.');bs.forEach((b,i)=>dl(b,fname()+'_'+(i+1)+'.png'))}};
$('#bPrint').onclick=()=>{const im=pages().map(c=>'<img src="'+c.toDataURL('image/jpeg',.92)+'">').join(''),w=window.open('');
 w.document.write('<style>@page{size:A4;margin:0}body{margin:0}img{width:100%;display:block;page-break-after:always}</style>'+im);w.document.close();setTimeout(()=>w.print(),600)};
$('#bPdf').onclick=()=>{const cs=pages(),enc=new TextEncoder(),parts=[],off=[];let len=0;
 const add=d=>{const b=typeof d==='string'?enc.encode(d):d;parts.push(b);len+=b.length};
 add('%PDF-1.4\n');off[1]=len;add('1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n');
 off[2]=len;add('2 0 obj\n<</Type/Pages/Count '+cs.length+'/Kids['+cs.map((_,k)=>(3+3*k)+' 0 R').join(' ')+']>>\nendobj\n');
 cs.forEach((c,k)=>{const bin=atob(c.toDataURL('image/jpeg',.92).split(',')[1]),jb=Uint8Array.from(bin,x=>x.charCodeAt(0)),a=3+3*k,ct='q 595 0 0 842 0 0 cm /Im0 Do Q';
  off[a]=len;add(a+' 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</XObject<</Im0 '+(a+2)+' 0 R>>>>/Contents '+(a+1)+' 0 R>>\nendobj\n');
  off[a+1]=len;add((a+1)+' 0 obj\n<</Length '+ct.length+'>>\nstream\n'+ct+'\nendstream\nendobj\n');
  off[a+2]=len;add((a+2)+' 0 obj\n<</Type/XObject/Subtype/Image/Width '+c.width+'/Height '+c.height+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+jb.length+'>>\nstream\n');add(jb);add('\nendstream\nendobj\n')});
 const n=3+3*cs.length,xr=len;let x='xref\n0 '+n+'\n0000000000 65535 f \n';for(let i=1;i<n;i++)x+=String(off[i]).padStart(10,'0')+' 00000 n \n';
 add(x+'trailer\n<</Size '+n+'/Root 1 0 R>>\nstartxref\n'+xr+'\n%%EOF');dl(new Blob(parts,{type:'application/pdf'}),fname()+'.pdf')};

rOcr();
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
