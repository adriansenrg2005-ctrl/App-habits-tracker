// ================= Utilidades =================
function hoy(){ return new Date().toLocaleDateString("sv"); }
function diasAtras(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toLocaleDateString("sv"); }
function difDias(a,b){ return Math.round((new Date(b)-new Date(a))/864e5); }
function lunesSemana(){ const d=new Date(); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.toLocaleDateString("sv"); }
function statValor(xp){ return Math.round(100*(xp/(xp+300))); }
function nivelDe(xp){ return Math.floor(Math.sqrt(xp/25))+1; }
function xpNivel(l){ return Math.pow(l-1,2)*25; }
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function cat(id){ return CATS.find(c=>c.id===id); }
function multDeRun(run){ return run>=7 ? 2 : run>=3 ? 1.5 : 1; }
function fechasDe(id){ return Object.keys(D.log).filter(f=>D.log[f].includes(id)).sort(); }

// ================= Cálculos =================
function mapaMults(){
  const m = {};
  for (const h of D.habits){
    if (h.tipo!=="bueno" || h.freq.tipo!=="diario") continue;
    let run = 0, prev = null;
    const mm = {};
    for (const f of fechasDe(h.id)){
      run = (prev && difDias(prev,f)===1) ? run+1 : 1;
      mm[f] = multDeRun(run);
      prev = f;
    }
    m[h.id] = mm;
  }
  return m;
}

function recordRacha(id){
  let mejor=0, run=0, prev=null;
  for (const f of fechasDe(id)){
    run = (prev && difDias(prev,f)===1) ? run+1 : 1;
    if (run>mejor) mejor=run;
    prev=f;
  }
  return mejor;
}

function limpios(h){
  const fechas = fechasDe(h.id);
  const F = hoy();
  if (!fechas.length){
    const d = Math.max(0, difDias(h.createdAt, F));
    return { actual:d, record:d };
  }
  let record = Math.max(0, difDias(h.createdAt, fechas[0]));
  for (let i=1;i<fechas.length;i++)
    record = Math.max(record, difDias(fechas[i-1], fechas[i])-1);
  const actual = Math.max(0, difDias(fechas[fechas.length-1], F));
  record = Math.max(record, actual);
  return { actual, record };
}

function calcular(){
  const mults = mapaMults();
  const xpCat = {}; CATS.forEach(c=>xpCat[c.id]=0);
  const ultAct = {}; CATS.forEach(c=>ultAct[c.id]=null);
  let xpTotal = 0, totalBuenas = 0;
  for (const f of Object.keys(D.log)){
    for (const hid of D.log[f]){
      const h = D.habits.find(x=>x.id===hid);
      if (!h) continue;
      if (h.tipo==="bueno") totalBuenas++;
      const delta = h.tipo==="malo" ? -XP_NEG : XP_POS * ((mults[h.id]||{})[f]||1);
      for (const c of h.cats){
        if (xpCat[c]===undefined) continue;
        xpCat[c]+=delta; xpTotal+=delta;
        if (h.tipo==="bueno" && (!ultAct[c] || f>ultAct[c])) ultAct[c]=f;
      }
    }
  }
  CATS.forEach(c=>xpCat[c.id]=Math.max(0,xpCat[c.id]));
  xpTotal = Math.max(0,xpTotal);
  const F = hoy();
  const decayendo = [], valores = CATS.map(c=>{
    let xp = xpCat[c.id], dec = false;
    if (xp>0 && ultAct[c.id]){
      const ina = difDias(ultAct[c.id], F);
      if (ina>DECAY_GRACIA){ xp *= Math.max(DECAY_SUELO, Math.pow(DECAY_DIARIO, ina-DECAY_GRACIA)); dec=true; }
    }
    decayendo.push(dec);
    return statValor(xp);
  });
  return { valores, decayendo, xpTotal: Math.round(xpTotal), totalBuenas };
}

function racha(id){
  const F = hoy();
  let r=0, i=(D.log[F]||[]).includes(id)?0:1;
  while (i<=365){ const f=diasAtras(i); if((D.log[f]||[]).includes(id)){r++;i++;} else break; }
  return r;
}
function vecesSemana(id){
  const lun=lunesSemana(), F=hoy(); let n=0;
  for (const f of Object.keys(D.log)) if (f>=lun&&f<=F&&D.log[f].includes(id)) n++;
  return n;
}

// ================= Acciones =================
function toggle(id){
  const F = hoy();
  const dia = D.log[F]||[];
  D.log[F] = dia.includes(id) ? dia.filter(x=>x!==id) : [...dia,id];
  if (!D.log[F].length) delete D.log[F];
  guardar(); render();
}
function borrarHabit(id){
  if (!confirm("¿Eliminar este hábito y su historial?")) return;
  D.habits = D.habits.filter(h=>h.id!==id);
  for (const f of Object.keys(D.log)){
    D.log[f]=D.log[f].filter(x=>x!==id);
    if (!D.log[f].length) delete D.log[f];
  }
  guardar(); render();
}

function exportar(){
  const blob = new Blob([JSON.stringify(D,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "habitos-backup-"+hoy()+".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function importar(ev){
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const d = JSON.parse(reader.result);
      if (!d || !Array.isArray(d.habits) || typeof d.log!=="object") throw new Error("formato");
      if (!confirm("Esto reemplazará tus datos actuales por los de la copia. ¿Continuar?")) return;
      D = d;
      if (!D.meta) D.meta = {};
      if (!D.meta.logros) D.meta.logros = {};
      if (!D.meta.titulos) D.meta.titulos = {};
      guardar(); render();
      alert("Copia importada correctamente ✔");
    }catch(e){ alert("El archivo no es una copia válida."); }
  };
  reader.readAsText(file);
  ev.target.value = "";
}

let fTipo="bueno", fFreq="diario", fObj=3, fCats=["disciplina"];
