/* Estado de piezas discretas. Motor sigue siendo el único dueño del morph.
   Nunca añade celdas que no pertenezcan a una pieza del catálogo. */
window.Composicion=(()=>{
 const N=21,limite=24;
 let items=[],selected=null,serial=0,undo=[],redo=[];
 const clone=v=>JSON.parse(JSON.stringify(v));
 const find=id=>Object.values(Patrones.piezas).flat().find(d=>d.id===id);
 function cells(item){const d=find(item.tipo),w=d.filas[0].length,h=d.filas.length,result=[];
  d.filas.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='.')return;let a=item.flip?w-1-x:x,b=y,W=w,H=h;for(let i=0;i<item.turn;i++){[a,b]=[H-1-b,a];[W,H]=[H,W];}result.push({x:a+item.x,y:b+item.y,color:item.colors[y*w+x]||item.palette[+v-1],key:y*w+x});}));return result;}
 const snapshot=()=>({items:clone(items),selected});
 function checkpoint(){undo.push(snapshot());if(undo.length>60)undo.shift();redo=[];}
 function bounds(item){const d=find(item.tipo);return item.turn%2?[d.filas.length,d.filas[0].length]:[d.filas[0].length,d.filas.length];}
 function clamp(item){const[w,h]=bounds(item);item.x=Math.max(0,Math.min(N-w,Math.round(item.x)));item.y=Math.max(0,Math.min(N-h,Math.round(item.y)));}
 function add(tipo,x,y,save=true){if(items.length>=limite)return null;const d=find(tipo);if(!d)return null;if(save)checkpoint();const item={id:++serial,tipo,x:x??Math.floor((N-d.filas[0].length)/2),y:y??Math.floor((N-d.filas.length)/2),turn:0,flip:false,palette:[...d.colores],colors:{}};clamp(item);items.push(item);selected=item.id;return item;}
 function hit(x,y){return [...items].reverse().find(i=>cells(i).some(c=>c.x===x&&c.y===y));}
 function current(){return items.find(i=>i.id===selected);}
 function mutate(fn){const i=current();if(!i)return false;checkpoint();fn(i);clamp(i);return true;}
 function compose(){const grid=new Map();items.forEach(i=>cells(i).forEach(c=>grid.set(c.x+','+c.y,c.color)));return grid;}
 function restore(value){items=value.items;selected=value.selected;}
 return {N,limite,find,cells,bounds,current,hit,compose,checkpoint,add,
  get items(){return items;},get selected(){return selected;},select(id){selected=id;},get canUndo(){return !!undo.length;},get canRedo(){return !!redo.length;},
  move(x,y,save=true){const i=current();if(!i)return;if(save)checkpoint();i.x=x;i.y=y;clamp(i);},
  rotate(){return mutate(i=>i.turn=(i.turn+1)%4);},flip(){return mutate(i=>i.flip=!i.flip);},
  duplicate(){const i=current();if(!i)return null;const d=add(i.tipo,i.x+2,i.y+2);if(d){d.turn=i.turn;d.flip=i.flip;d.colors=clone(i.colors);d.palette=[...i.palette];clamp(d);}return d;},
  remove(){if(!current())return;checkpoint();items=items.filter(i=>i.id!==selected);selected=items.at(-1)?.id??null;},
  clear(){if(!items.length)return;checkpoint();items=[];selected=null;},
  color(hex,cell){return mutate(i=>{if(cell){const c=cells(i).find(c=>c.x===cell[0]&&c.y===cell[1]);if(c)i.colors[c.key]=hex;}else{i.palette=i.palette.map(()=>hex);i.colors={};}});},
  undo(){if(!undo.length)return;redo.push(snapshot());restore(undo.pop());},redo(){if(!redo.length)return;undo.push(snapshot());restore(redo.pop());},
  switchTo(pueblo,draft){undo=[];redo=[];if(draft)restore(clone(draft));else this.reset(pueblo,false);},
  reset(pueblo,save=true){if(save)checkpoint();items=[];selected=null;const defs=Patrones.piezas[pueblo];[0,2,4].forEach((n,k)=>add(defs[n].id,[3,11,6][k],[3,4,13][k],false));},
  variation(pueblo){checkpoint();items=[];selected=null;const defs=Patrones.piezas[pueblo];[0,1,2,3].forEach((_,k)=>{const d=defs[Math.floor(Math.random()*defs.length)];const i=add(d.id,k%2?12:2,k<2?2:12,false);i.turn=Math.floor(Math.random()*4);clamp(i);});}
 };
})();
