import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';
import { serpTitle } from '../../lib/seoTitle';
import { OG_IMAGE_META, buildTwitter } from '../../lib/socialMetadata';

type Lang = 'en' | 'es' | 'zh';
function isLang(value: string): value is Lang { return value === 'en' || value === 'es' || value === 'zh'; }
type Section = { heading: string; body: string; points?: string[] };
type Faq = { question: string; answer: string };
type Item = { slug:string; title:string; description:string; h1:string; intro:string; bullets:string[]; cta:string };

const base='https://filtraai.com';

const pages: Record<Lang,Item[]> = {
en:[
{slug:'ai',title:'AI Review Analysis and Customer Feedback Intelligence',description:'Turn customer reviews and feedback into actionable insights for reputation, customer experience and growth with Filtra.AI.',h1:'Turn customer voice into business growth with AI',intro:'Filtra.AI analyzes reviews and customer feedback to reveal recurring problems, opportunities and priorities your team can act on.',bullets:['Analyze customer reviews with AI','Identify recurring complaints and opportunities','Turn feedback into clear action priorities','Improve online reputation and customer experience'],cta:'Start your free audit'},
{slug:'customer-feedback',title:'Customer Feedback Management with AI',description:'Centralize customer feedback, identify patterns and turn customer voice into growth opportunities.',h1:'Customer feedback that becomes action',intro:'Customer feedback is more than a collection of comments. Filtra.AI turns what customers say into decisions that improve experience and growth.',bullets:['Organize customer feedback','Detect patterns across reviews','Prioritize the issues that matter','Measure reputation and experience signals'],cta:'See how Filtra.AI works'},
{slug:'ai-review-analysis',title:'AI Review Analysis for Businesses',description:'Analyze online reviews with AI, detect trends and identify what customers value or criticize most.',h1:'Analyze reviews with AI',intro:'Understand the meaning behind your reviews without reading every comment manually.',bullets:['Find recurring themes','Detect negative experience signals','Discover customer strengths','Create actionable priorities'],cta:'Get a free audit'},
{slug:'online-reputation-management',title:'AI Online Reputation Management',description:'Monitor customer reviews and transform reputation signals into actions for visibility, trust and growth.',h1:'Manage online reputation with intelligence',intro:'Your reputation is built by customer experiences. Filtra.AI helps teams understand reputation signals and act on them.',bullets:['Monitor reputation signals','Understand negative reviews','Identify improvement opportunities','Turn reputation into a growth asset'],cta:'Explore reputation management'},
{slug:'google-reviews',title:'Google Reviews Management and Analysis',description:'Analyze Google reviews with AI and discover opportunities to improve customer experience and online reputation.',h1:'Turn Google Reviews into growth signals',intro:'Google reviews influence how customers perceive a business. Filtra.AI helps you understand what those reviews reveal.',bullets:['Analyze Google review patterns','Find recurring customer issues','Understand positive experience drivers','Build a stronger review strategy'],cta:'Start with a free audit'},
{slug:'filtra-ai',title:'Reviews, Feedback and Reputation Platform',description:'Filtra.AI helps businesses manage online reputation, Google reviews and customer feedback with AI.',h1:'Turn customer voice into business growth with AI',intro:'Filtra.AI helps businesses transform reviews, customer feedback and reputation signals into practical growth decisions.',bullets:['Manage online reputation with AI','Organize Google reviews and feedback','Find recurring themes and priorities','Turn customer voice into action'],cta:'Start your free audit'},
{slug:'google-reputation',title:'Google Reputation Management | Filtra.AI',description:'Manage Google reputation, review signals and customer feedback with Filtra.AI.',h1:'Google reputation management',intro:'Turn Google review signals into a continuous reputation management routine.',bullets:['Understand public reputation signals','Create a consistent review flow','Read themes beyond stars','Connect reviews to operational action'],cta:'Start with a free audit'},
{slug:'improve-google-reviews',title:'How to Improve Google Reviews | Filtra.AI',description:'Practical ways to improve Google reviews by improving experience and making honest review collection easier.',h1:'How to improve Google reviews',intro:'Improve the experience first, then make it easier for satisfied customers to share honest reviews.',bullets:['Start with the customer experience','Reduce friction with direct links','Ask at the right moment','Learn from recurring criticism'],cta:'Start with a free audit'},
{slug:'online-reputation-monitoring',title:'Online Reputation Monitoring | Filtra.AI',description:'Monitor reviews, recurring themes and changes in customer perception with Filtra.AI.',h1:'Online reputation monitoring',intro:'Monitor meaningful changes in reviews, themes and customer perception and turn them into management priorities.',bullets:['Track review volume and themes','Spot meaningful changes','Prioritize actionable signals','Build a weekly monitoring routine'],cta:'Start with a free audit'},
{slug:'customer-feedback-management',title:'Customer Feedback Management | Filtra.AI',description:'Structure customer feedback collection, analysis and follow-up to turn opinions into measurable improvement.',h1:'Customer feedback management',intro:'Route the right feedback to the right team and close the loop with measurable action.',bullets:['Collect feedback close to experience','Organize by theme and priority','Separate public and private signals','Track operational improvement'],cta:'Start with a free audit'},{slug:'hotels',title:'Hotel Reputation Management and Guest Reviews | Filtra.AI',description:'Manage hotel reviews and guest feedback with AI to identify recurring experience issues and opportunities.',h1:'Hotel reputation management that turns guest reviews into action',intro:'Filtra.AI organizes guest reviews and feedback so hotel teams can see recurring themes across rooms, service, breakfast, cleanliness and the guest journey.',bullets:['Analyze guest reviews with AI','Find recurring experience problems','Compare patterns by property or location','Turn feedback into operational priorities'],cta:'Start a free hotel audit'},
{slug:'tourism',title:'Tourism Reputation Management and Reviews | Filtra.AI',description:'Use AI to analyze tourism reviews and feedback across hotels, tours, destinations and visitor experiences.',h1:'Turn tourism reviews into better visitor experiences',intro:'Organize feedback across the visitor journey, separate public reputation signals from internal issues and identify recurring opportunities to improve.',bullets:['Analyze reviews across tourism operations','Compare themes by service or destination','Identify recurring visitor friction','Build a continuous reputation routine'],cta:'Start a free tourism audit'},
{slug:'agencies',title:'Reputation Management for Agencies | Filtra.AI',description:'Offer AI-powered review and reputation management as a recurring service for local SEO and marketing clients.',h1:'Add reputation management to your agency offer',intro:'Filtra.AI gives agencies a repeatable way to organize reviews, feedback and reporting alongside local SEO and marketing services.',bullets:['Add reputation operations to client retainers','Turn reviews into local SEO evidence','Create recurring client reports','Start with one pilot account'],cta:'Start an agency audit'},
{slug:'clinics',title:'Clinic Reputation Management and Patient Reviews | Filtra.AI',description:'Manage clinic reviews and patient feedback with AI while separating public reputation from issues that need internal care.',h1:'Clinic reputation management before the next Google review',intro:'Filtra.AI helps clinics collect, organize and analyze patient feedback to find recurring service friction and improve experience.',bullets:['Analyze patient reviews and feedback','Find recurring experience issues','Compare multiple clinic locations','Route private issues to the right team'],cta:'Start a free clinic audit'},
{slug:'franchises',title:'Franchise Reputation Management by Location | Filtra.AI',description:'Monitor reputation across franchise locations, compare review themes and identify where customers need a better experience.',h1:'Manage franchise reputation by location',intro:'Filtra.AI helps franchise networks compare review signals, identify recurring patterns and give each location clearer priorities.',bullets:['See reputation signals by location','Compare recurring themes across units','Support franchisees with evidence','Scale the workflow without losing context'],cta:'Start a franchise audit'},
{slug:'associations',title:'Association Feedback and Reputation Management | Filtra.AI',description:'Organize member and stakeholder feedback with AI to identify patterns, priorities and reputation opportunities.',h1:'Turn member feedback into better management',intro:'Filtra.AI organizes feedback from members, companies and other audiences so associations can see recurring patterns and decide where to focus.',bullets:['Collect structured stakeholder feedback','Find patterns by segment or region','Connect reputation and delivered experience','Build a recurring feedback routine'],cta:'Start a free association audit'},
{slug:'restaurants',title:'Restaurant Reputation Management and Google Reviews | Filtra.AI',description:'Manage restaurant reviews and customer feedback with AI to improve service, experience and Google reputation.',h1:'Restaurant reputation management that learns from every review',intro:'Filtra.AI organizes restaurant reviews around service, food, waiting time, ambience and recurring customer experience signals.',bullets:['Analyze restaurant reviews with AI','Find recurring service problems','Connect QR feedback to public reviews','Track reputation changes over time'],cta:'Start a free restaurant audit'},
{slug:'how-it-works',title:'How reputation management works: reviews and feedback',description:'See how Filtra.AI captures feedback, analyzes reviews and turns customer signals into reputation management actions.',h1:'How Filtra.AI works from feedback to reputation',intro:'Filtra.AI creates a structured feedback flow, organizes review signals with AI and helps teams turn customer voice into action.',bullets:['Capture the customer experience signal','Separate public and private feedback','Analyze themes and recurring issues','Turn signals into management priorities'],cta:'See how Filtra.AI works'},
{slug:'partners',title:'Filtra.AI Partner Program for Reputation Management',description:'Partner with Filtra.AI to add review, feedback and reputation management to your consulting, agency or professional offer.',h1:'Bring reputation management to more businesses',intro:'Consultancies, agencies and professionals can use Filtra.AI as an operational layer for customer feedback and reputation management.',bullets:['Add a reputation service to your offer','Start with one pilot customer','Use evidence in client conversations','Scale a repeatable workflow'],cta:'Start a partner audit'},
{slug:'ask-for-stars-vs-filtering',title:'Ask for 5 Stars vs Reputation Filtering | Filtra.AI',description:'Compare simply asking for stars with a feedback-first reputation workflow that learns from customer experience.',h1:'Asking for 5 stars is not the same as managing reputation',intro:'A feedback-first flow helps a business understand the customer experience before inviting honest public reviews and acting on recurring issues.',bullets:['Capture feedback before public review','Learn from criticism instead of hiding it','Make honest review collection easier','Turn signals into operational action'],cta:'Compare the two approaches'},
{slug:'free-review-audit',title:'Free Google Review and Reputation Audit | Filtra.AI',description:'Get a free review and online reputation audit to identify patterns, risks and opportunities in your customer feedback.',h1:'Get a free review and reputation audit',intro:'Start with a practical view of your reviews, recurring themes and reputation signals before deciding what to change.',bullets:['Identify recurring review themes','Find reputation risks and opportunities','Understand what customers value most','Build a focused improvement plan'],cta:'Request your free audit'}
],
es:[
{slug:'ia',title:'Análisis de reseñas con IA e inteligencia de clientes',description:'Convierte reseñas y comentarios de clientes en información accionable para reputación, experiencia y crecimiento.',h1:'Convierte la voz del cliente en crecimiento con IA',intro:'Filtra.AI analiza reseñas y comentarios para revelar problemas recurrentes, oportunidades y prioridades de acción.',bullets:['Analiza reseñas con IA','Detecta quejas y oportunidades','Convierte comentarios en prioridades','Mejora reputación y experiencia'],cta:'Solicitar auditoría gratuita'},
{slug:'feedback-clientes',title:'Gestión de feedback de clientes con IA',description:'Centraliza el feedback, identifica patrones y convierte la voz del cliente en oportunidades de crecimiento.',h1:'Feedback de clientes que se convierte en acción',intro:'Filtra.AI ayuda a convertir lo que dicen los clientes en decisiones que mejoran experiencia y crecimiento.',bullets:['Organiza el feedback','Detecta patrones en reseñas','Prioriza problemas importantes','Mide señales de reputación'],cta:'Cómo funciona Filtra.AI'},
{slug:'analisis-resenas-ia',title:'Análisis de reseñas con IA para empresas',description:'Analiza reseñas online con IA, detecta tendencias y descubre qué valoran o critican más tus clientes.',h1:'Analiza reseñas con IA',intro:'Comprende el significado de tus reseñas sin leer cada comentario manualmente.',bullets:['Encuentra temas recurrentes','Detecta experiencia negativa','Descubre fortalezas','Crea prioridades accionables'],cta:'Obtener auditoría gratuita'},
{slug:'gestion-reputacion-online',title:'Gestión de reputación online con IA',description:'Monitorea reseñas y convierte señales de reputación en acciones para mejorar confianza y crecimiento.',h1:'Gestiona tu reputación online con inteligencia',intro:'Filtra.AI ayuda a entender las señales de reputación y actuar sobre ellas.',bullets:['Monitorea señales','Comprende reseñas negativas','Encuentra oportunidades','Convierte reputación en crecimiento'],cta:'Explorar gestión de reputación'},
{slug:'resenas-google',title:'Gestión y análisis de reseñas de Google',description:'Analiza reseñas de Google con IA y descubre oportunidades para mejorar experiencia y reputación.',h1:'Convierte las reseñas de Google en señales de crecimiento',intro:'Filtra.AI ayuda a entender qué revelan las reseñas de Google sobre tu negocio.',bullets:['Analiza patrones','Encuentra problemas recurrentes','Comprende experiencias positivas','Construye una estrategia de reseñas'],cta:'Solicitar auditoría gratuita'},
{slug:'filtra-ai',title:'Plataforma de reseñas, feedback y reputación',description:'Filtra.AI ayuda a las empresas a gestionar reputación online, reseñas de Google y feedback con IA.',h1:'Convierte la voz del cliente en crecimiento con IA',intro:'Filtra.AI ayuda a convertir reseñas, feedback y señales de reputación en decisiones prácticas.',bullets:['Gestiona reputación con IA','Organiza reseñas y feedback','Detecta temas y prioridades','Convierte la voz del cliente en acción'],cta:'Solicitar auditoría gratuita'},
{slug:'reputacion-google',title:'Gestión de reputación en Google | Filtra.AI',description:'Gestiona reputación en Google, señales de reseñas y feedback con Filtra.AI.',h1:'Gestión de reputación en Google',intro:'Convierte las señales de Google en una rutina continua de gestión de reputación.',bullets:['Entiende señales públicas','Crea un flujo constante de reseñas','Analiza temas más allá de las estrellas','Conecta reseñas con acciones'],cta:'Solicitar auditoría gratuita'},
{slug:'mejorar-resenas-google',title:'Cómo mejorar las reseñas de Google | Filtra.AI',description:'Formas prácticas de mejorar las reseñas de Google mejorando la experiencia y facilitando opiniones honestas.',h1:'Cómo mejorar las reseñas de Google',intro:'Mejora primero la experiencia y facilita que los clientes satisfechos compartan reseñas honestas.',bullets:['Empieza por la experiencia','Reduce la fricción','Pregunta en el momento adecuado','Aprende de críticas recurrentes'],cta:'Solicitar auditoría gratuita'},
{slug:'monitoreo-reputacion-online',title:'Monitoreo de reputación online | Filtra.AI',description:'Monitorea reseñas, temas recurrentes y cambios de percepción con Filtra.AI.',h1:'Monitoreo de reputación online',intro:'Convierte los cambios relevantes de reseñas, temas y percepción en prioridades de gestión.',bullets:['Monitorea volumen y temas','Detecta cambios relevantes','Prioriza señales accionables','Crea una rutina semanal'],cta:'Solicitar auditoría gratuita'},
{slug:'gestion-feedback-clientes',title:'Gestión de feedback de clientes | Filtra.AI',description:'Estructura la recogida, análisis y seguimiento del feedback para convertir opiniones en mejoras medibles.',h1:'Gestión de feedback de clientes',intro:'Lleva cada señal al equipo adecuado y cierra el ciclo con acciones medibles.',bullets:['Recoge feedback cerca de la experiencia','Organiza por tema y prioridad','Separa señales públicas y privadas','Mide mejoras operativas'],cta:'Solicitar auditoría gratuita'},{slug:'hoteles',title:'Gestión de reputación para hoteles y reseñas de huéspedes | Filtra.AI',description:'Gestiona reseñas de hoteles y feedback de huéspedes con IA para detectar problemas y oportunidades recurrentes.',h1:'Gestión de reputación para hoteles a partir de las reseñas',intro:'Filtra.AI organiza reseñas y feedback de huéspedes para detectar patrones en habitaciones, servicio, desayuno, limpieza y experiencia.',bullets:['Analiza reseñas de huéspedes con IA','Detecta problemas recurrentes de experiencia','Compara patrones por hotel o ubicación','Convierte feedback en prioridades operativas'],cta:'Solicitar auditoría para hoteles'},
{slug:'turismo',title:'Gestión de reputación para turismo y reseñas | Filtra.AI',description:'Analiza con IA reseñas y feedback del sector turístico en hoteles, tours, destinos y experiencias.',h1:'Convierte las reseñas turísticas en mejores experiencias',intro:'Organiza el feedback del recorrido del visitante, separa señales públicas de problemas internos y detecta oportunidades recurrentes.',bullets:['Analiza reseñas de operaciones turísticas','Compara temas por servicio o destino','Detecta fricciones recurrentes de visitantes','Crea una rutina continua de reputación'],cta:'Solicitar auditoría de turismo'},
{slug:'agencias',title:'Gestión de reputación para agencias | Filtra.AI',description:'Añade gestión de reseñas y reputación con IA como servicio recurrente para clientes de SEO local y marketing.',h1:'Añade gestión de reputación a tu oferta de agencia',intro:'Filtra.AI ofrece a las agencias una forma repetible de organizar reseñas, feedback e informes junto con SEO local y marketing.',bullets:['Añade operaciones de reputación a los contratos','Convierte reseñas en evidencia para SEO local','Crea informes recurrentes para clientes','Empieza con una cuenta piloto'],cta:'Solicitar auditoría para agencias'},
{slug:'clinicas',title:'Gestión de reputación para clínicas y reseñas de pacientes | Filtra.AI',description:'Gestiona reseñas y feedback de pacientes con IA y separa la reputación pública de los problemas internos.',h1:'Gestión de reputación para clínicas antes de la próxima reseña',intro:'Filtra.AI ayuda a las clínicas a organizar y analizar feedback de pacientes para detectar fricciones recurrentes y mejorar la experiencia.',bullets:['Analiza reseñas y feedback de pacientes','Detecta problemas recurrentes de experiencia','Compara varias unidades','Lleva los problemas privados al equipo adecuado'],cta:'Solicitar auditoría para clínicas'},
{slug:'franquicias',title:'Gestión de reputación para franquicias por unidad | Filtra.AI',description:'Monitoriza la reputación de las franquicias por ubicación, compara temas de reseñas y detecta dónde mejorar.',h1:'Gestiona la reputación de tu franquicia por unidad',intro:'Filtra.AI ayuda a redes de franquicias a comparar señales, detectar patrones y dar a cada unidad prioridades más claras.',bullets:['Ve señales por ubicación','Compara temas recurrentes entre unidades','Apoya a franquiciados con evidencia','Escala el flujo sin perder contexto'],cta:'Solicitar auditoría para franquicias'},
{slug:'asociaciones',title:'Feedback y gestión de reputación para asociaciones | Filtra.AI',description:'Organiza el feedback de asociados y públicos con IA para encontrar patrones, prioridades y oportunidades de reputación.',h1:'Convierte el feedback de asociados en mejor gestión',intro:'Filtra.AI organiza el feedback de asociados, empresas y otros públicos para detectar patrones y decidir dónde concentrar la atención.',bullets:['Recoge feedback estructurado','Encuentra patrones por segmento o región','Relaciona reputación y experiencia entregada','Crea una rutina recurrente de feedback'],cta:'Solicitar auditoría para asociaciones'},
{slug:'restaurantes',title:'Gestión de reputación para restaurantes y Google Reviews | Filtra.AI',description:'Gestiona reseñas de restaurantes y feedback de clientes con IA para mejorar experiencia y reputación en Google.',h1:'Gestión de reputación para restaurantes que aprende de cada reseña',intro:'Filtra.AI organiza reseñas sobre atención, comida, tiempos de espera, ambiente y señales recurrentes de experiencia.',bullets:['Analiza reseñas de restaurantes con IA','Detecta problemas recurrentes de servicio','Conecta feedback QR con reseñas públicas','Mide cambios de reputación'],cta:'Solicitar auditoría para restaurantes'},
{slug:'como-funciona',title:'Cómo funciona la gestión de reputación: reseñas y feedback',description:'Descubre cómo Filtra.AI recoge feedback, analiza reseñas y convierte señales de clientes en acciones.',h1:'Cómo funciona Filtra.AI: del feedback a la reputación',intro:'Filtra.AI crea un flujo de feedback estructurado, organiza señales con IA y ayuda a convertir la voz del cliente en acción.',bullets:['Captura la señal de experiencia','Separa feedback público y privado','Analiza temas y problemas recurrentes','Convierte señales en prioridades de gestión'],cta:'Ver cómo funciona Filtra.AI'},
{slug:'socios',title:'Programa de socios para gestión de reputación',description:'Asóciate con Filtra.AI para añadir reseñas, feedback y gestión de reputación a tus servicios.',h1:'Lleva la gestión de reputación a más empresas',intro:'Consultoras, agencias y profesionales pueden usar Filtra.AI como capa operativa de feedback y reputación.',bullets:['Añade un servicio de reputación a tu oferta','Empieza con un cliente piloto','Usa evidencia en conversaciones','Escala un flujo repetible'],cta:'Solicitar auditoría para socios'},
{slug:'pedir-estrellas-vs-filtrar',title:'Pedir 5 estrellas vs filtrar feedback | Filtra.AI',description:'Compara pedir estrellas directamente con un flujo de reputación basado en feedback y experiencia del cliente.',h1:'Pedir 5 estrellas no es lo mismo que gestionar la reputación',intro:'Un flujo basado en feedback permite entender la experiencia antes de invitar a reseñas públicas honestas y actuar sobre problemas recurrentes.',bullets:['Captura feedback antes de la reseña pública','Aprende de las críticas','Facilita reseñas honestas','Convierte señales en acciones'],cta:'Comparar los dos enfoques'},
{slug:'auditoria-gratuita',title:'Auditoría gratuita de reseñas y reputación online | Filtra.AI',description:'Haz una auditoría gratuita de reseñas y reputación online para identificar patrones, riesgos y oportunidades.',h1:'Obtén una auditoría gratuita de reseñas y reputación',intro:'Empieza con una visión práctica de tus reseñas, temas recurrentes y señales de reputación antes de decidir qué cambiar.',bullets:['Identifica temas recurrentes','Encuentra riesgos y oportunidades','Entiende qué valoran tus clientes','Crea un plan de mejora enfocado'],cta:'Solicitar auditoría gratuita'}
],
zh:[
{slug:'ai',title:'AI 评论分析与客户反馈智能',description:'使用 Filtra.AI 将客户评论和反馈转化为可执行洞察，改善声誉、客户体验和业务增长。',h1:'用 AI 将客户声音转化为业务增长',intro:'Filtra.AI 分析评论和客户反馈，发现重复问题、机会和行动优先级。',bullets:['使用 AI 分析客户评论','发现重复投诉和机会','将反馈转化为行动优先级','改善在线声誉和客户体验'],cta:'开始免费审计'},
{slug:'customer-feedback',title:'AI 客户反馈管理',description:'集中管理客户反馈，发现模式，并将客户声音转化为增长机会。',h1:'让客户反馈真正产生行动',intro:'Filtra.AI 帮助企业将客户声音转化为改善体验和增长的决策。',bullets:['整理客户反馈','发现评论中的模式','确定重要问题优先级','衡量声誉和体验信号'],cta:'了解 Filtra.AI'},
{slug:'ai-review-analysis',title:'企业 AI 评论分析',description:'使用 AI 分析在线评论，发现趋势并了解客户最重视或最不满意的方面。',h1:'使用 AI 分析客户评论',intro:'无需手动阅读每一条评论，也能理解评论背后的业务信号。',bullets:['发现重复主题','识别负面体验','发现客户认可的优势','建立可执行优先级'],cta:'获取免费审计'},
{slug:'online-reputation-management',title:'AI 在线声誉管理',description:'监测客户评论，将声誉信号转化为改善信任、可见度和增长的行动。',h1:'用智能管理在线声誉',intro:'Filtra.AI 帮助团队理解声誉信号并及时行动。',bullets:['监测声誉信号','理解负面评论','发现积极体验机会','将声誉转化为增长资产'],cta:'了解声誉管理'},
{slug:'google-reviews',title:'Google 评论管理与分析',description:'使用 AI 分析 Google 评论，发现改善客户体验和在线声誉的机会。',h1:'将 Google 评论转化为增长信号',intro:'Filtra.AI 帮助企业理解 Google 评论揭示的信息。',bullets:['分析 Google 评论模式','发现重复客户问题','了解积极体验驱动因素','建立更好的评论策略'],cta:'开始免费审计'},
{slug:'filtra-ai',title:'评价、反馈与声誉管理平台',description:'Filtra.AI 帮助企业使用 AI 管理在线声誉、Google 评价和客户反馈。',h1:'用 AI 将客户声音转化为业务增长',intro:'Filtra.AI 将评价、客户反馈和声誉信号转化为实际增长决策。',bullets:['使用 AI 管理在线声誉','整理 Google 评价和反馈','发现重复主题和优先事项','将客户声音转化为行动'],cta:'开始免费审计'},
{slug:'google-reputation',title:'Google 声誉管理 | Filtra.AI',description:'使用 Filtra.AI 管理 Google 声誉、评价信号和客户反馈。',h1:'Google 声誉管理',intro:'将 Google 评价信号转化为持续的声誉管理流程。',bullets:['理解公开声誉信号','建立稳定评价流程','关注星级之外的主题','将评价连接到运营行动'],cta:'开始免费审计'},
{slug:'improve-google-reviews',title:'如何改善 Google 评价 | Filtra.AI',description:'通过改善体验和降低真实评价收集摩擦来改善 Google 评价。',h1:'如何改善 Google 评价',intro:'先改善客户体验，再让满意客户更容易分享真实评价。',bullets:['从客户体验开始','降低评价摩擦','在合适时机请求','从重复批评中学习'],cta:'开始免费审计'},
{slug:'online-reputation-monitoring',title:'在线声誉监测 | Filtra.AI',description:'使用 Filtra.AI 监测评价、重复主题和客户感知变化。',h1:'在线声誉监测',intro:'监测评价、主题和客户感知的重要变化，并转化为管理优先事项。',bullets:['跟踪评价数量和主题','发现有意义的变化','优先处理可行动信号','建立每周监测机制'],cta:'开始免费审计'},
{slug:'customer-feedback-management',title:'客户反馈管理 | Filtra.AI',description:'建立客户反馈收集、分析和跟进流程，将意见转化为可衡量的改进。',h1:'客户反馈管理',intro:'将正确的反馈交给正确团队，并通过可衡量的行动完成闭环。',bullets:['在体验附近收集反馈','按主题和优先级整理','区分公开与私密信号','跟踪运营改善'],cta:'开始免费审计'},
{slug:'hotels',title:'酒店声誉管理与宾客评价 | Filtra.AI',description:'使用 AI 管理酒店评价和宾客反馈，发现重复的体验问题与改进机会。',h1:'让酒店宾客评价真正推动服务改进',intro:'Filtra.AI 整理宾客评价与反馈，帮助酒店发现客房、服务、早餐、清洁和旅程中的重复主题。',bullets:['使用 AI 分析宾客评价','发现重复的体验问题','按酒店或地点比较模式','将反馈转化为运营优先级'],cta:'开始酒店免费审计'},
{slug:'tourism',title:'旅游业声誉管理与评价 | Filtra.AI',description:'使用 AI 分析旅游行业评价和反馈，覆盖酒店、旅行团、目的地与游客体验。',h1:'将旅游评价转化为更好的游客体验',intro:'整理游客旅程中的反馈，区分公开声誉信号与内部问题，并发现重复的改进机会。',bullets:['分析不同旅游业务的评价','按服务或目的地比较主题','发现重复的游客摩擦','建立持续的声誉管理流程'],cta:'开始旅游业免费审计'},
{slug:'agencies',title:'代理机构声誉管理服务 | Filtra.AI',description:'为本地 SEO 和营销客户提供 AI 驱动的评价与声誉管理服务。',h1:'将声誉管理加入您的代理机构服务',intro:'Filtra.AI 帮助代理机构以可重复的方式整理评价、反馈和报告，并与本地 SEO 和营销服务结合。',bullets:['把声誉运营加入客户服务','将评价转化为本地 SEO 证据','创建持续的客户报告','从一个试点客户开始'],cta:'开始代理机构免费审计'},
{slug:'clinics',title:'诊所声誉管理与患者评价 | Filtra.AI',description:'使用 AI 管理诊所评价和患者反馈，将公开声誉与需要内部处理的问题分开。',h1:'在下一条 Google 评价之前管理诊所声誉',intro:'Filtra.AI 帮助诊所收集、整理和分析患者反馈，发现重复的服务摩擦并改善体验。',bullets:['分析患者评价与反馈','发现重复的体验问题','比较不同诊所地点','将私密问题交给合适团队'],cta:'开始诊所免费审计'},
{slug:'franchises',title:'连锁与加盟声誉管理 | Filtra.AI',description:'按门店监测加盟网络声誉，比较评价主题并找到需要改善的位置。',h1:'按门店管理连锁企业的声誉',intro:'Filtra.AI 帮助连锁网络比较评价信号、发现重复模式，并为每个门店提供清晰的改进重点。',bullets:['按门店查看声誉信号','比较不同门店的重复主题','用证据支持加盟商','规模化流程同时保留上下文'],cta:'开始加盟网络免费审计'},
{slug:'associations',title:'协会反馈与声誉管理 | Filtra.AI',description:'使用 AI 整理会员与利益相关者反馈，发现模式、优先级和声誉机会。',h1:'将会员反馈转化为更好的管理',intro:'Filtra.AI 整理会员、企业和其他受众的反馈，让协会能够发现重复模式并明确关注重点。',bullets:['收集结构化利益相关者反馈','按细分或地区发现模式','连接声誉与实际体验','建立持续反馈机制'],cta:'开始协会免费审计'},
{slug:'restaurants',title:'餐厅声誉管理与 Google 评价 | Filtra.AI',description:'使用 AI 管理餐厅评价和客户反馈，改善服务、体验与 Google 声誉。',h1:'从每一条评价中学习的餐厅声誉管理',intro:'Filtra.AI 围绕服务、食物、等待时间、环境和重复体验信号整理餐厅评价。',bullets:['使用 AI 分析餐厅评价','发现重复服务问题','连接二维码反馈与公开评价','持续追踪声誉变化'],cta:'开始餐厅免费审计'},
{slug:'how-it-works',title:'Filtra.AI 如何管理评价与声誉',description:'了解 Filtra.AI 如何收集反馈、分析评价并将客户信号转化为行动。',h1:'Filtra.AI 如何从反馈走向声誉管理',intro:'Filtra.AI 建立结构化反馈流程，使用 AI 整理评价信号，并帮助团队将客户声音转化为行动。',bullets:['捕捉客户体验信号','区分公开与私密反馈','分析主题与重复问题','把信号转化为管理重点'],cta:'了解 Filtra.AI 如何工作'},
{slug:'partners',title:'Filtra.AI 声誉管理合作伙伴计划',description:'与 Filtra.AI 合作，将评价、反馈和声誉管理加入您的咨询或专业服务。',h1:'将声誉管理带给更多企业',intro:'咨询公司、代理机构和专业人士可以把 Filtra.AI 作为客户反馈与声誉管理的运营层。',bullets:['把声誉服务加入现有方案','从一个试点客户开始','在客户沟通中使用证据','扩展可复制的工作流'],cta:'开始合作伙伴审计'},
{slug:'request-stars-vs-filter',title:'请求五星 vs 反馈筛选 | Filtra.AI',description:'比较直接请求五星与以客户反馈为基础的声誉管理流程。',h1:'请求五星不等于管理企业声誉',intro:'以反馈为先的流程可以先理解客户体验，再邀请真实公开评价，并对重复问题采取行动。',bullets:['在公开评价前收集反馈','从批评中学习','让真实评价更容易产生','把信号转化为运营行动'],cta:'比较两种方式'},
{slug:'free-review-audit',title:'免费 Google 评价与在线声誉审计 | Filtra.AI',description:'免费分析 Google 评价和在线声誉，发现模式、风险与机会。',h1:'获取免费的评价与声誉审计',intro:'先了解评价、重复主题和声誉信号，再决定哪些问题值得优先改善。',bullets:['发现重复评价主题','识别声誉风险与机会','了解客户最重视什么','建立聚焦的改进计划'],cta:'申请免费审计'}
]
};

// Conteúdo único por página localizada. Sem isto, o template repete o mesmo
// boilerplate em todas as URLs e o Google trata as páginas como duplicadas.
const UNIQUE_CONTENT: Partial<Record<string,{sections:Section[];faq:Faq[]}>> = {
  'es:reputacion-google': {
    sections: [
      {
        heading: 'Qué señales de Google revisar primero',
        body: 'La reputación en Google no depende solo de la nota media. Revisa el volumen y la antigüedad de las reseñas, la proporción de respuestas, los temas que se repiten y la coherencia entre la ficha de Google Business Profile, el sitio web y lo que dicen los clientes. Una ficha incompleta o desactualizada puede aumentar la desconfianza incluso cuando la nota es alta.',
        points: [
          'Reseñas recientes: la percepción actual pesa más que un promedio antiguo.',
          'Temas recurrentes: espera, atención, precio, resultado y comunicación.',
          'Reseñas sin respuesta: especialmente las negativas y las de mayor alcance.',
          'Coherencia de la ficha: categoría, horarios, servicios, fotos y ubicación.',
        ],
      },
      {
        heading: 'Cómo convertir reseñas de Google en decisiones',
        body: 'Clasifica los comentarios por tema y por unidad, identifica qué problemas se repiten y asigna un responsable a cada acción. Responde con contexto y sin discutir en público; cuando el caso requiera datos personales, traslada la conversación a un canal privado. El objetivo no es maquillar la nota, sino corregir la causa que genera insatisfacción.',
      },
      {
        heading: 'Qué medir además de las estrellas',
        body: 'Sigue la evolución del volumen de reseñas, la proporción de respuestas, el tiempo de respuesta, la recurrencia de temas y la percepción por unidad. Compara periodos similares y evita conclusiones a partir de una sola reseña. Una rutina semanal de revisión permite detectar cambios antes de que se conviertan en un problema de reputación.',
      },
    ],
    faq: [
      {
        question: '¿Cómo puedo mejorar la reputación en Google?',
        answer: 'Empieza por la experiencia real: corrige los problemas que aparecen en las reseñas, facilita opiniones honestas en el momento adecuado, responde con transparencia y revisa los temas de forma periódica. La reputación mejora cuando la operación mejora y los clientes lo perciben.',
      },
      {
        question: '¿Cuántas reseñas necesito para tener buena reputación?',
        answer: 'No hay un número único. Importan la coherencia, la recencia y el contexto de tu categoría. Una ficha con reseñas recientes y respuestas cuidadas transmite más confianza que un volumen alto de comentarios antiguos o genéricos.',
      },
      {
        question: '¿Debo responder todas las reseñas de Google?',
        answer: 'Lo ideal es responder especialmente las negativas y las más recientes, pero una respuesta breve y personalizada en las positivas también refuerza la percepción de atención. Evita respuestas automáticas idénticas y nunca discutas en público.',
      },
      {
        question: '¿Las reseñas influyen en el SEO local?',
        answer: 'Las reseñas son una señal de confianza y pueden influir en la decisión del usuario, además de aportar contenido actualizado a la ficha. No son el único factor de posicionamiento local, pero forman parte de la experiencia que Google y los clientes observan.',
      },
      {
        question: '¿Puedo pedir reseñas a mis clientes?',
        answer: 'Sí, siempre que la solicitud sea honesta y no ofrezca incentivos a cambio de una valoración positiva ni filtre a los clientes insatisfechos. Pide opiniones a todos los clientes en el momento adecuado y facilita el proceso con un enlace directo.',
      },
    ],
  },
  'es:gestion-reputacion-online': {
    sections: [
      {
        heading: 'Qué incluye la gestión de reputación online',
        body: 'Gestionar la reputación online no es eliminar comentarios negativos ni responder solo cuando aparece una crisis. Es un proceso continuo para entender qué perciben los clientes en Google, portales del sector, redes sociales, encuestas y canales de atención, y convertir esas señales en decisiones de operación.',
        points: [
          'Escuchar en los canales donde el cliente opina.',
          'Separar señales públicas de feedback privado.',
          'Priorizar por impacto, gravedad y recurrencia.',
          'Asignar responsables y medir el cierre de cada acción.',
        ],
      },
      {
        heading: 'Un ciclo de trabajo en cuatro pasos',
        body: 'Primero recoge señales de forma ordenada; después analiza temas y patrones en lugar de leer casos aislados; luego lleva cada problema al equipo que puede corregirlo; finalmente mide si la percepción cambió. El ciclo se repite con una cadencia semanal para los síntomas y mensual para las tendencias.',
      },
      {
        heading: 'Cómo medir la evolución sin quedarte en la nota media',
        body: 'La nota media es un resumen útil, pero esconde el motivo de la percepción. Acompaña el volumen y la recencia de las reseñas, los temas recurrentes, el tiempo de respuesta, la proporción de casos cerrados y la evolución por unidad. Compara periodos equivalentes y registra las acciones para saber qué funcionó.',
      },
    ],
    faq: [
      {
        question: '¿Qué es la gestión de reputación online?',
        answer: 'Es el proceso de escuchar, analizar y actuar sobre las señales que forman la percepción de una empresa: reseñas, feedback, redes sociales, encuestas y atención al cliente. No se limita a la nota pública; incluye la experiencia que genera esa percepción.',
      },
      {
        question: '¿En qué se diferencia de responder reseñas?',
        answer: 'Responder reseñas es una parte del proceso. La gestión de reputación online también incluye detectar patrones, priorizar causas, asignar responsables, corregir la operación y medir si la percepción cambió con el tiempo.',
      },
      {
        question: '¿Cada cuánto tiempo debo revisar la reputación?',
        answer: 'Una revisión semanal de señales críticas y una revisión mensual de tendencias suele ser un buen punto de partida. La frecuencia depende del volumen de clientes y de la velocidad con la que cambian los canales donde tu empresa recibe feedback.',
      },
      {
        question: '¿Sirve para empresas con varias unidades?',
        answer: 'Sí. La gestión centralizada permite comparar temas entre unidades, detectar problemas sistémicos y preservar el contexto local. Cada unidad debe tener un responsable y un plan de acción, mientras la central mantiene la visión consolidada.',
      },
      {
        question: '¿Cómo empezar sin una herramienta?',
        answer: 'Reúne las reseñas y el feedback de los últimos meses, clasifica los temas recurrentes y elige dos o tres problemas prioritarios. Define un responsable y un plazo para cada acción. Cuando el volumen crezca, automatiza la recogida y el análisis para mantener la rutina.',
      },
    ],
  },
  'en:google-reviews': {
    sections: [
      {
        heading: 'What to measure in a Google reviews program',
        body: 'A Google reviews program is not a race to the highest star rating. Track review volume, recency, response rate, response time and the themes that appear across comments. A profile with recent reviews and thoughtful replies often converts better than a profile with a large but old review history.',
        points: [
          'Volume and recency: new reviews show that the business is active.',
          'Response rate and time: unanswered reviews signal neglect.',
          'Themes: waiting time, communication, price, quality and staff.',
          'Profile completeness: categories, hours, services, photos and location.',
        ],
      },
      {
        heading: 'How reviews connect to local search and revenue',
        body: 'Reviews influence trust before a customer clicks, and they add fresh content to your Google Business Profile. Use the same themes to fix operations, train the team and improve the customer journey. The goal is a repeatable flow: ask at the right moment, make the review easy, respond with context and act on what you learn.',
      },
      {
        heading: 'A review request that does not look like spam',
        body: 'Ask every customer, not only the happy ones, and never offer incentives for a positive rating. Use a direct link or QR code at the moment of value, keep the message short and let the customer decide. Filtering or pressuring customers violates Google policies and damages trust.',
      },
    ],
    faq: [
      {
        question: 'How many Google reviews do I need?',
        answer: 'There is no fixed number. Consistency, recency and the context of your category matter more than a large total. A steady flow of recent, detailed reviews is a stronger signal than a burst of old or generic comments.',
      },
      {
        question: 'Can I ask customers to leave a review?',
        answer: 'Yes, as long as the request is honest and does not offer rewards for a positive rating or filter out unhappy customers. Ask everyone at the right moment and make the process simple.',
      },
      {
        question: 'Should I reply to every review?',
        answer: 'Prioritize negative and recent reviews, but a short, personal reply to positive reviews also reinforces trust. Avoid identical templates and never argue in public.',
      },
      {
        question: 'Do Google reviews affect local SEO?',
        answer: 'Reviews are part of the trust and relevance signals around a local business and can influence click-through and conversion. They are not the only ranking factor, but they shape how customers and search engines perceive the profile.',
      },
      {
        question: 'How do I get more reviews without spam?',
        answer: 'Build the request into the customer journey, train the team to ask naturally, use a direct link or QR code and follow up once. Do not buy reviews or pressure customers.',
      },
    ],
  },
  'en:google-reputation': {
    sections: [
      {
        heading: 'Google reputation is more than a star rating',
        body: 'The rating is a summary, not a diagnosis. Look at what customers praise and complain about, how recent the comments are, whether the business replies and whether the profile matches the real experience. A 4.6 profile with unanswered complaints can lose more trust than a 4.3 profile with clear, consistent responses.',
        points: [
          'Recent reviews reveal the current experience.',
          'Repeated themes show where the operation fails.',
          'Unanswered negative reviews stay visible to future customers.',
          'Profile accuracy reduces doubt before the first contact.',
        ],
      },
      {
        heading: 'A weekly routine to protect your Google reputation',
        body: 'Review new comments, reply to the critical ones, log the theme and assign an owner for the fix. Check the profile for wrong hours, outdated services or missing photos. Once a month, compare themes and response time with the previous period instead of looking only at the average.',
      },
      {
        heading: 'When a negative review appears',
        body: 'Respond calmly, acknowledge the experience and move the conversation to a private channel when personal data is involved. Investigate the cause, fix what can be fixed and document the action. Never buy fake reviews or retaliate; short-term tricks create long-term risk.',
      },
    ],
    faq: [
      {
        question: 'How can I improve my Google reputation?',
        answer: 'Start with the real experience: fix the causes behind recurring complaints, ask customers for honest feedback, reply with context and keep the profile complete. Reputation improves when the operation improves and customers notice it.',
      },
      {
        question: 'Can I remove a negative Google review?',
        answer: 'Only if it violates Google policies, such as spam, hate speech or personal data. Otherwise, respond professionally and use the feedback to correct the cause. Reporting a legitimate negative review rarely removes it.',
      },
      {
        question: 'How often should I check Google reviews?',
        answer: 'A weekly check is enough for most businesses. If you receive a high volume of reviews or operate in a sensitive category, set up alerts for new comments and review the critical ones daily.',
      },
      {
        question: 'Does responding to reviews help?',
        answer: 'Yes. Responses show that the business listens, give context to future customers and can reduce the impact of a negative comment. Personal, specific replies work better than templates.',
      },
      {
        question: 'What if a competitor leaves a fake review?',
        answer: 'Report it to Google, document the evidence and keep your review flow honest. Do not retaliate with fake reviews; that creates policy risk and can damage the profile.',
      },
    ],
  },
  'en:customer-feedback': {
    sections: [
      {
        heading: 'Feedback is a system, not a survey',
        body: 'Customer feedback should reach the team while there is still time to act. Collect it after key moments, not only once a year, and connect public reviews with private surveys and support conversations. A single comment is an anecdote; a recurring theme is a management signal.',
        points: [
          'Collect at the moment of value: after a purchase, delivery or service.',
          'Separate public reviews from private feedback and support tickets.',
          'Tag themes so the same issue can be compared over time.',
          'Close the loop with the customer when possible.',
        ],
      },
      {
        heading: 'From feedback to retention',
        body: 'Prioritize issues by frequency, severity and impact on revenue or risk. Assign an owner, define a deadline and check whether the change reduced the theme in the next period. Customers who see a response are more likely to stay, even when the first experience was not perfect.',
      },
      {
        heading: 'What to measure beyond CSAT and NPS',
        body: 'Track response rate, recurrence of themes, time to resolution and the percentage of customers who received a follow-up. Use CSAT and NPS as context, not as the only truth. A stable score can hide a growing operational problem.',
      },
    ],
    faq: [
      {
        question: 'What is customer feedback management?',
        answer: 'It is the process of collecting, organizing, analyzing and acting on customer signals across reviews, surveys, support and other channels. The goal is to turn feedback into decisions, not just store comments.',
      },
      {
        question: 'How often should we collect feedback?',
        answer: 'After key moments in the journey, such as a purchase, delivery, support contact or service completion. A periodic relationship survey can complement the touchpoint feedback.',
      },
      {
        question: 'What is a closed-loop feedback process?',
        answer: 'It means responding to the customer, fixing the cause when possible and checking whether the change improved the experience. Closing the loop turns feedback into trust.',
      },
      {
        question: 'How do we prioritize feedback?',
        answer: 'Combine frequency, severity and business impact. A rare but serious issue may deserve more attention than a frequent low-impact complaint.',
      },
      {
        question: 'Which metrics matter most?',
        answer: 'Response rate, recurrence of themes, resolution time and follow-up completion. CSAT and NPS help, but they should be read together with the themes and the actions taken.',
      },
    ],
  },
  'en:clinics': {
    sections: [
      {
        heading: 'Why patient reviews matter for clinics',
        body: 'Patients often compare clinics through local search before booking. Reviews, ratings, photos and profile details reduce uncertainty, while unanswered complaints can send them to a competitor. Reputation is part of the patient journey, not a separate marketing task.',
        points: [
          'Recent reviews show how the clinic is performing now.',
          'Themes such as waiting time, communication and staff matter more than the average alone.',
          'Complete profiles with services, hours and location reduce doubt.',
          'Public replies must protect patient privacy.',
        ],
      },
      {
        heading: 'A compliant review workflow for clinics',
        body: 'Ask for feedback after care, when the patient has enough information to evaluate the experience. Use a simple link or QR code, ask all patients and never offer incentives for a positive rating. When a review mentions clinical details, reply without confirming the case and move the conversation to a private channel.',
      },
      {
        heading: 'What clinic teams should monitor',
        body: 'Track review volume and recency, recurring themes, response time and the share of reviews without a reply. Share the themes with reception, scheduling and clinical leadership so the fix reaches the cause. A monthly review is enough to spot trends; critical comments should be routed immediately.',
      },
    ],
    faq: [
      {
        question: 'Can clinics ask patients for reviews?',
        answer: 'Yes, if the request is honest, does not offer rewards for a positive rating and does not select only satisfied patients. Ask everyone at the right moment and keep the process simple.',
      },
      {
        question: 'How should a clinic respond to a negative review?',
        answer: 'Acknowledge the experience, avoid confirming clinical or personal data and invite the patient to continue in a private channel. Investigate the cause internally and document the action.',
      },
      {
        question: 'Do Google reviews affect patient choice?',
        answer: 'They influence trust and are often part of the first comparison. A complete profile with recent reviews and careful replies helps reduce uncertainty before booking.',
      },
      {
        question: 'What should a clinic measure?',
        answer: 'Review volume and recency, recurring themes, response time, unanswered reviews and the actions taken. The average rating is useful, but it does not show the cause of the perception.',
      },
      {
        question: 'How do we get more reviews without pressuring patients?',
        answer: 'Build the request into the post-care flow, explain that the feedback helps other patients and provide a direct link or QR code. Never pressure or reward.',
      },
    ],
  },
  'en:agencies': {
    sections: [
      {
        heading: 'Reputation management as an agency service',
        body: 'Agencies can productize reputation management with a clear scope: audit, monitoring, review response, theme analysis and monthly reporting. Standardize the workflow across clients while keeping the local context of each business. The value is not only in the tool; it is in the operating routine the agency installs.',
        points: [
          'Audit the profile, review volume, response rate and recurring themes.',
          'Define a response standard and an escalation path for sensitive cases.',
          'Separate the consolidated view from the local view of each unit.',
          'Report actions and outcomes, not only the star rating.',
        ],
      },
      {
        heading: 'How to prove value to clients',
        body: 'Start with a baseline and compare the same period after the work. Show review velocity, response time, theme recurrence and the operational fixes completed. Connect reputation signals to commercial outcomes when possible, such as leads, bookings or retention. A monthly narrative is more persuasive than a dashboard alone.',
      },
      {
        heading: 'Scaling without losing quality',
        body: 'Use templates for structure, not for the words. Give each client a voice guide, a list of sensitive topics and a clear owner for approval. Automate collection and analysis, but keep a human review for critical comments and public replies.',
      },
    ],
    faq: [
      {
        question: 'How do agencies manage reputation for multiple clients?',
        answer: 'With a standardized workflow: audit, monitoring, response, reporting and a clear owner per client. Templates help with structure, but replies and recommendations need client context.',
      },
      {
        question: 'What should a reputation audit include?',
        answer: 'Profile completeness, review volume and recency, rating, response rate, recurring themes, competitor comparison and the main operational gaps. The audit should end with a prioritized action plan.',
      },
      {
        question: 'How do you price reputation management?',
        answer: 'Price by scope, number of locations, review volume and the level of response and reporting. A monthly retainer fits the ongoing nature of the work better than a one-off project.',
      },
      {
        question: 'How do you report results?',
        answer: 'Show trends, themes, response time, review velocity and the actions completed. Connect the work to commercial outcomes when the data allows, and explain what changed and why.',
      },
      {
        question: 'Can agencies respond to reviews on behalf of clients?',
        answer: 'Yes, with permission and a clear voice guide. Sensitive cases should be escalated to the client, especially when they involve personal data, legal risk or clinical details.',
      },
    ],
  },
  'es:resenas-google': {
    sections: [
      {
        heading: 'Qué analizar en las reseñas de Google',
        body: 'La nota media resume la percepción, pero no explica qué está pasando. Revisa el volumen y la antigüedad de las reseñas, la proporción de respuestas, los temas que se repiten y la coherencia de la ficha de Google Business Profile. Una ficha con reseñas recientes y respuestas cuidadas transmite más confianza que un historial antiguo sin interacción.',
        points: [
          'Reseñas recientes: muestran la experiencia actual.',
          'Temas recurrentes: espera, atención, comunicación, precio y calidad.',
          'Reseñas sin respuesta: especialmente las negativas y las más visibles.',
          'Ficha completa: categoría, horarios, servicios, fotos y ubicación.',
        ],
      },
      {
        heading: 'Cómo usar las reseñas para mejorar la operación',
        body: 'Clasifica los comentarios por tema y por unidad, identifica patrones y asigna un responsable a cada acción. Responde con contexto y sin discutir en público; si el caso requiere datos personales, traslada la conversación a un canal privado. El objetivo no es maquillar la nota, sino corregir la causa que genera insatisfacción.',
      },
      {
        heading: 'Cómo pedir reseñas sin parecer spam',
        body: 'Pide opinión a todos los clientes, no solo a los satisfechos, y nunca ofrezcas incentivos por una valoración positiva. Usa un enlace directo o un código QR en el momento adecuado, mantén el mensaje corto y deja que el cliente decida. Filtrar o presionar clientes va contra las políticas de Google y daña la confianza.',
      },
    ],
    faq: [
      {
        question: '¿Cuántas reseñas necesito en Google?',
        answer: 'No hay un número fijo. Importan la constancia, la recencia y el contexto de tu categoría. Un flujo estable de reseñas recientes y detalladas es más fuerte que un pico de comentarios antiguos o genéricos.',
      },
      {
        question: '¿Puedo pedir reseñas a mis clientes?',
        answer: 'Sí, siempre que la solicitud sea honesta y no ofrezca recompensas por una valoración positiva ni filtre a los clientes insatisfechos. Pide a todos en el momento adecuado y facilita el proceso.',
      },
      {
        question: '¿Debo responder a todas las reseñas?',
        answer: 'Prioriza las negativas y las más recientes, pero una respuesta breve y personal a las positivas también refuerza la confianza. Evita plantillas idénticas y nunca discutas en público.',
      },
      {
        question: '¿Las reseñas influyen en el SEO local?',
        answer: 'Forman parte de las señales de confianza y relevancia de un negocio local y pueden influir en el clic y la conversión. No son el único factor de posicionamiento, pero moldean la percepción de clientes y buscadores.',
      },
      {
        question: '¿Cómo consigo más reseñas sin hacer spam?',
        answer: 'Integra la solicitud en la experiencia, entrena al equipo para pedir de forma natural, usa un enlace directo o QR y haz un seguimiento único. No compres reseñas ni presiones a los clientes.',
      },
    ],
  },
  'es:mejorar-resenas-google': {
    sections: [
      {
        heading: 'Mejorar la experiencia antes de pedir una reseña',
        body: 'La nota media no cambia solo porque se pidan más reseñas. Empieza por los problemas que aparecen en los comentarios: espera, comunicación, precio, resultado y trato. Corrige lo que se repite y pide opinión cuando el cliente ya recibió el valor; pedir antes de tiempo suele generar comentarios negativos.',
        points: [
          'Identifica los temas que más se repiten en las reseñas negativas.',
          'Define un responsable y un plazo para cada corrección.',
          'Pide feedback después del momento de valor, no antes.',
          'Responde a las reseñas para cerrar el ciclo con el cliente.',
        ],
      },
      {
        heading: 'Cómo pedir reseñas de forma honesta y sistemática',
        body: 'Crea un flujo simple: mensaje corto, enlace directo o QR, pedido a todos los clientes y un único recordatorio. Explica que la opinión ayuda a mejorar el servicio y nunca condicione la atención a una valoración positiva. La autenticidad es lo que sostiene la reputación a largo plazo.',
      },
      {
        heading: 'Qué esperar y cómo medir la evolución',
        body: 'Los resultados dependen del volumen de clientes, de la frecuencia de solicitud y de la experiencia real. Mide el volumen de reseñas nuevas, la proporción de respuestas, la recurrencia de temas y la evolución por periodo. No compares solo la nota: compara si el problema de fondo disminuyó.',
      },
    ],
    faq: [
      {
        question: '¿Cómo puedo mejorar la nota media en Google?',
        answer: 'Mejora la experiencia, corrige los temas recurrentes, pide opinión a todos los clientes y responde con transparencia. La nota es una consecuencia; la causa está en la operación y en la forma de solicitar feedback.',
      },
      {
        question: '¿Cuánto tarda en mejorar la reputación?',
        answer: 'Depende del volumen de clientes y de la recencia de las reseñas. Con un flujo constante, los cambios suelen ser visibles en semanas o meses, no de un día para otro.',
      },
      {
        question: '¿Puedo ofrecer un descuento por una reseña?',
        answer: 'No. Ofrecer incentivos por una valoración positiva va contra las políticas de Google y puede dañar la credibilidad. Puedes agradecer el feedback, pero no comprarlo.',
      },
      {
        question: '¿Debo pedir reseñas a todos los clientes?',
        answer: 'Sí. Pedir solo a los satisfechos se considera filtrado y distorsiona la percepción. Pide a todos, en el momento adecuado y sin presión.',
      },
      {
        question: '¿Qué hago con una reseña negativa?',
        answer: 'Responde con respeto, reconoce la experiencia, explica el siguiente paso y traslada los datos personales a un canal privado. Registra el tema y corrige la causa.',
      },
    ],
  },
  'es:monitoreo-reputacion-online': {
    sections: [
      {
        heading: 'Qué monitorear además de la nota media',
        body: 'El monitoreo de reputación online no se limita a mirar la puntuación. Sigue las reseñas nuevas, los temas recurrentes, el tiempo de respuesta, las reseñas sin responder y los cambios en la ficha de Google. Si la empresa tiene varias unidades, compara el consolidado con el contexto local de cada una.',
        points: [
          'Volumen y recencia de reseñas en Google y portales del sector.',
          'Temas recurrentes y su evolución en el tiempo.',
          'Tiempo de respuesta y porcentaje de reseñas sin responder.',
          'Cambios en la ficha: horarios, servicios, fotos y categorías.',
        ],
      },
      {
        heading: 'Cómo montar una rutina de monitoreo',
        body: 'Define una revisión semanal de señales críticas y una mensual de tendencias. Asigna un responsable, registra los temas y las acciones, y usa alertas para comentarios sensibles. La rutina debe producir decisiones, no solo un informe.',
      },
      {
        heading: 'Qué medir para saber si la reputación mejora',
        body: 'Además de la nota, acompaña la proporción de respuestas, el tiempo de respuesta, la recurrencia de cada tema y el porcentaje de acciones cerradas. Compara periodos equivalentes y registra las intervenciones para saber qué funcionó.',
      },
    ],
    faq: [
      {
        question: '¿Qué es el monitoreo de reputación online?',
        answer: 'Es el proceso de observar de forma continua las señales que forman la percepción de la empresa: reseñas, feedback, redes sociales, encuestas y atención al cliente. El objetivo es detectar cambios y actuar a tiempo.',
      },
      {
        question: '¿Cada cuánto tiempo debo revisar la reputación?',
        answer: 'Una revisión semanal de señales críticas y una mensual de tendencias suele ser suficiente para empezar. La frecuencia depende del volumen de clientes y de la sensibilidad del sector.',
      },
      {
        question: '¿Qué herramientas necesito?',
        answer: 'Puedes empezar con las alertas de Google, una hoja de cálculo y una rutina de revisión. Cuando el volumen crece, una plataforma centraliza reseñas, temas y reportes.',
      },
      {
        question: '¿Qué métricas importan más?',
        answer: 'Volumen y recencia de reseñas, temas recurrentes, tiempo de respuesta, reseñas sin responder y evolución de la percepción. La nota media es un resumen, no el diagnóstico.',
      },
      {
        question: '¿Cómo monitorear varias unidades?',
        answer: 'Combina una vista consolidada con una vista por unidad. Compara temas y tendencias, pero conserva el contexto local y asigna un responsable por unidad.',
      },
    ],
  },
  'es:clinicas': {
    sections: [
      {
        heading: 'Por qué las reseñas importan en una clínica',
        body: 'El paciente suele comparar clínicas en la búsqueda local antes de agendar. Las reseñas, la nota, las fotos y los datos de la ficha reducen la incertidumbre; las quejas sin respuesta pueden llevar al paciente a otra opción. La reputación forma parte de la jornada del paciente, no es una tarea aparte.',
        points: [
          'Reseñas recientes muestran el desempeño actual de la clínica.',
          'Espera, comunicación, trato y resultado importan más que la media sola.',
          'Una ficha completa con servicios, horarios y ubicación reduce dudas.',
          'Las respuestas públicas deben proteger la privacidad del paciente.',
        ],
      },
      {
        heading: 'Un flujo de reseñas compatible con la privacidad',
        body: 'Pide feedback después de la atención, cuando el paciente tiene información suficiente para evaluar la experiencia. Usa un enlace o QR simple, pide a todos los pacientes y no ofrezcas incentivos por una nota positiva. Si una reseña menciona datos clínicos, responde sin confirmar el caso y traslada la conversación a un canal privado.',
      },
      {
        heading: 'Qué debe monitorear el equipo de la clínica',
        body: 'Sigue el volumen y la recencia de las reseñas, los temas recurrentes, el tiempo de respuesta y las reseñas sin responder. Comparte los temas con recepción, agenda y liderazgo clínico para que la corrección llegue a la causa. Una revisión mensual es suficiente para ver tendencias; los comentarios críticos deben escalarse de inmediato.',
      },
    ],
    faq: [
      {
        question: '¿Puede una clínica pedir reseñas a sus pacientes?',
        answer: 'Sí, si la solicitud es honesta, no ofrece recompensas por una valoración positiva y no selecciona solo a los pacientes satisfechos. Pide a todos en el momento adecuado y facilita el proceso.',
      },
      {
        question: '¿Cómo responder a una reseña negativa de un paciente?',
        answer: 'Reconoce la experiencia, evita confirmar datos clínicos o personales e invita al paciente a continuar en un canal privado. Investiga la causa internamente y documenta la acción.',
      },
      {
        question: '¿Las reseñas de Google influyen en la elección del paciente?',
        answer: 'Influyen en la confianza y suelen formar parte de la primera comparación. Una ficha completa, con reseñas recientes y respuestas cuidadas, reduce la incertidumbre antes de agendar.',
      },
      {
        question: '¿Qué debe medir una clínica?',
        answer: 'Volumen y recencia de reseñas, temas recurrentes, tiempo de respuesta, reseñas sin responder y acciones tomadas. La nota media es útil, pero no muestra la causa de la percepción.',
      },
      {
        question: '¿Cómo conseguir más reseñas sin presionar al paciente?',
        answer: 'Integra la solicitud en el flujo posterior a la atención, explica que la opinión ayuda a otros pacientes y ofrece un enlace directo o QR. Nunca presiones ni recompenses.',
      },
    ],
  },
  'en:improve-google-reviews': {
    sections: [
      {
        heading: 'Fix the experience before asking for more reviews',
        body: 'A higher rating starts with the experience customers have, not with the request. Look at recurring complaints in your reviews and support conversations: waiting time, communication, price, quality and staff. Fix what repeats, then ask for feedback when the customer has already received the value. Asking too early tends to produce negative comments.',
        points: [
          'List the themes behind your negative reviews.',
          'Assign an owner and a deadline for each fix.',
          'Ask for feedback after the moment of value.',
          'Reply to reviews to close the loop with the customer.',
        ],
      },
      {
        heading: 'A simple review flow that works',
        body: 'Keep the process light: a short message, a direct link or QR code, a request to every customer and one reminder. Explain that the feedback helps improve the service and never tie the request to a benefit. Authenticity is what sustains the rating over time.',
      },
      {
        heading: 'Track progress, not just the average',
        body: 'Measure new review volume, response rate, theme recurrence and the trend by period. The average matters, but it hides the reason behind the perception. A rising volume of recent reviews with fewer repeated complaints is a better sign than a small jump in the score.',
      },
    ],
    faq: [
      {
        question: 'How can I improve my Google reviews?',
        answer: 'Improve the experience, fix recurring themes, ask every customer in the right moment and reply with transparency. The rating is a consequence of the operation and the way you request feedback.',
      },
      {
        question: 'How long does it take to improve the rating?',
        answer: 'It depends on your customer volume and how recent your reviews are. With a steady flow, changes usually become visible over weeks or months, not overnight.',
      },
      {
        question: 'Can I offer a discount for a review?',
        answer: 'No. Rewards for positive ratings violate Google policies and damage credibility. You can thank customers for feedback, but you cannot buy it.',
      },
      {
        question: 'Should I ask all customers for a review?',
        answer: 'Yes. Asking only happy customers is considered review gating and distorts perception. Ask everyone at the right moment, without pressure.',
      },
      {
        question: 'What should I do with a negative review?',
        answer: 'Reply respectfully, acknowledge the experience, explain the next step and move personal data to a private channel. Log the theme and fix the cause.',
      },
    ],
  },
  'en:customer-feedback-management': {
    sections: [
      {
        heading: 'What a feedback management program includes',
        body: 'Managing feedback at scale means more than reading comments. It means defining which channels feed the program, who owns each theme, how issues are prioritized and how results are reported. Reviews, surveys, support tickets and sales conversations should reach the same analysis layer.',
        points: [
          'Define the channels and the collection moments.',
          'Tag themes with a shared taxonomy across teams.',
          'Assign an owner and a service level per theme.',
          'Report outcomes monthly, not only the volume collected.',
        ],
      },
      {
        heading: 'Governance: who does what',
        body: 'Customer experience, operations, support and leadership all touch feedback. Give each team a clear responsibility: route, fix, reply or decide. Without ownership, feedback becomes a report nobody acts on. A short weekly meeting is usually enough to keep the loop running.',
      },
      {
        heading: 'KPIs that connect feedback to the business',
        body: 'Track response rate, theme recurrence, time to resolution, follow-up completion and the share of issues that turned into a fix. Combine them with retention, repeat purchase or conversion data when available. The goal is to show that listening changed the operation.',
      },
    ],
    faq: [
      {
        question: 'What is customer feedback management?',
        answer: 'It is the operating system around customer signals: collection, taxonomy, routing, action and reporting. It turns comments into decisions and connects teams to the same customer view.',
      },
      {
        question: 'Do we need a tool to start?',
        answer: 'No. A spreadsheet and a weekly routine can work at low volume. A platform becomes valuable when the volume, the number of channels or the number of units grows.',
      },
      {
        question: 'How do we avoid feedback fatigue?',
        answer: 'Ask less and close the loop more. Focus on key moments, avoid duplicate surveys and show customers and teams what changed because of the feedback.',
      },
      {
        question: 'Which teams should be involved?',
        answer: 'Customer experience, operations, support and leadership. Each one needs a defined role in routing, fixing, replying or deciding priorities.',
      },
      {
        question: 'How do we measure the program?',
        answer: 'Response rate, theme recurrence, resolution time, follow-up completion and fixes shipped. Connect them to retention or conversion to show business impact.',
      },
    ],
  },
  'en:filtra-ai': {
    sections: [
      {
        heading: 'What Filtra.AI does',
        body: 'Filtra.AI brings reviews and customer feedback into one place, uses AI to classify themes and turns the analysis into a prioritized action list. Teams see what customers repeat, which units need attention and what changed after each fix. The platform supports reputation, customer experience and local growth.',
        points: [
          'Centralize Google reviews and feedback in one workflow.',
          'Classify themes automatically and compare periods.',
          'Prioritize issues by frequency, severity and unit.',
          'Track responses, actions and outcomes over time.',
        ],
      },
      {
        heading: 'Who it is for',
        body: 'The platform fits businesses with multiple locations, agencies managing several clients and teams that already collect feedback but struggle to act on it. If reviews and comments sit in different tools and nobody owns the follow-up, the first gain is the operating routine the platform installs.',
      },
      {
        heading: 'How teams use it week to week',
        body: 'A typical routine: review new signals, reply to critical comments, route themes to owners and check the actions from the previous week. Monthly, compare themes and response time across periods and units. The goal is not another dashboard; it is a shorter path from feedback to fix.',
      },
    ],
    faq: [
      {
        question: 'What makes Filtra.AI different from a review dashboard?',
        answer: 'The focus is the action loop: classify themes, prioritize, assign owners and check whether the change reduced the problem. The dashboard is a means, not the end.',
      },
      {
        question: 'Does it work for multiple locations?',
        answer: 'Yes. You get a consolidated view to find patterns and a local view per unit, so each location keeps its own context and owner.',
      },
      {
        question: 'Can agencies use it with clients?',
        answer: 'Yes. Agencies can standardize the workflow across clients while keeping each brand voice, escalation path and reporting cadence.',
      },
      {
        question: 'Which channels does it cover?',
        answer: 'Google reviews are the starting point, combined with surveys, support conversations and other feedback channels your operation already uses.',
      },
      {
        question: 'How long does implementation take?',
        answer: 'Start with one unit or client to validate the flow, taxonomy and routine, then expand. Most of the work is defining owners and cadence, not the setup itself.',
      },
    ],
  },
  'en:free-review-audit': {
    sections: [
      {
        heading: 'What the free review audit covers',
        body: 'The audit looks at your Google Business Profile and the signals that shape perception: review volume and recency, rating trend, response rate, unanswered comments, recurring themes and how you compare with direct competitors. It ends with a short list of priority actions, not a generic report.',
        points: [
          'Profile completeness: categories, hours, services, photos and location.',
          'Review volume, recency and rating trend.',
          'Response rate, response time and unanswered reviews.',
          'Recurring themes and competitor comparison.',
        ],
      },
      {
        heading: 'What you receive',
        body: 'You get a clear diagnosis: what is working, what is costing trust and which three actions have the highest impact. The goal is to help you decide where to start, whether you run the program internally or with Filtra.AI.',
      },
      {
        heading: 'How to prepare',
        body: 'Have the Google Business Profile link and, if you have several units, a list of locations. If you already collect feedback, bring the channels you use. The audit works with public data plus what you choose to share.',
      },
    ],
    faq: [
      {
        question: 'Is the audit really free?',
        answer: 'Yes. It is a diagnostic step to show where the main opportunities are. No commitment to continue with the platform.',
      },
      {
        question: 'How long does it take?',
        answer: 'For a single location, usually a few business days. Multi-unit or multi-brand audits take longer because more profiles and themes are compared.',
      },
      {
        question: 'What do I need to provide?',
        answer: 'The Google Business Profile link and a list of units if you have more than one. Any feedback or support data you already collect helps deepen the analysis.',
      },
      {
        question: 'Do you need access to my Google account?',
        answer: 'No. The audit uses public profile data and whatever you choose to share. Account access is only needed later, if you decide to use the platform.',
      },
      {
        question: 'What happens after the audit?',
        answer: 'You receive the diagnosis and the priority actions. You can implement them internally or use Filtra.AI to run the ongoing routine.',
      },
    ],
  },
  'en:how-it-works': {
    sections: [
      {
        heading: 'From connection to first insight',
        body: 'The first step is connecting your Google Business Profile and, if you use them, your feedback channels. The platform organizes reviews and comments, classifies themes and shows the current picture: what customers repeat, what is unanswered and where the trend is going.',
        points: [
          'Connect the profile and the feedback sources.',
          'Classify themes with a shared taxonomy.',
          'See the current picture by unit and by period.',
          'Define owners and priorities from the first list.',
        ],
      },
      {
        heading: 'The weekly and monthly routine',
        body: 'Weekly, the team reviews new signals, replies to critical comments and works on the priority list. Monthly, it compares themes, response time and outcomes across periods and locations. The cadence is what turns the platform into results.',
      },
      {
        heading: 'Roles and escalation',
        body: 'A local owner handles replies and operational fixes. A central team watches the consolidated view, shares standards and steps in on sensitive cases. Clear escalation keeps responses fast and preserves the context of each unit.',
      },
    ],
    faq: [
      {
        question: 'How long does setup take?',
        answer: 'The initial connection is quick. Most of the time goes into defining the taxonomy, owners and cadence that fit your operation.',
      },
      {
        question: 'Do I need to change my current tools?',
        answer: 'No. Filtra.AI can work alongside your current survey or support tools and bring the signals into one analysis layer.',
      },
      {
        question: 'Who should use the platform day to day?',
        answer: 'Usually a local owner for replies and fixes, supported by a central team that monitors the consolidated view and standards.',
      },
      {
        question: 'How are sensitive reviews handled?',
        answer: 'They follow an escalation path to the responsible team or central contact, especially when they involve personal data, legal risk or clinical details.',
      },
      {
        question: 'How do we know it is working?',
        answer: 'Track theme recurrence, response time, unanswered reviews and the actions completed. Improvement shows up when the same complaint appears less often.',
      },
    ],
  },
  'es:gestion-feedback-clientes': {
    sections: [
      {
        heading: 'Qué incluye gestionar el feedback de clientes',
        body: 'Gestionar feedback a escala es más que leer comentarios. Implica definir qué canales alimentan el programa, quién es responsable de cada tema, cómo se priorizan los problemas y cómo se reportan los resultados. Reseñas, encuestas, tickets de soporte y conversaciones comerciales deben llegar a la misma capa de análisis.',
        points: [
          'Define los canales y los momentos de recogida.',
          'Clasifica temas con una taxonomía compartida.',
          'Asigna un responsable y un plazo por tema.',
          'Reporta resultados mensualmente, no solo el volumen recogido.',
        ],
      },
      {
        heading: 'Gobernanza: quién hace qué',
        body: 'Experiencia del cliente, operaciones, soporte y dirección tocan el feedback. Da a cada equipo una responsabilidad clara: enrutar, corregir, responder o decidir. Sin responsables, el feedback se convierte en un informe que nadie acciona. Una reunión semanal corta suele ser suficiente para mantener el ciclo.',
      },
      {
        heading: 'Métricas que conectan feedback y negocio',
        body: 'Sigue la tasa de respuesta, la recurrencia de temas, el tiempo de resolución, el seguimiento completado y el porcentaje de problemas que se convirtieron en una corrección. Combínalos con retención, recompra o conversión cuando sea posible. El objetivo es demostrar que escuchar cambió la operación.',
      },
    ],
    faq: [
      {
        question: '¿Qué es la gestión del feedback de clientes?',
        answer: 'Es el sistema operativo alrededor de las señales del cliente: recogida, taxonomía, enrutamiento, acción y reporte. Convierte comentarios en decisiones y conecta a los equipos con la misma visión.',
      },
      {
        question: '¿Necesito una herramienta para empezar?',
        answer: 'No. Una hoja de cálculo y una rutina semanal funcionan con poco volumen. Una plataforma aporta valor cuando crecen el volumen, los canales o las unidades.',
      },
      {
        question: '¿Cómo evitamos la fatiga de encuestas?',
        answer: 'Pregunta menos y cierra más ciclos. Enfócate en momentos clave, evita encuestas duplicadas y muestra a clientes y equipos qué cambió gracias al feedback.',
      },
      {
        question: '¿Qué equipos deben participar?',
        answer: 'Experiencia del cliente, operaciones, soporte y dirección. Cada uno necesita un rol definido para enrutar, corregir, responder o decidir prioridades.',
      },
      {
        question: '¿Cómo medimos el programa?',
        answer: 'Tasa de respuesta, recurrencia de temas, tiempo de resolución, seguimiento completado y correcciones implementadas. Conéctalos con retención o conversión para mostrar impacto.',
      },
    ],
  },
  'es:filtra-ai': {
    sections: [
      {
        heading: 'Qué hace Filtra.AI',
        body: 'Filtra.AI reúne reseñas y feedback de clientes en un solo lugar, usa IA para clasificar temas y convierte el análisis en una lista de acciones priorizadas. Los equipos ven qué repiten los clientes, qué unidades necesitan atención y qué cambió después de cada corrección. La plataforma apoya reputación, experiencia del cliente y crecimiento local.',
        points: [
          'Centraliza reseñas de Google y feedback en un solo flujo.',
          'Clasifica temas automáticamente y compara periodos.',
          'Prioriza por frecuencia, gravedad y unidad.',
          'Sigue respuestas, acciones y resultados en el tiempo.',
        ],
      },
      {
        heading: 'Para quién es',
        body: 'La plataforma encaja en negocios con varias unidades, agencias que gestionan varios clientes y equipos que ya recogen feedback pero no consiguen accionarlo. Si las reseñas y los comentarios viven en herramientas distintas y nadie es dueño del seguimiento, la primera ganancia es la rutina operativa que instala la plataforma.',
      },
      {
        heading: 'La rutina semanal del equipo',
        body: 'Una rutina típica: revisar señales nuevas, responder comentarios críticos, enrutar temas a responsables y comprobar las acciones de la semana anterior. Cada mes, comparar temas y tiempo de respuesta entre periodos y unidades. El objetivo no es otro panel; es acortar el camino del feedback a la corrección.',
      },
    ],
    faq: [
      {
        question: '¿En qué se diferencia de un panel de reseñas?',
        answer: 'El foco es el ciclo de acción: clasificar temas, priorizar, asignar responsables y comprobar si el cambio redujo el problema. El panel es un medio, no el fin.',
      },
      {
        question: '¿Funciona para varias ubicaciones?',
        answer: 'Sí. Tienes una vista consolidada para encontrar patrones y una vista por unidad, de modo que cada local conserva su contexto y responsable.',
      },
      {
        question: '¿Pueden usarla las agencias con sus clientes?',
        answer: 'Sí. Las agencias pueden estandarizar el flujo entre clientes manteniendo la voz de cada marca, la escalación y la cadencia de reporte.',
      },
      {
        question: '¿Qué canales cubre?',
        answer: 'Las reseñas de Google son el punto de partida, combinadas con encuestas, conversaciones de soporte y otros canales de feedback que ya use tu operación.',
      },
      {
        question: '¿Cuánto tarda la implementación?',
        answer: 'Empieza con una unidad o cliente para validar el flujo, la taxonomía y la rutina, y luego expande. La mayor parte del trabajo es definir responsables y cadencia, no la configuración.',
      },
    ],
  },
  'es:ia': {
    sections: [
      {
        heading: 'Qué hace la IA en la gestión de reputación',
        body: 'La IA no decide la estrategia por ti. Su valor está en procesar volumen: clasificar reseñas y comentarios por tema, detectar patrones que se repiten, medir la evolución y ayudar a priorizar. Eso libera al equipo para lo que realmente importa: corregir la causa y responder con contexto.',
        points: [
          'Clasificación automática de temas y sentimiento.',
          'Detección de patrones entre periodos y unidades.',
          'Priorización por frecuencia, gravedad e impacto.',
          'Sugerencias de respuesta que el equipo revisa.',
        ],
      },
      {
        heading: 'Dónde la IA ayuda de verdad',
        body: 'Con cientos o miles de comentarios, leer uno por uno no escala. La IA compara el lenguaje de los clientes con la operación y muestra dónde se repiten los problemas. También detecta cambios de tono antes de que aparezcan en la nota media.',
      },
      {
        heading: 'Límites y buenas prácticas',
        body: 'La IA puede equivocarse con ironía, contexto local o comentarios ambiguos. Mantén revisión humana en respuestas públicas y casos sensibles, define una taxonomía clara y revisa las clasificaciones al principio. La tecnología acelera el análisis; la decisión y la relación con el cliente siguen siendo humanas.',
      },
    ],
    faq: [
      {
        question: '¿La IA responde a las reseñas automáticamente?',
        answer: 'Puede sugerir respuestas, pero la revisión humana es recomendable, especialmente en casos negativos o sensibles. La autenticidad y el contexto local importan más que la velocidad.',
      },
      {
        question: '¿Cómo clasifica los temas?',
        answer: 'Con una taxonomía definida por la empresa: espera, atención, comunicación, precio, calidad, resultado y otros temas propios del negocio. Una taxonomía clara mejora la precisión.',
      },
      {
        question: '¿Funciona en varios idiomas?',
        answer: 'Sí, el análisis puede trabajar con reseñas y comentarios en distintos idiomas, lo que ayuda a operaciones multi-país.',
      },
      {
        question: '¿Se pierde el contexto local?',
        answer: 'No si la plataforma mantiene la vista por unidad. El análisis consolidado encuentra patrones; la vista local conserva el contexto de cada operación.',
      },
      {
        question: '¿Qué necesito para empezar?',
        answer: 'Reseñas y feedback de los últimos meses y una idea clara de qué temas importan para el negocio. Con eso se define la taxonomía y se priorizan las primeras acciones.',
      },
    ],
  },
  'es:analisis-resenas-ia': {
    sections: [
      {
        heading: 'Qué analizar en las reseñas',
        body: 'Un buen análisis de reseñas va más allá del sentimiento general. Mira el volumen y la recencia, la distribución de notas, los temas que se repiten, el tiempo de respuesta y la evolución por periodo. Cada capa responde a una pregunta distinta sobre la experiencia del cliente.',
        points: [
          'Volumen y recencia: ¿la percepción está actualizada?',
          'Distribución de notas: ¿dónde se concentra la insatisfacción?',
          'Temas: ¿qué problema se repite y en qué unidades?',
          'Respuestas: ¿qué comentarios siguen sin atención?',
        ],
      },
      {
        heading: 'Cómo usar IA en el análisis',
        body: 'La IA clasifica los comentarios por tema y sentimiento, agrupa casos similares y señala cambios en el lenguaje de los clientes. En lugar de leer cientos de reseñas una por una, el equipo empieza por los temas priorizados y por los casos que más afectan la percepción.',
      },
      {
        heading: 'Del análisis a la acción',
        body: 'Termina el análisis con una lista corta: qué corregir, quién es responsable y en qué plazo. Vuelve a medir el tema en el siguiente periodo para saber si la acción funcionó. Un análisis sin acción es solo un informe.',
      },
    ],
    faq: [
      {
        question: '¿Qué métricas analizar en las reseñas?',
        answer: 'Volumen, recencia, distribución de notas, temas recurrentes, tasa y tiempo de respuesta y evolución por unidad. La nota media es el resumen, no el diagnóstico.',
      },
      {
        question: '¿Cómo priorizo los temas?',
        answer: 'Combina frecuencia, gravedad e impacto en el negocio. Un problema grave pero poco frecuente puede requerir más atención que una queja común de bajo impacto.',
      },
      {
        question: '¿La IA sustituye al análisis humano?',
        answer: 'No. La IA procesa volumen y encuentra patrones; el equipo interpreta el contexto, decide prioridades y conversa con el cliente.',
      },
      {
        question: '¿Cada cuánto revisar el análisis?',
        answer: 'Semanal para señales críticas y mensual para tendencias. La comparación entre periodos muestra si las acciones están funcionando.',
      },
      {
        question: '¿Qué hago con los temas detectados?',
        answer: 'Convierte cada tema en una acción con responsable y plazo, y comprueba en el siguiente periodo si la recurrencia bajó.',
      },
    ],
  },
  'es:auditoria-gratuita': {
    sections: [
      {
        heading: 'Qué cubre la auditoría gratuita',
        body: 'La auditoría revisa tu ficha de Google Business Profile y las señales que forman la percepción: volumen y recencia de reseñas, evolución de la nota, tasa de respuesta, comentarios sin contestar, temas recurrentes y referencias de negocios similares de la zona. Termina con una lista corta de acciones prioritarias, no con un informe genérico.',
        points: [
          'Ficha completa: categorías, horarios, servicios, fotos y ubicación.',
          'Volumen, recencia y evolución de la nota.',
          'Tasa de respuesta, tiempo de respuesta y reseñas sin contestar.',
          'Temas recurrentes y referencias de negocios similares.',
        ],
      },
      {
        heading: 'Qué recibes',
        body: 'Recibes un diagnóstico claro: qué funciona, qué está costando confianza y qué tres acciones tienen más impacto. El objetivo es ayudarte a decidir por dónde empezar, tanto si ejecutas el programa internamente como con Filtra.AI.',
      },
      {
        heading: 'Cómo prepararte',
        body: 'Ten a mano el enlace de la ficha de Google Business Profile y, si tienes varias unidades, la lista de locales. Si ya recoges feedback, trae los canales que usas. La auditoría trabaja con datos públicos y con lo que decidas compartir.',
      },
    ],
    faq: [
      {
        question: '¿La auditoría es realmente gratuita?',
        answer: 'Sí. Es un paso de diagnóstico para mostrar dónde están las principales oportunidades, sin compromiso de continuar con la plataforma.',
      },
      {
        question: '¿Cuánto tarda?',
        answer: 'Para un solo local, normalmente unos días hábiles. Las auditorías multi-unidad o multi-marca tardan más porque se comparan más fichas y temas.',
      },
      {
        question: '¿Qué necesito aportar?',
        answer: 'El enlace de la ficha de Google Business Profile y la lista de unidades si hay más de una. Datos de feedback o soporte que ya recojas ayudan a profundizar el análisis.',
      },
      {
        question: '¿Necesitan acceso a mi cuenta de Google?',
        answer: 'No. La auditoría usa datos públicos de la ficha y lo que decidas compartir. El acceso a la cuenta solo es necesario después, si decides usar la plataforma.',
      },
      {
        question: '¿Qué pasa después de la auditoría?',
        answer: 'Recibes el diagnóstico y las acciones prioritarias. Puedes implementarlas internamente o usar Filtra.AI para ejecutar la rutina continua.',
      },
    ],
  },
  'en:online-reputation-management': {
    sections: [
      {
        heading: 'What online reputation management covers',
        body: 'Online reputation management is the routine that connects what customers say in public to what the business does next. It includes monitoring reviews and mentions, responding with consistency, fixing recurring causes and reporting the evolution to leadership. The goal is not to hide criticism; it is to make the experience better and let the record show it.',
        points: [
          'Monitor reviews, social mentions and search results.',
          'Respond with a consistent voice and clear policy.',
          'Fix the operational causes behind recurring complaints.',
          'Report trends to leadership every month.',
        ],
      },
      {
        heading: 'Reputation is built in the operation',
        body: 'No communication strategy survives a service that fails. The strongest reputation programs start with the customer journey: where people get frustrated, where expectations are set and where the promise breaks. Reviews are the receipt of that journey, which is why fixing the cause beats deleting the comment.',
      },
      {
        heading: 'A governance model that scales',
        body: 'Define who monitors, who replies, who fixes and who decides priorities. Central teams keep standards and consolidated reporting; local teams keep context and speed. Without that split, multi-unit operations either respond slowly or lose consistency.',
      },
    ],
    faq: [
      {
        question: 'What is online reputation management?',
        answer: 'It is the ongoing practice of monitoring, responding, fixing causes and reporting what customers say in public channels. It connects customer experience data to operational decisions.',
      },
      {
        question: 'Does it mean deleting negative comments?',
        answer: 'No. You cannot remove legitimate reviews, and trying to hide criticism damages trust. The work is to respond well, fix the cause and show improvement over time.',
      },
      {
        question: 'How is it different from customer service?',
        answer: 'Customer service resolves individual cases. Reputation management looks at patterns across cases and turns them into fixes, standards and public responses.',
      },
      {
        question: 'Who should own it?',
        answer: 'A central owner defines standards and reporting, while local owners handle replies and operational fixes. The split keeps speed and consistency.',
      },
      {
        question: 'How do we measure reputation?',
        answer: 'Track rating trend, review volume and recency, response rate and time, theme recurrence and the share of complaints that turned into fixes.',
      },
    ],
  },
  'en:online-reputation-monitoring': {
    sections: [
      {
        heading: 'What to monitor',
        body: 'Monitoring is more than watching the star average. Track new reviews and comments across channels, response times, recurring themes, sudden changes in tone and mentions outside your profiles. Each signal answers a different question about what customers are experiencing.',
        points: [
          'New reviews and comments across channels.',
          'Response rate and time to first reply.',
          'Theme recurrence and sentiment shifts.',
          'Mentions in search, social and news.',
        ],
      },
      {
        heading: 'Alerts that lead to action',
        body: 'An alert is only useful if it reaches someone who can act. Route critical reviews to the local owner, recurring themes to operations and sensitive cases to the right escalation path. A daily digest plus real-time alerts for high-risk cases usually covers most operations.',
      },
      {
        heading: 'The monthly review',
        body: 'Once a month, compare periods: volume, rating, themes, response time and actions completed. Look for what changed and why. Monitoring without a review ritual becomes noise; the meeting is where signals turn into priorities.',
      },
    ],
    faq: [
      {
        question: 'What should I monitor in online reputation?',
        answer: 'New reviews and comments, response rate and time, recurring themes, sentiment changes and mentions outside your profiles. The rating alone hides the causes.',
      },
      {
        question: 'Do I need paid tools?',
        answer: 'Not at low volume. Google Business Profile notifications, a shared inbox and a spreadsheet cover the basics. Tools help when volume, channels or units grow.',
      },
      {
        question: 'How fast should we respond to a review?',
        answer: 'Critical reviews deserve a reply within 24 to 48 hours. Routine reviews can follow a weekly cadence, but consistency matters more than speed alone.',
      },
      {
        question: 'What is a reputation alert?',
        answer: 'A notification for a signal that needs attention: a very negative review, a spike in a theme, a mention in the press or a sudden change in volume.',
      },
      {
        question: 'How do we avoid alert fatigue?',
        answer: 'Define severity levels and owners, send real-time alerts only for high-risk cases and keep the rest in a daily or weekly digest.',
      },
    ],
  },
  'en:ai-review-analysis': {
    sections: [
      {
        heading: 'What AI adds to review analysis',
        body: 'AI processes volume that humans cannot read line by line. It classifies reviews by theme and sentiment, groups similar cases and highlights what changed between periods. The team starts from the prioritized list instead of a random sample.',
        points: [
          'Theme and sentiment classification at scale.',
          'Grouping of similar complaints across units.',
          'Period comparison and trend detection.',
          'Prioritization by frequency and severity.',
        ],
      },
      {
        heading: 'A method that works',
        body: 'Start with a taxonomy that reflects your operation: waiting time, communication, price, quality, staff, result. Review a sample of classifications at the beginning and adjust. Then combine AI output with business context: a rare complaint about safety may matter more than fifty comments about parking.',
      },
      {
        heading: 'From analysis to decision',
        body: 'End each cycle with a short action list: what to fix, who owns it and when. Measure the same theme in the next period to check whether the action worked. The value of the analysis is the decision it triggers, not the dashboard it fills.',
      },
    ],
    faq: [
      {
        question: 'Can AI replace manual review analysis?',
        answer: 'It can handle the volume and find patterns, but context, priorities and public responses still need human judgment. AI accelerates the reading; the team decides.',
      },
      {
        question: 'How accurate is theme classification?',
        answer: 'It depends on the taxonomy and the language of the comments. With clear categories and a reviewed sample at the start, accuracy is usually enough for prioritization.',
      },
      {
        question: 'Does it work with reviews in different languages?',
        answer: 'Yes. Multilingual analysis is one of the main advantages for operations that serve international customers.',
      },
      {
        question: 'What do I need to start?',
        answer: 'A few months of reviews and comments plus a clear list of themes that matter to the business. The taxonomy is the foundation.',
      },
      {
        question: 'How do I know the analysis is working?',
        answer: 'When the prioritized themes become actions and their recurrence drops in later periods. Track fixes, not only sentiment scores.',
      },
    ],
  },
  'en:tourism': {
    sections: [
      {
        heading: 'Why reviews decide the booking',
        body: 'Travel decisions happen before the first contact. Tourists compare ratings, read recent reviews and look for signs that the experience matches the photos. A profile with fresh, specific feedback converts better than a beautiful page with old comments.',
        points: [
          'Recent reviews matter more than the total count.',
          'Travelers look for practical details: location, timing, guides, safety.',
          'Responses show that the business listens before arrival.',
          'Photos and review themes should tell the same story.',
        ],
      },
      {
        heading: 'Collect feedback at the right moment',
        body: 'Ask during the experience, not weeks later. A QR code at check-in, a message after the tour and a follow-up at checkout capture impressions while they are fresh. Group tours need a light process; individual travelers can receive a personal message.',
      },
      {
        heading: 'Turn themes into itinerary improvements',
        body: 'Reviews from tourists repeat practical themes: waiting, transport, communication in other languages, guide knowledge, cleanliness and value. Route each theme to the responsible team and review them before the next season, not after the complaints pile up.',
      },
    ],
    faq: [
      {
        question: 'How do I get more reviews for my tourism business?',
        answer: 'Ask at the right moments: check-in, after the tour and at checkout. Make the link or QR code easy and explain how the feedback helps future travelers.',
      },
      {
        question: 'Should I respond to reviews in other languages?',
        answer: 'Yes, whenever possible. A short reply in the customer language or in English shows care and helps future international travelers.',
      },
      {
        question: 'How do seasonality and reviews interact?',
        answer: 'Volume follows the season. Compare the same period year over year and use the low season to fix themes before the next high season.',
      },
      {
        question: 'What matters most in tourism reviews?',
        answer: 'Recency, practical details and consistency between the listing and the experience. Travelers use reviews to reduce uncertainty.',
      },
      {
        question: 'Can I ask guests to review during the stay?',
        answer: 'Yes, as long as it is voluntary and not tied to benefits. The best moment is when the customer has just experienced the value.',
      },
    ],
  },
  'en:franchises': {
    sections: [
      {
        heading: 'The franchise reputation problem',
        body: 'In a franchise, the brand is shared but the experience is local. One unit with slow service affects the perception of the whole network, while a strong local team can lift its own results. Managing that tension requires standards without erasing local context.',
        points: [
          'A shared taxonomy so themes can be compared across units.',
          'Local owners for replies and operational fixes.',
          'Central visibility into trends and critical cases.',
          'Consistent response standards with room for local voice.',
        ],
      },
      {
        heading: 'What the network should standardize',
        body: 'Standardize what protects the brand: response time, tone, escalation rules, handling of sensitive cases and reporting. Leave flexibility for what depends on local context: menu, schedule, team and neighborhood. The franchisor sets the frame; the franchisee operates inside it.',
      },
      {
        heading: 'Reporting that franchisees actually use',
        body: 'A monthly view per unit, with themes, response time, rating trend and completed actions, gives franchisees a practical agenda. Compare units carefully: different locations start from different baselines. The goal is improvement, not a public ranking that encourages gaming.',
      },
    ],
    faq: [
      {
        question: 'Who owns the review response in a franchise?',
        answer: 'Usually the local unit, with standards and escalation defined by the franchisor. Central teams monitor critical cases and consolidated trends.',
      },
      {
        question: 'Should all units use the same response template?',
        answer: 'Use the same principles and tone guidelines, not identical texts. Generic replies are easy to spot and reduce trust.',
      },
      {
        question: 'How do we compare units fairly?',
        answer: 'Compare each unit with its own history and with similar locations. Absolute rankings ignore differences in traffic, competition and maturity.',
      },
      {
        question: 'What should the franchisor monitor?',
        answer: 'Theme recurrence, response time, critical cases and the share of units with pending actions. The consolidated view shows where the network needs support.',
      },
      {
        question: 'How do we handle a crisis in one unit?',
        answer: 'Follow a central escalation path, respond quickly with facts and keep the local context. Silence or deletion usually makes the crisis worse.',
      },
    ],
  },
  'es:feedback-clientes': {
    sections: [
      {
        heading: 'Qué es el feedback de clientes',
        body: 'El feedback de clientes es toda señal que el cliente deja sobre su experiencia: reseñas, encuestas, mensajes de soporte, comentarios en redes y conversaciones comerciales. Recogerlo bien significa elegir momentos clave y no saturar al cliente con preguntas.',
        points: [
          'Elige momentos clave: después de la compra, del soporte o de la visita.',
          'Combina señales públicas y privadas.',
          'Haz preguntas cortas y específicas.',
          'Cierra el ciclo: muestra qué cambió.',
        ],
      },
      {
        heading: 'Cómo recoger feedback sin fatiga',
        body: 'Menos encuestas y mejores momentos. Una pregunta en el instante adecuado vale más que un formulario de veinte campos enviado una semana después. Si el cliente ya dio su opinión en una reseña, no le pidas lo mismo otra vez por correo.',
      },
      {
        heading: 'Del comentario a la decisión',
        body: 'El feedback solo genera valor cuando alguien lo lee, lo clasifica y actúa. Define un responsable por tema, prioriza por frecuencia y gravedad, y revisa los resultados en el periodo siguiente. La respuesta al cliente también forma parte del ciclo.',
      },
    ],
    faq: [
      {
        question: '¿Qué canales de feedback debo usar?',
        answer: 'Los que el cliente ya usa: reseñas, encuestas post-servicio, soporte y redes. Es mejor cubrir pocos canales bien que muchos a medias.',
      },
      {
        question: '¿Cada cuánto pedir feedback?',
        answer: 'En momentos clave y con moderación. Evita encuestas duplicadas y respeta la frecuencia con la que el cliente interactúa con el negocio.',
      },
      {
        question: '¿Qué hago con el feedback negativo?',
        answer: 'Respóndelo con respeto, corrige la causa cuando sea posible y registra el tema para medir recurrencia. No lo elimines ni lo ignores.',
      },
      {
        question: '¿Cómo sé si el programa funciona?',
        answer: 'Cuando los temas priorizados generan acciones y su recurrencia baja en los periodos siguientes. También mejora la tasa de respuesta.',
      },
      {
        question: '¿Necesito una herramienta?',
        answer: 'Al principio, una hoja de cálculo y una rutina semanal bastan. La herramienta aporta cuando crecen el volumen, los canales o las unidades.',
      },
    ],
  },
  'es:turismo': {
    sections: [
      {
        heading: 'Por qué las reseñas deciden la reserva',
        body: 'La decisión de viaje ocurre antes del primer contacto. El turista compara notas, lee reseñas recientes y busca señales de que la experiencia coincide con las fotos. Un perfil con feedback fresco y específico convierte mejor que una página bonita con comentarios antiguos.',
        points: [
          'Las reseñas recientes pesan más que el total acumulado.',
          'El viajero busca detalles prácticos: ubicación, horarios, guías, seguridad.',
          'Las respuestas muestran que el negocio escucha antes de la llegada.',
          'Fotos y temas de reseñas deben contar la misma historia.',
        ],
      },
      {
        heading: 'Pedir feedback en el momento correcto',
        body: 'Pregunta durante la experiencia, no semanas después. Un código QR en el check-in, un mensaje después del tour y un seguimiento al salir capturan impresiones frescas. Los tours grupales necesitan un proceso ligero; el viajero individual acepta un mensaje personal.',
      },
      {
        heading: 'Convertir temas en mejoras del itinerario',
        body: 'Las reseñas de turistas repiten temas prácticos: espera, transporte, comunicación en otros idiomas, conocimiento del guía, limpieza y relación calidad-precio. Enruta cada tema al equipo responsable y revísalos antes de la próxima temporada, no cuando las quejas se acumulan.',
      },
    ],
    faq: [
      {
        question: '¿Cómo consigo más reseñas en turismo?',
        answer: 'Pide en los momentos correctos: check-in, después del tour y al salir. Facilita el enlace o el QR y explica cómo la opinión ayuda a futuros viajeros.',
      },
      {
        question: '¿Debo responder reseñas en otros idiomas?',
        answer: 'Sí, cuando sea posible. Una respuesta breve en el idioma del cliente o en inglés muestra atención y ayuda a futuros viajeros internacionales.',
      },
      {
        question: '¿Cómo influye la temporada?',
        answer: 'El volumen sigue la temporada. Compara el mismo periodo de un año a otro y usa la temporada baja para corregir temas antes de la alta.',
      },
      {
        question: '¿Qué importa más en las reseñas de turismo?',
        answer: 'Recencia, detalles prácticos y coherencia entre el anuncio y la experiencia. El viajero usa las reseñas para reducir la incertidumbre.',
      },
      {
        question: '¿Puedo pedir reseña durante la estancia?',
        answer: 'Sí, siempre que sea voluntario y no esté ligado a beneficios. El mejor momento es cuando el cliente acaba de vivir el valor.',
      },
    ],
  },
  'es:franquicias': {
    sections: [
      {
        heading: 'El problema de reputación en franquicias',
        body: 'En una franquicia la marca es compartida, pero la experiencia es local. Una unidad con servicio lento afecta la percepción de toda la red, mientras un buen equipo local puede mejorar sus propios resultados. Gestionar esa tensión exige estándares sin borrar el contexto local.',
        points: [
          'Una taxonomía compartida para comparar temas entre unidades.',
          'Responsables locales para respuestas y correcciones.',
          'Visibilidad central de tendencias y casos críticos.',
          'Estándares de respuesta con espacio para la voz local.',
        ],
      },
      {
        heading: 'Qué debe estandarizar la red',
        body: 'Estandariza lo que protege la marca: tiempo de respuesta, tono, reglas de escalación, tratamiento de casos sensibles y reporte. Deja flexibilidad para lo que depende del contexto: menú, horario, equipo y barrio. La franquiciadora define el marco; el franquiciado opera dentro.',
      },
      {
        heading: 'Un reporte que el franquiciado use',
        body: 'Una vista mensual por unidad con temas, tiempo de respuesta, evolución de la nota y acciones completadas le da al franquiciado una agenda práctica. Compara con cuidado: cada local parte de una base distinta. El objetivo es mejorar, no publicar un ranking que incentive manipular.',
      },
    ],
    faq: [
      {
        question: '¿Quién responde las reseñas en una franquicia?',
        answer: 'Normalmente la unidad local, con estándares y escalación definidos por la franquiciadora. El equipo central monitorea casos críticos y tendencias.',
      },
      {
        question: '¿Todas las unidades deben usar la misma plantilla?',
        answer: 'Comparte principios y tono, no textos idénticos. Las respuestas genéricas se detectan y reducen la confianza.',
      },
      {
        question: '¿Cómo comparar unidades de forma justa?',
        answer: 'Compara cada unidad con su propia historia y con locales similares. Un ranking absoluto ignora diferencias de tráfico, competencia y madurez.',
      },
      {
        question: '¿Qué debe monitorear la franquiciadora?',
        answer: 'Recurrencia de temas, tiempo de respuesta, casos críticos y porcentaje de unidades con acciones pendientes.',
      },
      {
        question: '¿Cómo manejar una crisis en una unidad?',
        answer: 'Sigue una escalación central, responde rápido con hechos y conserva el contexto local. El silencio o borrar comentarios suele empeorar la crisis.',
      },
    ],
  },
  'es:como-funciona': {
    sections: [
      {
        heading: 'De la conexión al primer insight',
        body: 'El primer paso es conectar la ficha de Google Business Profile y, si los usas, tus canales de feedback. La plataforma organiza reseñas y comentarios, clasifica temas y muestra el panorama actual: qué repiten los clientes, qué está sin responder y hacia dónde va la tendencia.',
        points: [
          'Conecta la ficha y las fuentes de feedback.',
          'Clasifica temas con una taxonomía compartida.',
          'Consulta el panorama por unidad y por periodo.',
          'Define responsables y prioridades desde la primera lista.',
        ],
      },
      {
        heading: 'La rutina semanal y mensual',
        body: 'Cada semana el equipo revisa señales nuevas, responde comentarios críticos y trabaja la lista de prioridades. Cada mes compara temas, tiempo de respuesta y resultados entre periodos y locales. La cadencia es lo que convierte la plataforma en resultados.',
      },
      {
        heading: 'Roles y escalación',
        body: 'Un responsable local atiende respuestas y correcciones operativas. Un equipo central vigila la vista consolidada, comparte estándares e interviene en casos sensibles. Una escalación clara mantiene la respuesta rápida y conserva el contexto de cada unidad.',
      },
    ],
    faq: [
      {
        question: '¿Cuánto tarda la configuración?',
        answer: 'La conexión inicial es rápida. La mayor parte del tiempo se dedica a definir la taxonomía, los responsables y la cadencia que encajan con la operación.',
      },
      {
        question: '¿Tengo que cambiar mis herramientas actuales?',
        answer: 'No. Filtra.AI puede convivir con tus encuestas o herramientas de soporte y reunir las señales en una sola capa de análisis.',
      },
      {
        question: '¿Quién debe usar la plataforma a diario?',
        answer: 'Normalmente un responsable local para respuestas y correcciones, apoyado por un equipo central que monitorea la vista consolidada y los estándares.',
      },
      {
        question: '¿Cómo se tratan las reseñas sensibles?',
        answer: 'Siguen una ruta de escalación al equipo responsable o al contacto central, especialmente si implican datos personales, riesgo legal o detalles clínicos.',
      },
      {
        question: '¿Cómo sabemos si funciona?',
        answer: 'Sigue la recurrencia de temas, el tiempo de respuesta, las reseñas sin contestar y las acciones completadas.',
      },
    ],
  },
  'es:restaurantes': {
    sections: [
      {
        heading: 'La reseña empieza en la mesa',
        body: 'En restaurantes, la percepción se forma en la experiencia: espera, comida, servicio, ambiente y precio. La reseña es la consecuencia. Antes de pedir más opiniones, revisa qué temas se repiten y qué se puede corregir esta misma semana.',
        points: [
          'Tiempo de espera y comunicación durante la espera.',
          'Consistencia entre platos, fotos y expectativas.',
          'Atención del equipo en hora punta.',
          'Relación calidad-precio percibida.',
        ],
      },
      {
        heading: 'Pedir la reseña sin interrumpir',
        body: 'El mejor momento es al final, cuando el cliente ya vivió la experiencia. Un QR en la cuenta, una tarjeta discreta o un mensaje después de la visita funcionan mejor que interrumpir la comida. Nunca condicione la reseña a un descuento.',
      },
      {
        heading: 'Responder y corregir',
        body: 'Responde las reseñas con nombre del plato o del turno cuando ayude, agradece el detalle y explica la corrección. Los temas repetidos deben llegar a la cocina y al salón como mejoras concretas, no quedarse en el panel de reputación.',
      },
    ],
    faq: [
      {
        question: '¿Cómo consigo más reseñas para mi restaurante?',
        answer: 'Pide al final de la experiencia con un QR o enlace directo, facilita el proceso y explica que la opinión ayuda a otros clientes.',
      },
      {
        question: '¿Debo responder todas las reseñas?',
        answer: 'Idealmente sí. Prioriza las negativas y las que aportan detalle; las respuestas muestran que el restaurante escucha.',
      },
      {
        question: '¿Qué hago con una crítica sobre la comida?',
        answer: 'Agradece el comentario, reconoce la experiencia, explica la corrección y ofrece un canal privado para el seguimiento.',
      },
      {
        question: '¿Puedo ofrecer un postre a cambio de una reseña?',
        answer: 'No. Incentivar reseñas positivas viola las políticas de Google y daña la credibilidad. Puedes agradecer el feedback, no comprarlo.',
      },
      {
        question: '¿Cómo uso las reseñas para mejorar el menú?',
        answer: 'Agrupa los temas por plato, turno y unidad, y revisa la recurrencia después de cada cambio.',
      },
    ],
  },
  'en:ai': {
    sections: [
      {
        heading: 'What the AI does with customer voice',
        body: 'Filtra.AI reads reviews, surveys and support conversations and turns them into structured signals. It classifies themes, measures sentiment and groups similar cases across units, so the team sees patterns instead of isolated comments. The output is a prioritized list of what to fix and what to protect.',
        points: [
          'Classify themes and sentiment across channels.',
          'Group similar cases by unit and period.',
          'Prioritize by frequency, severity and impact.',
          'Suggest responses that the team reviews.',
        ],
      },
      {
        heading: 'AI for analysis, humans for judgment',
        body: 'The model handles volume and consistency; people handle context, relationships and decisions. Sensitive cases, legal risk and ambiguous comments should always pass through human review. The best setup combines fast classification with a clear escalation policy.',
      },
      {
        heading: 'From insight to measurable outcome',
        body: 'Each cycle ends with owners, deadlines and a small set of actions. In the next period, the platform compares the same themes to show whether recurrence fell. That loop is what turns customer voice into operational improvement and, eventually, into growth.',
      },
    ],
    faq: [
      {
        question: 'What can Filtra.AI analyze?',
        answer: 'Google reviews, surveys, support conversations and other feedback channels. The platform classifies themes, sentiment and recurrence across periods and units.',
      },
      {
        question: 'Does the AI write public responses?',
        answer: 'It can suggest drafts, but public replies should be reviewed by the team, especially in negative or sensitive cases. Authenticity and context matter.',
      },
      {
        question: 'How does the AI handle different languages?',
        answer: 'It classifies content in multiple languages, which helps operations that serve international customers or manage units in different countries.',
      },
      {
        question: 'Is the analysis reliable?',
        answer: 'With a clear taxonomy and an initial sample review, classification is consistent enough for prioritization. Human review covers ambiguous or high-risk cases.',
      },
      {
        question: 'What do I need to start?',
        answer: 'A few months of reviews or feedback and a list of themes that matter to the business. The taxonomy is defined together at the start.',
      },
    ],
  },
  'en:hotels': {
    sections: [
      {
        heading: 'The guest journey behind the review',
        body: 'Hotel reviews rarely mention one thing. They mix room condition, cleanliness, breakfast, staff, check-in and location. Reading them one by one hides the pattern; grouping by stage of the stay shows which part of the operation needs attention first.',
        points: [
          'Room condition, cleanliness and maintenance.',
          'Check-in, checkout and staff communication.',
          'Breakfast, amenities and value perception.',
          'Location and expectations set by photos.',
        ],
      },
      {
        heading: 'Google and booking platforms together',
        body: 'Guests leave feedback on Google, booking platforms and internal surveys. Each channel has a different audience and a different response standard. Consolidating them avoids the trap of fixing only what appears on the platform with the most visible rating.',
      },
      {
        heading: 'A routine that fits hotel operations',
        body: 'Daily, the team handles critical reviews and pending replies. Weekly, it reviews recurring themes with housekeeping, maintenance and front desk. Monthly, it compares properties and periods. The cadence keeps small issues from becoming a seasonal pattern.',
      },
    ],
    faq: [
      {
        question: 'How do I improve my hotel rating?',
        answer: 'Fix the recurring themes in the guest journey, ask for feedback at the right moments and reply consistently. The rating follows the experience, not the request.',
      },
      {
        question: 'Should I respond to every review?',
        answer: 'Prioritize negative and detailed reviews, but aim to reply to all. Responses show future guests how the hotel handles problems.',
      },
      {
        question: 'How do I compare properties?',
        answer: 'Compare each property with its own history and with similar properties. Different locations, categories and demand profiles start from different baselines.',
      },
      {
        question: 'What should we do with OTA reviews?',
        answer: 'Monitor them together with Google reviews, answer where the platform allows and route recurring themes to the same operational owners.',
      },
      {
        question: 'How do we involve housekeeping and maintenance?',
        answer: 'Translate review themes into specific checklists and routines for each team. Monthly, review recurrence with them, not only with management.',
      },
    ],
  },
  'en:associations': {
    sections: [
      {
        heading: 'Feedback from members and stakeholders',
        body: 'Associations serve several audiences at once: members, associated companies, partners and public bodies. Each group has different expectations, and a single survey rarely captures them. Structured collection by segment reveals what each audience values and where the association is failing to deliver.',
        points: [
          'Segment feedback by member profile and region.',
          'Combine surveys, events and service channels.',
          'Track themes over terms and administrations.',
          'Report results to the board with clear priorities.',
        ],
      },
      {
        heading: 'Reputation beyond the member base',
        body: 'Public perception also matters: how the association is cited in the press, in search results and in conversations within the sector. Monitoring those signals helps anticipate crises and strengthens the association as a reference for the category.',
      },
      {
        heading: 'A routine for continuous management',
        body: 'Define a calendar: quarterly surveys, event feedback, annual perception review and a monthly board summary. With a stable taxonomy, comparisons across years become possible and decisions stop depending on anecdotal comments.',
      },
    ],
    faq: [
      {
        question: 'How do associations collect member feedback?',
        answer: 'Combine short surveys, event evaluations and messages from service channels, segmented by member profile. A stable taxonomy allows comparison over time.',
      },
      {
        question: 'How do we measure association reputation?',
        answer: 'Track member satisfaction, theme recurrence, participation and public mentions. Combine internal perception with external signals.',
      },
      {
        question: 'What should be reported to the board?',
        answer: 'Priority themes, evolution by segment, response rates and actions completed. Boards need decisions, not raw comment lists.',
      },
      {
        question: 'How do we handle sensitive feedback?',
        answer: 'Create a confidential channel and an escalation policy. Aggregate reporting protects identities while keeping the signal visible.',
      },
      {
        question: 'How often should we survey members?',
        answer: 'Usually quarterly for short pulses and annually for a deeper perception study. Avoid overloading the same audience with duplicate requests.',
      },
    ],
  },
  'en:restaurants': {
    sections: [
      {
        heading: 'What diners review',
        body: 'Restaurant reviews mix food, service, waiting time, ambience and price. The same complaint can come from the kitchen, the floor or the booking process. Grouping by theme and shift shows where the fix belongs, instead of treating every review as a communication problem.',
        points: [
          'Food consistency and menu expectations.',
          'Waiting time and communication during the peak.',
          'Service attention and team knowledge.',
          'Ambience, cleanliness and perceived value.',
        ],
      },
      {
        heading: 'From QR code to public review',
        body: 'A QR code on the bill captures feedback while the experience is fresh. It should invite an honest review, not filter unhappy customers. The private signal helps the team act; the public review helps future diners decide.',
      },
      {
        heading: 'Weekly routine for the floor and the kitchen',
        body: 'Share recurring themes with both teams every week, with examples and specific fixes. Track whether the theme reappears in the next period. Reviews become useful when they change prep, staffing or service flow.',
      },
    ],
    faq: [
      {
        question: 'How do I get more Google reviews for my restaurant?',
        answer: 'Ask at the end of the meal with a QR code or direct link, keep the request simple and never condition it to a benefit or a positive rating.',
      },
      {
        question: 'Should I reply to negative reviews?',
        answer: 'Yes. Acknowledge the experience, explain the fix and move personal details to a private channel. Silence looks like indifference to future diners.',
      },
      {
        question: 'How do I handle complaints about waiting time?',
        answer: 'Check staffing and communication during peak hours, and tell customers how long the wait will be. Most complaints are about uncertainty, not only the delay.',
      },
      {
        question: 'Do reviews help with local SEO?',
        answer: 'Yes. Recent, detailed reviews and consistent replies strengthen the profile and give search engines more context about the restaurant.',
      },
      {
        question: 'How do I use review themes in training?',
        answer: 'Turn recurring themes into short training topics and checklists for the floor and kitchen teams, reviewed monthly.',
      },
    ],
  },
  'en:partners': {
    sections: [
      {
        heading: 'Who the partner program is for',
        body: 'The program fits consultancies, agencies and independent professionals who already advise businesses on marketing, customer experience or local growth. Instead of building a reputation practice from scratch, partners add the platform and a proven routine to the services they already sell.',
        points: [
          'Consultancies adding customer experience services.',
          'Agencies selling local SEO and Google Business Profile.',
          'Professionals serving clinics, restaurants and franchises.',
          'Teams that want recurring revenue with clear evidence.',
        ],
      },
      {
        heading: 'How a partnership starts',
        body: 'Start with one pilot client. Define the taxonomy, the owners and the monthly report together, then review the first results. The pilot becomes the case study for the next clients and the basis for a repeatable package.',
      },
      {
        heading: 'What partners get',
        body: 'Partners get the operational layer, reporting standards and support to run the routine. The commercial model, volume and responsibilities are defined per partner, so each one can price the service according to its market.',
      },
    ],
    faq: [
      {
        question: 'Do I need to be an agency to partner?',
        answer: 'No. Consultancies and independent professionals also qualify if they already serve businesses and want to add reputation management to their offer.',
      },
      {
        question: 'Is there a minimum volume?',
        answer: 'The model is defined per partner. Starting with one pilot client is the recommended path before committing to a larger volume.',
      },
      {
        question: 'Who handles the client relationship?',
        answer: 'Usually the partner. Filtra.AI provides the platform, the operating method and support for analysis and reporting.',
      },
      {
        question: 'Can I use my own brand?',
        answer: 'The commercial arrangement, including branding and packaging, is defined with each partner. The platform runs underneath the service.',
      },
      {
        question: 'How long does it take to launch?',
        answer: 'A pilot can start in weeks. The main work is defining the taxonomy, the owners and the reporting cadence with the first client.',
      },
    ],
  },
  'en:ask-for-stars-vs-filtering': {
    sections: [
      {
        heading: 'The direct ask',
        body: 'Asking every customer for five stars sounds simple, but it creates two problems: customers feel pressured and the rating stops reflecting the real experience. Google policies also prohibit incentives and review gating. A direct ask works when it is neutral, voluntary and available to everyone.',
        points: [
          'Neutral invitation, without asking for a specific rating.',
          'No rewards, discounts or conditions.',
          'The same process for every customer.',
          'A public reply policy for positive and negative feedback.',
        ],
      },
      {
        heading: 'The feedback-first approach',
        body: 'A feedback-first flow invites the customer to comment privately before the public review. It is not about hiding unhappy customers; it is about understanding the problem while there is still time to fix it. The public invitation remains open to everyone, which keeps the process honest.',
      },
      {
        heading: 'What actually improves the rating',
        body: 'The rating improves when the experience improves and the review flow is consistent. Collect feedback at the right moment, fix recurring themes, reply well and measure the trend. Shortcuts that filter customers tend to backfire in the medium term.',
      },
    ],
    faq: [
      {
        question: 'Is asking for five stars against Google policies?',
        answer: 'Asking for a specific rating is discouraged and incentives are prohibited. Invite customers to share an honest opinion instead of requesting a score.',
      },
      {
        question: 'What is review gating?',
        answer: 'It is the practice of filtering customers so only happy ones reach the public review. Google prohibits it and it distorts the perception of the business.',
      },
      {
        question: 'Can I ask unhappy customers to complain privately?',
        answer: 'Yes, as long as the public review is still available to everyone. Offering a private channel is service, not filtering.',
      },
      {
        question: 'Does the feedback-first flow reduce negative reviews?',
        answer: 'It can reduce surprises, because problems are addressed before becoming public. It should not be used to block anyone from reviewing.',
      },
      {
        question: 'What is the best way to ask for a review?',
        answer: 'At the moment of value, with a short message, a direct link and no pressure. One reminder is enough.',
      },
    ],
  },
  'es:hoteles': {
    sections: [
      {
        heading: 'El recorrido del huésped detrás de la reseña',
        body: 'Las reseñas de hoteles rara vez hablan de una sola cosa. Mezclan habitación, limpieza, desayuno, atención, check-in y ubicación. Leerlas una por una esconde el patrón; agruparlas por etapa de la estancia muestra qué parte de la operación necesita atención primero.',
        points: [
          'Estado de la habitación, limpieza y mantenimiento.',
          'Check-in, check-out y comunicación del equipo.',
          'Desayuno, servicios y percepción de valor.',
          'Ubicación y expectativas creadas por las fotos.',
        ],
      },
      {
        heading: 'Google y las plataformas de reserva',
        body: 'El huésped deja feedback en Google, en plataformas de reserva y en encuestas internas. Cada canal tiene un público y un estándar de respuesta distinto. Consolidarlos evita corregir solo lo que aparece en la plataforma con la nota más visible.',
      },
      {
        heading: 'Una rutina que encaja en la operación',
        body: 'A diario, el equipo atiende reseñas críticas y respuestas pendientes. Cada semana revisa temas recurrentes con limpieza, mantenimiento y recepción. Cada mes compara hoteles y periodos. La cadencia evita que problemas pequeños se conviertan en un patrón de temporada.',
      },
    ],
    faq: [
      {
        question: '¿Cómo mejoro la nota de mi hotel?',
        answer: 'Corrige los temas recurrentes del recorrido del huésped, pide feedback en los momentos correctos y responde con consistencia. La nota sigue a la experiencia.',
      },
      {
        question: '¿Debo responder todas las reseñas?',
        answer: 'Prioriza las negativas y las detalladas, pero intenta responder todas. Las respuestas muestran a futuros huéspedes cómo gestiona el hotel los problemas.',
      },
      {
        question: '¿Cómo comparo varios hoteles?',
        answer: 'Compara cada hotel con su propia historia y con hoteles similares. Ubicaciones, categorías y demandas distintas parten de bases distintas.',
      },
      {
        question: '¿Qué hago con las reseñas de las OTAs?',
        answer: 'Haz seguimiento junto con Google, responde donde la plataforma lo permita y enruta los temas a los mismos responsables operativos.',
      },
      {
        question: '¿Cómo involucro a limpieza y mantenimiento?',
        answer: 'Traduce los temas en listas de verificación y rutinas concretas para cada equipo. Revisa la recurrencia mensualmente con ellos, no solo con la dirección.',
      },
    ],
  },
  'es:agencias': {
    sections: [
      {
        heading: 'Reputación como servicio recurrente',
        body: 'Las agencias ya gestionan SEO local, contenido y perfiles de Google Business Profile. La reputación encaja como una capa operativa: recoger feedback, clasificar temas, responder reseñas y reportar mejoras. Es un servicio mensual con evidencia concreta para el cliente.',
        points: [
          'Añade gestión de reseñas a los contratos actuales.',
          'Usa las reseñas como evidencia para SEO local.',
          'Estandariza informes mensuales por cliente.',
          'Empieza con una cuenta piloto.',
        ],
      },
      {
        heading: 'Qué cambia en la operación de la agencia',
        body: 'La agencia define la taxonomía, los responsables y la cadencia de reporte de cada cliente. La plataforma organiza los datos y la rutina semanal. Lo que antes era una tarea manual y dispersa se convierte en un proceso repetible.',
      },
      {
        heading: 'Cómo vender el servicio',
        body: 'Presenta el problema en términos del cliente: reseñas sin responder, temas que se repiten y falta de evidencia para priorizar. Muestra el diagnóstico del piloto y propone una rutina mensual con objetivos claros.',
      },
    ],
    faq: [
      {
        question: '¿Necesito un equipo dedicado?',
        answer: 'No al inicio. Una persona puede operar la rutina de varios clientes con la plataforma, apoyada por el equipo de la agencia para casos sensibles.',
      },
      {
        question: '¿Cómo integro esto con SEO local?',
        answer: 'Las reseñas y las respuestas aportan señales de actividad y contexto al perfil de Google. Úsalas junto con el trabajo de contenido y enlaces.',
      },
      {
        question: '¿Puedo ofrecerlo a clientes pequeños?',
        answer: 'Sí. Un paquete básico con monitoreo, respuestas y un informe mensual funciona para clientes con poco volumen.',
      },
      {
        question: '¿Cómo demuestro resultados?',
        answer: 'Muestra la evolución de temas, tasa y tiempo de respuesta, reseñas sin contestar y acciones completadas. Conecta con retención o conversión cuando sea posible.',
      },
      {
        question: '¿La agencia mantiene la voz de cada marca?',
        answer: 'Sí. La plataforma estandariza el proceso, pero los lineamientos de tono y los casos sensibles deben adaptarse a cada cliente.',
      },
    ],
  },
  'es:asociaciones': {
    sections: [
      {
        heading: 'Feedback de asociados y públicos',
        body: 'Una asociación atiende varios públicos a la vez: asociados, empresas vinculadas, aliados y organismos públicos. Cada grupo tiene expectativas distintas y una sola encuesta rara vez las captura. La recogida estructurada por segmento revela qué valora cada audiencia y dónde falla la entrega.',
        points: [
          'Segmenta el feedback por perfil de asociado y región.',
          'Combina encuestas, eventos y canales de servicio.',
          'Sigue los temas a lo largo de las gestiones.',
          'Reporta resultados a la directiva con prioridades claras.',
        ],
      },
      {
        heading: 'Reputación más allá de los asociados',
        body: 'La percepción pública también importa: cómo se cita la asociación en prensa, en resultados de búsqueda y en conversaciones del sector. Monitorear esas señales ayuda a anticipar crisis y refuerza la asociación como referencia de la categoría.',
      },
      {
        heading: 'Una rutina de gestión continua',
        body: 'Define un calendario: encuestas trimestrales, evaluación de eventos, revisión anual de percepción y resumen mensual para la directiva. Con una taxonomía estable, las comparaciones entre años se vuelven posibles y las decisiones dejan de depender de comentarios aislados.',
      },
    ],
    faq: [
      {
        question: '¿Cómo recoger feedback de los asociados?',
        answer: 'Combina encuestas cortas, evaluación de eventos y mensajes de los canales de servicio, segmentados por perfil. Una taxonomía estable permite comparar en el tiempo.',
      },
      {
        question: '¿Cómo medir la reputación de la asociación?',
        answer: 'Sigue satisfacción de asociados, recurrencia de temas, participación y menciones públicas. Combina percepción interna y señales externas.',
      },
      {
        question: '¿Qué reportar a la directiva?',
        answer: 'Temas prioritarios, evolución por segmento, tasas de respuesta y acciones completadas. La directiva necesita decisiones, no listas de comentarios.',
      },
      {
        question: '¿Cómo tratar feedback sensible?',
        answer: 'Crea un canal confidencial y una política de escalación. El reporte agregado protege identidades sin ocultar la señal.',
      },
      {
        question: '¿Cada cuánto encuestar?',
        answer: 'Normalmente trimestral para pulsos cortos y anual para un estudio de percepción más profundo. Evita duplicar solicitudes al mismo público.',
      },
    ],
  },
  'es:socios': {
    sections: [
      {
        heading: 'Para quién es el programa de socios',
        body: 'El programa encaja en consultoras, agencias y profesionales independientes que ya asesoran a empresas en marketing, experiencia del cliente o crecimiento local. En lugar de construir una práctica de reputación desde cero, el socio añade la plataforma y una rutina probada a los servicios que ya vende.',
        points: [
          'Consultoras que añaden experiencia del cliente.',
          'Agencias que venden SEO local y Google Business Profile.',
          'Profesionales que atienden clínicas, restaurantes y franquicias.',
          'Equipos que buscan ingresos recurrentes con evidencia.',
        ],
      },
      {
        heading: 'Cómo empieza una alianza',
        body: 'Empieza con un cliente piloto. Define juntos la taxonomía, los responsables y el informe mensual, y revisa los primeros resultados. El piloto se convierte en el caso de estudio para los siguientes clientes y en la base de un paquete repetible.',
      },
      {
        heading: 'Qué recibe el socio',
        body: 'El socio recibe la capa operativa, los estándares de reporte y el soporte para ejecutar la rutina. El modelo comercial, el volumen y las responsabilidades se definen por socio, de modo que cada uno fija el precio según su mercado.',
      },
    ],
    faq: [
      {
        question: '¿Necesito ser una agencia para ser socio?',
        answer: 'No. Consultoras y profesionales independientes también pueden participar si ya atienden empresas y quieren añadir gestión de reputación a su oferta.',
      },
      {
        question: '¿Hay un volumen mínimo?',
        answer: 'El modelo se define por socio. Empezar con un cliente piloto es el camino recomendado antes de comprometer un volumen mayor.',
      },
      {
        question: '¿Quién gestiona la relación con el cliente?',
        answer: 'Normalmente el socio. Filtra.AI aporta la plataforma, el método operativo y soporte para el análisis y el reporte.',
      },
      {
        question: '¿Puedo usar mi propia marca?',
        answer: 'El acuerdo comercial, incluido el branding y el empaquetado, se define con cada socio. La plataforma funciona por debajo del servicio.',
      },
      {
        question: '¿Cuánto tarda el lanzamiento?',
        answer: 'Un piloto puede empezar en semanas. El trabajo principal es definir la taxonomía, los responsables y la cadencia de reporte con el primer cliente.',
      },
    ],
  },
  'es:pedir-estrellas-vs-filtrar': {
    sections: [
      {
        heading: 'El pedido directo',
        body: 'Pedir cinco estrellas a cada cliente parece simple, pero crea dos problemas: el cliente se siente presionado y la nota deja de reflejar la experiencia real. Las políticas de Google también prohíben incentivos y el filtrado de reseñas. El pedido directo funciona cuando es neutral, voluntario y está disponible para todos.',
        points: [
          'Invitación neutral, sin pedir una nota concreta.',
          'Sin recompensas, descuentos ni condiciones.',
          'El mismo proceso para todos los clientes.',
          'Política pública de respuesta para feedback positivo y negativo.',
        ],
      },
      {
        heading: 'El enfoque feedback primero',
        body: 'Un flujo feedback primero invita al cliente a comentar en privado antes de la reseña pública. No se trata de esconder a los insatisfechos, sino de entender el problema mientras aún hay tiempo de corregirlo. La invitación pública sigue abierta para todos, lo que mantiene el proceso honesto.',
      },
      {
        heading: 'Qué mejora realmente la nota',
        body: 'La nota mejora cuando la experiencia mejora y el flujo de reseñas es consistente. Recoge feedback en el momento correcto, corrige temas recurrentes, responde bien y mide la tendencia. Los atajos que filtran clientes suelen volverse en contra a medio plazo.',
      },
    ],
    faq: [
      {
        question: '¿Pedir cinco estrellas viola las políticas de Google?',
        answer: 'Pedir una nota concreta es desaconsejado y los incentivos están prohibidos. Invita al cliente a compartir una opinión honesta en lugar de exigir una puntuación.',
      },
      {
        question: '¿Qué es el filtrado de reseñas?',
        answer: 'Es la práctica de filtrar clientes para que solo los satisfechos lleguen a la reseña pública. Google lo prohíbe y distorsiona la percepción del negocio.',
      },
      {
        question: '¿Puedo pedir a los insatisfechos que se quejen en privado?',
        answer: 'Sí, siempre que la reseña pública siga disponible para todos. Ofrecer un canal privado es servicio, no filtrado.',
      },
      {
        question: '¿El flujo feedback primero reduce reseñas negativas?',
        answer: 'Puede reducir sorpresas, porque los problemas se atienden antes de hacerse públicos. No debe usarse para bloquear a nadie.',
      },
      {
        question: '¿Cuál es la mejor forma de pedir una reseña?',
        answer: 'En el momento del valor, con un mensaje corto, un enlace directo y sin presión. Un recordatorio es suficiente.',
      },
    ],
  },
};

const sourcePaths=['/ia','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google','/filtra-ai','/reputacao-google','/como-melhorar-avaliacoes-google','/monitoramento-reputacao-online','/gestao-de-feedback','/hoteis','/turismo','/agencias','/clinicas','/franquias','/associacoes','/restaurantes','/como-funciona','/parceiros','/pedir-estrela-vs-filtrar','/auditoria-gratuita'];

export function generateStaticParams(){return (Object.entries(pages) as [Lang,Item[]][]).flatMap(([lang,items])=>items.map(x=>({lang,slug:x.slug})));}

function get(lang:string,slug:string){
  const items=pages[lang as Lang];
  if(!items)return null;
  const index=items.findIndex(x=>x.slug===slug);
  return index<0?null:{item:items[index],index};
}

const pageFamilies:Record<string,{pt:string;en:string;es:string;zh:string}>={
  '/ia':{pt:'/ia',en:'/en/ai',es:'/es/ia',zh:'/zh/ai'},
  '/feedback-de-clientes':{pt:'/feedback-de-clientes',en:'/en/customer-feedback',es:'/es/feedback-clientes',zh:'/zh/customer-feedback'},
  '/analise-de-avaliacoes-com-ia':{pt:'/analise-de-avaliacoes-com-ia',en:'/en/ai-review-analysis',es:'/es/analisis-resenas-ia',zh:'/zh/ai-review-analysis'},
  '/gestao-de-reputacao-online':{pt:'/gestao-de-reputacao-online',en:'/en/online-reputation-management',es:'/es/gestion-reputacion-online',zh:'/zh/online-reputation-management'},
  '/avaliacoes-google':{pt:'/avaliacoes-google',en:'/en/google-reviews',es:'/es/resenas-google',zh:'/zh/google-reviews'},
  '/filtra-ai':{pt:'/filtra-ai',en:'/en/filtra-ai',es:'/es/filtra-ai',zh:'/zh/filtra-ai'},
  '/reputacao-google':{pt:'/reputacao-google',en:'/en/google-reputation',es:'/es/reputacion-google',zh:'/zh/google-reputation'},
  '/como-melhorar-avaliacoes-google':{pt:'/como-melhorar-avaliacoes-google',en:'/en/improve-google-reviews',es:'/es/mejorar-resenas-google',zh:'/zh/improve-google-reviews'},
  '/monitoramento-reputacao-online':{pt:'/monitoramento-reputacao-online',en:'/en/online-reputation-monitoring',es:'/es/monitoreo-reputacion-online',zh:'/zh/online-reputation-monitoring'},
  '/gestao-de-feedback':{pt:'/gestao-de-feedback',en:'/en/customer-feedback-management',es:'/es/gestion-feedback-clientes',zh:'/zh/customer-feedback-management'},
  '/hoteis':{pt:'/hoteis',en:'/en/hotels',es:'/es/hoteles',zh:'/zh/hotels'},
  '/turismo':{pt:'/turismo',en:'/en/tourism',es:'/es/turismo',zh:'/zh/tourism'},
  '/agencias':{pt:'/agencias',en:'/en/agencies',es:'/es/agencias',zh:'/zh/agencies'},
  '/clinicas':{pt:'/clinicas',en:'/en/clinics',es:'/es/clinicas',zh:'/zh/clinics'},
  '/franquias':{pt:'/franquias',en:'/en/franchises',es:'/es/franquicias',zh:'/zh/franchises'},
  '/associacoes':{pt:'/associacoes',en:'/en/associations',es:'/es/asociaciones',zh:'/zh/associations'},
  '/restaurantes':{pt:'/restaurantes',en:'/en/restaurants',es:'/es/restaurantes',zh:'/zh/restaurants'},
  '/como-funciona':{pt:'/como-funciona',en:'/en/how-it-works',es:'/es/como-funciona',zh:'/zh/how-it-works'},
  '/parceiros':{pt:'/parceiros',en:'/en/partners',es:'/es/socios',zh:'/zh/partners'},
  '/pedir-estrela-vs-filtrar':{pt:'/pedir-estrela-vs-filtrar',en:'/en/ask-for-stars-vs-filtering',es:'/es/pedir-estrellas-vs-filtrar',zh:'/zh/request-stars-vs-filter'},
  '/auditoria-gratuita':{pt:'/auditoria-gratuita',en:'/en/free-review-audit',es:'/es/auditoria-gratuita',zh:'/zh/free-review-audit'}
};

function familyForPage(lang:Lang,slug:string){
  const path='/'+lang+'/'+slug;
  return Object.values(pageFamilies).find(family=>family[lang]===path);
}

function sourcePathForPage(lang:Lang,slug:string){
  const family=familyForPage(lang,slug);
  return family?.pt;
}

function localizedPath(lang:Lang,sourcePath:string,fallbackSlug:string){
  return pageFamilies[sourcePath]?.[lang] || '/'+lang+'/'+fallbackSlug;
}

const labels={
  en:{topics:'Explore related topics',resources:'Guides and resources',why:'What this page helps you solve',how:'A practical workflow',benefits:'What to look for',next:'Continue with Filtra.AI',back:'See the full strategy',faq:'Frequently asked questions'},
  es:{topics:'Explora temas relacionados',resources:'Guías y recursos',why:'Qué problema ayuda a resolver esta página',how:'Un flujo de trabajo práctico',benefits:'Qué debes observar',next:'Continúa con Filtra.AI',back:'Ver la estrategia completa',faq:'Preguntas frecuentes'},
  zh:{topics:'探索相关主题',resources:'指南与资源',why:'本页面可以帮助解决什么问题',how:'实用的管理流程',benefits:'重点关注什么',next:'继续了解 Filtra.AI',back:'查看完整策略',faq:'常见问题'}
};

const RELATED_BY_SOURCE:Record<string,string[]>={
  '/filtra-ai':['/gestao-de-reputacao-online','/avaliacoes-google','/analise-de-avaliacoes-com-ia','/feedback-de-clientes'],
  '/gestao-de-reputacao-online':['/monitoramento-reputacao-online','/reputacao-google','/avaliacoes-google','/gestao-de-feedback'],
  '/avaliacoes-google':['/como-melhorar-avaliacoes-google','/reputacao-google','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online'],
  '/reputacao-google':['/avaliacoes-google','/como-melhorar-avaliacoes-google','/monitoramento-reputacao-online','/gestao-de-reputacao-online'],
  '/analise-de-avaliacoes-com-ia':['/avaliacoes-google','/feedback-de-clientes','/gestao-de-reputacao-online','/monitoramento-reputacao-online'],
  '/feedback-de-clientes':['/gestao-de-feedback','/analise-de-avaliacoes-com-ia','/avaliacoes-google','/gestao-de-reputacao-online'],
  '/como-melhorar-avaliacoes-google':['/avaliacoes-google','/reputacao-google','/feedback-de-clientes','/gestao-de-reputacao-online'],
  '/monitoramento-reputacao-online':['/gestao-de-reputacao-online','/reputacao-google','/avaliacoes-google','/analise-de-avaliacoes-com-ia'],
  '/gestao-de-feedback':['/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google'],
  '/hoteis':['/reputacao-google','/avaliacoes-google','/gestao-de-reputacao-online','/monitoramento-reputacao-online'],
  '/turismo':['/reputacao-google','/gestao-de-reputacao-online','/feedback-de-clientes','/monitoramento-reputacao-online'],
  '/agencias':['/gestao-de-reputacao-online','/avaliacoes-google','/auditoria-gratuita','/parceiros'],
  '/clinicas':['/avaliacoes-google','/reputacao-google','/gestao-de-feedback','/gestao-de-reputacao-online'],
  '/franquias':['/monitoramento-reputacao-online','/gestao-de-reputacao-online','/avaliacoes-google','/reputacao-google'],
  '/associacoes':['/feedback-de-clientes','/gestao-de-feedback','/gestao-de-reputacao-online','/auditoria-gratuita'],
  '/restaurantes':['/avaliacoes-google','/reputacao-google','/como-melhorar-avaliacoes-google','/feedback-de-clientes'],
  '/como-funciona':['/filtra-ai','/avaliacoes-google','/feedback-de-clientes','/gestao-de-reputacao-online'],
  '/parceiros':['/filtra-ai','/gestao-de-reputacao-online','/avaliacoes-google','/auditoria-gratuita'],
  '/pedir-estrela-vs-filtrar':['/avaliacoes-google','/feedback-de-clientes','/gestao-de-reputacao-online','/como-melhorar-avaliacoes-google'],
  '/auditoria-gratuita':['/filtra-ai','/avaliacoes-google','/gestao-de-reputacao-online','/analise-de-avaliacoes-com-ia'],
};

function relatedIndexes(index:number,count:number){
  const sourcePath=sourcePaths[index];
  const preferred=RELATED_BY_SOURCE[sourcePath]||[];
  const result:number[]=[];
  for(const path of preferred){
    const candidate=sourcePaths.indexOf(path);
    if(candidate>=0 && candidate!==index && !result.includes(candidate)) result.push(candidate);
    if(result.length>=count)return result;
  }
  const authority=['/filtra-ai','/gestao-de-reputacao-online','/avaliacoes-google','/reputacao-google','/analise-de-avaliacoes-com-ia','/feedback-de-clientes','/como-melhorar-avaliacoes-google','/monitoramento-reputacao-online','/gestao-de-feedback'];
  for(const path of authority){
    const candidate=sourcePaths.indexOf(path);
    if(candidate>=0 && candidate!==index && !result.includes(candidate))result.push(candidate);
    if(result.length>=count)return result;
  }
  for(let offset=1;result.length<count && offset<sourcePaths.length;offset++){
    const candidate=(index+offset)%sourcePaths.length;
    if(candidate!==index&&!result.includes(candidate))result.push(candidate);
  }
  return result;
}

export async function generateMetadata({params}:{params:Promise<{lang:string;slug:string}>}):Promise<Metadata>{
  const {lang,slug}=await params;
  if(!isLang(lang))return{};
  const found=get(lang,slug);
  if(!found)return{};
  const family=familyForPage(lang,slug);
  if(!family)return {
    title:serpTitle(found.item.title),
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/'+slug},
    openGraph:{type:'website',url:base+'/'+lang+'/'+slug,siteName:'Filtra.AI',title:found.item.title,description:found.item.description,images:[OG_IMAGE_META]},
    twitter:buildTwitter(found.item.title,found.item.description),
    robots:{index:lang!=='zh',follow:true}
  };
  const languages:Record<string,string>={
    'pt-BR':base+family.pt,
    en:base+family.en,
    es:base+family.es,
    'x-default':base+family.pt
  };
  return {
    title:serpTitle(found.item.title),
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/'+slug,languages},
    openGraph:{type:'website',url:base+'/'+lang+'/'+slug,siteName:'Filtra.AI',title:found.item.title,description:found.item.description,images:[OG_IMAGE_META]},
    twitter:buildTwitter(found.item.title,found.item.description),
    robots:{index:lang!=='zh',follow:true}
  };
}

export default async function Page({params}:{params:Promise<{lang:string;slug:string}>}){
  const {lang,slug}=await params;
  if(!isLang(lang))notFound();
  const found=get(lang,slug);
  if(!found)notFound();

  const t=labels[lang];
  const topic=found.item;
  const unique=UNIQUE_CONTENT[`${lang}:${slug}`];
  const related=relatedIndexes(found.index,4);
  const relatedCopy=related.map(i=>pages[lang][i]);
  const primary=localizedPath(lang,sourcePaths[found.index],slug);
  const blogHub=lang==='en'?'/en/blog':lang==='es'?'/es/blog':'/zh/blog';
  const blogFamilies=[
    {en:'/en/blog/get-google-reviews',es:'/es/blog/conseguir-resenas-google',zh:'/zh/blog/google-reviews-guide',label:{en:'How to get genuine Google reviews',es:'Cómo conseguir reseñas genuinas en Google',zh:'如何获得更多真实的 Google 评价'}},
    {en:'/en/blog/online-reputation-management-guide',es:'/es/blog/guia-gestion-reputacion-online',zh:'/zh/blog/online-reputation-management-guide',label:{en:'Online reputation management guide',es:'Guía de gestión de reputación online',zh:'在线声誉管理指南'}},
    {en:'/en/blog/ai-review-analysis-guide',es:'/es/blog/analisis-resenas-ia',zh:'/zh/blog/ai-review-analysis-guide',label:{en:'AI review analysis guide',es:'Guía de análisis de reseñas con IA',zh:'AI 评论分析指南'}},
    {en:'/en/blog/customer-feedback-reputation',es:'/es/blog/feedback-clientes-reputacion',zh:'/zh/blog/customer-feedback-reputation',label:{en:'Customer feedback and reputation',es:'Feedback de clientes y reputación',zh:'客户反馈与声誉'}},
    {en:'/en/blog/local-seo-google-reviews',es:'/es/blog/seo-local-resenas-google',zh:'/zh/blog/local-seo-google-reviews',label:{en:'Local SEO and Google reviews',es:'SEO local y reseñas de Google',zh:'本地 SEO 与 Google 评价'}},
    {en:'/en/blog/agency-reputation-management',es:'/es/blog/agencia-gestion-reputacion',zh:'/zh/blog/agency-reputation-management',label:{en:'Agency reputation management',es:'Gestión de reputación para agencias',zh:'代理机构声誉管理'}}
  ];
  const resourceByPage:Record<string,typeof blogFamilies[number]>={
    '/avaliacoes-google':blogFamilies[0],
    '/como-melhorar-avaliacoes-google':blogFamilies[0],
    '/reputacao-google':blogFamilies[0],
    '/gestao-de-reputacao-online':blogFamilies[1],
    '/monitoramento-reputacao-online':blogFamilies[1],
    '/analise-de-avaliacoes-com-ia':blogFamilies[2],
    '/ia':blogFamilies[2],
    '/feedback-de-clientes':blogFamilies[3],
    '/gestao-de-feedback':blogFamilies[3],
    '/filtra-ai':blogFamilies[2],
    '/agencias':blogFamilies[5],
    '/hoteis':blogFamilies[5],
    '/turismo':blogFamilies[5],
    '/clinicas':blogFamilies[5],
    '/franquias':blogFamilies[5],
    '/associacoes':blogFamilies[5],
    '/restaurantes':blogFamilies[5],
    '/como-funciona':blogFamilies[1],
    '/parceiros':blogFamilies[5],
    '/pedir-estrela-vs-filtrar':blogFamilies[0],
    '/auditoria-gratuita':blogFamilies[2]
  };
  const sourcePath=sourcePathForPage(lang,slug);
  const resourceArticle=sourcePath ? resourceByPage[sourcePath] : undefined;
  if(!resourceArticle) notFound();
  const sectionCopy={
    en:{
      why:`Businesses searching for ${topic.title.toLowerCase()} need a repeatable way to understand customer signals and turn them into decisions, not just collect more comments.`,
      how:`Start with the customer experience, organize the relevant signals, identify recurring patterns, route the right issue to the right team and monitor whether the change improves perception over time.`
    },
    es:{
      why:`Las empresas que buscan ${topic.title.toLowerCase()} necesitan una forma repetible de entender las señales de los clientes y convertirlas en decisiones, no solo acumular comentarios.`,
      how:`Empieza por la experiencia del cliente, organiza las señales relevantes, identifica patrones recurrentes, lleva cada problema al equipo adecuado y comprueba si la mejora cambia la percepción con el tiempo.`
    },
    zh:{
      why:`${topic.title} 需要的不只是收集更多评论，而是建立可重复的方法来理解客户信号，并把这些信号转化为管理决策。`,
      how:`从客户体验开始，整理相关信号，识别重复模式，把问题交给合适团队处理，并持续观察改进是否改变客户感知。`
    }
  }[lang];

  const benefits={
    en:'Use the themes below as management signals: frequency, customer impact, recurrence and the team responsible for the next action.',
    es:'Usa los temas siguientes como señales de gestión: frecuencia, impacto en el cliente, recurrencia y equipo responsable de la siguiente acción.',
    zh:'把下面的主题当作管理信号：出现频率、客户影响、重复程度以及负责下一步行动的团队。'
  }[lang];

  return <main lang={lang} className="min-h-screen bg-black text-zinc-100">
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <BrandMark href={`/${lang}`} />
        <LanguageSwitcher compact/>
      </div>
    </header>

    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html:JSON.stringify({
        '@context':'https://schema.org',
        '@type':'WebPage',
        name:topic.title,
        description:topic.description,
        url:base+'/'+lang+'/'+slug,
        inLanguage:lang,
        isPartOf:{
          '@type':'WebSite',
          name:'Filtra.AI',
          url:base+'/'
        }
      })}}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html:JSON.stringify({
        '@context':'https://schema.org',
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Filtra.AI',item:base+'/'+lang},
          {'@type':'ListItem',position:2,name:topic.title,item:base+'/'+lang+'/'+slug}
        ]
      })}}
    />
    {unique && unique.faq.length>0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html:JSON.stringify({
          '@context':'https://schema.org',
          '@type':'FAQPage',
          mainEntity:unique.faq.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))
        })}}
      />
    )}
    <section className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-sm font-medium text-indigo-400">Filtra.AI</p>
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{topic.h1}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{topic.intro}</p>

      {unique ? (
        unique.sections.map((section)=>(
          <section key={section.heading} className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{section.body}</p>
            {section.points && (
              <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-base leading-8 text-zinc-300">
                {section.points.map((point)=><li key={point}>{point}</li>)}
              </ul>
            )}
          </section>
        ))
      ) : (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">{t.why}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{sectionCopy.why}</p>
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {topic.bullets.map(x=><div key={x} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 leading-7">{x}</div>)}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t.benefits}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{benefits}</p>
      </section>

      {!unique && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">{t.how}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{sectionCopy.how}</p>
        </section>
      )}

      {unique && unique.faq.length>0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">{t.faq}</h2>
          <div className="mt-6 space-y-3">
            {unique.faq.map((item)=>(
              <details key={item.question} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-base leading-8 text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <nav aria-label={t.topics} className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">{t.next}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {relatedCopy.map((item,pos)=>{
            const i=related[pos];
            return <Link key={item.slug} href={localizedPath(lang,sourcePaths[i],item.slug)} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-indigo-500">
              <span className="block text-sm font-semibold text-zinc-100">{item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">{item.description}</span>
            </Link>;
          })}
        </div>
      </nav>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">{t.resources}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={blogHub} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-indigo-500">
            <span className="block text-sm font-semibold text-zinc-100">{lang==='en'?'Reviews & reputation blog':lang==='es'?'Blog de reseñas y reputación':'评价与声誉博客'}</span>
            <span className="mt-1 block text-xs leading-5 text-zinc-400">{lang==='en'?'Browse localized guides and practical resources.':lang==='es'?'Explora guías localizadas y recursos prácticos.':'浏览本地化指南与实用资源。'}</span>
          </Link>
          <Link href={resourceArticle[lang]} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-indigo-500">
            <span className="block text-sm font-semibold text-zinc-100">{resourceArticle.label[lang]}</span>
            <span className="mt-1 block text-xs leading-5 text-zinc-400">{topic.description}</span>
          </Link>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href={primary} className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-200">{t.back}</Link>
        <Link href={primary} className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white">{topic.cta}</Link>
      </div>
    </section>
  </main>;
}
