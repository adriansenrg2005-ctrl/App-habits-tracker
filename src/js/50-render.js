// ================= Render =================
function radarSVG(valores, decayendo){
  const size=280, cx=140, cy=140, R=100, n=CATS.length;
  const ang=i=>Math.PI*2*i/n-Math.PI/2;
  const pt=(i,r)=>[cx+r*Math.cos(ang(i)), cy+r*Math.sin(ang(i))];
  let s=`<svg class="radar" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#7C5CFF" stop-opacity=".85"/>
    <stop offset="100%" stop-color="#4ED6FF" stop-opacity=".85"/></linearGradient></defs>`;
  for (const f of [0.25,0.5,0.75,1])
    s+=`<polygon points="${CATS.map((_,i)=>pt(i,R*f).join(",")).join(" ")}" fill="none" stroke="#232A4A"/>`;
  CATS.forEach((_,i)=>{ const [x,y]=pt(i,R); s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#232A4A"/>`; });
  s+=`<polygon points="${valores.map((v,i)=>pt(i,Math.max(6,v/100*R)).join(",")).join(" ")}"
    fill="url(#g)" stroke="#9D8CFF" stroke-width="2" stroke-linejoin="round"/>`;
  CATS.forEach((c,i)=>{
    const [x,y]=pt(i,R+22);
    s+=`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
      font-size="11" fill="${c.color}" font-weight="600">${c.name}${decayendo[i]?" ▼":""}</text>`;
  });
  valores.forEach((v,i)=>{ const [x,y]=pt(i,Math.max(6,v/100*R)); s+=`<circle cx="${x}" cy="${y}" r="3" fill="${CATS[i].color}"/>`; });
  return s+"</svg>";
}

function renderForm(){
  const b=document.getElementById("t-bueno"), m=document.getElementById("t-malo");
  b.style.cssText = fTipo==="bueno" ? "background:#5EF0A0;color:#0A0C16;border-color:#5EF0A0"
    : "background:transparent;color:#5EF0A0;border-color:#5EF0A0";
  m.style.cssText = fTipo==="malo" ? "background:#FF5C5C;color:#0A0C16;border-color:#FF5C5C"
    : "background:transparent;color:#FF5C5C;border-color:#FF5C5C";
  document.getElementById("freq-grupo").style.display = fTipo==="bueno" ? "grid" : "none";
  const fd=document.getElementById("f-diario"), fs=document.getElementById("f-semanal");
  fd.style.cssText = fFreq==="diario" ? "background:#4ED6FF;color:#0A0C16;border-color:#4ED6FF"
    : "background:transparent;color:#4ED6FF;border-color:#4ED6FF";
  fs.textContent = fObj+"x / semana";
  fs.style.cssText = "flex:1;" + (fFreq==="semanal" ? "background:#FFD700;color:#0A0C16;border-color:#FFD700"
    : "background:transparent;color:#FFD700;border-color:#FFD700");
  document.getElementById("cats-form").innerHTML = CATS.map(c=>{
    const sel=fCats.includes(c.id);
    return `<button class="cat-chip" onclick="toggleCatF('${c.id}')"
      style="border-color:${c.color};${sel?`background:${c.color};color:#0A0C16`:`color:${c.color}`}">${c.name}</button>`;
  }).join("");
  document.getElementById("xp-preview").textContent =
    (fTipo==="malo"?"−":"+") + (fTipo==="malo"?XP_NEG:XP_POS)*fCats.length + " xp por marca";
}

function filaHabito(h){
  const F=hoy(), done=(D.log[F]||[]).includes(h.id);
  const malo = h.tipo==="malo", semanal = h.freq.tipo==="semanal";
  const color = malo ? "#FF5C5C" : cat(h.cats[0]).color;
  const sem = vecesSemana(h.id);
  const corona = semanal && sem>=h.freq.objetivo;
  const r = malo ? limpios(h).actual : racha(h.id);
  const mult = (!malo && !semanal) ? multDeRun(done ? r : r+1) : 1;
  let extra = "";
  if (malo) extra = done ? '<span style="color:#FF5C5C">hoy has caído</span>'
    : (r>0 ? `<span style="color:#5EF0A0">🛡️ ${r} ${r===1?"día":"días"} limpio</span>` : "");
  else if (semanal) extra = `<span style="color:${corona?"#FFD700":"#8B93B8"}">${sem}/${h.freq.objetivo} esta semana${corona?(h.titulo?` · 👑 ${esc(h.titulo)}`:" · 👑"):""}</span>`;
  else {
    const partes = [];
    if (r>1) partes.push(`🔥 ${r} días`);
    if (mult>1) partes.push(`<b style="color:#FFD700">x${mult}</b>`);
    if (partes.length) extra = `<span style="color:#FFB454">${partes.join(" · ")}</span>`;
  }
  const xpMostrar = malo ? XP_NEG*h.cats.length : Math.round(XP_POS*mult)*h.cats.length;
  return `<div class="habito" style="${[
      done?`background:${malo?"#2A1420":"#16203A"}`:"",
      `border-color:${corona?"#FFD700":done?color+"66":"#232A4A"}`,
      corona?"box-shadow:0 0 8px rgba(255,215,0,.2)":""
    ].filter(Boolean).join(";")}">
    <button class="check" onclick="toggle('${h.id}')"
      style="border-color:${color};${done?`background:${color}`:""}">${done?(malo?"✕":"✓"):""}</button>
    <div class="h-info">
      <div class="h-nombre" style="${done&&!malo?"text-decoration:line-through;opacity:.6":""}">${esc(h.name)}</div>
      <div class="h-meta">
        <span>${h.cats.map((cid,i)=>`<span style="color:${cat(cid).color}">${cat(cid).name}${i<h.cats.length-1?" · ":""}</span>`).join("")}</span>
        ${extra}
      </div>
    </div>
    <span class="h-xp mono" style="${malo?"color:#FF5C5C":mult>1?"color:#FFD700":""}">${malo?"−":"+"}${xpMostrar}xp</span>
    <button class="h-del" onclick="borrarHabit('${h.id}')">✕</button>
  </div>`;
}

// ---- página de logros ----
function renderLogros(ctx){
  const fechaCorta = f => new Date(f).toLocaleDateString("es",{day:"numeric",month:"short"});

  // rachas
  let rachasHTML = "";
  for (const h of D.habits){
    let icoTxt, valTxt;
    if (h.tipo==="malo"){
      const l = limpios(h);
      icoTxt = "🛡️";
      valTxt = `<b style="color:#5EF0A0">${l.actual}</b> días limpio · récord <b>${l.record}</b>`;
    } else if (h.freq.tipo==="semanal"){
      const total = fechasDe(h.id).length;
      icoTxt = "📅";
      valTxt = `<b style="color:#FFD700">${vecesSemana(h.id)}/${h.freq.objetivo}</b> esta semana · ${total} en total`;
    } else {
      const rec = recordRacha(h.id);
      icoTxt = "🔥";
      valTxt = `<b style="color:#FFB454">${racha(h.id)}</b> días · récord <b>${rec}</b>`;
    }
    rachasHTML += `<div class="logro">
      <div class="l-ico">${icoTxt}</div>
      <div class="l-txt"><div class="l-n">${esc(h.name)}</div></div>
      <div class="l-p">${valTxt}</div>
    </div>`;
  }

  // títulos
  const catalogoTitulos = [
    ...CATS.map(c=>({n:TITULOS_STAT[c.id], d:`Haz que ${c.name} domine tu polígono`, ico:"⬟", color:c.color})),
    {n:"Pentágono Perfecto", d:"Las 5 stats a ≥30 y en equilibrio", ico:"⬠", color:"#FFD700"},
    ...D.habits.filter(h=>h.tipo==="bueno"&&h.freq.tipo==="semanal").map(h=>({
      n:h.titulo||("Maestro: "+h.name), d:`${h.name} · ${h.freq.objetivo}x/semana`, ico:"👑", color:"#FFD700"})),
    {n:"Corrompido", d:"3+ caídas en vicios en una semana · título oscuro", ico:"💀", color:"#FF5C5C", oscuro:true},
  ];
  let titulosHTML = catalogoTitulos.map(t=>{
    const fecha = D.meta.titulos[t.n];
    const on = !!fecha;
    return `<div class="logro ${on?(t.oscuro?"oscuro":"on"):"off"}">
      <div class="l-ico" style="color:${t.color}">${t.ico}</div>
      <div class="l-txt">
        <div class="l-n" style="${on?`color:${t.color}`:""}">${esc(t.n)}</div>
        <div class="l-d">${esc(t.d)}</div>
      </div>
      <div class="l-p">${on?fechaCorta(fecha):"🔒"}</div>
    </div>`;
  }).join("");

  // logros
  let logrosHTML = LOGROS.map(l=>{
    const fecha = D.meta.logros[l.id];
    const on = !!fecha;
    return `<div class="logro ${on?"on":"off"}">
      <div class="l-ico">${l.ico}</div>
      <div class="l-txt">
        <div class="l-n" style="${on?"color:#FFD700":""}">${l.n}</div>
        <div class="l-d">${l.d}</div>
      </div>
      <div class="l-p">${on?fechaCorta(fecha):l.prog(ctx)}</div>
    </div>`;
  }).join("");

  const nLogros = Object.keys(D.meta.logros).length;
  const nTitulos = Object.keys(D.meta.titulos).length;
  document.getElementById("pag-logros").innerHTML = `
    <div class="pag-titulo">Sala de trofeos</div>
    <div class="pag-sub">${nLogros}/${LOGROS.length} logros · ${nTitulos}/${catalogoTitulos.length} títulos</div>
    <div class="sec-logros">🔥 Rachas</div>${rachasHTML}
    <div class="sec-logros">👑 Títulos</div>${titulosHTML}
    <div class="sec-logros">🏆 Logros</div>${logrosHTML}`;
}

function render(){
  const { valores, decayendo, xpTotal, totalBuenas } = calcular();
  const nivel = nivelDe(xpTotal);
  const base = xpNivel(nivel), sig = xpNivel(nivel+1);
  const prog = sig>base ? (xpTotal-base)/(sig-base) : 0;

  const caidas = D.habits.filter(h=>h.tipo==="malo").reduce((a,h)=>a+vecesSemana(h.id),0);
  let tit;
  const mx=Math.max(...valores), mn=Math.min(...valores);
  if (caidas>=3) tit={n:"Corrompido", d:caidas+" caídas esta semana", c:"#FF5C5C"};
  else if (mn>=30 && mx-mn<=12) tit={n:"Pentágono Perfecto", d:"Todas las stats en equilibrio", c:"#FFD700"};
  else if (mx>=20){ const i=valores.indexOf(mx); tit={n:TITULOS_STAT[CATS[i].id], d:CATS[i].name+" domina tu polígono", c:CATS[i].color}; }
  else tit={n:"Novato", d:"Tu leyenda acaba de empezar", c:"#8B93B8"};

  const coronas = D.habits.filter(h=>h.tipo==="bueno"&&h.freq.tipo==="semanal"&&vecesSemana(h.id)>=h.freq.objetivo)
    .map(h=>h.titulo||("Maestro: "+h.name));

  // registrar títulos y logros conseguidos (permanentes)
  const F = hoy();
  if (tit.n!=="Novato" && !D.meta.titulos[tit.n]) D.meta.titulos[tit.n]=F;
  coronas.forEach(t=>{ if(!D.meta.titulos[t]) D.meta.titulos[t]=F; });
  const ctx = {
    totalBuenas, nivel,
    mejorRacha: Math.max(0, ...D.habits.filter(h=>h.tipo==="bueno"&&h.freq.tipo==="diario").map(h=>recordRacha(h.id))),
    mejorLimpio: Math.max(0, ...D.habits.filter(h=>h.tipo==="malo").map(h=>limpios(h).record)),
  };
  LOGROS.forEach(l=>{ if(l.check(ctx) && !D.meta.logros[l.id]) D.meta.logros[l.id]=F; });
  guardar();

  document.getElementById("header").innerHTML = `
    <div class="fila-top">
      <div>
        <div class="lbl">Nivel ${nivel}</div>
        <div class="titulo" style="color:${tit.c}">${tit.n}</div>
        <div class="desc">${tit.d}</div>
      </div>
      <div style="text-align:right">
        <div class="lbl">XP total</div>
        <div class="mono xp">${xpTotal}</div>
      </div>
    </div>
    ${coronas.length?`<div class="chips">${coronas.map(t=>`<span class="chip">👑 ${esc(t)}</span>`).join("")}</div>`:""}
    <div class="barra"><div style="width:${Math.round(prog*100)}%"></div></div>`;

  document.getElementById("radarwrap").innerHTML = radarSVG(valores, decayendo);
  document.getElementById("statsnum").innerHTML = CATS.map((c,i)=>`
    <div>
      <b class="mono" style="color:${c.color}">${valores[i]}${decayendo[i]?'<span style="color:#FF5C5C">▼</span>':""}</b>
      <div class="mini-barra"><div style="width:${valores[i]}%;background:${c.color}"></div></div>
    </div>`).join("");
  document.getElementById("decayaviso").innerHTML = decayendo.some(Boolean)
    ? `<div class="aviso-decay">▼ Stats decayendo: más de ${DECAY_GRACIA} días sin actividad en esa categoría</div>` : "";

  const buenos = D.habits.filter(h=>h.tipo==="bueno");
  const malos = D.habits.filter(h=>h.tipo==="malo");
  const hechos=(D.log[F]||[]).filter(id=>buenos.some(b=>b.id===id)).length;
  document.getElementById("contador").textContent = `Hoy · ${hechos}/${buenos.length}`;
  document.getElementById("lista-buenos").innerHTML =
    buenos.length ? buenos.map(filaHabito).join("") : '<div class="vacio">Aún no hay hábitos. Pulsa <b>+ Hábito</b>.</div>';
  document.getElementById("seccion-malos").innerHTML = malos.length
    ? `<div class="seccion-mal">☠ Vicios · solo marca si caes</div>` + malos.map(filaHabito).join("") : "";

  renderLogros(ctx);
}

