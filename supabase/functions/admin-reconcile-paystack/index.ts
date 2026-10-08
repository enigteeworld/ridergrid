import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const headers = { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS' };
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return respond({ok:true});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 try {
  const url=Deno.env.get('SUPABASE_URL'); const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); const key=Deno.env.get('PAYSTACK_SECRET_KEY');
  if(!url||!service||!key)return respond({error:'Server configuration missing'},500);
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/,'').trim();
  if(!token)return respond({error:'Unauthorized'},401);
  const sb=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await sb.auth.getUser(token);
  if(error||!user)return respond({error:'Unauthorized'},401);
  const {data:profile,error:profileError}=await sb.from('profiles').select('user_type').eq('id',user.id).single();
  if(profileError||profile?.user_type!=='admin')return respond({error:'Admin access required'},403);
  const {reference}=await req.json();const ref=String(reference||'').trim();
  if(!/^[a-zA-Z0-9_.-]{5,160}$/.test(ref))return respond({error:'Invalid payment reference'},400);
  const ps=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,{headers:{Authorization:`Bearer ${key}`}});
  const result=await ps.json();if(!ps.ok||!result?.status)return respond({error:'Paystack verification failed'},502);
  const payment=result.data||{};
  const {data:existing,error:txError}=await sb.from('wallet_transactions').select('id,profile_id,amount,type,reference_id,created_at').eq('reference_id',ref).limit(20);
  if(txError)return respond({error:'Unable to inspect wallet ledger',details:txError.message},500);
  return respond({ok:true,read_only:true,reference:ref,paystack_status:payment.status,currency:payment.currency,amount:Number(payment.amount||0)/100,profile_id:payment.metadata?.profile_id||null,ledger_entries:existing||[],ledger_count:(existing||[]).length,action:'Review the result; no wallet balance was modified.'});
 }catch(e){return respond({error:String(e)},500)}
});
