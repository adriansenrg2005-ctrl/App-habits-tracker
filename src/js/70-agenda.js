// ================= Agenda por voz (offline, autocontenida) =================
(function(){
  if(!D.eventos){ D.eventos = []; guardar(); }

  /* ---------- diccionarios ---------- */
  const NUM = {
    'cero':0,'un':1,'una':1,'uno':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,
    'ocho':8,'nueve':9,'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,'quince':15,
    'dieciseis':16,'dieciséis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,'veinte':20,
    'veintiuno':21,'veintiuna':21,'veintidos':22,'veintidós':22,'veintitres':23,'veintitrés':23,
    'veinticuatro':24,'veinticinco':25,'veintiseis':26,'veintiséis':26,'veintisiete':27,
    'veintiocho':28,'veintinueve':29,'treinta':30
  };
  const DOW = {'domingo':0,'lunes':1,'martes':2,'miercoles':3,'miércoles':3,'jueves':4,'viernes':5,'sabado':6,'sábado':6};
  const DOW_NAME = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const DOW_SHORT = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  const DOW_ICS = ['SU','MO','TU','WE','TH','FR','SA'];
  const MONTH = {'enero':0,'febrero':1,'marzo':2,'abril':3,'mayo':4,'junio':5,'julio':6,'agosto':7,
    'septiembre':8,'setiembre':8,'octubre':9,'noviembre':10,'diciembre':11};
  const MONTH_NAME = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function wordToNum(w){
    w = w.trim();
    if(/^\d+$/.test(w)) return parseInt(w,10);
    if(w in NUM) return NUM[w];
    let m = w.match(/^(treinta|veinte)\s+y\s+([a-záéíóú]+)$/);
    if(m && (m[2] in NUM)) return (m[1]==='treinta'?30:20) + NUM[m[2]];
    return null;
  }

  /* ---------- extractores ---------- */
  function extractTime(t){
    let matched = null, h=null, min=0;
    if(/\bmediod[ií]a\b/.test(t)){ h=12; min=0; matched='mediodía'; }
    else if(/\bmedianoche\b/.test(t)){ h=0; min=0; matched='medianoche'; }
    else {
      const numWord = 'una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|dieciséis|diecisiete|dieciocho|diecinueve|veinte|veinti[a-záéíóú]+';
      const re = new RegExp(
        '\\ba\\s+las?\\s+(\\d{1,2}(?:[:h\\.]\\d{2})?|'+numWord+')' +
        '(\\s+y\\s+media|\\s+y\\s+cuarto|\\s+menos\\s+cuarto|\\s+y\\s+(?:diez|veinte|veinticinco|cinco))?' +
        '(\\s+de\\s+la\\s+(?:mañana|tarde|noche|madrugada))?','i');
      const m = t.match(re);
      if(m){
        matched = m[0];
        let hp = m[1];
        let mm = hp.match(/^(\d{1,2})[:h\.](\d{2})$/);
        if(mm){ h=+mm[1]; min=+mm[2]; }
        else if(/^\d+$/.test(hp)){ h=+hp; }
        else { h = wordToNum(hp); if(h==null) h=0; }
        if(m[2]){
          if(/media/.test(m[2])) min=30;
          else if(/menos\s+cuarto/.test(m[2])){ min=45; h=(h+23)%24; }
          else if(/cuarto/.test(m[2])) min=15;
          else if(/diez/.test(m[2])) min=10;
          else if(/veinticinco/.test(m[2])) min=25;
          else if(/veinte/.test(m[2])) min=20;
          else if(/cinco/.test(m[2])) min=5;
        }
        const fr = m[3]||'';
        if(/tarde|noche/.test(fr) && h<12) h+=12;
        if(/mañana|madrugada/.test(fr) && h===12) h=0;
      }
    }
    if(h===null){
      if(/\bpor\s+la\s+mañana\b/.test(t)){ h=9; min=0; matched='por la mañana'; }
      else if(/\bpor\s+la\s+tarde\b/.test(t)){ h=17; min=0; matched='por la tarde'; }
      else if(/\bpor\s+la\s+noche\b/.test(t)){ h=21; min=0; matched='por la noche'; }
    }
    if(h===null) return null;
    h = ((h%24)+24)%24;
    return {h, m:min, matched};
  }

  function extractDate(t, now){
    const mk = (off)=>{ const d=new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()+off); return d; };
    let m = t.match(/\b(dentro\s+de|en)\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|media)\s+(minutos?|horas?|d[ií]as?|semanas?|mes(?:es)?)\b/);
    if(m){
      let n = m[2]==='media' ? 0.5 : wordToNum(m[2]); if(n==null) n=1;
      const d = new Date(now); const u = m[3];
      if(/minuto/.test(u)) d.setMinutes(d.getMinutes()+n);
      else if(/hora/.test(u)) d.setMinutes(d.getMinutes()+n*60);
      else if(/d[ií]a/.test(u)) d.setDate(d.getDate()+n);
      else if(/semana/.test(u)) d.setDate(d.getDate()+n*7);
      else if(/mes/.test(u)) d.setMonth(d.getMonth()+n);
      return {date:d, matched:m[0], exact:true};
    }
    if(/pasado\s+mañana/.test(t)) return {date:mk(2), matched:'pasado mañana', exact:false};
    if(/\besta\s+mañana\b/.test(t)) return {date:mk(0), matched:'esta mañana', exact:false};
    const tMask = t.replace(/(de|por)\s+la\s+mañana/g,'##');
    if(/\bmañana\b/.test(tMask)) return {date:mk(1), matched:'mañana', exact:false};
    if(/\bhoy\b|\besta\s+(tarde|noche)\b/.test(t)){
      const mm = t.match(/\besta\s+(tarde|noche)\b/);
      return {date:mk(0), matched: mm?mm[0]:'hoy', exact:false};
    }
    m = t.match(/\b(este\s+|el\s+pr[oó]ximo\s+|pr[oó]ximo\s+|el\s+|los\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/);
    if(m){
      const target = DOW[m[2]];
      let delta = (target - now.getDay() + 7) % 7;
      if(delta===0) delta = 7;
      return {date:mk(delta), matched:m[0], dow:target, exact:false};
    }
    m = t.match(/\bel\s+(\d{1,2}|[a-záéíóú]+)\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);
    if(m){
      let day = wordToNum(m[1]); if(day==null) return null;
      const mo = MONTH[m[2]]; let year = now.getFullYear();
      let d = new Date(year, mo, day, 0,0,0,0);
      if(d < new Date(now.getFullYear(),now.getMonth(),now.getDate())) d = new Date(year+1, mo, day);
      return {date:d, matched:m[0], exact:false};
    }
    m = t.match(/\bel\s+(\d{1,2})\b/);
    if(m){
      let day = +m[1];
      if(day>=1 && day<=31){
        let d = new Date(now.getFullYear(), now.getMonth(), day, 0,0,0,0);
        const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
        if(d < today) d = new Date(now.getFullYear(), now.getMonth()+1, day);
        return {date:d, matched:m[0], exact:false};
      }
    }
    return null;
  }

  function extractRecurrence(t){
    if(/\b(todos\s+los\s+d[ií]as|cada\s+d[ií]a|a\s+diario|diariamente)\b/.test(t)){
      const m = t.match(/\b(todos\s+los\s+d[ií]as|cada\s+d[ií]a|a\s+diario|diariamente)\b/);
      return {type:'daily', matched:m[0]};
    }
    let m = t.match(/\b(todos\s+los|cada|los)\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)s?\b/);
    if(m) return {type:'weekly', dow:DOW[m[2]], matched:m[0]};
    if(/\b(cada\s+semana|todas\s+las\s+semanas|semanalmente)\b/.test(t)){
      const mm = t.match(/\b(cada\s+semana|todas\s+las\s+semanas|semanalmente)\b/);
      return {type:'weekly', matched:mm[0]};
    }
    return null;
  }

  function cleanTitle(t, removals){
    let s = ' ' + t + ' ';
    removals.filter(Boolean).sort((a,b)=>b.length-a.length).forEach(r=>{ s = s.split(r).join(' '); });
    s = s.replace(/^\s*(recu[eé]rda(me)?|recu[eé]rda|recordar|no\s+olvides?(\s+de)?|ap[uú]nta(me)?|an[oó]ta(me)?|a[ñn]ade|agrega|pon(me)?|crea|programa|nuevo\s+evento|evento|recordatorio|tarea)\s+/i,' ');
    s = s.replace(/^\s*(que|de|a|el|la)\s+/i,' ');
    s = s.replace(/\b(a\s+las?|el|los|este|pr[oó]ximo|de\s+la)\s*$/i,' ');
    s = s.replace(/\s+/g,' ').trim();
    s = s.replace(/[,;.\s]+$/,'').replace(/^[,;.\s]+/,'');
    if(!s) return 'Recordatorio';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function parseVoz(input, now){
    now = now || new Date();
    const t = input.toLowerCase();
    const rec  = extractRecurrence(t);
    const time = extractTime(t);
    let   dInfo = extractDate(t, now);
    if(rec && rec.type==='weekly' && rec.dow!=null && !dInfo){
      let delta = (rec.dow - now.getDay() + 7) % 7; if(delta===0) delta = 7;
      const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()+delta);
      dInfo = {date:d, exact:false, matched:''};
    }
    let date, hasTime;
    if(dInfo && dInfo.exact){ date = dInfo.date; hasTime = true; }
    else {
      date = dInfo ? new Date(dInfo.date) : (()=>{ const d=new Date(now); d.setHours(0,0,0,0); return d; })();
      if(time){ date.setHours(time.h, time.m, 0, 0); hasTime = true; }
      else { date.setHours(9,0,0,0); hasTime = false; }
      if(!dInfo && hasTime && date < now && !rec){ date.setDate(date.getDate()+1); }
    }
    const title = cleanTitle(input, [ dInfo && dInfo.matched, time && time.matched, rec && rec.matched ]);
    let recurrence = null;
    if(rec){
      if(rec.type==='daily') recurrence = {type:'daily'};
      else if(rec.type==='weekly') recurrence = {type:'weekly', dow: rec.dow!=null?rec.dow:date.getDay()};
    }
    return { title, date, hasTime, recurrence, raw: input };
  }

  /* ---------- helpers ---------- */
  function pad(n){ return (n<10?'0':'')+n; }
  function agEsc(s){ return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function lunesDe(d){ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }

  /* ---------- ocurrencias de la semana (expande repetidos) ---------- */
  function ocurrenciasSemana(lunes){
    const res = {};                                  // ymd -> [{ev, ts}]
    const dias = [];
    for(let i=0;i<7;i++){ const d=new Date(lunes); d.setDate(d.getDate()+i); dias.push(d); res[ymd(d)]=[]; }
    (D.eventos||[]).forEach(ev=>{
      const base = new Date(ev.ts);
      const base0 = new Date(base); base0.setHours(0,0,0,0);
      if(!ev.recurrence){
        const k = ymd(base);
        if(k in res) res[k].push({ev, ts:ev.ts});
      } else {
        dias.forEach(d=>{
          if(d < base0) return;                      // no antes de su primera fecha
          const ok = ev.recurrence.type==='daily' || d.getDay()===ev.recurrence.dow;
          if(!ok) return;
          const o = new Date(d); o.setHours(base.getHours(), base.getMinutes(), 0, 0);
          res[ymd(d)].push({ev, ts:+o});
        });
      }
    });
    Object.keys(res).forEach(k=>res[k].sort((a,b)=>a.ts-b.ts));
    return {dias, res};
  }

  /* ---------- estado (en D.eventos, entra en el backup) ---------- */
  function addEvento(ev){
    if(!D.eventos) D.eventos=[];
    D.eventos.push({
      id: Date.now()+''+Math.floor(Math.random()*1000),
      title: ev.title, ts: ev.date.getTime(), hasTime: ev.hasTime, recurrence: ev.recurrence||null
    });
    D.eventos.sort((a,b)=>a.ts-b.ts);
    guardar(); renderAgenda(); scheduleLocal();
  }
  function delEvento(id){
    const ev=(D.eventos||[]).find(e=>e.id===id);
    if(ev && ev.recurrence && !confirm('Este evento se repite. ¿Borrar toda la serie?')) return;
    D.eventos = (D.eventos||[]).filter(e=>e.id!==id);
    guardar(); renderAgenda();
  }

  /* ---------- .ics -> Calendario nativo de iOS ---------- */
  function escapeICS(s){ return String(s).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n'); }
  function icsLocal(d){ return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00'; }
  function icsDate(d){ return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate()); }
  function buildICS(e){
    const start = new Date(e.ts);
    const st = new Date();
    const dtstamp = st.getUTCFullYear()+pad(st.getUTCMonth()+1)+pad(st.getUTCDate())+'T'+
                    pad(st.getUTCHours())+pad(st.getUTCMinutes())+pad(st.getUTCSeconds())+'Z';
    let L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Habitos RPG//Agenda//ES','CALSCALE:GREGORIAN',
      'BEGIN:VEVENT','UID:'+e.id+'@habitos-agenda','DTSTAMP:'+dtstamp];
    if(e.hasTime){
      L.push('DTSTART:'+icsLocal(start), 'DTEND:'+icsLocal(new Date(e.ts+30*60000)));
      L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeICS(e.title),'TRIGGER:PT0M','END:VALARM');
    } else {
      L.push('DTSTART;VALUE=DATE:'+icsDate(start));
      L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeICS(e.title),'TRIGGER:PT9H','END:VALARM');
    }
    if(e.recurrence){
      if(e.recurrence.type==='daily') L.push('RRULE:FREQ=DAILY');
      else if(e.recurrence.type==='weekly') L.push('RRULE:FREQ=WEEKLY;BYDAY='+DOW_ICS[e.recurrence.dow]);
    }
    L.push('SUMMARY:'+escapeICS(e.title),'END:VEVENT','END:VCALENDAR');
    return L.join('\r\n');
  }
  function exportICS(e){
    const blob = new Blob([buildICS(e)], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (e.title.replace(/[^\wáéíóúñ ]/gi,'').trim()||'evento') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
    agToast('Abriendo Calendario de iOS…');
  }

  /* ---------- notificación local (extra, con la app abierta) ---------- */
  let timers = [];
  function scheduleLocal(){
    timers.forEach(clearTimeout); timers = [];
    if(!('Notification' in window) || Notification.permission!=='granted') return;
    const now = Date.now();
    (D.eventos||[]).filter(e=>e.hasTime && e.ts>now && e.ts-now < 24*3600000).forEach(e=>{
      timers.push(setTimeout(()=>{ try{ new Notification('◆ '+e.title, {body:'Es la hora.'}); }catch(_){} }, e.ts-now));
    });
  }
  function askNotif(){
    if('Notification' in window && Notification.permission==='default'){
      Notification.requestPermission().then(()=>scheduleLocal());
    }
  }

  /* ---------- vista semanal ---------- */
  let semanaOffset = 0;

  function renderAgenda(){
    const el = document.getElementById('ag-sem'); if(!el) return;
    const hoy0 = new Date(); hoy0.setHours(0,0,0,0);
    const lunes = lunesDe(new Date());
    lunes.setDate(lunes.getDate() + semanaOffset*7);
    const {dias, res} = ocurrenciasSemana(lunes);

    const fin = new Date(lunes); fin.setDate(fin.getDate()+6);
    const rango = lunes.getDate()+' '+(lunes.getMonth()===fin.getMonth()?'':MONTH_NAME[lunes.getMonth()].slice(0,3)+' ')+
                  '– '+fin.getDate()+' '+MONTH_NAME[fin.getMonth()].slice(0,3);
    const nTareas = dias.reduce((a,d)=>a+res[ymd(d)].length,0);

    let html =
      '<div class="ag-wnav">'+
        '<button class="ag-wbtn" data-w="-1">◀</button>'+
        '<div class="ag-wttl"><b>'+(semanaOffset===0?'Esta semana':rango)+'</b>'+
          '<span>'+(semanaOffset===0?rango:'')+(semanaOffset!==0?'<button class="ag-whoy" data-w="0">volver a hoy</button>':' · '+nTareas+' tareas')+'</span></div>'+
        '<button class="ag-wbtn" data-w="1">▶</button>'+
      '</div>';

    dias.forEach(d=>{
      const k = ymd(d);
      const evs = res[k];
      const esHoy = +d===+hoy0;
      const pasado = d < hoy0;
      const marcas = (D.log[k]||[]).length;                 // actividad de hábitos ese día
      html += '<div class="ag-dia'+(esHoy?' hoy':'')+(pasado?' pasado':'')+'">'+
        '<div class="ag-dhdr">'+
          '<span class="ag-ddw">'+DOW_SHORT[d.getDay()]+'</span>'+
          '<span class="ag-dnum">'+d.getDate()+'</span>'+
          (esHoy?'<span class="ag-dtag">hoy</span>':'')+
          (marcas?'<span class="ag-dhab" title="hábitos completados">✦ '+marcas+'</span>':'')+
        '</div>';
      if(evs.length===0){
        html += '<div class="ag-libre">—</div>';
      } else {
        evs.forEach(o=>{
          const e = o.ev;
          const rep = e.recurrence ? ' rep':'';
          const col = e.hasTime
            ? '<span class="t">'+pad(new Date(o.ts).getHours())+':'+pad(new Date(o.ts).getMinutes())+'</span>'
            : '<span class="ad">día</span>';
          const bg = e.recurrence ? '<span class="bg">↻</span>' : '';
          html += '<div class="ag-ev'+rep+'">'+col+
            '<span class="nm">'+agEsc(e.title)+'</span>'+bg+
            '<span class="ac">'+
              '<button class="ag-ib" data-cal="'+e.id+'" title="Añadir al Calendario de iOS">📅</button>'+
              '<button class="ag-ib" data-del="'+e.id+'" title="Borrar">✕</button>'+
            '</span></div>';
        });
      }
      html += '</div>';
    });

    if(nTareas===0 && (D.eventos||[]).length===0){
      html += '<div class="ag-empty"><b>Semana despejada</b>Dicta tu primera misión arriba.</div>';
    }
    el.innerHTML = html;
  }

  /* ---------- preview editable ---------- */
  function showPreview(p){
    const box = document.getElementById('ag-preview');
    const d = p.date;
    const dateStr = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const timeStr = pad(d.getHours())+':'+pad(d.getMinutes());
    box.innerHTML =
      '<div class="ag-prev">'+
        '<div class="l">Misión</div>'+
        '<div class="r"><input id="ag-p-title" value="'+agEsc(p.title)+'"></div>'+
        '<div class="r">'+
          '<div class="h"><div class="l">Día</div><input id="ag-p-date" type="date" value="'+dateStr+'"></div>'+
          '<div class="h"><div class="l">Hora</div><input id="ag-p-time" type="time" value="'+timeStr+'"></div>'+
        '</div>'+
        '<div class="r">'+
          '<div class="h"><div class="l">Repetir</div><select id="ag-p-rep">'+
            '<option value="">No repetir</option>'+
            '<option value="daily"'+(p.recurrence&&p.recurrence.type==='daily'?' selected':'')+'>Cada día</option>'+
            '<option value="weekly"'+(p.recurrence&&p.recurrence.type==='weekly'?' selected':'')+'>Cada semana (ese día)</option>'+
          '</select></div>'+
          '<div class="h"><div class="l">&nbsp;</div><label class="ck"><input type="checkbox" id="ag-p-ht"'+(p.hasTime?' checked':'')+'> con hora</label></div>'+
        '</div>'+
        '<div class="acts"><button id="ag-no">Descartar</button><button id="ag-ok">✓ Guardar</button></div>'+
      '</div>';
    document.getElementById('ag-ok').addEventListener('click',()=>{
      const title = document.getElementById('ag-p-title').value.trim() || 'Recordatorio';
      const dv = document.getElementById('ag-p-date').value.split('-').map(Number);
      const tv = document.getElementById('ag-p-time').value.split(':').map(Number);
      const hasTime = document.getElementById('ag-p-ht').checked;
      const dt = new Date(dv[0], dv[1]-1, dv[2], hasTime?tv[0]:9, hasTime?tv[1]:0, 0, 0);
      const rv = document.getElementById('ag-p-rep').value;
      let recurrence = null;
      if(rv==='daily') recurrence={type:'daily'};
      else if(rv==='weekly') recurrence={type:'weekly', dow:dt.getDay()};
      // si el evento cae fuera de la semana visible, vuelve a la semana del evento
      const lunEv = lunesDe(dt), lunHoy = lunesDe(new Date());
      semanaOffset = Math.round((lunEv - lunHoy)/(7*864e5));
      addEvento({title, date:dt, hasTime, recurrence});
      box.innerHTML='';
      const ta=document.getElementById('ag-texto'); if(ta){ ta.value=''; ta.style.height='auto'; }
      agToast('Misión guardada ✓');
    });
    document.getElementById('ag-no').addEventListener('click',()=>{ box.innerHTML=''; });
  }

  /* ---------- toast ---------- */
  let toastT;
  function agToast(msg){
    let el = document.getElementById('ag-toast');
    if(!el){ el=document.createElement('div'); el.className='ag-toast'; el.id='ag-toast'; document.body.appendChild(el); }
    el.textContent=msg; el.classList.add('show');
    clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'), 2200);
  }

  /* ---------- init ---------- */
  function initAgenda(){
    const host = document.getElementById('pag-agenda'); if(!host) return;
    host.innerHTML =
      '<div class="ag-h1">◆ Agenda</div>'+
      '<div class="ag-sub">Dicta lo que tengas que hacer · calendario semanal</div>'+
      '<div class="ag-cap">'+
        '<label>Nueva entrada</label>'+
        '<div class="ag-bar">'+
          '<textarea id="ag-texto" rows="1" placeholder="Toca aquí, pulsa el 🎤 del teclado y habla…"></textarea>'+
          '<button id="ag-add" aria-label="Añadir">＋</button>'+
        '</div>'+
        '<div class="ag-tip"><b>Ej.:</b> "cada lunes reunión a las 9" · "el jueves dentista a las 5 y media"</div>'+
        '<div id="ag-preview"></div>'+
      '</div>'+
      '<div class="ag-list" id="ag-sem"></div>'+
      '<div class="ag-back">Inicio ▶</div>';
    const ta = document.getElementById('ag-texto');
    ta.addEventListener('input', ()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,140)+'px'; });
    document.getElementById('ag-add').addEventListener('click', ()=>{
      const raw = ta.value.trim(); if(!raw){ ta.focus(); return; }
      askNotif(); showPreview(parseVoz(raw, new Date()));
    });
    document.getElementById('ag-sem').addEventListener('click', (e)=>{
      const w = e.target.closest('[data-w]');
      if(w){ const v=w.dataset.w; semanaOffset = (v==='0') ? 0 : semanaOffset + (+v); renderAgenda(); return; }
      const cal = e.target.closest('[data-cal]'); const del = e.target.closest('[data-del]');
      if(cal){ const ev=(D.eventos||[]).find(x=>x.id===cal.dataset.cal); if(ev) exportICS(ev); }
      if(del){ delEvento(del.dataset.del); }
    });
    renderAgenda();
  }

  initAgenda();
  scheduleLocal();
})();

// abrir en la página de Inicio (índice 1), no en la Agenda
function irAInicio(){ pagEl.scrollLeft = pagEl.clientWidth; actualizarDots(); }
requestAnimationFrame(irAInicio);
setTimeout(irAInicio, 60);
