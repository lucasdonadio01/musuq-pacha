/* Archivo comunitario: usuarios ficticios y anotaciones sobre texto.
   La autoría documental se conserva. Aportes y comentarios nuevos son una
   demostración en memoria: no hay envío, moderación ni persistencia remota. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),panel=$('detalle');
  const usuarios=['@trama.del.sur','@semilla.norte','@entre.tramas','@rio.abierto','@memoria.pampa'];
  const demo=window.MUSUQ_MESA.flatMap(c=>c.laminas).find(d=>d.id==='QUw003');
  window.MUSUQ_MESA=window.MUSUQ_MESA.map(c=>({...c,laminas:c.laminas.filter(d=>d.id!=='QUw003').map((d,i)=>({...d,aportante:usuarios[i%usuarios.length],avatar:902+i*83}))}));
  const logged=()=>!!window.MUSUQ_SESION?.activa;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||window.MUSUQ_A11Y?.estado.detener;
  const el=(tag,cl,text)=>{const e=document.createElement(tag);e.className=cl||'';if(text)e.textContent=text;return e;};
  const btn=(text,cl='')=>{const b=el('button','pixel-button '+cl,text);b.type='button';return b;};
  const avatar=(seed,i=0)=>window.MUSUQ_SESION.avatar(seed,i);
  let api,current=null,selection=null,opened=null,pinned=null,opener=null,closing=false,changing=false,formMode='',serial=0;
  const comments=new Map(),texts=new Map(),fields=['detalle-contexto','lamina-descripcion','lamina-limite'];
  let hoverExit;
  function leaveComment(){clearTimeout(hoverExit);hoverExit=setTimeout(()=>{if(thread.matches(':hover')||thread.contains(document.activeElement))return;const fixed=list().find(c=>c.id===pinned);if(fixed)displayComment(fixed);else closeThread();},160);}
  const actions=el('div','archivo-acciones');$('volver-categoria').before(actions);actions.append($('volver-categoria'));
  const collaborate=btn('Colaborar con material','aporte-naranja');actions.append(collaborate);
  // Google Material Icons: add_photo_alternate (Apache 2.0).
  const contributeIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  contributeIcon.setAttribute('viewBox','0 0 24 24');contributeIcon.setAttribute('aria-hidden','true');
  contributeIcon.innerHTML='<path fill="currentColor" d="M21 3h-3V0h-2v3h-3v2h3v3h2V5h3zM19 19H5V5h6V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8h-2v8zM9 14l2.03 2.71L14 13l4 5H6z"/>';
  collaborate.prepend(contributeIcon);
  const uploader=el('div','archivo-aportante');$('lamina-tipo').after(uploader);
  const socialNote=el('p','archivo-social-nota','Aportantes y comentarios de demostración');uploader.after(socialNote);
  const wrappers=new Map();
  for(const id of fields){const p=$(id),wrap=el('div','texto-comentable'),rail=el('div','texto-avatares');p.before(wrap);wrap.append(p,rail);wrappers.set(id,{p,wrap,rail});p.dataset.comentable=id;}
  const thread=el('section','archivo-hilo');thread.hidden=true;thread.setAttribute('aria-label','Comentario de la comunidad');panel.append(thread);
  const selectionButton=btn('Dejar un comentario','aporte-naranja seleccion-comentar');selectionButton.hidden=true;document.body.append(selectionButton);
  const dialog=el('dialog','aporte-dialog');dialog.setAttribute('aria-labelledby','aporte-titulo');document.body.append(dialog);
  const close=btn('×','aporte-cerrar');close.setAttribute('aria-label','Cerrar');const content=el('div','aporte-contenido');dialog.append(close,content);
  function motion(target,frames,options){return reduced()?Promise.resolve():target.animate(frames,options).finished.catch(()=>{});}
  async function dismiss(){if(closing||!dialog.open)return;closing=true;await motion(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(14px)'}],{duration:180,easing:'ease-in',fill:'forwards'});dialog.close();dialog.getAnimations().forEach(a=>a.cancel());closing=false;opener?.focus({preventScroll:true});}
  function show(trigger){opener=trigger||document.activeElement;dialog.showModal();motion(dialog,[{opacity:0,transform:'translateY(20px) scale(.98)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});content.querySelector('h2')?.focus({preventScroll:true});}
  async function change(fn){if(changing)return;changing=true;await motion(content,[{opacity:1},{opacity:0}],{duration:100});if(dialog.open){fn();dialog.scrollTop=0;await motion(content,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:230,easing:'ease-out'});}changing=false;}
  function heading(title,lead){content.replaceChildren();const h=el('h2','',title);h.id='aporte-titulo';h.tabIndex=-1;content.append(h);if(lead)content.append(el('p','aporte-intro',lead));}
  close.onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();dismiss();});dialog.addEventListener('keydown',e=>e.stopPropagation());
  function field(form,label,tag='input',attrs={}){const l=el('label','aporte-campo',label),e=el(tag);Object.assign(e,attrs);l.append(e);form.append(l);return e;}
  function startForm(){
    formMode='blank';heading('Colaborar con material','Compartí una imagen, una breve descripción y su fuente.');
    const form=el('form','aporte-form');form.noValidate=true;
    const pick=btn('Elegir foto','aporte-elegir');form.append(pick);
    field(form,'Título','input',{placeholder:'Nombre del material',maxLength:120});
    field(form,'Breve descripción','textarea',{placeholder:'Contanos qué muestra.',rows:3,maxLength:600});
    field(form,'Fuente','input',{type:'url',placeholder:'https://…'});
    const next=btn('Siguiente','aporte-naranja');next.type='submit';form.append(next);content.append(form);
    const fill=e=>{e.preventDefault();e.stopPropagation();if(logged())change(review);};
    form.addEventListener('click',e=>{if(e.target.closest('button,input,textarea,label'))fill(e);},true);
    form.addEventListener('keydown',e=>{if(e.target.matches('input,textarea')&&(e.key.length===1||e.key==='Enter'))fill(e);},true);
    form.onsubmit=fill;
  }
  function review(){
    formMode='review';heading('Tu material está listo','Revisá la información y finalizá para verlo en el archivo.');
    const form=el('form','aporte-form'),img=el('img','aporte-preview');img.src=demo.imagen;img.alt=demo.titulo;form.append(img);
    field(form,'Título','input',{value:demo.titulo,readOnly:true});field(form,'Breve descripción','textarea',{value:demo.descripcion,readOnly:true,rows:4});field(form,'Fuente','input',{type:'url',value:demo.fuente,readOnly:true});
    form.append(el('p','aporte-contexto',demo.atribucion));const finish=btn('Finalizar','aporte-naranja');finish.type='submit';form.append(finish);content.append(form);
    const error=el('p','aporte-error');error.setAttribute('role','alert');form.append(error);
    form.onsubmit=async e=>{e.preventDefault();if(!logged()||finish.disabled)return;finish.disabled=true;finish.textContent='Preparando material…';try{const ready=new Image();ready.src=demo.imagen;await ready.decode();if(!logged())return;await dismiss();api.agregar({...demo,aportante:'Vos',avatar:1907,aporteDemo:true});}catch{error.textContent='No pudimos abrir la imagen. Volvé a intentar.';}finally{finish.disabled=false;finish.textContent='Finalizar';}};
  }
  collaborate.onclick=()=>{if(logged()){startForm();show(collaborate);return;}formMode='login';heading('Sumate al archivo','Iniciá sesión para colaborar con material.');const login=btn('Iniciar sesión','aporte-naranja');content.append(login);show(collaborate);login.onclick=()=>{$('ingresar').click();change(startForm);};};
  function list(){return comments.get(current?.id)||[];}
  function seedComments(){if(comments.has(current.id))return;const messages=['¿Podemos sumar otra fuente para comparar este fragmento?','Me interesa cómo se describe este contexto. ¿Hay más material para leer?','Gracias por incluir la referencia original: ayuda a seguir investigando.','Sería interesante comparar esta descripción con otros documentos del archivo.','Esta aclaración es importante para no confundir la imagen con un testimonio directo.'];
    comments.set(current.id,messages.map((text,i)=>{const fieldId=fields[i<2?0:i<4?1:2],textValue=texts.get(fieldId)||'',start=i%2?Math.floor(textValue.length*.5):0,end=Math.min(textValue.length,start+Math.max(15,Math.floor(textValue.length*.25)));return {id:'demo-'+i,field:fieldId,start,end,quote:textValue.slice(start,end),text,author:usuarios[i],seed:902+i*83,index:i};}).filter(c=>c.end>c.start));}
  function highlight(id){panel.querySelectorAll('mark[data-comments]').forEach(m=>m.classList.toggle('activo',!!id&&m.dataset.comments.split(' ').includes(id)));}
  function closeThread(){clearTimeout(hoverExit);opened=pinned=null;highlight(null);thread.hidden=true;panel.classList.remove('comentarios-abiertos');panel.querySelectorAll('.texto-avatar').forEach(b=>b.setAttribute('aria-expanded','false'));}
  function displayComment(c,pin=false){clearTimeout(hoverExit);if(pin)pinned=c.id;opened=c.id;selectionButton.hidden=true;panel.classList.add('comentarios-abiertos');highlight(c.id);
    panel.querySelectorAll('.texto-avatar').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.id===c.id)));
    thread.replaceChildren();thread.hidden=false;const head=el('div','archivo-hilo__cabecera'),who=el('div','archivo-hilo__autor');who.append(avatar(c.seed,c.index),el('strong','',c.author));const dismissThread=btn('×','hilo-cerrar');dismissThread.setAttribute('aria-label','Cerrar comentarios');dismissThread.onclick=closeThread;head.append(who,dismissThread);
    thread.append(head,el('blockquote','',c.quote),el('p','archivo-hilo__texto',c.text));
    // The comment lives beside the paragraph it annotates, not at the end of the sheet.
    wrappers.get(c.field).wrap.after(thread);
    if(pin)requestAnimationFrame(()=>thread.scrollIntoView({block:'nearest',behavior:reduced()?'instant':'smooth'}));
    thread.onpointerenter=()=>{clearTimeout(hoverExit);highlight(c.id);};thread.onpointerleave=leaveComment;thread.onfocusout=leaveComment;
  }
  function drawAnnotations(){for(const [id,{p,rail}] of wrappers){const text=texts.get(id)||'',items=list().filter(c=>c.field===id);p.replaceChildren();rail.replaceChildren();
    const cuts=[...new Set([0,text.length,...items.flatMap(c=>[c.start,c.end])])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){const from=cuts[i],to=cuts[i+1],ids=items.filter(c=>c.start<=from&&c.end>=to).map(c=>c.id);const part=ids.length?el('mark','texto-subrayado',text.slice(from,to)):document.createTextNode(text.slice(from,to));if(ids.length)part.dataset.comments=ids.join(' ');p.append(part);}
    items.forEach(c=>{const b=el('button','texto-avatar');b.type='button';b.dataset.id=c.id;b.setAttribute('aria-label','Comentario de '+c.author);b.setAttribute('aria-expanded','false');b.append(avatar(c.seed,c.index));b.onpointerenter=e=>{if(e.pointerType!=='touch')displayComment(c);};b.onpointerleave=leaveComment;b.onfocus=()=>displayComment(c);b.onblur=leaveComment;b.onclick=()=>displayComment(c,true);rail.append(b);});
  }}
  function refresh(){current=api.actual();selection=null;selectionButton.hidden=true;closeThread();if(!current)return;texts.clear();fields.forEach(id=>texts.set(id,$(id).textContent));uploader.replaceChildren();uploader.append(avatar(current.avatar||1907,Math.max(0,usuarios.indexOf(current.aportante))),el('span','','Aportado por '),el('strong','',current.aportante||'@archivo.compartido'));seedComments();drawAnnotations();}
  function selectionInfo(){const s=getSelection();if(!logged()||!current||!s?.rangeCount||s.isCollapsed)return null;const r=s.getRangeAt(0);const parent=n=>n.nodeType===1?n:n.parentElement;const a=parent(r.startContainer)?.closest('[data-comentable]'),z=parent(r.endContainer)?.closest('[data-comentable]');if(!a||a!==z||!r.toString().trim())return null;const prefix=r.cloneRange();prefix.selectNodeContents(a);prefix.setEnd(r.startContainer,r.startOffset);const start=prefix.toString().length;return {field:a.id,start,end:start+r.toString().length,quote:r.toString(),rect:r.getBoundingClientRect(),doc:current.id};}
  function offer(){if(dialog.open)return;const s=selectionInfo();if(!s){selectionButton.hidden=true;return;}selection=s;selectionButton.hidden=false;const w=selectionButton.offsetWidth;selectionButton.style.left=Math.max(12,Math.min(innerWidth-w-12,s.rect.left))+'px';selectionButton.style.top=Math.max(12,Math.min(innerHeight-55,s.rect.bottom+8))+'px';}
  document.addEventListener('selectionchange',()=>{clearTimeout(offer.timer);offer.timer=setTimeout(offer,100);});panel.addEventListener('pointerup',()=>setTimeout(offer,0));panel.addEventListener('scroll',()=>selectionButton.hidden=true);
  selectionButton.addEventListener('pointerdown',e=>e.preventDefault());
  selectionButton.onclick=()=>{if(!selection||!logged())return;const target={...selection};formMode='comment';heading('Dejar un comentario','Tu comentario quedará vinculado a este fragmento.');content.append(el('blockquote','comentario-cita',target.quote));const form=el('form','aporte-form'),text=field(form,'Comentario','textarea',{required:true,maxLength:500,rows:4});const save=btn('Publicar comentario','aporte-naranja');save.type='submit';form.append(save);content.append(form);selectionButton.hidden=true;show(panel);text.focus();
    form.onsubmit=e=>{e.preventDefault();if(!logged()||!text.value.trim()||api.actual()?.id!==target.doc)return;const c={...target,id:'propio-'+(++serial),text:text.value.trim(),author:'Vos',seed:1907,index:0};comments.get(target.doc).push(c);getSelection()?.removeAllRanges();drawAnnotations();displayComment(c,true);opener=panel.querySelector('[data-id="'+c.id+'"]');dismiss();};};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open&&(opened||!selectionButton.hidden)){e.preventDefault();e.stopImmediatePropagation();selectionButton.hidden=true;closeThread();}},true);
  addEventListener('musuq:sesion',()=>{if(!logged()){selectionButton.hidden=true;if(dialog.open)dismiss();}});
  addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  window.MUSUQ_ARCHIVO_APORTES={montar(a){api=a;},cambiarVista(){selectionButton.hidden=true;closeThread();current=null;},actualizar(){if(api?.actual()?.id!==current?.id)refresh();}};
})();
