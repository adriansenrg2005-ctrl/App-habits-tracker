// indicador de página (3 páginas)
const pagEl = document.getElementById("paginas");
function actualizarDots(){
  const p = Math.round(pagEl.scrollLeft / pagEl.clientWidth);
  for (let i=0;i<3;i++){ const d=document.getElementById("dot"+i); if(d) d.classList.toggle("activo", p===i); }
}
pagEl.addEventListener("scroll", actualizarDots);

renderForm();
render();

