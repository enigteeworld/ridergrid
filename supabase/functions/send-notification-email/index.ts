import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={ 'Content-Type':'application/json' };
Deno.serve(async(req)=>{
 try{
  const expected=Deno.env.get('EMAIL_WEBHOOK_SECRET');
  if(expected && req.headers.get('x-ridergrid-webhook-secret')!==expected) return new Response(JSON.stringify({ok:false,error:'Unauthorized'}),{status:401,headers:cors});
  const payload=await req.json(); const n=payload.record;
  if(!n?.id||!n?.profile_id) return new Response(JSON.stringify({ok:true,skipped:true}),{headers:cors});
  const url=Deno.env.get('SUPABASE_URL')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, resend=Deno.env.get('RESEND_API_KEY')!, from=Deno.env.get('RESEND_FROM_EMAIL')||'RiderGrid <notifications@example.com>', app=Deno.env.get('APP_URL')||'';
  const sb=createClient(url,service); const {data:p}=await sb.from('profiles').select('email,full_name').eq('id',n.profile_id).single();
  if(!p?.email){await sb.from('notifications').update({email_status:'skipped',email_error:'No recipient email'}).eq('id',n.id);return new Response(JSON.stringify({ok:true,skipped:true}),{headers:cors});}
  const d=n.data||{}; const path=d.ticket_id?'/support':d.job_id?`/jobs/${d.job_id}`:''; const action=app?`<p style="margin-top:24px"><a href="${app}${path}" style="background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block">Open RiderGrid</a></p>`:'';
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[p.email],subject:n.title,html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>${n.title}</h2><p>Hello ${p.full_name||'there'},</p><p>${n.message}</p>${action}<p style="color:#777;font-size:12px;margin-top:32px">This is an automated RiderGrid notification.</p></div>`})});
  if(!r.ok) throw new Error(await r.text());
  await sb.from('notifications').update({email_status:'sent',emailed_at:new Date().toISOString(),email_error:null}).eq('id',n.id);
  return new Response(JSON.stringify({ok:true}),{headers:cors});
 }catch(e){return new Response(JSON.stringify({ok:false,error:String(e)}),{status:500,headers:cors});}
});
