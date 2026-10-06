type DotModelRoute={model:string;reason:string};
export function selectDotModel(message:string):DotModelRoute{
  const text=String(message||'').toLowerCase();
  const complex=/crise|estrat|causa|impacto|compar|plano|decisão|decisao|analis|diagnóstico|diagnostico/.test(text);
  const model=process.env.DOT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return {model,reason:complex?'consulta complexa':'consulta padrão'};
}
