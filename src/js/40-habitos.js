function toggleForm(){ document.getElementById("form").classList.toggle("abierto"); renderForm(); }
function setTipo(t){ fTipo=t; renderForm(); }
function setFreq(f){ fFreq=f; renderForm(); }
function cambiaObj(d){ fObj=Math.min(7,Math.max(1,fObj+d)); fFreq="semanal"; renderForm(); }
function toggleCatF(id){
  fCats = fCats.includes(id) ? (fCats.length>1?fCats.filter(x=>x!==id):fCats) : [...fCats,id];
  renderForm();
}
function addHabit(){
  const inp = document.getElementById("f-nombre");
  const nombre = inp.value.trim();
  if (!nombre || !fCats.length) return;
  D.habits.push({
    id: Date.now().toString(36), name:nombre, tipo:fTipo, cats:[...fCats],
    createdAt: hoy(),
    freq: (fTipo==="bueno"&&fFreq==="semanal") ? {tipo:"semanal",objetivo:fObj} : {tipo:"diario"},
    titulo: null,
  });
  inp.value="";
  document.getElementById("form").classList.remove("abierto");
  guardar(); render();
}

