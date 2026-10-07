import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

type Lang = 'en' | 'es' | 'zh';
type Item = { slug:string; title:string; description:string; h1:string; intro:string; bullets:string[]; cta:string };

const base='https://filtraai.com';

const pages: Record<Lang,Item[]> = {
en:[
{slug:'ai',title:'AI Review Analysis and Customer Feedback Intelligence',description:'Turn customer reviews and feedback into actionable insights for reputation, customer experience and growth with Filtra.AI.',h1:'Turn customer voice into business growth with AI',intro:'Filtra.AI analyzes reviews and customer feedback to reveal recurring problems, opportunities and priorities your team can act on.',bullets:['Analyze customer reviews with AI','Identify recurring complaints and opportunities','Turn feedback into clear action priorities','Improve online reputation and customer experience'],cta:'Start your free audit'},
{slug:'customer-feedback',title:'Customer Feedback Management with AI',description:'Centralize customer feedback, identify patterns and turn customer voice into growth opportunities.',h1:'Customer feedback that becomes action',intro:'Customer feedback is more than a collection of comments. Filtra.AI turns what customers say into decisions that improve experience and growth.',bullets:['Organize customer feedback','Detect patterns across reviews','Prioritize the issues that matter','Measure reputation and experience signals'],cta:'See how Filtra.AI works'},
{slug:'ai-review-analysis',title:'AI Review Analysis for Businesses',description:'Analyze online reviews with AI, detect trends and identify what customers value or criticize most.',h1:'Analyze reviews with AI',intro:'Understand the meaning behind your reviews without reading every comment manually.',bullets:['Find recurring themes','Detect negative experience signals','Discover customer strengths','Create actionable priorities'],cta:'Get a free audit'},
{slug:'online-reputation-management',title:'AI Online Reputation Management',description:'Monitor customer reviews and transform reputation signals into actions for visibility, trust and growth.',h1:'Manage online reputation with intelligence',intro:'Your reputation is built by customer experiences. Filtra.AI helps teams understand reputation signals and act on them.',bullets:['Monitor reputation signals','Understand negative reviews','Identify improvement opportunities','Turn reputation into a growth asset'],cta:'Explore reputation management'},
{slug:'google-reviews',title:'Google Reviews Management and Analysis',description:'Analyze Google reviews with AI and discover opportunities to improve customer experience and online reputation.',h1:'Turn Google Reviews into growth signals',intro:'Google reviews influence how customers perceive a business. Filtra.AI helps you understand what those reviews reveal.',bullets:['Analyze Google review patterns','Find recurring customer issues','Understand positive experience drivers','Build a stronger review strategy'],cta:'Start with a free audit'},
{slug:'filtra-ai',title:'Filtra.AI — AI Online Reputation Management',description:'Filtra.AI helps businesses manage online reputation, Google reviews and customer feedback with AI.',h1:'Turn customer voice into business growth with AI',intro:'Filtra.AI helps businesses transform reviews, customer feedback and reputation signals into practical growth decisions.',bullets:['Manage online reputation with AI','Organize Google reviews and feedback','Find recurring themes and priorities','Turn customer voice into action'],cta:'Start your free audit'},
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
{slug:'how-it-works',title:'How Filtra.AI Works for Reviews and Reputation',description:'See how Filtra.AI captures feedback, analyzes reviews and turns customer signals into reputation management actions.',h1:'How Filtra.AI works from feedback to reputation',intro:'Filtra.AI creates a structured feedback flow, organizes review signals with AI and helps teams turn customer voice into action.',bullets:['Capture the customer experience signal','Separate public and private feedback','Analyze themes and recurring issues','Turn signals into management priorities'],cta:'See how Filtra.AI works'},
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
{slug:'filtra-ai',title:'Filtra.AI — gestión de reputación online con IA',description:'Filtra.AI ayuda a las empresas a gestionar reputación online, reseñas de Google y feedback con IA.',h1:'Convierte la voz del cliente en crecimiento con IA',intro:'Filtra.AI ayuda a convertir reseñas, feedback y señales de reputación en decisiones prácticas.',bullets:['Gestiona reputación con IA','Organiza reseñas y feedback','Detecta temas y prioridades','Convierte la voz del cliente en acción'],cta:'Solicitar auditoría gratuita'},
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
{slug:'como-funciona',title:'Cómo funciona Filtra.AI para reseñas y reputación',description:'Descubre cómo Filtra.AI recoge feedback, analiza reseñas y convierte señales de clientes en acciones.',h1:'Cómo funciona Filtra.AI: del feedback a la reputación',intro:'Filtra.AI crea un flujo de feedback estructurado, organiza señales con IA y ayuda a convertir la voz del cliente en acción.',bullets:['Captura la señal de experiencia','Separa feedback público y privado','Analiza temas y problemas recurrentes','Convierte señales en prioridades de gestión'],cta:'Ver cómo funciona Filtra.AI'},
{slug:'socios',title:'Programa de socios de Filtra.AI para gestión de reputación',description:'Asóciate con Filtra.AI para añadir reseñas, feedback y gestión de reputación a tus servicios.',h1:'Lleva la gestión de reputación a más empresas',intro:'Consultoras, agencias y profesionales pueden usar Filtra.AI como capa operativa de feedback y reputación.',bullets:['Añade un servicio de reputación a tu oferta','Empieza con un cliente piloto','Usa evidencia en conversaciones','Escala un flujo repetible'],cta:'Solicitar auditoría para socios'},
{slug:'pedir-estrellas-vs-filtrar',title:'Pedir 5 estrellas vs filtrar feedback | Filtra.AI',description:'Compara pedir estrellas directamente con un flujo de reputación basado en feedback y experiencia del cliente.',h1:'Pedir 5 estrellas no es lo mismo que gestionar la reputación',intro:'Un flujo basado en feedback permite entender la experiencia antes de invitar a reseñas públicas honestas y actuar sobre problemas recurrentes.',bullets:['Captura feedback antes de la reseña pública','Aprende de las críticas','Facilita reseñas honestas','Convierte señales en acciones'],cta:'Comparar los dos enfoques'},
{slug:'auditoria-gratuita',title:'Auditoría gratuita de reseñas y reputación online | Filtra.AI',description:'Haz una auditoría gratuita de reseñas y reputación online para identificar patrones, riesgos y oportunidades.',h1:'Obtén una auditoría gratuita de reseñas y reputación',intro:'Empieza con una visión práctica de tus reseñas, temas recurrentes y señales de reputación antes de decidir qué cambiar.',bullets:['Identifica temas recurrentes','Encuentra riesgos y oportunidades','Entiende qué valoran tus clientes','Crea un plan de mejora enfocado'],cta:'Solicitar auditoría gratuita'}
],
zh:[
{slug:'ai',title:'AI 评论分析与客户反馈智能',description:'使用 Filtra.AI 将客户评论和反馈转化为可执行洞察，改善声誉、客户体验和业务增长。',h1:'用 AI 将客户声音转化为业务增长',intro:'Filtra.AI 分析评论和客户反馈，发现重复问题、机会和行动优先级。',bullets:['使用 AI 分析客户评论','发现重复投诉和机会','将反馈转化为行动优先级','改善在线声誉和客户体验'],cta:'开始免费审计'},
{slug:'customer-feedback',title:'AI 客户反馈管理',description:'集中管理客户反馈，发现模式，并将客户声音转化为增长机会。',h1:'让客户反馈真正产生行动',intro:'Filtra.AI 帮助企业将客户声音转化为改善体验和增长的决策。',bullets:['整理客户反馈','发现评论中的模式','确定重要问题优先级','衡量声誉和体验信号'],cta:'了解 Filtra.AI'},
{slug:'ai-review-analysis',title:'企业 AI 评论分析',description:'使用 AI 分析在线评论，发现趋势并了解客户最重视或最不满意的方面。',h1:'使用 AI 分析客户评论',intro:'无需手动阅读每一条评论，也能理解评论背后的业务信号。',bullets:['发现重复主题','识别负面体验','发现客户认可的优势','建立可执行优先级'],cta:'获取免费审计'},
{slug:'online-reputation-management',title:'AI 在线声誉管理',description:'监测客户评论，将声誉信号转化为改善信任、可见度和增长的行动。',h1:'用智能管理在线声誉',intro:'Filtra.AI 帮助团队理解声誉信号并及时行动。',bullets:['监测声誉信号','理解负面评论','发现积极体验机会','将声誉转化为增长资产'],cta:'了解声誉管理'},
{slug:'google-reviews',title:'Google 评论管理与分析',description:'使用 AI 分析 Google 评论，发现改善客户体验和在线声誉的机会。',h1:'将 Google 评论转化为增长信号',intro:'Filtra.AI 帮助企业理解 Google 评论揭示的信息。',bullets:['分析 Google 评论模式','发现重复客户问题','了解积极体验驱动因素','建立更好的评论策略'],cta:'开始免费审计'},
{slug:'filtra-ai',title:'Filtra.AI — AI 在线声誉管理',description:'Filtra.AI 帮助企业使用 AI 管理在线声誉、Google 评价和客户反馈。',h1:'用 AI 将客户声音转化为业务增长',intro:'Filtra.AI 将评价、客户反馈和声誉信号转化为实际增长决策。',bullets:['使用 AI 管理在线声誉','整理 Google 评价和反馈','发现重复主题和优先事项','将客户声音转化为行动'],cta:'开始免费审计'},
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
  en:{topics:'Explore related topics',resources:'Guides and resources',why:'What this page helps you solve',how:'A practical workflow',benefits:'What to look for',next:'Continue with Filtra.AI',back:'See the full strategy'},
  es:{topics:'Explora temas relacionados',resources:'Guías y recursos',why:'Qué problema ayuda a resolver esta página',how:'Un flujo de trabajo práctico',benefits:'Qué debes observar',next:'Continúa con Filtra.AI',back:'Ver la estrategia completa'},
  zh:{topics:'探索相关主题',resources:'指南与资源',why:'本页面可以帮助解决什么问题',how:'实用的管理流程',benefits:'重点关注什么',next:'继续了解 Filtra.AI',back:'查看完整策略'}
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
  const found=get(lang,slug);
  if(!found)return{};
  const family=familyForPage(lang,slug);
  if(!family)return {
    title:found.item.title,
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/'+slug},
    openGraph:{type:'website',url:base+'/'+lang+'/'+slug,siteName:'Filtra.AI',title:found.item.title,description:found.item.description},
    robots:{index:true,follow:true}
  };
  const languages:Record<string,string>={
    'pt-BR':base+family.pt,
    en:base+family.en,
    es:base+family.es,
    zh:base+family.zh,
    'x-default':base+family.pt
  };
  return {
    title:found.item.title,
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/'+slug,languages},
    openGraph:{type:'website',url:base+'/'+lang+'/'+slug,siteName:'Filtra.AI',title:found.item.title,description:found.item.description},
    robots:{index:true,follow:true}
  };
}

export default async function Page({params}:{params:Promise<{lang:string;slug:string}>}){
  const {lang,slug}=await params;
  const found=get(lang,slug);
  if(!found)notFound();

  const t=labels[lang];
  const topic=found.item;
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
        <Link href={`/${lang}`} className="font-semibold tracking-tight text-white"><BrandMark/></Link>
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
    <section className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-sm font-medium text-indigo-400">Filtra.AI</p>
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{topic.h1}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{topic.intro}</p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">{t.why}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{sectionCopy.why}</p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {topic.bullets.map(x=><div key={x} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 leading-7">{x}</div>)}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t.benefits}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{benefits}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t.how}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{sectionCopy.how}</p>
      </section>

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
