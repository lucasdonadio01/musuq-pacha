(function () {
  'use strict';
  const especies = {
    quenoa: {nombre:'Queñoa', cientifico:'Polylepis tomentella', forma:'torcido', hoja:'#809953', tronco:'#aa6841', alto:0.70},
    blanco: {nombre:'Algarrobo blanco', cientifico:'Neltuma alba (sin. Prosopis alba)', forma:'parasol', hoja:'#7aa34f', tronco:'#90734b', alto:0.93},
    quebracho: {nombre:'Quebracho blanco', cientifico:'Aspidosperma quebracho-blanco', forma:'vertical', hoja:'#728f69', tronco:'#c1aa85', alto:1.07},
    dulce: {nombre:'Algarrobo dulce', cientifico:'Neltuma flexuosa (sin. Prosopis flexuosa)', forma:'abierto', hoja:'#91a85b', tronco:'#967249', alto:0.85},
    tabaquillo: {nombre:'Tabaquillo', cientifico:'Polylepis australis', forma:'torcido', hoja:'#619975', tronco:'#bd7950', alto:0.87},
    lapacho: {nombre:'Lapacho negro / rosado', cientifico:'Handroanthus heptaphyllus', forma:'redondo', hoja:'#d48da5', tronco:'#817254', alto:1.06},
    parana: {nombre:'Pino Paraná', cientifico:'Araucaria angustifolia', forma:'araucaria', hoja:'#417d59', tronco:'#8a7253', alto:1.27},
    tala: {nombre:'Tala', cientifico:'Celtis tala', forma:'redondo', hoja:'#8ba755', tronco:'#947f53', alto:0.83},
    calden: {nombre:'Caldén', cientifico:'Neltuma caldenia (sin. Prosopis caldenia)', forma:'parasol', hoja:'#a8ae5b', tronco:'#836747', alto:1.00},
    nire: {nombre:'Ñire', cientifico:'Nothofagus antarctica', forma:'torcido', hoja:'#bdad58', tronco:'#897453', alto:0.78},
    pehuen: {nombre:'Pehuén', cientifico:'Araucaria araucana', forma:'pehuen', hoja:'#568466', tronco:'#8b7257', alto:1.23},
    guindo: {nombre:'Guindo', cientifico:'Nothofagus betuloides', forma:'vertical', hoja:'#3d8873', tronco:'#85745a', alto:1.04}
  };
  const porZona = {
    1:['quenoa'], 2:['quenoa','blanco'], 3:['dulce'], 4:['blanco','quebracho'], 5:['blanco','quebracho'],
    6:['blanco','quebracho'], 7:['tabaquillo','blanco'], 8:['dulce'], 9:['blanco','quebracho'], 10:['blanco','quebracho'],
    11:['blanco','lapacho'], 12:['lapacho','parana'], 13:['tala'], 14:['calden','tala'],
    15:['nire'], 16:['nire'], 17:['pehuen','nire'], 18:['guindo','nire'], 19:['blanco','quebracho']
  };
  const notas = {
    1:'Queñoales puntuales de la Puna jujeña; el desierto y los salares quedan abiertos.',
    2:'Queñoa en altura y algarrobo en valles. Distribución ilustrativa, no uniforme.',
    7:'Tabaquillos serranos y algarrobos en sectores bajos; se conservan claros.',
    11:'Algarrobo chaqueño y lapacho en el sector oriental más húmedo.',
    12:'Lapacho en el NEA; pino Paraná restringido al noreste de Misiones.',
    14:'Caldén hacia el oeste y tala hacia el este; los pastizales quedan abiertos.',
    15:'Ñires sólo en la franja andina. La estepa patagónica permanece sin bosque.',
    16:'Ñires sólo en el borde del ecotono austral; el norte estepario queda abierto.',
    17:'Pehuén en el oeste de Neuquén, no en toda la provincia ni en Mendoza.',
    18:'Guindo y ñire en el ambiente boscoso fueguino.'
  };
  const azar = n => {const v=Math.sin(n*127.1+311.7)*43758.5453; return v-Math.floor(v);};
  const clamp = v => Math.max(0,Math.min(1,v));
  const rad=Math.PI/180, n=(Math.sin(-5*rad)+Math.sin(-42*rad))/2;
  const a=Math.cos(-5*rad)**2+2*n*Math.sin(-5*rad), rho0=6371*Math.sqrt(a-2*n*Math.sin(-32*rad))/n;
  function geografia(x,y){
    const xx=x*100+187.5, yy=rho0-y*100-1187.5, rho=-Math.hypot(xx,yy);
    return {lon:Math.atan2(-xx,-yy)/n/rad-60,lat:Math.asin((a-(rho*n/6371)**2)/(2*n))/rad};
  }
  function compatible(id,g){
    const {lon:x,lat:y}=g;
    switch(id){
      case 'quenoa':return y>-24.1&&y<-21.8&&x>-67.4&&x<-65.35;
      case 'blanco':return y>-34.2&&x>-66.2;
      case 'quebracho':return y>-33.5&&x>-66.2&&x<-58;
      case 'dulce':return x>-69.5&&x<-64.5&&y>-39&&y<-24.5;
      case 'tabaquillo':return y>-33&&y<-30&&x>-65.6&&x<-64.2;
      case 'lapacho':return x>-60.8&&y>-30.7;
      case 'parana':return x>-54.5&&y>-27.1&&y<-25.6;
      case 'tala':return x>-61.5&&y>-38.5&&y<-29;
      case 'calden':return x>-67&&x<-63&&y>-38.8&&y<-33.8;
      case 'nire':return y<-53.8||(y<-38.3&&x<(y<-47?-71.3:-70.7));
      case 'pehuen':return y>-40.3&&y<-37.5&&x<-70.7;
      case 'guindo':return y<-54.3;
      default:return false;
    }
  }

  function crear({escena,C,P,suelo}){
    const T=window.THREE, maxArboles=200, grupo=new T.Group();
    grupo.name='Bosquetes nativos'; escena.add(grupo);
    const uvGeo=C.x.map((x,i)=>geografia(x,C.y[i]));
    const planes=new Map();
    const recortes=new Map(), cargador=new T.TextureLoader();
    const plano=new T.PlaneGeometry(1,1).translate(0,0.5,0);
    function cargar(id){
      if(recortes.has(id))return recortes.get(id);
      const material=new T.MeshBasicMaterial({side:T.DoubleSide,alphaTest:0.35,depthWrite:true,toneMapped:false});
      const mesh=new T.InstancedMesh(plano,material,maxArboles);
      mesh.name='Árbol 2D · '+id;mesh.count=0;mesh.frustumCulled=false;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);grupo.add(mesh);
      const recurso={mesh,listo:false,aspecto:1,error:false};recortes.set(id,recurso);
      const url=window.MUSUQ_ARBOLES_SPRITES?.[id]||'assets/arboles/'+id+'-sprite.webp';
      cargador.load(url, textura=>{
        textura.anisotropy=2;
        recurso.aspecto=textura.image.width/textura.image.height;
        material.map=textura;material.needsUpdate=true;recurso.listo=true;
      },undefined,()=>{recurso.error=true;console.warn('No se pudo cargar el árbol ilustrado:',id);});
      return recurso;
    }
    const geoPolvo=new T.IcosahedronGeometry(1,1);
    const opacidad=new T.InstancedBufferAttribute(new Float32Array(maxArboles*5),1);
    geoPolvo.setAttribute('alphaPolvo',opacidad);
    const polvo=new T.InstancedMesh(geoPolvo,new T.ShaderMaterial({
      transparent:true,depthWrite:false,
      vertexShader:`attribute float alphaPolvo; varying float vAlpha; varying vec3 vN; varying vec3 vV;
        void main(){vAlpha=alphaPolvo;vN=normalize(normalMatrix*mat3(instanceMatrix)*normal);
        vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.0);vV=normalize(-p.xyz);
        gl_Position=projectionMatrix*p;}`,
      fragmentShader:`varying float vAlpha;varying vec3 vN;varying vec3 vV;
        void main(){float suave=smoothstep(0.05,0.8,abs(dot(normalize(vN),normalize(vV))));
        gl_FragColor=vec4(0.73,0.61,0.43,vAlpha*suave);}`
    }),maxArboles*5);
    polvo.name='Polvo de brote';
    polvo.count=0;polvo.frustumCulled=false;polvo.instanceMatrix.setUsage(T.DynamicDrawUsage);grupo.add(polvo);
    opacidad.setUsage(T.DynamicDrawUsage);
    const obj=new T.Object3D(), direccion=new T.Vector3();
    let arboles=[], seleccion=null, inicio=0, retirada=-1, reloj=0;

    function plan(zona){
      if(planes.has(zona.id))return planes.get(zona.id);
      const bit=1<<zona.id, ids=porZona[zona.id]||[], celdas=[];
      for(let i=0;i<C.x.length;i++)if(C.zonas[i]&bit)celdas.push(i);
      const ocupadas=new Set(), resultado=[];
      const presupuesto=Math.min(40,Math.max(ids.length*2,Math.floor(celdas.length*0.34)));
      const centro=celdas.reduce((s,i)=>[s[0]+C.x[i]/celdas.length,s[1]+C.y[i]/celdas.length],[0,0]);
      for(const [tipoIndex,id] of ids.entries()){
        const candidatos=celdas.filter(i=>compatible(id,uvGeo[i])&&
          (celdas.length<12||Math.hypot(C.x[i]-centro[0],C.y[i]-centro[1])>P.q*1.1));
        candidatos.sort((i,j)=>azar(i+zona.id*51)-azar(j+zona.id*51));
        const centros=[];
        const cupo=Math.max(1,Math.floor(presupuesto/ids.length));
        for(const i of candidatos){
          if(centros.length>=Math.min(4,Math.ceil(cupo/3)))break;
          if(centros.every(j=>Math.hypot(C.x[i]-C.x[j],C.y[i]-C.y[j])>P.q*3))centros.push(i);
        }
        let usados=0;
        for(const [parche,centroId] of centros.entries()){
          const limiteParche=Math.ceil(cupo*(parche+1)/centros.length);
          const vecinos=candidatos.filter(i=>Math.hypot(C.x[i]-C.x[centroId],C.y[i]-C.y[centroId])<P.q*1.5)
            .sort((i,j)=>Math.hypot(C.x[i]-C.x[centroId],C.y[i]-C.y[centroId])-Math.hypot(C.x[j]-C.x[centroId],C.y[j]-C.y[centroId]));
          for(const i of vecinos){
            if(usados>=limiteParche||ocupadas.has(i))continue;
            ocupadas.add(i);usados++;
            const esquina=azar(i+zona.id*13)>0.5?1:-1;
            const cantidad=3+(azar(i+zona.id)>0.35?1:0)+(azar(i+zona.id*3)>0.7?1:0);
            for(let k=0;k<cantidad;k++){
              const semilla=i*31+zona.id*7+k*17;
              resultado.push({i,id,x:C.x[i]+esquina*P.q*(0.17+(k%2)*0.16),z:-C.y[i]+P.q*(-0.30+k*0.19),
                escala:P.q*(0.92+azar(semilla)*0.64)*especies[id].alto,
                giro:(azar(semilla+1)-0.5)*0.95,espejo:azar(semilla+3)>0.5?-1:1,
                semilla,demora:tipoIndex*0.12+parche*0.16+azar(semilla+2)*0.30});
            }
          }
        }
      }
      planes.set(zona.id,resultado.slice(0,maxArboles));return planes.get(zona.id);
    }

    function seleccionar(zona,demora=0){
      if(zona?.id===seleccion?.id)return;
      if(!zona){retirada=reloj;seleccion=null;return;}
      seleccion=zona;arboles=plan(zona);inicio=reloj+demora;retirada=-1;
      for(const b of arboles){cargar(b.id);delete b.nacimiento;}
    }

    function actualizar(dt,reducido,camara){
      if(!reducido)reloj+=dt;
      else inicio=reloj-10;
      let np=0;
      for(const r of recortes.values())r.mesh.count=0;
      if(camara)camara.getWorldDirection(direccion);
      const frente=Math.atan2(-direccion.x,-direccion.z);
      const salida=retirada<0?1:reducido?0:1-clamp((reloj-retirada)/0.32);
      if(salida<=0)arboles=[];
      for(const b of arboles){
        const recurso=recortes.get(b.id);
        if(!recurso?.listo)continue;
        if(b.nacimiento===undefined)b.nacimiento=Math.max(inicio+b.demora,reloj);
        const edad=reducido?9:reloj-b.nacimiento;
        if(edad<0)continue;
        const t=clamp(edad/0.85), el=t-1;
        const crecimiento=reducido?1:1+2.05*el*el*el+1.05*el*el;
        const f=Math.max(0.001,crecimiento*salida);
        obj.position.set(b.x,suelo(b.i)-b.escala*0.28*(1-Math.min(1,f))+0.004,b.z);
        obj.rotation.set(0,frente+b.giro,reducido?0:Math.sin(edad*12)*Math.exp(-edad*4)*0.07,'YXZ');
        obj.scale.set(b.espejo*b.escala*recurso.aspecto*(1+(1-f)*0.16)*salida,b.escala*f,1);
        obj.updateMatrix();recurso.mesh.setMatrixAt(recurso.mesh.count++,obj.matrix);
        if(!reducido&&edad<0.85&&retirada<0){
          const u=clamp(edad/0.85);
          for(let k=0;k<5;k++){
            const ang=k*Math.PI*0.4+azar(b.semilla)*6.28;
            const radio=(0.035+u*0.23)*b.escala;
            obj.position.set(b.x+Math.cos(ang)*radio,suelo(b.i)+0.025+Math.sin(u*Math.PI)*0.12*b.escala,b.z+Math.sin(ang)*radio);
            obj.rotation.set(0,ang,0);obj.scale.setScalar(b.escala*(0.035+u*0.13));obj.scale.y*=0.65;obj.updateMatrix();
            polvo.setMatrixAt(np,obj.matrix);opacidad.setX(np,Math.sin(u*Math.PI)*0.42);np++;
          }
        }
      }
      polvo.count=np;
      for(const m of [polvo,...Array.from(recortes.values(),r=>r.mesh)]){
        m.visible=m.count>0;m.instanceMatrix.needsUpdate=true;
      }
      opacidad.needsUpdate=true;grupo.visible=arboles.length>0;
    }
    return {seleccionar,actualizar,plan,estado:()=>({zona:seleccion?.id||null,arboles:arboles.length,polvo:polvo.count,
      especies:[...new Set(arboles.map(a=>a.id))],celdas:[...new Set(arboles.map(a=>a.i))],
      visibles:Array.from(recortes.values()).reduce((s,r)=>s+r.mesh.count,0),
      texturas:Array.from(recortes,([id,r])=>({id,listo:r.listo,error:r.error,url:r.mesh.material.map?.image.src})),
      drawCalls:grupo.visible?grupo.children.filter(m=>m.visible).length:0})};
  }
  window.MUSUQ_BOSQUES={crear,especies,porZona,notas,compatible,geografia};
})();
