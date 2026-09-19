// Ejecutar: node simbolos/tests/composicion.test.cjs. Sin dependencias externas.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context=vm.createContext({performance});context.window=context;
for(const name of ['pueblos','patrones','composicion','motor'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),context);
const C=context.Composicion;
for(const pueblo of context.Patrones.pueblos){
 C.reset(pueblo.id,false);assert.equal(C.items.length,3);
 for(const def of context.Patrones.piezas[pueblo.id]){
  C.clear();C.add(def.id);const before=JSON.stringify(C.cells(C.current()));
  for(let i=0;i<4;i++)C.rotate();assert.equal(JSON.stringify(C.cells(C.current())),before);
  C.flip();C.flip();assert.equal(JSON.stringify(C.cells(C.current())),before);
  const cell=C.cells(C.current())[0],count=C.cells(C.current()).length;
  C.color('#123456',[cell.x,cell.y]);assert.equal(C.cells(C.current()).filter(c=>c.color==='#123456').length,1);
  assert.equal(C.cells(C.current()).length,count);
  C.color('#abcdef');assert.ok(C.cells(C.current()).every(c=>c.color==='#abcdef'));
  C.move(-999,999);assert.ok(C.cells(C.current()).every(c=>c.x>=0&&c.y>=0&&c.x<21&&c.y<21));
  C.duplicate();assert.equal(C.items.length,2);C.undo();assert.equal(C.items.length,1);C.redo();assert.equal(C.items.length,2);
  C.remove();assert.equal(C.items.length,1);C.clear();assert.equal(C.compose().size,0);C.undo();assert.equal(C.items.length,1);
 }
}
C.clear();for(let i=0;i<24;i++)assert.ok(C.add('om-rombo'));assert.equal(C.add('om-rombo'),null);
assert.equal(C.add('no-existe'),null);
vm.runInContext(`{
 const figure=Motor.crear(21), grid=new Map();for(let y=0;y<21;y++)for(let x=0;x<21;x++)grid.set(x+','+y,'#123456');
 figure.fijar(grid,100);let painted=0;const ctx={save(){},restore(){},fillRect(){painted++;}};
 if(figure.dibujar(ctx,0,0,10,100,{})!==false||painted!==441)throw Error('La actualización directa debe dibujar completa sin morph');
 figure.cargar(new Map([['2,2','#abcdef']]),200);if(!figure.dibujar({...ctx,translate(){},rotate(){}},0,0,10,220,{}))throw Error('El morph compartido debe seguir animado');
}`,context);
console.log('OK: 18 piezas, rotación, espejo, colores, límites, historial y render directo/morph.');
