import type { Language } from '../Contexts/LanguageContext';

type PageBodies = Partial<Record<Language, string[]>>;

export const SEO_BODIES: Record<string, PageBodies> = {
  '/hoteis': {
    en: [
      'Reviews reveal recurring patterns about cleanliness, rooms, service, breakfast, location, noise, maintenance and communication. The goal is to find patterns, not treat one comment as a diagnosis.',
      'Public reputation is a consequence of real experiences. Organizing feedback helps teams route recurring themes to the right areas and recognize what guests value.',
      'Structured feedback supports operations, service and quality meetings. Teams work with clearer, comparable themes instead of scattered comments or spreadsheets.',
      'The approach works across hotels, inns and chains. For multi-unit operations, location-level analysis separates local issues from broader patterns.',
      'Test one unit for seven days, observe the feedback and recurring themes, then use the learning to decide how to scale.'
    ],
    es: [
      'Las reseñas revelan patrones sobre limpieza, habitaciones, atención, desayuno, ubicación, ruido, mantenimiento y comunicación. El objetivo es encontrar patrones, no tratar un comentario aislado como diagnóstico.',
      'La reputación pública es consecuencia de experiencias reales. Organizar el feedback ayuda a llevar los temas recurrentes a las áreas responsables y reconocer lo que valoran los huéspedes.',
      'El feedback estructurado apoya reuniones de operación, atención y calidad. El equipo trabaja con temas claros y comparables en lugar de comentarios dispersos.',
      'La lógica funciona en hoteles, posadas y cadenas. En operaciones con varias unidades, el análisis por ubicación distingue problemas locales de patrones más amplios.',
      'Prueba una unidad durante siete días, observa los comentarios y temas recurrentes y utiliza ese aprendizaje para decidir cómo ampliar el proceso.'
    ],
    zh: [
      '评价可以揭示清洁、客房、服务、早餐、位置、噪音、维护和沟通等方面的重复模式。重点是发现模式，而不是把单条评论当成诊断。',
      '公开声誉来自真实体验。整理反馈后，团队可以将重复问题交给负责部门，同时识别宾客真正重视的体验。',
      '结构化反馈可以支持运营、服务和质量会议。团队不再依赖分散评论，而是使用更清晰、可比较的主题。',
      '这种方法适用于酒店、旅馆和连锁企业。对于多门店运营，按门店分析可以区分本地问题与更广泛的模式。',
      '先在一个门店试用 7 天，观察收到的反馈和重复主题，再根据结果决定如何扩大应用。'
    ]
  },
  '/turismo': {
    en: [
      'Collect feedback close to the experience so the signal is fresh and useful for improvement.',
      'Separate public reputation signals from operational issues that need internal follow-up.',
      'Compare themes across services, destinations, units and stages of the visitor journey.',
      'Connect what visitors experience across hotels, tours, agencies and other operations.',
      'Start with a focused pilot and use the first seven days to identify the strongest patterns.'
    ],
    es: [
      'Recoge feedback cerca del momento de la experiencia para que la señal sea fresca y útil.',
      'Separa las señales públicas de reputación de los problemas operativos que necesitan seguimiento interno.',
      'Compara temas entre servicios, destinos, unidades y etapas del viaje.',
      'Conecta la experiencia del visitante entre hoteles, tours, agencias y otras operaciones.',
      'Empieza con un piloto y utiliza los primeros siete días para identificar los patrones más importantes.'
    ],
    zh: [
      '在体验发生后及时收集反馈，让信号保持新鲜并可用于改进。',
      '将公开声誉信号与需要内部跟进的运营问题区分开来。',
      '比较不同服务、目的地、门店和旅程阶段中的主题。',
      '连接酒店、旅游、机构和其他业务中的访客体验。',
      '从一个明确的试点开始，用前 7 天找出最重要的模式。'
    ]
  },
  '/agencias': {
    en: [
      'Agencies can sell reputation management as an operational layer alongside local SEO and marketing services.',
      'A clear onboarding flow makes it possible to start with one client and demonstrate value quickly.',
      'Reviews and customer feedback become evidence for the local SEO narrative instead of isolated numbers.',
      'Reports show clients what customers are saying, which themes repeat and what deserves action.',
      'Start with one pilot client, prove the workflow and then package the service for the rest of the portfolio.'
    ],
    es: [
      'Las agencias pueden vender gestión de reputación como una capa operativa junto con SEO local y marketing.',
      'Un onboarding claro permite empezar con un cliente y demostrar valor rápidamente.',
      'Las reseñas y el feedback se convierten en evidencia para la estrategia de SEO local, no solo en números aislados.',
      'Los informes muestran qué dicen los clientes, qué temas se repiten y qué merece una acción.',
      'Empieza con un cliente piloto, demuestra el flujo y después empaqueta el servicio para el resto de la cartera.'
    ],
    zh: [
      '代理机构可以将声誉管理作为本地 SEO 和营销服务之外的运营层来销售。',
      '清晰的接入流程可以先从一个客户开始，并快速展示价值。',
      '评价和客户反馈可以成为本地 SEO 策略的证据，而不只是孤立的数字。',
      '报告帮助客户了解客户在说什么、哪些主题重复以及哪些问题值得行动。',
      '先选择一个试点客户验证流程，再将服务复制到整个客户组合。'
    ]
  },
  '/clinicas': {
    en: [
      'Ask for feedback at the right moment in the patient journey, while the experience is still clear.',
      'Private feedback gives the clinic a channel to understand issues that should receive internal care.',
      'Use a consistent tone and response process so patients receive clear and respectful communication.',
      'For multiple locations, compare themes and signals by unit without losing the context of each clinic.',
      'Run a seven-day trial without a card, observe the signals and decide where the process should expand.'
    ],
    es: [
      'Pide feedback en el momento adecuado del recorrido del paciente, cuando la experiencia todavía está clara.',
      'El feedback privado ofrece a la clínica un canal para entender problemas que necesitan atención interna.',
      'Utiliza un tono y un proceso de respuesta consistentes para ofrecer una comunicación clara y respetuosa.',
      'En varias unidades, compara temas y señales por clínica sin perder el contexto de cada ubicación.',
      'Realiza una prueba de siete días sin tarjeta, observa las señales y decide dónde ampliar el proceso.'
    ],
    zh: [
      '在患者体验的合适时机请求反馈，让体验记忆保持清晰。',
      '私密反馈为诊所提供内部了解和处理问题的渠道。',
      '保持一致的语气和回复流程，让患者获得清晰且尊重的沟通。',
      '对于多门店诊所，可以按门店比较主题和信号，同时保留各门店上下文。',
      '无需信用卡试用 7 天，观察信号后再决定在哪些地方扩大流程。'
    ]
  },
  '/franquias': {
    en: [
      'See reputation signals by location so network managers can understand where attention is needed.',
      'Compare recurring experience themes across units and identify patterns that deserve a network-level response.',
      'Give franchisees clearer evidence about what customers value and where service can improve.',
      'Scale the process across the network while keeping the context of each location.',
      'Start with one unit, validate the workflow and expand once the results are clear.'
    ],
    es: [
      'Observa las señales de reputación por unidad para saber dónde hace falta atención.',
      'Compara temas recurrentes entre unidades e identifica patrones que merecen una respuesta de toda la red.',
      'Ofrece a los franquiciados evidencia clara sobre lo que valoran los clientes y dónde puede mejorar el servicio.',
      'Escala el proceso en la red sin perder el contexto de cada unidad.',
      'Empieza con una unidad, valida el flujo y amplíalo cuando los resultados sean claros.'
    ],
    zh: [
      '按门店查看声誉信号，帮助网络管理者明确需要关注的位置。',
      '比较不同门店的重复体验主题，发现需要网络层面响应的模式。',
      '为加盟商提供清晰证据，了解客户重视什么以及服务可以在哪里改进。',
      '在整个网络扩展流程，同时保留每个门店的业务上下文。',
      '先从一个门店开始验证流程，结果清晰后再扩大。'
    ]
  },
  '/associacoes': {
    en: [
      'Listen to members, companies and different audiences instead of relying on occasional conversations.',
      'Segment feedback to find patterns by profile, region, service or other relevant groups.',
      'Connect reputation with the experience delivered by the association or federation.',
      'The same approach works for federations, networks, unions and sector organizations.',
      'Run a seven-day pilot and use the collected signals to define the next management priorities.'
    ],
    es: [
      'Escucha a asociados, empresas y públicos diferentes en lugar de depender de conversaciones ocasionales.',
      'Segmenta el feedback para encontrar patrones por perfil, región, servicio u otros grupos relevantes.',
      'Relaciona la reputación con la experiencia entregada por la asociación o federación.',
      'La misma lógica sirve para federaciones, redes, sindicatos y organizaciones sectoriales.',
      'Realiza un piloto de siete días y utiliza las señales recopiladas para definir las próximas prioridades.'
    ],
    zh: [
      '倾听会员、企业和不同受众，而不是只依赖偶尔的沟通。',
      '按用户画像、地区、服务或其他重要群体细分反馈，发现模式。',
      '将协会或联合会提供的体验与声誉连接起来。',
      '这种方法同样适用于联合会、网络组织、工会和行业机构。',
      '试用 7 天，并根据收集到的信号确定下一步管理重点。'
    ]
  },
  '/restaurantes': {
    en: [
      'Restaurant reviews often reflect service, waiting time, food, environment and the overall experience.',
      'QR codes at tables or in delivery flows make feedback collection easier without interrupting the operation.',
      'Review velocity matters because recent reviews provide fresher public signals.',
      'When the score is low, understand the underlying themes and route internal issues to the right team.',
      'Set up the flow in minutes and start learning from real customer feedback.'
    ],
    es: [
      'Las reseñas de restaurantes suelen reflejar atención, tiempo de espera, comida, ambiente y experiencia general.',
      'Los códigos QR en mesas o entregas facilitan la recogida de feedback sin interrumpir la operación.',
      'La velocidad de reseñas importa porque las opiniones recientes ofrecen señales públicas más actuales.',
      'Cuando la nota es baja, entiende los temas detrás y dirige los problemas internos al equipo adecuado.',
      'Configura el flujo en minutos y empieza a aprender de feedback real de clientes.'
    ],
    zh: [
      '餐厅评价通常反映服务、等待时间、食物、环境和整体体验。',
      '桌台或配送中的二维码可以更轻松地收集反馈，而不会打断运营。',
      '评价速度很重要，因为近期评价可以提供更及时的公开信号。',
      '评分较低时，应理解背后的主题，并将内部问题交给合适的团队。',
      '几分钟即可配置流程，开始从真实客户反馈中学习。'
    ]
  },
  '/como-funciona': {
    en: [
      'Filtra.AI provides a structured review channel for the customer journey.',
      'Capture the customer rating before deciding the next step.',
      'High ratings of 4–5 stars can be directed to Google Reviews as an invitation to share the experience publicly.',
      'Lower ratings of 1–3 stars can enter a private feedback flow so the business can understand and address the issue.',
      'AI and reporting organize the signals into themes, priorities and follow-up.',
      'Use the seven-day trial to validate the complete flow before expanding.'
    ],
    es: [
      'Filtra.AI ofrece un canal estructurado de evaluación dentro del recorrido del cliente.',
      'Registra la valoración del cliente antes de definir el siguiente paso.',
      'Las valoraciones de 4–5 estrellas pueden dirigirse a Google Reviews como invitación a compartir públicamente la experiencia.',
      'Las valoraciones de 1–3 estrellas pueden entrar en un flujo privado para entender y tratar el problema.',
      'La IA y los informes organizan las señales en temas, prioridades y seguimiento.',
      'Utiliza la prueba de siete días para validar el flujo completo antes de ampliarlo.'
    ],
    zh: [
      'Filtra.AI 为客户旅程提供结构化的评价渠道。',
      '先记录客户评分，再决定下一步流程。',
      '4–5 星的高评分可以引导客户前往 Google Reviews，自主公开分享体验。',
      '1–3 星的低评分可以进入私密反馈流程，让企业了解并处理问题。',
      'AI 和报告将这些信号整理为主题、优先级和后续行动。',
      '利用 7 天试用验证完整流程，再决定是否扩大。'
    ]
  },
  '/pedir-estrela-vs-filtrar': {
    en: [
      'Simply asking everyone for five stars is not the same as building a reputation management process.',
      'The filter creates a first feedback step so the business can understand the experience before the public review stage.',
      'Transparency means inviting honest feedback and treating criticism as useful operational information.',
      'The key questions are what customers experienced, what repeated and what the business did with that signal.',
      'Test both approaches and compare the quality of the information generated.'
    ],
    es: [
      'Pedir cinco estrellas a todo el mundo no es lo mismo que construir un proceso de gestión de reputación.',
      'El filtro crea un primer paso de feedback para entender la experiencia antes de la reseña pública.',
      'La transparencia significa invitar a comentarios honestos y tratar las críticas como información útil para la operación.',
      'Las preguntas clave son qué vivieron los clientes, qué se repitió y qué hizo la empresa con esa señal.',
      'Prueba ambos enfoques y compara la calidad de la información generada.'
    ],
    zh: [
      '简单地向所有人请求五星并不等于建立声誉管理流程。',
      '筛选先建立反馈步骤，让企业在公开评价之前理解客户体验。',
      '透明意味着邀请真实反馈，并把批评视为有价值的运营信息。',
      '关键是了解客户经历了什么、哪些问题重复出现，以及企业如何处理这些信号。',
      '测试两种方式，并比较产生的信息质量。'
    ]
  }
};