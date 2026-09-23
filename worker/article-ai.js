const MODELS=['google/gemma-4-31b-it:free','google/gemma-4-26b-a4b-it:free','openrouter/free'];

function parseJson(value){
  const clean=String(value||'').replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
  try{return JSON.parse(clean)}catch(_){ }
  const match=clean.match(/\{[\s\S]*\}/);
  if(match){try{return JSON.parse(match[0])}catch(_){ }}
  return null;
}

function buildPrompt(topic,title,facts){
  return [
    'اكتب مقالاً عربياً محلياً مفيداً لصاحب النشاط.',
    'موضوع المقال: '+topic,
    title?'العنوان المقترح: '+title:'',
    'بيانات المكان الموثقة فقط: '+JSON.stringify(facts),
    'أعد JSON فقط بالمفاتيح: title, excerpt, content, keywords.',
    'المحتوى بين 450 و550 حرفاً تقريباً، واضح ومفيد وطبيعي ومتنوّع. استخدم اسم النشاط والمنطقة عندما يكون ذلك مناسباً.',
    'لا تخترع أسعاراً أو مواعيد أو خدمات أو تقييمات أو مواقع. لا Markdown. لا حشو كلمات مفتاحية ولا وعود غير مثبتة.'
  ].filter(Boolean).join('\n');
}

async function callModel(key,prompt){
  const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'HTTP-Referer':'https://dalilmanzala.com','X-Title':'Dalil Manzala Articles'},
    body:JSON.stringify({model:MODELS[0],models:MODELS,temperature:0.45,max_tokens:1100,messages:[
      {role:'system',content:'أنت محرر محتوى عربي محلي. ركّز على فائدة القارئ والحقائق الموثقة. لا تحاول التحايل على أدوات كشف الذكاء الاصطناعي.'},
      {role:'user',content:prompt}
    ]}),
    signal:AbortSignal.timeout(12000)
  });
  if(!response.ok) throw new Error('OpenRouter HTTP '+response.status);
  const data=await response.json();
  return data?.choices?.[0]?.message?.content||'';
}

export async function generateArticleDraft({env,topic,title='',facts={}}){
  const keys=[env?.OPENROUTER_API_KEY,env?.OPENROUTER_API_KEY_2,env?.OPENROUTER_API_KEY_3,env?.OPENROUTER_API_KEY_4]
    .filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim());
  if(!keys.length) throw new Error('No OpenRouter key configured');
  const prompt=buildPrompt(topic,title,facts);
  let lastError=null;
  for(const key of keys){
    try{
      const parsed=parseJson(await callModel(key,prompt));
      if(!parsed||typeof parsed!=='object') continue;
      let content=String(parsed.content||'').replace(/\s+/g,' ').trim();
      const arabicCount=(content.match(/[\u0600-\u06FF]/g)||[]).length;
      if(content.length<420||arabicCount<300) continue;
      if(content.length>600) content=content.slice(0,600).replace(/\s+\S*$/,'')+'…';
      return {
        title:String(parsed.title||title||'مقال عن النشاط').trim().slice(0,180),
        excerpt:String(parsed.excerpt||content.slice(0,180)).trim().slice(0,260),
        content,
        keywords:Array.isArray(parsed.keywords)?[...new Set(parsed.keywords.map(value=>String(value||'').trim()).filter(Boolean))].slice(0,10):[],
        aiGenerated:true,
        characterCount:content.length
      };
    }catch(error){lastError=error}
  }
  throw lastError||new Error('AI article generation failed');
}