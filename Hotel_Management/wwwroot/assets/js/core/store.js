import{demoState}from'../data/demo-data.js';
import{overlap}from'./engine.js';

const KEY='hotel-management-system:v2';
const LEGACY=['hotel-management-system:v1','northstar-hms-v1'];
const LISTS=['roomTypes','rooms','guests','reservations','stays','roomMoves','services','charges','guestCharges','payments','refunds','housekeeping','housekeepingRecords','housekeepingTasks','maintenance','maintenanceRecords','ratePlans','seasonalRates','guestNotes','guestPreferences','invoices','folios','alerts','activities','activityLogs','savedFilters'];
const CANONICAL=LISTS.filter(k=>!['guestCharges','housekeepingRecords','maintenanceRecords','activityLogs'].includes(k));
export const clone=x=>JSON.parse(JSON.stringify(x));
const makeId=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const settings={hotelName:'My Hotel',currency:'USD',taxRate:10,theme:'light',pageSize:10,allowCheckoutWithBalance:true};

function ensureFolio(s,st){
  if(s.folios.some(f=>f.stayId===st.id))return;
  const r=s.reservations.find(x=>x.id===st.reservationId);if(!r)return;
  const lineItems=(r.nightlyRates||[]).map((n,i)=>({id:makeId('line'),type:'Room Charge',description:`Night ${i+1}`,quantity:1,unitPrice:+n.roomRate,amount:+n.roomRate,date:n.date,sourceEntityId:r.id}));
  s.charges.filter(c=>c.reservationId===r.id).forEach(c=>lineItems.push({id:makeId('line'),type:'Service Charge',description:c.description,quantity:+c.quantity,unitPrice:+c.unitPrice,amount:+c.total,date:c.date,sourceEntityId:c.id}));
  const f={id:makeId('folio'),reservationId:r.id,stayId:st.id,guestId:r.guestId,status:st.status==='Completed'?'Closed':'Open',lineItems,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};s.folios.push(f);normalizeFolio(s,f);
}

function normalizeFolio(s,f){
  const r=s.reservations.find(x=>x.id===f.reservationId);if(!r)return;
  f.lineItems=(f.lineItems||[]).filter(x=>x.type!=='Tax'&&x.type!=='Discount');
  if(+r.discountAmount>0)f.lineItems.push({id:makeId('line'),type:'Discount',description:'Reservation discount',quantity:1,unitPrice:-Math.abs(+r.discountAmount),amount:-Math.abs(+r.discountAmount),date:r.checkInDate,sourceEntityId:r.id});
  const taxable=Math.max(0,f.lineItems.reduce((n,x)=>n+(+x.amount||0),0)),tax=taxable*Math.max(0,+r.taxRate||0)/100;
  if(tax>0)f.lineItems.push({id:makeId('line'),type:'Tax',description:`Hotel tax (${+r.taxRate||0}%)`,quantity:1,unitPrice:tax,amount:tax,date:r.checkOutDate,sourceEntityId:r.id});
  f.updatedAt=new Date().toISOString();
}

function generateAlerts(s){
  const day=new Date().toISOString().slice(0,10),wanted=[];
  s.reservations.forEach(r=>{if(r.status==='Confirmed'&&r.checkInDate===day)wanted.push(['Arrival Today',r.id,`Arrival ${r.reservationNumber}`]);if(r.status==='Checked In'&&r.checkOutDate===day)wanted.push(['Departure Today',r.id,`Departure ${r.reservationNumber}`]);if(r.status==='Confirmed'&&s.guests.find(g=>g.id===r.guestId)?.status==='VIP')wanted.push(['VIP Arrival',r.id,`VIP arrival ${r.reservationNumber}`])});
  s.maintenance.filter(m=>['Reported','In Progress'].includes(m.status)).forEach(m=>wanted.push(['Maintenance Issue',m.id,m.title]));
  wanted.forEach(([type,sourceId,message])=>{if(!s.alerts.some(a=>a.type===type&&a.sourceId===sourceId&&!a.dismissed))s.alerts.push({id:makeId('alert'),type,sourceId,message,read:false,dismissed:false,createdAt:new Date().toISOString()})});
}

export function upgrade(input,{seed=false}={}){
  const s=clone(input||{});s.schemaVersion=2;s.version=2;s.settings={...settings,...s.settings};s.metadata={createdAt:new Date().toISOString(),...s.metadata};LISTS.forEach(k=>s[k]=Array.isArray(s[k])?s[k]:[]);
  s.reservations.forEach(r=>{r.tags=Array.isArray(r.tags)?r.tags:[];r.specialRequests=r.specialRequests||'';r.bookingChannel=r.bookingChannel||r.source||'Direct';r.bookedAt=r.bookedAt||r.createdAt||new Date().toISOString();if(!Array.isArray(r.nightlyRates)){r.nightlyRates=[];for(let d=new Date(r.checkInDate+'T12:00:00');d<new Date(r.checkOutDate+'T12:00:00');d.setDate(d.getDate()+1))r.nightlyRates.push({date:d.toISOString().slice(0,10),roomRate:+r.roomRate||0})}});
  s.reservations.filter(r=>['Checked In','Checked Out'].includes(r.status)).forEach(r=>{if(!s.stays.some(x=>x.reservationId===r.id))s.stays.push({id:makeId('stay'),reservationId:r.id,guestId:r.guestId,roomId:r.roomId,currentRoomId:r.roomId,actualCheckInAt:r.actualCheckInAt||r.checkInDate,actualCheckOutAt:r.actualCheckOutAt||null,status:r.status==='Checked In'?'Active':'Completed',createdAt:r.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()})});
  s.stays.forEach(st=>ensureFolio(s,st));s.folios.forEach(f=>normalizeFolio(s,f));
  if(seed&&!s.ratePlans.length)s.ratePlans.push({id:'rp-standard',name:'Standard Rate',description:'Flexible standard rate',type:'Standard',discountPercent:0,adjustmentAmount:0,minNights:1,maxNights:30,refundable:true,active:true,createdAt:new Date().toISOString()},{id:'rp-long',name:'Long Stay',description:'Seven nights or longer',type:'Discount',discountPercent:12,adjustmentAmount:0,minNights:7,maxNights:90,refundable:true,active:true,createdAt:new Date().toISOString()});
  syncAliases(s);generateAlerts(s);return s;
}

function syncAliases(s){s.guestCharges=s.charges.map(x=>({...clone(x),id:'gc-'+x.id}));s.housekeepingRecords=s.housekeeping.map(x=>({...clone(x),id:'hr-'+x.id}));s.maintenanceRecords=s.maintenance.map(x=>({...clone(x),id:'mr-'+x.id}));s.activityLogs=s.activities.map(x=>({...clone(x),id:'al-'+x.id,type:x.type||'General'})).concat(s.activityLogs.filter(x=>!String(x.id).startsWith('al-')))}

export function sync(s){
  s.reservations.filter(r=>r.status==='Checked In').forEach(r=>{if(!s.stays.some(x=>x.reservationId===r.id&&x.status==='Active')){const st={id:makeId('stay'),reservationId:r.id,guestId:r.guestId,roomId:r.roomId,currentRoomId:r.roomId,actualCheckInAt:r.actualCheckInAt||new Date().toISOString(),status:'Active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};s.stays.push(st);ensureFolio(s,st)}});
  s.stays.forEach(st=>{const r=s.reservations.find(x=>x.id===st.reservationId);if(r?.status==='Checked Out'){st.status='Completed';st.actualCheckOutAt=r.actualCheckOutAt||st.actualCheckOutAt;const f=s.folios.find(x=>x.stayId===st.id);if(f)f.status='Closed'}});
  s.folios.forEach(f=>normalizeFolio(s,f));syncAliases(s);generateAlerts(s);
}

export function integrity(s){
  const errors=[];LISTS.forEach(k=>{if(!Array.isArray(s[k]))errors.push(`${k} is not an array`)});
  const ids=CANONICAL.flatMap(k=>s[k]||[]).map(x=>x.id).filter(Boolean),dups=ids.filter((x,i)=>ids.indexOf(x)!==i);if(dups.length)errors.push('Duplicate IDs');
  const nums=s.rooms.map(r=>String(r.roomNumber).trim().toLowerCase());if(new Set(nums).size!==nums.length)errors.push('Duplicate room numbers');
  s.rooms.forEach(r=>{if(!s.roomTypes.some(t=>t.id===r.roomTypeId))errors.push(`Room ${r.roomNumber} has invalid room type`)});
  s.reservations.forEach(r=>{if(!s.guests.some(g=>g.id===r.guestId))errors.push(`${r.reservationNumber} has invalid guest`);if(r.roomId&&!s.rooms.some(q=>q.id===r.roomId))errors.push(`${r.reservationNumber} has invalid room`);if(+r.roomRate<0||+r.discountAmount<0)errors.push(`${r.reservationNumber} has negative finance value`)});
  for(let i=0;i<s.reservations.length;i++)for(let j=i+1;j<s.reservations.length;j++){const a=s.reservations[i],b=s.reservations[j];if(a.roomId&&a.roomId===b.roomId&&['Confirmed','Checked In'].includes(a.status)&&['Confirmed','Checked In'].includes(b.status)&&overlap(a.checkInDate,a.checkOutDate,b.checkInDate,b.checkOutDate))errors.push(`Overlapping reservations ${a.reservationNumber} and ${b.reservationNumber}`)}
  const active=s.stays.filter(x=>x.status==='Active');active.forEach(st=>{if(active.some(x=>x.id!==st.id&&(x.currentRoomId===st.currentRoomId||x.reservationId===st.reservationId)))errors.push('Duplicate active stay');if(!s.reservations.some(r=>r.id===st.reservationId))errors.push(`Stay ${st.id} has invalid reservation`)});
  s.refunds.forEach(r=>{const p=s.payments.find(x=>x.id===r.paymentId),sum=s.refunds.filter(x=>x.paymentId===r.paymentId).reduce((n,x)=>n+ +x.amount,0);if(!p||sum>+p.amount+.001)errors.push(`Invalid refund ${r.refundNumber||r.id}`)});
  s.folios.forEach(f=>{if(!s.reservations.some(r=>r.id===f.reservationId))errors.push(`Invalid folio ${f.id}`)});s.invoices.forEach(i=>{if(!s.folios.some(f=>f.id===i.folioId))errors.push(`Invalid invoice ${i.invoiceNumber}`)});
  return{valid:errors.length===0,errors};
}
export function validate(s){const r=integrity(s);if(!r.valid)throw Error(r.errors[0]);return true}
export function save(s){const next=upgrade(s);sync(next);validate(next);next.metadata.lastIntegrityCheck=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(next))}
export function load(){try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw){const s=upgrade(raw);validate(s);return s}}catch(e){sessionStorage.setItem('hms-storage-error',e.message)}for(const k of LEGACY){try{const raw=JSON.parse(localStorage.getItem(k));if(raw){const s=upgrade(raw,{seed:true});validate(s);save(s);return s}}catch(e){sessionStorage.setItem('hms-migration-error',e.message)}}const s=upgrade(demoState(),{seed:true});save(s);return s}
export function mutate(fn){const next=clone(load());fn(next);sync(next);validate(next);save(next);return next}
export function reset(demo=true){const s=upgrade(demo?demoState():{settings},{seed:demo});save(s);return s}
export function merge(candidate){const base=clone(load()),inc=upgrade(candidate);CANONICAL.forEach(k=>{const ids=new Set(base[k].map(x=>x.id));inc[k].forEach(x=>{if(!ids.has(x.id))base[k].push(clone(x))})});base.settings={...base.settings,...inc.settings};sync(base);validate(base);save(base);return base}
export{KEY};
