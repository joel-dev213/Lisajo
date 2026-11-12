import {useState,useMemo} from "react";
const RENT={"1 Bedroom":15000,"2 Bedroom":25000,"Shop":40000};
const MONTHS=["2026-09","2026-10","2026-11"];
const LABEL={"2026-09":"September 2026","2026-10":"October 2026","2026-11":"November 2026"};
const kes=n=>"KES "+Number(n).toLocaleString("en-KE");
const seed=[
 {id:1,name:"Grace Wanjiku",unit:"A1",type:"1 Bedroom",phone:"+254711000001",pay:[["2026-09",15000],["2026-10",15000],["2026-11",15000]]},
 {id:2,name:"John Otieno",unit:"A2",type:"1 Bedroom",phone:"+254711000002",pay:[["2026-09",15000],["2026-10",15000]]},
 {id:3,name:"Mary Achieng",unit:"B1",type:"2 Bedroom",phone:"+254711000003",pay:[["2026-09",25000],["2026-10",25000],["2026-11",25000]]},
 {id:4,name:"Peter Kamau",unit:"B2",type:"2 Bedroom",phone:"+254711000004",pay:[["2026-09",25000],["2026-10",10000],["2026-11",10000]]},
 {id:5,name:"Fatuma Hassan",unit:"B3",type:"2 Bedroom",phone:"+254711000005",pay:[["2026-09",25000],["2026-10",25000],["2026-11",25000]]},
 {id:6,name:"Daniel Mutua",unit:"Shop 1",type:"Shop",phone:"+254711000006",pay:[["2026-09",40000],["2026-10",40000],["2026-11",40000]]},
 {id:7,name:"Lucy Njeri",unit:"Shop 2",type:"Shop",phone:"+254711000007",pay:[["2026-09",40000]]},
 {id:8,name:"Samuel Kiptoo",unit:"A3",type:"1 Bedroom",phone:"+254711000008",pay:[["2026-09",15000],["2026-10",15000]]},
].map(t=>({...t,pay:t.pay.map(([m,a],i)=>({m,a,date:m+"-05",method:"M-Pesa",no:"RCT-"+t.id+String(i)}))}));

const rentOf=t=>RENT[t.type];
const paidIn=(t,m)=>t.pay.filter(p=>p.m===m).reduce((s,p)=>s+p.a,0);
const arrears=(t,m)=>MONTHS.filter(x=>x<=m).reduce((s,x)=>s+rentOf(t)-paidIn(t,x),0);
const overdue=m=>new Date()>new Date(m+"-10T23:59:59");

const receiptMsg=(t,p)=>`RECEIPT ${p.no}
Date: ${p.date}
Tenant: ${t.name}
Unit: ${t.unit} (${t.type})
For: ${LABEL[p.m]}
Amount paid: ${kes(p.a)}
Monthly rent: ${kes(rentOf(t))}
Balance after payment: ${kes(arrears(t,p.m))}

Dear ${t.name}, thank you for paying your rent and for being our valued customer. We truly appreciate you. – Management`;
const warnMsg=(t,m)=>`REMINDER – RENT OVERDUE
Dear ${t.name}, your rent for ${LABEL[m]} (Unit ${t.unit}) was due on the 10th. Outstanding: ${kes(arrears(t,m))}. Please pay immediately to avoid further action. – Management`;

function App(){
 const [tenants,setTenants]=useState(seed);
 const [tab,setTab]=useState("dash");
 const [month,setMonth]=useState("2026-11");
 const [msg,setMsg]=useState(null);
 const [log,setLog]=useState([]);
 const [pf,setPf]=useState({tid:1,amount:"",method:"M-Pesa"});
 const [nf,setNf]=useState({name:"",unit:"",type:"1 Bedroom",phone:""});
 const [edit,setEdit]=useState(null);

 const stats=useMemo(()=>{
  const rows=tenants.map(t=>({t,due:rentOf(t),paid:paidIn(t,month),arr:arrears(t,month)}));
  const exp=rows.reduce((s,r)=>s+r.due,0),col=rows.reduce((s,r)=>s+r.paid,0);
  return {rows,exp,col,paidRows:rows.filter(r=>r.paid>=r.due),unpaidRows:rows.filter(r=>r.paid<r.due)};
 },[tenants,month]);
 const byMonth=MONTHS.map(m=>tenants.reduce((s,t)=>s+paidIn(t,m),0));
 const maxM=Math.max(...byMonth,1);

 const send=()=>{setLog(l=>[{time:new Date().toLocaleString(),to:msg.to,name:msg.name,kind:msg.kind,body:msg.body},...l]);setMsg(null)};
 const addPay=()=>{
  const a=Number(pf.amount);if(!a)return;
  const t=tenants.find(x=>x.id===Number(pf.tid));
  const no="RCT-"+String(1000+tenants.reduce((s,x)=>s+x.pay.length,0)+1);
  const p={m:month,a,date:new Date().toISOString().slice(0,10),method:pf.method,no};
  setTenants(ts=>ts.map(x=>x.id===t.id?{...x,pay:[...x.pay,p]}:x));
  const t2={...t,pay:[...t.pay,p]};
  setMsg({to:t.phone,name:t.name,kind:"Receipt + thank you",body:receiptMsg(t2,p)});
  setPf({...pf,amount:""});
 };
 const addTenant=()=>{
  if(!nf.name||!nf.unit)return;
  setTenants(ts=>[...ts,{...nf,id:Date.now(),pay:[]}]);setNf({name:"",unit:"",type:"1 Bedroom",phone:""});
 };
 const saveEdit=()=>{
  if(!edit.name||!edit.unit)return;
  setTenants(ts=>ts.map(x=>x.id===edit.id?{...x,name:edit.name,unit:edit.unit,type:edit.type,phone:edit.phone}:x));setEdit(null);
 };
 const delTenant=()=>{setTenants(ts=>ts.filter(x=>x.id!==edit.id));setEdit(null)};
 const warn=r=>setMsg({to:r.t.phone,name:r.t.name,kind:"Warning",body:warnMsg(r.t,month)});
 const warnAll=()=>{
  const entries=stats.unpaidRows.map(r=>({time:new Date().toLocaleString(),to:r.t.phone,name:r.t.name,kind:"Warning",body:warnMsg(r.t,month)}));
  setLog(l=>[...entries,...l]);setTab("log");
 };
 const allPays=tenants.flatMap(t=>t.pay.filter(p=>p.m===month).map(p=>({t,p})));
 const T=({id,children})=><button className={tab===id?"on":""} onClick={()=>setTab(id)}>{children}</button>;

 return <div className="app">
  <aside className="side">
   <div className="brand"><span style={{fontSize:30}}>🏢</span><div>Rent Ledger<span className="note">Property manager</span></div></div>
   <nav>
    <T id="dash">📊 Dashboard</T><T id="status">✅ Paid / Unpaid</T><T id="pay">💳 Payments</T><T id="ten">👥 Tenants</T><T id="log">✉️ Messages ({log.length})</T>
   </nav>
   <div className="mini"><div className="note">{LABEL[month]}</div><b>{Math.round(stats.col/Math.max(stats.exp,1)*100)}% collected</b>
    <div className="prog"><i style={{width:Math.round(stats.col/Math.max(stats.exp,1)*100)+"%"}}/></div></div>
  </aside>
  <main className="main">
  <header>
   <div><h1>{({dash:"Dashboard",status:"Paid / Unpaid",pay:"Payments",ten:"Tenants",log:"Message log"})[tab]}</h1><div className="note">Rent is due on the 10th of every month</div></div>
   <select value={month} onChange={e=>setMonth(e.target.value)}>{MONTHS.map(m=><option key={m} value={m}>{LABEL[m]}</option>)}</select>
  </header>

  {tab==="dash"&&<>
   <div className="grid">
    <div className="card"><div className="k">Collected</div><div className="v">{kes(stats.col)}</div></div>
    <div className="card"><div className="k">Expected</div><div className="v">{kes(stats.exp)}</div></div>
    <div className="card"><div className="k">Outstanding</div><div className="v" style={{color:"var(--bad)"}}>{kes(stats.exp-stats.col)}</div></div>
    <div className="card"><div className="k">Paid / Unpaid tenants</div><div className="v">{stats.paidRows.length} / {stats.unpaidRows.length}</div></div>
   </div>
   <div className="two">
    <div className="card"><h2>Collected per month</h2>
     <div className="bars">{byMonth.map((v,i)=><div key={i} className="bar" style={{height:(v/maxM*100)+"%"}}><span>{Math.round(v/1000)}k</span></div>)}</div>
     <div className="row" style={{marginTop:6}}>{MONTHS.map(m=><div key={m} className="bl">{LABEL[m].split(" ")[0]}</div>)}</div>
    </div>
    <div className="card"><h2>By unit type</h2>
     <table><thead><tr><th>Type</th><th>Rent</th><th>Units</th><th>Collected</th></tr></thead><tbody>
      {Object.keys(RENT).map(k=>{const ts=tenants.filter(t=>t.type===k);return <tr key={k}><td>{k}</td><td>{kes(RENT[k])}</td><td>{ts.length}</td><td>{kes(ts.reduce((s,t)=>s+paidIn(t,month),0))}</td></tr>})}
     </tbody></table>
     <p className="note">Rent is due on the 10th of every month. {overdue(month)?"Deadline for "+LABEL[month]+" has passed.":"Deadline not yet reached."}</p>
    </div>
   </div>
  </>}

  {tab==="status"&&<div className="two">
   <div className="card"><h2>✅ Paid ({stats.paidRows.length})</h2><div className="tw"><table><tbody>
    {stats.paidRows.map(r=><tr key={r.t.id}><td>{r.t.name}</td><td>{r.t.unit}</td><td>{kes(r.paid)}</td></tr>)}
   </tbody></table></div></div>
   <div className="card"><div className="row" style={{justifyContent:"space-between"}}><h2 style={{margin:0}}>⚠️ Unpaid ({stats.unpaidRows.length})</h2>
    {overdue(month)&&stats.unpaidRows.length>0&&<button className="btn pri sm" onClick={warnAll}>Send all warnings</button>}</div>
    <div className="tw"><table><thead><tr><th>Tenant</th><th>Unit</th><th>Balance</th><th></th></tr></thead><tbody>
    {stats.unpaidRows.map(r=><tr key={r.t.id}><td>{r.t.name}</td><td>{r.t.unit}</td><td><span className="pill bad">{kes(r.arr)}</span></td>
     <td>{overdue(month)&&<button className="btn sm" onClick={()=>warn(r)}>Warn</button>}</td></tr>)}
   </tbody></table></div></div>
  </div>}

  {tab==="pay"&&<>
   <div className="card" style={{marginBottom:12}}><h2>Record payment for {LABEL[month]}</h2>
    <div className="row">
     <select value={pf.tid} onChange={e=>setPf({...pf,tid:e.target.value})}>{tenants.map(t=><option key={t.id} value={t.id}>{t.name} – {t.unit}</option>)}</select>
     <input type="number" placeholder="Amount (KES)" value={pf.amount} onChange={e=>setPf({...pf,amount:e.target.value})}/>
     <select value={pf.method} onChange={e=>setPf({...pf,method:e.target.value})}><option>M-Pesa</option><option>Cash</option><option>Bank</option></select>
     <button className="btn pri" onClick={addPay}>Save &amp; create receipt</button>
    </div></div>
   <div className="card"><h2>Payments this month</h2><div className="tw"><table><thead><tr><th>Receipt</th><th>Tenant</th><th>Unit</th><th>Amount</th><th>Method</th><th></th></tr></thead><tbody>
    {allPays.map(({t,p})=><tr key={p.no}><td>{p.no}</td><td>{t.name}</td><td>{t.unit}</td><td>{kes(p.a)}</td><td>{p.method}</td>
     <td><button className="btn sm" onClick={()=>setMsg({to:t.phone,name:t.name,kind:"Receipt + thank you",body:receiptMsg(t,p)})}>Receipt</button></td></tr>)}
   </tbody></table></div></div>
  </>}

  {tab==="ten"&&<>
   <div className="card" style={{marginBottom:12}}><h2>Add tenant</h2><div className="row">
    <input placeholder="Full name" value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})}/>
    <input placeholder="House no." value={nf.unit} onChange={e=>setNf({...nf,unit:e.target.value})} style={{width:110}}/>
    <select value={nf.type} onChange={e=>setNf({...nf,type:e.target.value})}>{Object.keys(RENT).map(k=><option key={k}>{k}</option>)}</select>
    <input placeholder="Phone +254…" value={nf.phone} onChange={e=>setNf({...nf,phone:e.target.value})}/>
    <button className="btn pri" onClick={addTenant}>Add</button></div></div>
   <div className="card"><h2>Ledger – {LABEL[month]}</h2><div className="tw"><table><thead><tr><th>Tenant</th><th>House</th><th>Type</th><th>Rent</th><th>Paid</th><th>Balance (cumulative)</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {stats.rows.map(r=><tr key={r.t.id}><td>{r.t.name}<div className="note">{r.t.phone}</div></td><td>{r.t.unit}</td><td>{r.t.type}</td><td>{kes(r.due)}</td><td>{kes(r.paid)}</td>
     <td>{kes(r.arr)}</td><td><span className={"pill "+(r.paid>=r.due?"ok":r.paid>0?"warn":"bad")}>{r.paid>=r.due?"Paid":r.paid>0?"Partial":"Unpaid"}</span></td>
     <td><button className="btn sm" onClick={()=>setEdit({...r.t,confirmDel:false})}>Edit / Delete</button></td></tr>)}
   </tbody></table></div></div>
  </>}

  {tab==="log"&&<div className="card"><h2>Sent messages</h2>
   {log.length===0&&<p className="note">Nothing sent yet. Record a payment or send a warning.</p>}
   {log.map((l,i)=><div key={i} style={{borderBottom:"1px solid var(--line)",padding:"8px 0"}}>
    <b>{l.kind}</b> → {l.name} ({l.to}) <span className="note">{l.time}</span><pre>{l.body}</pre></div>)}
  </div>}

  {edit&&<div className="modal" onClick={()=>setEdit(null)}><div className="card" onClick={e=>e.stopPropagation()}>
   <h2>Edit tenant</h2>
   <div className="row"><input placeholder="Full name" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/>
    <input placeholder="House no." value={edit.unit} onChange={e=>setEdit({...edit,unit:e.target.value})} style={{width:110}}/></div>
   <div className="row"><select value={edit.type} onChange={e=>setEdit({...edit,type:e.target.value})}>{Object.keys(RENT).map(k=><option key={k}>{k}</option>)}</select>
    <input placeholder="Phone +254…" value={edit.phone} onChange={e=>setEdit({...edit,phone:e.target.value})}/></div>
   <p className="note">Changing the unit type changes the monthly rent and recalculates balances.</p>
   <div className="row"><button className="btn pri" onClick={saveEdit}>Save changes</button><button className="btn" onClick={()=>setEdit(null)}>Cancel</button>
    {!edit.confirmDel&&<button className="btn" style={{color:"var(--bad)"}} onClick={()=>setEdit({...edit,confirmDel:true})}>Delete tenant</button>}
    {edit.confirmDel&&<button className="btn" style={{background:"var(--bad)",color:"#fff"}} onClick={delTenant}>Confirm delete (removes payment history)</button>}</div>
  </div></div>}

  {msg&&<div className="modal" onClick={()=>setMsg(null)}><div className="card" onClick={e=>e.stopPropagation()}>
   <h2>{msg.kind} → {msg.name}</h2><div className="note">To: {msg.to} (SMS / WhatsApp)</div>
   <pre>{msg.body}</pre>
   <div className="row"><button className="btn pri" onClick={send}>Send now</button><button className="btn" onClick={()=>setMsg(null)}>Close</button></div>
   <p className="note">Demo only: sending is simulated. Real SMS needs the backend + an SMS provider.</p>
  </div></div>}
 </main></div>;
}
export default App;
