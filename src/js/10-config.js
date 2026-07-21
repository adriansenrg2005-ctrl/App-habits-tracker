// ================= Config =================
const CATS = [
  { id:"cuerpo", name:"Cuerpo", color:"#4ED6FF" },
  { id:"mente", name:"Mente", color:"#7C5CFF" },
  { id:"disciplina", name:"Disciplina", color:"#FFB454" },
  { id:"social", name:"Social", color:"#FF6E9C" },
  { id:"energia", name:"Energía", color:"#5EF0A0" },
];
const XP_POS = 10, XP_NEG = 15;
const DECAY_GRACIA = 2, DECAY_DIARIO = 0.98, DECAY_SUELO = 0.6;
const KEY = "habit-rpg";

const PRESETS = [
  { name:"Fumar", tipo:"malo", cats:["cuerpo","energia"], freq:{tipo:"diario"} },
  { name:"Hacer deporte", tipo:"bueno", cats:["cuerpo","energia","disciplina"], freq:{tipo:"semanal",objetivo:3}, titulo:"Espartano" },
  { name:"Leer", tipo:"bueno", cats:["mente"], freq:{tipo:"diario"} },
  { name:"Hablar con 5 personas", tipo:"bueno", cats:["social"], freq:{tipo:"diario"} },
  { name:"Caer", tipo:"malo", cats:["disciplina","energia"], freq:{tipo:"diario"} },
  { name:"1h a un proyecto", tipo:"bueno", cats:["mente","disciplina"], freq:{tipo:"semanal",objetivo:4}, titulo:"Constructor" },
  { name:"+1h seguida con el móvil", tipo:"malo", cats:["mente","disciplina"], freq:{tipo:"diario"} },
  { name:"Estudiar 1h+ (uni)", tipo:"bueno", cats:["mente","disciplina"], freq:{tipo:"diario"} },
  { name:"Dormir antes de las 00:30", tipo:"bueno", cats:["energia","disciplina"], freq:{tipo:"diario"} },
  { name:"Planificar el día (5 min)", tipo:"bueno", cats:["disciplina"], freq:{tipo:"diario"} },
  { name:"Comida basura", tipo:"malo", cats:["cuerpo","energia"], freq:{tipo:"diario"} },
  { name:"Quedar con amigos", tipo:"bueno", cats:["social","energia"], freq:{tipo:"semanal",objetivo:2}, titulo:"Alma del grupo" },
  { name:"Llamar a un amigo o familiar", tipo:"bueno", cats:["social"], freq:{tipo:"semanal",objetivo:2}, titulo:"Cercano" },
];
const TITULOS_STAT = { cuerpo:"Titán", mente:"Erudito", disciplina:"Estratega", social:"Carismático", energia:"Dínamo" };

const LOGROS = [
  { id:"primero", n:"Primer paso", d:"Completa tu primer hábito", ico:"🌱",
    check:c=>c.totalBuenas>=1, prog:c=>Math.min(1,c.totalBuenas)+"/1" },
  { id:"r3", n:"En llamas", d:"Racha de 3 días en un hábito (x1.5 XP)", ico:"🔥",
    check:c=>c.mejorRacha>=3, prog:c=>Math.min(3,c.mejorRacha)+"/3" },
  { id:"r7", n:"Imparable", d:"Racha de 7 días (x2 XP)", ico:"⚡",
    check:c=>c.mejorRacha>=7, prog:c=>Math.min(7,c.mejorRacha)+"/7" },
  { id:"r30", n:"Leyenda viva", d:"Racha de 30 días en un hábito", ico:"🐉",
    check:c=>c.mejorRacha>=30, prog:c=>Math.min(30,c.mejorRacha)+"/30" },
  { id:"limpio7", n:"Escudo templado", d:"7 días limpio de un vicio", ico:"🛡️",
    check:c=>c.mejorLimpio>=7, prog:c=>Math.min(7,c.mejorLimpio)+"/7" },
  { id:"limpio30", n:"Voluntad de hierro", d:"30 días limpio de un vicio", ico:"⚔️",
    check:c=>c.mejorLimpio>=30, prog:c=>Math.min(30,c.mejorLimpio)+"/30" },
  { id:"cien", n:"Centurión", d:"100 hábitos completados en total", ico:"🏛️",
    check:c=>c.totalBuenas>=100, prog:c=>Math.min(100,c.totalBuenas)+"/100" },
  { id:"quini", n:"Imperator", d:"500 hábitos completados en total", ico:"👑",
    check:c=>c.totalBuenas>=500, prog:c=>Math.min(500,c.totalBuenas)+"/500" },
  { id:"nivel5", n:"Aventurero", d:"Alcanza el nivel 5", ico:"🗡️",
    check:c=>c.nivel>=5, prog:c=>Math.min(5,c.nivel)+"/5" },
  { id:"nivel10", n:"Veterano", d:"Alcanza el nivel 10", ico:"🏆",
    check:c=>c.nivel>=10, prog:c=>Math.min(10,c.nivel)+"/10" },
  { id:"nivel25", n:"Élite", d:"Alcanza el nivel 25", ico:"💎",
    check:c=>c.nivel>=25, prog:c=>Math.min(25,c.nivel)+"/25" },
];

