import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BrandMark } from '../../../components/BrandMark';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { serpTitle } from '../../../lib/seoTitle';

type Lang='en'|'es'|'zh';
type Section={heading:string;body:string;bullets?:string[]};
type Article={slug:string;title:string;description:string;kicker:string;lead:string;sections:Section[]};

const base='https://filtraai.com';

const families=[
  {pt:'/blog/como-conseguir-avaliacoes-google',en:'/en/blog/get-google-reviews',es:'/es/blog/conseguir-resenas-google',zh:'/zh/blog/google-reviews-guide'},
  {pt:'/blog/gestao-reputacao-online-guia',en:'/en/blog/online-reputation-management-guide',es:'/es/blog/guia-gestion-reputacion-online',zh:'/zh/blog/online-reputation-management-guide'},
  {pt:'/blog/feedback-cliente-para-reputacao',en:'/en/blog/customer-feedback-reputation',es:'/es/blog/feedback-clientes-reputacion',zh:'/zh/blog/customer-feedback-reputation'},
  {pt:'/blog/seo-local-avaliacoes-local-pack',en:'/en/blog/local-seo-google-reviews',es:'/es/blog/seo-local-resenas-google',zh:'/zh/blog/local-seo-google-reviews'},
  {pt:'/blog/agencia-vender-gestao-reputacao',en:'/en/blog/agency-reputation-management',es:'/es/blog/agencia-gestion-reputacion',zh:'/zh/blog/agency-reputation-management'}
] as const;

const translatedFamilies = [
  { en: '/en/blog/ai-review-analysis-guide', es: '/es/blog/analisis-resenas-ia', zh: '/zh/blog/ai-review-analysis-guide' },
] as const;

const articles:Record<Lang,Article[]>={
  en:[
    {slug:'agency-reputation-management',title:'Agency Reputation Management: A Recurring Local SEO Service',description:'A practical guide for SEO agencies that want to offer reputation management as a recurring local SEO service.',kicker:'Agencies · Local SEO',lead:'Agencies can turn reputation management into a repeatable service when review monitoring, analysis, response workflows and reporting are packaged around each client.',sections:[{heading:'Package reputation as part of local SEO',body:'Reputation is closely connected to local search because reviews shape trust around the business profile. Agencies can make it a recurring deliverable instead of treating reviews as an occasional task.'},{heading:'Standardize the workflow without losing local context',body:'Create a repeatable process for monitoring reviews, identifying recurring themes, organizing responses and reporting results. Keep each client and location tied to its own operational context.',bullets:['Define the scope per client or location','Set a recurring review and reporting cadence','Separate operational issues from response tasks','Track changes over time']},{heading:'Use AI to scale analysis, not judgment',body:'AI can group reviews, surface recurring topics and reduce manual reading. The agency should still validate context, choose priorities and keep client-facing decisions accountable.'},{heading:'Show the value in recurring reports',body:'Reports should connect review volume, rating movement, recurring themes, response activity and improvement opportunities. The goal is to make reputation visible as an ongoing local SEO service.'}]},
    {slug:'get-google-reviews',title:'How to Get More Genuine Google Reviews',description:'A practical guide to collecting more genuine Google reviews without pressuring customers or selecting reviews by rating.',kicker:'Google Reviews · Guide',lead:'More reviews start with a better customer journey and a simple invitation at the right moment. The goal is not to control the rating; it is to make honest feedback easier to share.',sections:[
      {heading:'Start with the experience',body:'Before changing the review request, look at the moments that customers actually remember. Waiting time, service quality, communication and follow-up often determine whether a customer wants to say something publicly.'},
      {heading:'Reduce friction',body:'Give customers a direct path to the place where they can leave a review. QR codes, direct links and short messages work best when they appear naturally after the relevant experience.'},
      {heading:'Ask consistently, not selectively',body:'A sustainable review process should use the same invitation logic for customers rather than trying to predict who will leave a high rating. The customer decides whether to publish, what to write and which rating to give.',bullets:['Use the same invitation standard across customers','Keep the request simple and transparent','Never promise a benefit in exchange for a rating']},
      {heading:'Learn from what comes back',body:'A review request is also a feedback loop. Group recurring themes such as service, speed, quality, price or communication, then assign improvement actions to the responsible team.'}
    ]},
    {slug:'online-reputation-management-guide',title:'Online Reputation Management: A Practical Guide',description:'Learn how to build a repeatable online reputation management process around reviews, feedback, analysis and action.',kicker:'Online Reputation · Guide',lead:'Reputation management works better as an operating process than as a crisis response. The strongest teams monitor signals, understand causes and close the loop.',sections:[
      {heading:'Monitor the signals that matter',body:'Track review volume, rating movement, recurring topics and meaningful changes in customer perception. Do not treat every individual comment as a crisis; look for patterns and changes.'},
      {heading:'Connect public reviews to operations',body:'A repeated complaint about waiting, communication or delivery is more valuable when it reaches the team that can change the process. Reputation becomes useful when evidence reaches an owner.'},
      {heading:'Build a weekly rhythm',body:'Choose a consistent review period, summarize the strongest themes, decide which issues deserve action and check whether the next cycle shows improvement.',bullets:['Review new feedback','Group recurring themes','Assign owners and deadlines','Compare the next period']},
      {heading:'Use AI as an accelerator',body:'AI can summarize comments, group themes and highlight unusual changes. People still need to validate context and decide which operational response makes sense.'}
    ]},
    {slug:'ai-review-analysis-guide',title:'AI Review Analysis: How to Turn Comments into Decisions',description:'Use AI to organize customer reviews, detect recurring themes and turn large volumes of comments into practical priorities.',kicker:'AI · Review Analysis',lead:'Reading every review manually becomes harder as volume grows. AI can reduce the search work so teams spend more time interpreting context and acting on evidence.',sections:[
      {heading:'What AI should find',body:'A useful analysis can reveal themes such as service, quality, speed, price, product, communication and location-specific issues. It should make patterns easier to compare, not replace judgment.'},
      {heading:'From single comment to recurring theme',body:'One review may be an isolated event. When the same issue appears repeatedly, it becomes a stronger operational signal. Grouping by theme makes that recurrence visible.'},
      {heading:'Prioritize before you act',body:'Not every negative comment deserves the same response. Consider frequency, customer impact, severity and how easily the business can change the underlying process.',bullets:['Frequency of the issue','Impact on customer experience','Operational ownership','Evidence of change over time']},
      {heading:'Close the loop',body:'After an improvement is made, compare later reviews to the original theme. The value of AI analysis is not a summary on its own; it is the ability to connect feedback with measurable action.'}
    ]},
    {slug:'customer-feedback-reputation',title:'Customer Feedback and Reputation: How to Close the Loop',description:'A practical guide to turning customer feedback into priorities, operational action and reputation improvement.',kicker:'Customer Feedback · Reputation',lead:'Collecting feedback is only the start. The value appears when signals become priorities, actions and measurable learning.',sections:[{heading:'Capture the signal close to the experience',body:'Feedback is easier to interpret when it is collected near the moment of the customer experience. Keep the collection path simple and aligned with the real customer journey.'},{heading:'Organize feedback by theme and priority',body:'Do not turn every comment into the same kind of task. Group signals by topic, impact and recurrence so repeated issues become visible.',bullets:['Group recurring topics','Consider customer impact','Separate isolated events from patterns','Assign an operational owner']},{heading:'Separate public reviews from private feedback',body:'Public reviews shape market perception, while private feedback can help investigate and recover individual experiences. Both are useful when their roles are clear.'},{heading:'Close the loop with action',body:'The process should end with an action and a later review of what changed. Without that step, feedback becomes storage instead of an improvement system.'}]},
    {slug:'local-seo-google-reviews',title:'Local SEO and Google Reviews: What Businesses Should Monitor',description:'Connect local SEO, Google reviews and customer experience with a practical reputation workflow for local businesses.',kicker:'Local SEO · Reviews',lead:'Local visibility is not only about publishing a profile. Businesses also need a credible customer experience and a steady process for learning from reviews.',sections:[
      {heading:'Keep the local business information consistent',body:'Name, location, contact details, hours and service information should remain clear across the customer journey. Confusing information can create friction before the review ever happens.'},
      {heading:'Treat reviews as customer evidence',body:'Reviews reveal how customers experience the business in real situations. Track themes that affect local trust, such as service, reliability, speed and communication.'},
      {heading:'Do not chase artificial volume',body:'The safest long-term strategy is to make genuine review collection simple and consistent. Avoid practices that try to select customers or manipulate ratings.',bullets:['Invite genuine feedback','Use a consistent process','Respond professionally','Improve the underlying experience']},
      {heading:'Turn reputation into a local growth loop',body:'The strongest workflow connects discovery, experience, feedback and improvement. Local SEO attracts attention; customer experience creates the story; reviews provide evidence; operations create the next improvement.'}
    ]}
  ],
  es:[
    {slug:'agencia-gestion-reputacion',title:'Reputación para agencias: servicio recurrente de SEO local',description:'Guía práctica para agencias SEO que quieren ofrecer gestión de reputación como servicio recurrente de SEO local.',kicker:'Agencias · SEO local',lead:'Las agencias pueden convertir la gestión de reputación en un servicio repetible cuando monitorización, análisis, respuestas e informes se organizan para cada cliente.',sections:[{heading:'Integra reputación en el SEO local',body:'Las reseñas están conectadas con la confianza que genera el perfil local. Para una agencia, esto permite convertir la gestión de reputación en un entregable recurrente y no en una tarea ocasional.'},{heading:'Estandariza el proceso sin perder el contexto local',body:'Define un flujo repetible para monitorizar reseñas, detectar temas, organizar respuestas y presentar informes. Cada cliente y ubicación debe conservar su contexto operativo.',bullets:['Define el alcance por cliente o ubicación','Establece una cadencia de revisión e informes','Separa problemas operativos de tareas de respuesta','Mide los cambios a lo largo del tiempo']},{heading:'Usa IA para escalar el análisis',body:'La IA puede agrupar reseñas y detectar temas recurrentes, reduciendo el trabajo manual. La agencia debe validar el contexto y decidir las prioridades.'},{heading:'Demuestra el valor con informes recurrentes',body:'Los informes deben conectar volumen de reseñas, evolución de la valoración, temas recurrentes, actividad de respuestas y oportunidades de mejora.'}]},
    {slug:'conseguir-resenas-google',title:'Cómo conseguir más reseñas genuinas en Google',description:'Guía práctica para aumentar reseñas genuinas en Google sin presionar a los clientes ni seleccionar opiniones por valoración.',kicker:'Reseñas de Google · Guía',lead:'Más reseñas empiezan por una mejor experiencia y una invitación sencilla en el momento adecuado. El objetivo no es controlar la nota, sino facilitar que el cliente comparta su opinión.',sections:[
      {heading:'Empieza por la experiencia',body:'Antes de cambiar el mensaje de solicitud, revisa los momentos que realmente recuerda el cliente. Espera, atención, comunicación y seguimiento suelen influir en la voluntad de opinar públicamente.'},
      {heading:'Reduce la fricción',body:'Ofrece una ruta directa al lugar donde el cliente puede dejar su reseña. QR, enlaces directos y mensajes breves funcionan mejor cuando aparecen de forma natural después de la experiencia.'},
      {heading:'Pregunta de forma consistente, no selectiva',body:'Un proceso sostenible utiliza la misma lógica de invitación para los clientes en lugar de intentar predecir quién dejará una valoración alta. El cliente decide si publica, qué escribe y qué nota da.',bullets:['Mantén el mismo criterio para toda la base','Haz la invitación simple y transparente','No ofrezcas beneficios por una valoración concreta']},
      {heading:'Aprende de lo que recibes',body:'La solicitud de reseña también es un ciclo de feedback. Agrupa temas como atención, velocidad, calidad, precio o comunicación y asigna acciones de mejora al equipo responsable.'}
    ]},
    {slug:'guia-gestion-reputacion-online',title:'Gestión de reputación online: guía práctica',description:'Aprende a crear un proceso repetible de gestión de reputación online basado en reseñas, feedback, análisis y acción.',kicker:'Reputación online · Guía',lead:'La reputación funciona mejor como un proceso operativo que como una respuesta a crisis. Los equipos fuertes monitorizan señales, entienden causas y cierran el ciclo.',sections:[
      {heading:'Monitoriza las señales importantes',body:'Controla volumen de reseñas, cambios de valoración, temas recurrentes y variaciones relevantes en la percepción. No conviertas cada comentario aislado en una crisis; busca patrones.'},
      {heading:'Conecta las reseñas con la operación',body:'Una queja repetida sobre espera, comunicación o entrega tiene más valor cuando llega al equipo que puede cambiar el proceso. La reputación se vuelve útil cuando hay un responsable.'},
      {heading:'Crea una rutina semanal',body:'Define un periodo de revisión, resume los temas principales, decide qué problemas necesitan acción y comprueba si el siguiente ciclo muestra una mejora.',bullets:['Revisar feedback nuevo','Agrupar temas recurrentes','Asignar responsables y plazos','Comparar el siguiente periodo']},
      {heading:'Usa IA como acelerador',body:'La IA puede resumir comentarios, agrupar temas y detectar cambios poco habituales. El equipo debe validar contexto y decidir qué respuesta operativa tiene sentido.'}
    ]},
    {slug:'analisis-resenas-ia',title:'Análisis de reseñas con IA: de los comentarios a las decisiones',description:'Usa IA para organizar reseñas, detectar temas recurrentes y convertir grandes volúmenes de comentarios en prioridades prácticas.',kicker:'IA · Análisis de reseñas',lead:'Leer cada reseña manualmente se vuelve difícil cuando crece el volumen. La IA puede reducir el trabajo de búsqueda para que el equipo dedique más tiempo al contexto y a la acción.',sections:[
      {heading:'Qué debería encontrar la IA',body:'Un análisis útil puede revelar temas como atención, calidad, velocidad, precio, producto, comunicación y problemas específicos de cada ubicación. La IA debe facilitar la comparación, no reemplazar el criterio.'},
      {heading:'Del comentario aislado al patrón',body:'Una reseña puede ser un caso puntual. Cuando el mismo problema aparece varias veces, se convierte en una señal operativa más fuerte. Agrupar por tema hace visible esa recurrencia.'},
      {heading:'Prioriza antes de actuar',body:'No todos los comentarios negativos requieren la misma respuesta. Considera frecuencia, impacto en el cliente, gravedad y capacidad del negocio para cambiar el proceso.',bullets:['Frecuencia del problema','Impacto en la experiencia','Responsable operativo','Evidencia de cambio']},
      {heading:'Cierra el ciclo',body:'Después de una mejora, compara las reseñas posteriores con el tema original. El valor del análisis con IA está en conectar feedback con una acción que pueda medirse.'}
    ]},
    {slug:'feedback-clientes-reputacion',title:'Feedback de clientes y reputación: cómo cerrar el ciclo',description:'Guía práctica para convertir feedback de clientes en prioridades, acciones operativas y mejora de la reputación.',kicker:'Feedback · Reputación',lead:'Recoger feedback es solo el principio. El valor aparece cuando las señales se convierten en prioridades, acciones y aprendizaje medible.',sections:[{heading:'Captura la señal cerca de la experiencia',body:'El feedback se interpreta mejor cuando se recoge cerca del momento de la experiencia. El canal debe ser sencillo y encajar con el recorrido real del cliente.'},{heading:'Organiza por tema y prioridad',body:'No conviertas cada comentario en la misma tarea. Agrupa señales por tema, impacto y recurrencia para detectar problemas repetidos.',bullets:['Agrupa temas recurrentes','Considera el impacto en el cliente','Separa casos aislados de patrones','Asigna un responsable operativo']},{heading:'Separa reseñas públicas y feedback privado',body:'Las reseñas públicas influyen en la percepción del mercado, mientras que el feedback privado ayuda a investigar y recuperar experiencias concretas. Ambos canales cumplen funciones distintas.'},{heading:'Cierra el ciclo con una acción',body:'El proceso debe terminar con una acción registrada y una revisión posterior. Sin ese paso, el feedback se convierte en almacenamiento y no en mejora.'}]},
    {slug:'seo-local-resenas-google',title:'SEO local y reseñas de Google: qué debe monitorizar una empresa',description:'Conecta SEO local, reseñas de Google y experiencia del cliente con una rutina práctica de reputación para negocios locales.',kicker:'SEO local · Reseñas',lead:'La visibilidad local no depende solo de tener un perfil. También necesitas una experiencia creíble y un proceso constante para aprender de las reseñas.',sections:[
      {heading:'Mantén coherente la información local',body:'Nombre, ubicación, contacto, horarios y servicios deben ser claros durante el recorrido del cliente. La información confusa puede generar fricción antes incluso de la reseña.'},
      {heading:'Trata las reseñas como evidencia',body:'Las reseñas muestran cómo se vive el negocio en situaciones reales. Observa temas que afectan a la confianza local: atención, fiabilidad, rapidez y comunicación.'},
      {heading:'No persigas volumen artificial',body:'La estrategia sostenible es facilitar la recogida de opiniones genuinas de forma consistente. Evita prácticas que seleccionen clientes o manipulen las valoraciones.',bullets:['Invita a feedback genuino','Usa un proceso consistente','Responde profesionalmente','Mejora la experiencia real']},
      {heading:'Convierte reputación en un ciclo de crecimiento local',body:'SEO local atrae atención; la experiencia crea la historia; las reseñas aportan evidencia y la operación crea la siguiente mejora. La reputación funciona mejor cuando las cuatro partes están conectadas.'}
    ]}
  ],
  zh:[
    {slug:'agency-reputation-management',title:'代理商声誉管理：如何建立可重复的本地 SEO 服务',description:'为 SEO 代理商提供实用指南，将声誉管理作为持续性的本地 SEO 服务。',kicker:'代理商 · 本地 SEO',lead:'当评价监测、分析、回应和报告围绕每个客户组织起来时，代理商可以把声誉管理变成可重复的持续服务。',sections:[{heading:'把声誉管理纳入本地 SEO',body:'评价与商家资料周围的客户信任密切相关。代理商可以把评价管理设计成持续交付的服务，而不是偶尔处理的任务。'},{heading:'标准化流程，同时保留本地语境',body:'建立监测评价、发现重复主题、组织回应和生成报告的固定流程，同时保留每个客户和地点的运营背景。',bullets:['按客户或地点定义服务范围','建立固定的复盘与报告节奏','区分运营问题与回应任务','持续跟踪变化']},{heading:'用 AI 扩展分析，而不是取代判断',body:'AI 可以聚合评价、发现重复主题并减少人工阅读。代理商仍应验证上下文、确定优先级并对面向客户的决策负责。'},{heading:'用持续报告展示价值',body:'报告可以连接评价数量、评分变化、重复主题、回应活动和改进机会，让声誉成为可持续的本地 SEO 服务。'}]},
    {slug:'google-reviews-guide',title:'如何获得更多真实的 Google 评价',description:'通过真实、非选择性的评价邀请，提高 Google 评价数量，同时避免给客户施加评分压力。',kicker:'Google 评价 · 指南',lead:'更多评价首先来自更好的客户体验，以及在合适时间发出的简单邀请。目标不是控制评分，而是让真实反馈更容易发生。',sections:[
      {heading:'先改善客户体验',body:'在修改评价邀请之前，先观察客户真正记住的体验。等待时间、服务质量、沟通和后续跟进，往往比一句请求文案更影响客户是否愿意公开分享意见。'},
      {heading:'降低评价阻力',body:'给客户一个直接、清楚的评价入口。二维码、直接链接和简短消息最好在体验结束后自然出现，而不是让客户自己寻找。'},
      {heading:'一致邀请，而不是按评分选择',body:'可持续的流程应该对客户使用一致的邀请方式，而不是预测谁会给高分。客户自己决定是否发布、写什么以及给多少星。',bullets:['对不同客户保持一致的邀请标准','保持请求简单透明','不要用福利换取特定评分']},
      {heading:'从反馈中学习',body:'评价邀请也是反馈闭环。把服务、速度、质量、价格和沟通等主题整理出来，再交给负责团队进行改进。'}
    ]},
    {slug:'online-reputation-management-guide',title:'在线声誉管理：企业实用指南',description:'建立围绕评价、客户反馈、分析和行动的可重复在线声誉管理流程。',kicker:'在线声誉 · 指南',lead:'声誉管理更适合作为持续运营流程，而不是危机发生后的临时反应。优秀团队会监测信号、理解原因并完成闭环。',sections:[
      {heading:'监测真正重要的信号',body:'关注评价数量、评分变化、重复主题和客户感知的明显变化。不要把每一条单独评论都当成危机，更要寻找持续出现的模式。'},
      {heading:'把公开评价连接到运营',body:'如果等待、沟通或交付问题反复出现，就应该让能够改变流程的团队看到它。声誉只有进入责任链之后才会真正产生价值。'},
      {heading:'建立每周节奏',body:'固定复盘周期，整理主要主题，决定哪些问题需要行动，然后在下一周期检查是否有改善。',bullets:['检查新反馈','归类重复主题','分配负责人和期限','比较下一周期']},
      {heading:'把 AI 当成加速器',body:'AI 可以总结评论、聚合主题和提示异常变化，但团队仍需要验证上下文，并决定什么运营动作最合理。'}
    ]},
    {slug:'ai-review-analysis-guide',title:'AI 评论分析：如何把评论转化为管理决策',description:'使用 AI 整理客户评论、发现重复主题，并把大量评论转化为可执行优先级。',kicker:'AI · 评论分析',lead:'当评论越来越多时，人工逐条阅读会变慢。AI 可以减少寻找信号的工作，让团队把更多时间用于理解背景和采取行动。',sections:[
      {heading:'AI 应该发现什么',body:'有价值的分析可以发现服务、质量、速度、价格、产品、沟通和地点相关的问题。AI 的作用是让模式更容易比较，而不是代替管理判断。'},
      {heading:'从单条评论到重复模式',body:'一条评论可能只是个别事件。相同问题多次出现时，它就成为更强的运营信号。按主题整理评论，可以让重复性变得清晰。'},
      {heading:'行动前先确定优先级',body:'并非所有负面评论都需要相同处理。可以考虑出现频率、客户影响、严重程度以及企业改变流程的能力。',bullets:['问题出现频率','对客户体验的影响','运营负责人','改进后的变化证据']},
      {heading:'完成反馈闭环',body:'完成改进后，继续观察新的评论是否还出现原来的问题。AI 分析的价值不是一份摘要，而是把客户声音与可衡量的行动连接起来。'}
    ]},
    {slug:'customer-feedback-reputation',title:'客户反馈与声誉管理：如何闭环',description:'将客户反馈转化为优先级、运营行动和可衡量改进的实用指南。',kicker:'客户反馈 · 声誉',lead:'收集反馈只是开始。真正的价值来自把信号转化为优先级、行动和可衡量的学习。',sections:[{heading:'在体验附近捕捉信号',body:'越接近客户体验发生的时刻，反馈越容易保留上下文。收集方式应简单，并融入真实的客户流程。'},{heading:'按主题和优先级整理反馈',body:'不要把每条评论都变成相同的任务。按主题、影响和重复程度进行整理，让反复出现的问题变得清晰。',bullets:['归纳重复主题','考虑客户影响','区分孤立事件与模式','指定运营负责人']},{heading:'区分公开评价与私下反馈',body:'公开评价影响市场对企业的认知，而私下反馈有助于调查和恢复具体体验。两者都重要，但作用不同。'},{heading:'用行动完成闭环',body:'流程应该以明确行动结束，并在之后复盘变化。否则反馈只是存储，而不是持续改进系统。'}]},
    {slug:'local-seo-google-reviews',title:'本地 SEO 与 Google 评价：企业应该监测什么',description:'把本地 SEO、Google 评价和客户体验连接起来，为本地企业建立可持续的声誉管理流程。',kicker:'本地 SEO · 评价',lead:'本地可见度不仅仅是建立一个商家资料。企业还需要可信的客户体验，以及持续学习评价内容的方法。',sections:[
      {heading:'保持本地商家信息一致',body:'名称、地址、联系方式、营业时间和服务信息应该在客户旅程中保持清楚。信息不一致可能在评价发生前就造成摩擦。'},
      {heading:'把评价当作客户证据',body:'评价反映真实体验。可以观察影响本地信任的主题，例如服务、可靠性、速度和沟通。'},
      {heading:'不要追求人为制造的评价数量',body:'长期策略应该是让真实评价更容易发生，并保持一致的邀请流程。避免选择客户或操纵评分。',bullets:['邀请真实反馈','保持一致流程','专业回应评价','改善真正的客户体验']},
      {heading:'形成一个本地增长循环',body:'本地 SEO 带来发现，客户体验创造故事，评价提供证据，而运营改进产生下一轮更好的体验。声誉管理应连接这四个环节。'}
    ]}
  ]
};

function get(lang:string,slug:string){
  const list=articles[lang as Lang];
  if(!list)return null;
  const index=list.findIndex(item=>item.slug===slug);
  return index<0?null:{item:list[index],index};
}

function familyFor(lang:Lang,slug:string){
  return families.find(family => family[lang] === '/'+lang+'/blog/'+slug || family[lang] === '/blog/'+slug)
    || translatedFamilies.find(family => family[lang] === '/'+lang+'/blog/'+slug);
}

function familyPath(lang:Lang,slug:string){
  const family=familyFor(lang,slug);
  return family?.[lang] || '/'+lang+'/blog/'+slug;
}

const localizedLabels={
  en:{topics:'Continue exploring',solution:'Go deeper with Filtra.AI',home:'Filtra.AI',cta:'Start your 7-day free trial'},
  es:{topics:'Sigue explorando',solution:'Profundiza con Filtra.AI',home:'Filtra.AI',cta:'Comenzar prueba gratuita de 7 días'},
  zh:{topics:'继续探索',solution:'深入了解 Filtra.AI',home:'Filtra.AI',cta:'开始 7 天免费试用'}
};

const solutionPaths:Record<Lang,Record<string,string>>={
  en:{
    'agency-reputation-management':'/en/agencies',
    'get-google-reviews':'/en/google-reviews',
    'online-reputation-management-guide':'/en/online-reputation-management',
    'ai-review-analysis-guide':'/en/ai-review-analysis',
    'customer-feedback-reputation':'/en/customer-feedback',
    'local-seo-google-reviews':'/en/google-reviews'
  },
  es:{
    'agencia-gestion-reputacion':'/es/agencias',
    'conseguir-resenas-google':'/es/resenas-google',
    'guia-gestion-reputacion-online':'/es/gestion-reputacion-online',
    'analisis-resenas-ia':'/es/analisis-resenas-ia',
    'feedback-clientes-reputacion':'/es/feedback-clientes',
    'seo-local-resenas-google':'/es/resenas-google'
  },
  zh:{
    'agency-reputation-management':'/zh/agencies',
    'google-reviews-guide':'/zh/google-reviews',
    'online-reputation-management-guide':'/zh/online-reputation-management',
    'ai-review-analysis-guide':'/zh/ai-review-analysis',
    'customer-feedback-reputation':'/zh/customer-feedback',
    'local-seo-google-reviews':'/zh/google-reviews'
  }
};

export function generateStaticParams(){
  return (Object.entries(articles) as [Lang,Article[]][]).flatMap(([lang,list])=>list.map(item=>({lang,slug:item.slug})));
}

export async function generateMetadata({params}:{params:Promise<{lang:string;slug:string}>}):Promise<Metadata>{
  const {lang:raw,slug}=await params;
  const lang=raw as Lang;
  const found=get(lang,slug);
  if(!found)return{};
  const family=familyFor(lang,slug);
  if(!family)return {
    title:serpTitle(found.item.title),
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/blog/'+slug},
    openGraph:{
      type:'article',
      url:base+'/'+lang+'/blog/'+slug,
      siteName:'Filtra.AI',
      title:serpTitle(found.item.title),
      description:found.item.description
    },
    robots:{index:true,follow:true}
  };
  const languages:Record<string,string>={
    en:base+family.en,
    es:base+family.es,
    zh:base+family.zh
  };
  if ('pt' in family) {
    languages['pt-BR']=base+family.pt;
    languages['x-default']=base+family.pt;
  } else {
    languages['x-default']=base+family.en;
  }
  return {
    title:serpTitle(found.item.title),
    description:found.item.description,
    alternates:{canonical:base+'/'+lang+'/blog/'+slug,languages},
    openGraph:{
      type:'article',
      url:base+'/'+lang+'/blog/'+slug,
      siteName:'Filtra.AI',
      title:serpTitle(found.item.title),
      description:found.item.description
    },
    robots:{index:true,follow:true}
  };
}

export default async function LocalizedBlogPage({params}:{params:Promise<{lang:string;slug:string}>}){
  const {lang:raw,slug}=await params;
  const lang=raw as Lang;
  const found=get(lang,slug);
  if(!found)notFound();
  const labels=localizedLabels[lang];
  const related=articles[lang][(found.index+1)%articles[lang].length];
  const relatedFamily=familyFor(lang,related.slug);
  const solutionPath=solutionPaths[lang][slug] || (lang==='en'?'/en':lang==='es'?'/es':'/zh');
  const articleUrl=base+'/'+lang+'/blog/'+slug;
  const blogPosting={
    '@context':'https://schema.org',
    '@type':'BlogPosting',
    headline:found.item.title,
    description:found.item.description,
    url:articleUrl,
    mainEntityOfPage:articleUrl,
    author:{'@type':'Organization',name:'Filtra.AI',url:base},
    publisher:{'@type':'Organization',name:'Filtra.AI',url:base},
    datePublished:'2026-10-05',
    dateModified:'2026-10-05',
    inLanguage:lang==='en'?'en':lang==='es'?'es':'zh-CN',
    isPartOf:{'@type':'WebSite',name:'Filtra.AI',url:base},
    image:base+'/og-image.svg'
  };

  return <main lang={lang} className="min-h-screen bg-black text-zinc-100">
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href={lang==='en'?'/en':lang==='es'?'/es':'/zh'} className="font-semibold tracking-tight text-white"><BrandMark/></Link>
        <LanguageSwitcher compact/>
      </div>
    </header>
    <article className="mx-auto max-w-4xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(blogPosting)}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({
        '@context':'https://schema.org',
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:labels.home,item:base+'/'+lang},
          {'@type':'ListItem',position:2,name:labels.topics,item:base+'/'+lang+'/blog'},
          {'@type':'ListItem',position:3,name:found.item.title,item:articleUrl}
        ]
      })}} />
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">{found.item.kicker}</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{found.item.title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{found.item.lead}</p>
      <div className="mt-12 space-y-12">
        {found.item.sections.map(section=><section key={section.heading}>
          <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{section.body}</p>
          {section.bullets && <ul className="mt-5 list-disc space-y-2 pl-5 text-zinc-300">{section.bullets.map(b=><li key={b}>{b}</li>)}</ul>}
        </section>)}
      </div>
      <section className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-2xl font-bold tracking-tight">{labels.solution}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{found.item.description}</p>
        <Link href={solutionPath} className="mt-5 inline-flex rounded-xl border border-zinc-700 px-5 py-3 font-semibold hover:border-indigo-500">Filtra.AI</Link>
      </section>
      <nav aria-label={labels.topics} className="mt-16 border-t border-zinc-800 pt-10">
        <h2 className="text-2xl font-bold tracking-tight">{labels.topics}</h2>
        <Link href={relatedFamily ? familyPath(lang,related.slug) : (lang==='en'?'/en/blog':lang==='es'?'/es/blog':'/zh/blog')} className="mt-5 block rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <span className="block font-semibold">{related.title}</span>
          <span className="mt-2 block text-sm leading-6 text-zinc-400">{related.description}</span>
        </Link>
      </nav>
      <Link href={lang==='en'?'/en':lang==='es'?'/es':'/zh'} className="mt-8 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white">{labels.cta}</Link>
    </article>
  </main>;
}
