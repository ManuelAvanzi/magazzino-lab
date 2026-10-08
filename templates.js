import {warehouseDemo,item} from './model.js';

export const warehouseTemplates=[
 {id:'base',name:'Magazzino didattico',size:'48 × 40 m',description:'Il laboratorio attuale: 48 moduli di scaffalatura, imballaggio e flussi guidati.',create:warehouseDemo},
 {id:'distribution',name:'Centro di distribuzione',size:'60 × 48 m + piazzale',description:'80 moduli, quattro famiglie di merce, tre banchi e camion in arrivo e partenza.',create:distributionWarehouse},
 {id:'fulfillment',name:'Hub ordini e resi',size:'60 × 54 m + piazzale',description:'64 moduli, picking, rulliere, roll container, pesatura e controllo resi. Sei nuove attrezzature e camion al piazzale.',create:fulfillmentWarehouse,objectives:['Ricevimento: controlla i colli prima di assegnarli a una posizione.','Picking: confronta il prelievo da pallet con quello da cassette.','Preparazione: collega rulliera, imballaggio, pesatura e consolidamento.','Resi: separa la merce da verificare da quella disponibile per la spedizione.']}
];
export function distributionWarehouse(){
 const objects=[],types=['cartons','totes','drums','crates'],names=['Cartoni','Cassette riutilizzabili','Fusti','Casse in legno'];
 const rows=[-16,-14.7,-9,-7.7,-2,-.7,5,6.3,12,13.3];
 rows.forEach((z,row)=>{for(const x of [-22,-19,-16,-13,-10,-7,-4,-1])objects.push({...item('rack',x,z),cargoType:types[Math.floor(row/2)%4],name:`Scaffalatura ${String.fromCharCode(65+Math.floor(row/2))} · ${names[Math.floor(row/2)%4]}`});});
 objects.push({...item('vehicle',7,-2),w:4,d:38},{...item('vehicle',24,-3),w:4,d:36},{...item('pedestrian',-27,0),w:1.8,d:42},item('exit',-27,22),{...item('shipping',17,20),w:18,d:5});
 for(const x of [-16,-10,-4]){objects.push(item('bench',x,20),{...item('worker',x,21.3),rotation:180});}
 for(let i=0;i<8;i++)for(const z of [19.2,21])objects.push({...item('pallet',10+i*2,z),cargoType:types[i%4],name:`Pallet · ${names[i%4]}`});
 objects.push(item('forklift',7,4),item('forklift',24,-5),item('worker',-27,-10),{...item('worker',-27,9),rotation:180},item('warningSign',10,-20),item('speedSign',21,-20));
 for(const z of [-15,-7,1,9,17])objects.push({...item('barrier',-25.4,z),rotation:90});
 return {version:1,name:'Centro di distribuzione',templateId:'distribution',logisticsYard:true,width:60,depth:48,objects};
}

// A rigid delivery truck reverses into the external bay, waits, then drives out.
// This illustrative cycle does not change stock quantities or stored objects.
export function truckCycle(time,depth){
 const t=((time%44)+44)%44,smooth=t=>t*t*(3-2*t),near=depth/2+6,far=depth/2+40;
 if(t<12)return {z:far+(near-far)*smooth(t/12),phase:'Arrivo e accosto',moving:true,visible:true};
 if(t<26)return {z:near,phase:'Sosta alla baia',moving:false,visible:true};
 if(t<38)return {z:near+(far-near)*smooth((t-26)/12),phase:'Partenza',moving:true,visible:true};
 return {z:far,phase:'In attesa del prossimo arrivo',moving:false,visible:false};
}

export function fulfillmentWarehouse(){
 const objects=[],cargo=['cartons','totes','crates','drums'];
 const add=(type,x,z,props={})=>objects.push({...item(type,x,z),...props});
 [-17,-15.7,-9,-7.7,-1,.3,7,8.3].forEach((z,row)=>{for(const [i,x]of [-22,-19,-16,-13,-10,-7,-4].entries())add('rack',x,z,{cargoType:cargo[Math.floor(row/2)],name:`Stock ${String.fromCharCode(65+Math.floor(row/2))}${i+1}`});});
 for(const z of [-13,-11.7])for(const x of [13,16,19,22])add('rack',x,z,{cargoType:'totes',name:'Picking · piccoli articoli'});
 add('vehicle',5,-2,{w:4,d:44});add('vehicle',26,-4,{w:3.5,d:38});add('pedestrian',-27.5,0,{w:1.6,d:47});add('exit',-27.5,25,{w:2,d:2});
 add('receiving',-12,-23,{w:25,d:5});add('returns',18,3,{w:10,d:9});add('shipping',18,21.5,{w:17,d:8});
 for(const [i,x]of [-22,-19,-16,-13,-10,-7,-4].entries())add('pallet',x,-23,{cargoType:cargo[i%4],name:'Ricevimento · lotto da controllare'});
 for(const x of [-17,-11,-5]){add('bench',x,21,{name:'Imballaggio · postazione'});add('worker',x,22.3,{rotation:180});}
 for(const x of [-17,-11])add('rollerConveyor',x,15.8);
 add('parcelScale',-5,17.5);add('parcelScale',20,5.5,{name:'Resi · riscontro del peso'});add('bench',16,5.5,{name:'Controllo integrità e identificazione'});
 for(const x of [14,16,18,20])add('industrialBin',x,1,{name:'Resi · contenitore in verifica'});
 for(const x of [14,16,18,20,22])add('crateStack',x,-6,{name:'Picking · cassette riutilizzabili'});
 for(const x of [12,14,16,18,20,22,24]){add('pallet',x,19,{cargoType:cargo[(x/2)%4]});add('rollCage',x,23,{name:`Spedizioni · giro ${x/2-5}`});}
 add('handTruck',-22,20);add('handTruck',-20,20);add('handTruck',22,6);
 add('forklift',5,6);add('forklift',26,-5);add('worker',-27.5,-8);add('worker',-27.5,10,{rotation:180});
 for(const z of [-18,-10,-2,6,14,21])add('barrier',-25.8,z,{rotation:90});
 add('warningSign',8,-22);add('speedSign',23,-21);add('exitSign',-25.7,25);
 return {version:1,name:'Hub ordini e resi',templateId:'fulfillment',logisticsYard:true,width:60,depth:54,objects};
}
