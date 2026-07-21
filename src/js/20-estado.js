// ================= Estado =================
let D = { habits:[], log:{}, meta:{} };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) D = JSON.parse(raw);
} catch(e){}
if (!D.habits) D.habits = [];
if (!D.log) D.log = {};
if (!D.meta) D.meta = {};
if (!D.meta.logros) D.meta.logros = {};
if (!D.meta.titulos) D.meta.titulos = {};

if (!D.meta.v5) {
  D.habits.forEach(h=>{ if (h.name.toLowerCase()==="caer (nofap)") h.name = "Caer"; });
  const del = new Set(D.habits.filter(h=>h.name.toLowerCase().startsWith("psicotécnicos")).map(h=>h.id));
  if (del.size){
    D.habits = D.habits.filter(h=>!del.has(h.id));
    for (const f of Object.keys(D.log)){
      D.log[f] = D.log[f].filter(id=>!del.has(id));
      if (!D.log[f].length) delete D.log[f];
    }
  }
  D.meta.v5 = true;
}
if (!D.meta.seeded5) {
  const exist = new Set(D.habits.map(h=>h.name.toLowerCase()));
  PRESETS.forEach((p,i)=>{
    if (!exist.has(p.name.toLowerCase()))
      D.habits.push({...p, id:"p"+Date.now().toString(36)+i, createdAt:hoy()});
  });
  D.meta.seeded = true;
  D.meta.seeded5 = true;
}
guardar();

function guardar(){ try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} }

