export type ClientReportStats={total:number;ratedCount:number;positive:number;critical:number;average:number;sentiment:{positivo:number;neutro:number;negativo:number};themes:{name:string;count:number}[]};
export type ClientReportPayload={companyName:string;periodLabel:string;lang:string;logoUrl?:string;plan?:string;stats:ClientReportStats;evolution:number|null;recommendations:string[];labels:{title:string;avg:string;reviews:string;positive:string;critical:string;evolution:string;evolutionEmpty:string;evolutionText:string;sentiment:string;sentPos:string;sentNeu:string;sentNeg:string;pointsPos:string;pointsCrit:string;recommendations:string;themes:string;footer:string;brand:string;plan:string;rights:string}};
export type ReportExportResult={ok:boolean;mode:'pdf-download'|'failed'};
import { exportReportPdfDirect } from './reportPdfDirect';
export function openReportPrintWindow(_payload:ClientReportPayload){return false;}
export function exportReportClient(payload:ClientReportPayload):ReportExportResult{void exportReportPdfDirect(payload);return{ok:true,mode:'pdf-download'};}
