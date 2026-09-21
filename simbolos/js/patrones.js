/* Referencias de los patrones. La agrupación por territorio no cambia la
   atribución del FNA. Las matrices son simplificaciones para jugar,
   no calcos, emblemas históricos ni nuevos motivos generativos. */
window.Patrones = (() => {
 const refs={
  maiz:{imagen:'omaguaca-maiz.png',titulo:'Faja / Sarachumpi / Faja de maíz',lugar:'Santa Ana, Valle Grande, Jujuy. 1971',cultura:'Textil kolla',descripcion:'Fibra: lana de oveja. Hecho con: telar de cintura. Uso: vestimenta. Técnica: tejido en cara de urdimbre; urdimbres complementarias, trenzado.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 62, pp. 46-47).'},
  faja:{imagen:'omaguaca-faja.png',titulo:'Faja',lugar:'Santa Ana, Valle Grande, Jujuy. 1971',cultura:'Textil kolla',descripcion:'Fibra: lana de oveja. Hecho con: telar de cintura. Uso: vestimenta. Técnica: tejido en cara de urdimbre; tejido llano, urdimbres complementarias, trenzado.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 59, pp. 58-59).'},
  qom:{imagen:'qom-faja.png',titulo:'Faja',lugar:'Barrio Toba, Resistencia, Chaco. 1968',cultura:'Textil qom-toba',descripcion:'Fibra: lana de oveja industrial. Hecho con: telar vertical. Uso: vestimenta. Técnica: tejido llano en cara de urdimbre.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 24, pp. 112-113).'},
  yica:{imagen:'qom-yica.png',titulo:'Bolsa / Yica',lugar:'Formosa. 1970 aprox',cultura:'Textil de comunidad indígena',descripcion:'Fibra: caraguatá o chaguar. Hecho con: hilo suspendido entre estacas y aguja. Uso: recipiente y transporte. Técnica: mallas en enlazado doble interconectado.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 261, pp. 108-109).'},
  matron:{imagen:'querandi-matron.png',titulo:'Matrón',lugar:'Santa Isabel, La Pampa. 1974',cultura:'Textil ranquel',descripcion:'Fibra: lana de oveja. Hecho con: telar horizontal elevado. Uso: abrigo y adorno de cama. Técnica: tejido llano en cara de urdimbre; teñido por reserva de urdimbre.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 191, pp. 164-165).'},
  matra:{imagen:'querandi-matra.png',titulo:'Manta / Matra',lugar:'Médanos Chicos, Chalileo, La Pampa. 1968',cultura:'Textil ranquel',descripcion:'Fibra: lana de oveja. Hecho con: telar horizontal elevado. Uso: abrigo y adorno de cama. Técnica: tejido llano en cara de urdimbre; teñido por reserva de urdimbre.',fuente:'La Argentina textil, Fondo Nacional de las Artes (FNA 12, pp. 184-185).'}
 };
 const def=(id,nombre,ref,filas,colores)=>({id,nombre,ref,filas,colores});
 const piezas={
  omaguaca:[
   def('om-rombo','Rombo','faja',['..1..','.121.','12.21','.121.','..1..'],['#9C2447','#E3C89D']),
   def('om-cruce','Cruce de guarda','faja',['1...1','.1.1.','..2..','.1.1.','1...1'],['#9C2447','#E3C89D']),
   def('om-espiga','Espiga de maíz','maiz',['.2.','1.1','.2.','1.1','.2.','1.1','.2.'],['#A92D50','#E3C89D']),
   def('om-zigzag','Zigzag','faja',['1...1','.1.1.','..2..'],['#9C2447','#E3C89D']),
   def('om-banda','Banda','faja',['1111111','2222222','1111111'],['#9C2447','#453244']),
   def('om-guarda','Guarda de rombos','faja',['..1...1..','.121.121.','..1...1..'],['#A52C47','#E3C89D'])
  ],
  querandi:[
   def('qu-rombo','Rombo escalonado','matron',['...1...','..121..','.12.21.','12...21','.12.21.','..121..','...1...'],['#9B245C','#D8A93F']),
   def('qu-cruce','Cruce','matron',['.1.1.','11211','.121.','11211','.1.1.'],['#9B245C','#D8A93F']),
   def('qu-doble','Doble módulo','matra',['1111','1...','1111','...1','1111'],['#D8A93F']),
   def('qu-bandas','Bandas paralelas','matron',['12131','12131','12131','12131','12131','12131','12131'],['#942657','#286C5A','#D8A93F']),
   def('qu-escalon','Escalón','matra',['1....','11...','.11..','..11.','...11','....1'],['#D8A93F']),
   def('qu-trama','Trama alternada','matra',['1.1.1','.121.','1.1.1','.121.','1.1.1'],['#D8A93F','#292827'])
  ],
  qom:[
   def('qo-bandas','Bandas de faja','qom',['11231','11231','11231','11231','11231','11231','11231'],['#CE796F','#D3AB65','#485653']),
   def('qo-doble','Doble banda','qom',['11211','11211','11211','11211','11211'],['#CE796F','#485653']),
   def('qo-trama','Trama de bolsa','yica',['111..','122..','..111','..221','111..','122..'],['#AF724B','#594B39']),
   def('qo-escalon','Banda escalonada','yica',['11....','.11...','..11..','...11.','....11'],['#AF724B']),
   def('qo-modulo','Módulo alternado','yica',['1122','1122','2211','2211'],['#B58059','#584E40']),
   def('qo-linea','Línea de faja','qom',['1111111','2222222'],['#CE796F','#485653'])
  ]
 };
 const base=PUEBLOS.filter(p=>['omaguaca','querandi'].includes(p.id));
 const qom={id:'qom',nombre:'Qom',region:'Gran Chaco',bioma:'Chaco · Formosa',fondo:'#F0E9DD',nota:'Paleta editable de la composición',colores:[{h:'#CE796F',n:'rosa'},{h:'#D3AB65',n:'ocre'},{h:'#485653',n:'verde oscuro'},{h:'#AF724B',n:'tierra'},{h:'#292827',n:'carbón'},{h:'#E3D6BD',n:'fibra'}]};
 const avisos={omaguaca:'Textiles kolla de Jujuy.',querandi:'Textiles ranqueles de La Pampa.',qom:'Faja qom-toba y bolsa de Formosa.'};
 return {refs,piezas,pueblos:[...base,qom],avisos};
})();
