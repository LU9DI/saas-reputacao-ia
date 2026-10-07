import { getDb } from '../lib/db.js';
import { listTopDotSignals } from './dotAgentPerception.js';

export type DotAgentGoal = {
  id:number; empresa_id:string; title:string; description?:string; status:'active'|'paused'|'completed'|'archived'; progress:number; source?:string; created_at:string; updated_at:string; last_activity_at?:string|null;
};

async function ensureSchema(){
  const db=getDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS dot_agent_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    progress REAL NOT NULL DEFAULT 0,
    source TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_activity_at TEXT
  )`);
  try { await db.exec('ALTER TABLE dot_agent_goals ADD COLUMN last_activity_at TEXT'); } catch {}
  await db.exec('CREATE INDEX IF NOT EXISTS idx_dot_agent_goals_empresa ON dot_agent_goals(empresa_id,status,updated_at)');
}

function normalize(row:any):DotAgentGoal{return {id:Number(row.id),empresa_id:String(row.empresa_id),title:String(row.title),description:row.description||undefined,status:String(row.status) as DotAgentGoal['status'],progress:Number(row.progress||0),source:row.source||undefined,created_at:String(row.created_at),updated_at:String(row.updated_at),last_activity_at:row.last_activity_at||null};}

export async function createDotAgentGoal(empresaId:string,input:any){
  await ensureSchema(); const db=getDb(); const title=String(input?.title||'').trim();
  if(title.length<3) throw new Error('O objetivo precisa ter pelo menos 3 caracteres.');
  const now=new Date().toISOString();
  const r=await db.run('INSERT INTO dot_agent_goals (empresa_id,title,description,status,progress,source,created_at,updated_at,last_activity_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id',[empresaId,title.slice(0,180),String(input?.description||'').slice(0,4000)||null,'active',0,String(input?.source||'dot').slice(0,80),now,now,now]);
  return normalize(await db.get('SELECT * FROM dot_agent_goals WHERE id=? AND empresa_id=?',[r.lastID,empresaId]));
}
export async function listDotAgentGoals(empresaId:string){await ensureSchema();const rows=await getDb().all('SELECT * FROM dot_agent_goals WHERE empresa_id=? ORDER BY updated_at DESC LIMIT 50',[empresaId]);return (rows||[]).map(normalize);}
export async function updateDotAgentGoal(empresaId:string,id:number,input:any){await ensureSchema();const db=getDb();const current=await db.get('SELECT * FROM dot_agent_goals WHERE id=? AND empresa_id=?',[id,empresaId]);if(!current)return null;const status=input?.status?String(input.status):String(current.status);if(!['active','paused','completed','archived'].includes(status))throw new Error('Status de objetivo inválido.');const progress=input?.progress==null?Number(current.progress||0):Math.min(100,Math.max(0,Number(input.progress)));const now=new Date().toISOString();await db.run('UPDATE dot_agent_goals SET title=COALESCE(?,title),description=COALESCE(?,description),status=?,progress=?,updated_at=?,last_activity_at=? WHERE id=? AND empresa_id=?',[input?.title?String(input.title).trim().slice(0,180):null,input?.description==null?null:String(input.description).slice(0,4000),status,progress,now,now,id,empresaId]);return normalize(await db.get('SELECT * FROM dot_agent_goals WHERE id=? AND empresa_id=?',[id,empresaId]));}
export async function getDotAgentWorkspace(empresaId:string){await ensureSchema();const goals=await listDotAgentGoals(empresaId);const signals=await listTopDotSignals(empresaId,8);const safeSignals=signals.map(({id,title,summary,severity,priorityScore,status,signalType,source,lastSeenAt})=>({id,title,summary,severity,priorityScore,status,signalType,source,lastSeenAt}));return {goals,signals:safeSignals,summary:{active:goals.filter(g=>g.status==='active').length,attention:goals.filter(g=>g.status==='active'&&g.progress<50).length,signals:signals.length,criticalSignals:signals.filter(s=>s.severity==='critical').length}};}
