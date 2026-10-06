import { getDb } from '../lib/db.js';
import { advanceMission } from './dotAgentMissions.js';

export async function runCurrentDotMissionStep(empresaId:string,missionId:number){
  const db=getDb();
  const mission=await db.get('SELECT * FROM dot_agent_missions WHERE id=? AND empresa_id=?',[missionId,empresaId]);
  if(!mission)return null;
  const step=await db.get('SELECT * FROM dot_agent_mission_steps WHERE mission_id=? AND empresa_id=? ORDER BY id ASC LIMIT 1 OFFSET ?',[missionId,empresaId,Number(mission.current_step||0)]);
  if(!step)return {mission,completed:true};
  if(String(step.type)==='approval') return {mission,status:'waiting_approval',requiresApproval:true,step};
  const output={
    observe:'Contexto da empresa carregado; nenhum efeito externo foi executado.',
    investigate:'Investigação interna preparada. O próximo passo depende dos sinais e dados disponíveis.',
    recommend:'Recomendação preparada. Qualquer ação protegida continuará aguardando aprovação.',
    prepare:'Tratativa interna preparada e pronta para revisão.',
    result:'Resultado aguardando acompanhamento dos indicadores.',
  }[String(step.type)] || 'Etapa processada pelo agente.';
  const updated=await advanceMission(empresaId,missionId,output);
  return {mission:updated,step:{...step,output},executed:true,externalSideEffect:false};
}
