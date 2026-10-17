'use client';
import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';
import { PreviewNavigator } from '../components/PreviewNavigator';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage, type Language } from '../Contexts/LanguageContext';

const email='projetosaas1@gmail.com';
type C={title:string;date:string;intro:string;sections:[string,string][];terms:string;home:string};
const copy:Record<Language,C>={
pt:{title:'Política de Privacidade',date:'Versão 23 de setembro de 2026',intro:'Esta política explica como a Filtra.AI trata dados pessoais no site e na plataforma, de acordo com a legislação aplicável, incluindo a LGPD.',terms:'Termos de Uso',home:'Início',sections:[
['1. Controlador e contato','FILTRA.AI TECNOLOGIA LTDA., CNPJ 69.113.166/0001-10, Rua 12, nº 457, Setor Oeste, Goiânia/GO, CEP 74140-040. Contato de privacidade: '+email+'.'],
['2. Dados tratados','Podem ser tratados dados de cadastro, uso, avaliações e feedbacks, assinatura e cobrança, registros de aceite e dados técnicos necessários à segurança. Dados completos de pagamento podem ser processados diretamente por intermediadores.'],
['3. Finalidades e bases legais','Os dados podem ser usados para administrar contas, autenticar usuários, prestar o SaaS, processar assinaturas, prestar suporte, prevenir uso indevido e abuso, manter segurança, cumprir obrigações legais e exercer direitos. As bases podem incluir contrato, obrigação legal, exercício regular de direitos, legítimo interesse ou consentimento, quando aplicável.'],
['4. Papéis sob a LGPD','Em regra, a empresa cliente define as finalidades dos dados de seus clientes e atua como Controladora, enquanto a FILTRA.AI atua como Operadora dentro das instruções e limites contratuais. Para seus próprios dados de cadastro, faturamento, segurança e atendimento, a Filtra.AI poderá atuar como Controladora.'],
['5. Compartilhamento e suboperadores','Podem ser utilizados provedores de hospedagem, banco de dados, infraestrutura, e-mail, pagamentos, observabilidade e inteligência artificial, conforme a funcionalidade contratada. O compartilhamento ocorre quando necessário ao serviço, por obrigação legal ou proteção da plataforma.'],
['6. Transferências internacionais','Alguns fornecedores podem processar dados fora do Brasil. Quando houver transferência internacional, serão observadas as salvaguardas e exigências da legislação aplicável.'],
['7. Cookies','O site e a plataforma podem usar cookies, armazenamento local e tecnologias semelhantes para sessões, preferências, experiência e segurança. Tecnologias que dependam de consentimento observarão os requisitos aplicáveis.'],
['8. Inteligência artificial','Algumas funções utilizam IA para analisar feedbacks, identificar temas, gerar relatórios ou auxiliar respostas. O usuário continua responsável pela revisão e utilização das informações geradas.'],
['9. Retenção','Os dados são mantidos pelo período necessário ao serviço, obrigações legais, segurança, disputas e exercício de direitos. Depois podem ser eliminados, anonimizados ou mantidos quando houver base legal.'],
['10. Segurança','São adotadas medidas técnicas e administrativas razoáveis contra acesso não autorizado, perda, alteração, divulgação ou destruição indevida. Incidentes relevantes serão tratados conforme a legislação aplicável.'],
['11. Direitos dos titulares','Nos termos da LGPD, titulares podem solicitar confirmação, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informações sobre compartilhamentos e demais direitos legais. Quando a FILTRA.AI atuar como Operadora, o pedido deve ser direcionado, em regra, à empresa Controladora.'],
['12. Atualizações','Esta política pode ser atualizada por mudanças no produto, fornecedores, legislação ou práticas de tratamento. A versão vigente e sua data de atualização serão publicadas nesta página.']]},
en:{title:'Privacy Policy',date:'Version September 23, 2026',intro:'This policy explains how Filtra.AI processes personal data on its website and platform under applicable law, including Brazil’s LGPD.',terms:'Terms of Use',home:'Home',sections:[
['1. Controller and contact','FILTRA.AI TECNOLOGIA LTDA., CNPJ 69.113.166/0001-10, Rua 12, nº 457, Setor Oeste, Goiânia/GO, CEP 74140-040. Privacy contact: '+email+'.'],
['2. Data processed','We may process account, usage, reviews and feedback, subscription and billing, consent records, and technical security data. Full payment details may be processed directly by payment providers.'],
['3. Purposes and legal bases','Data may be used to manage accounts, authenticate users, provide SaaS services, process subscriptions, support users, prevent fraud, maintain security, comply with law and exercise rights. Legal bases may include contract, legal obligation, legal rights, legitimate interest or consent where applicable.'],
['4. LGPD roles','Generally, the customer determines purposes for its customers’ data and acts as Controller, while FILTRA.AI acts as Processor within instructions and contractual limits. For its own registration, billing, security and support data, Filtra.AI may act as Controller.'],
['5. Sharing and subprocessors','We may use hosting, database, infrastructure, email, payment, observability and AI providers as required by the contracted functionality. Sharing occurs when necessary for service, legal obligations or platform protection.'],
['6. International transfers','Some providers may process data outside Brazil. Applicable safeguards and legal requirements will be followed for international transfers.'],
['7. Cookies','The site and platform may use cookies, local storage and similar technologies for sessions, preferences, experience and security. Consent requirements will be respected where applicable.'],
['8. Artificial intelligence','Some features use AI to analyze feedback, identify themes, generate reports or assist replies. Users remain responsible for reviewing and using generated information.'],
['9. Retention','Data is kept as necessary for service delivery, legal duties, security, disputes and legal rights, after which it may be deleted, anonymized or retained where legally required.'],
['10. Security','Reasonable technical and administrative measures are used against unauthorized access, loss, alteration, disclosure or destruction. Relevant incidents will be handled as required by law.'],
['11. Data subject rights','Under LGPD, individuals may request confirmation, access, correction, anonymization, blocking or deletion, portability, sharing information and other legal rights. Where FILTRA.AI acts as Processor, requests should generally go to the customer acting as Controller.'],
['12. Updates','This policy may be updated to reflect changes in the product, providers, law or processing practices. The current version and date are published here.']]},
es:{title:'Política de Privacidad',date:'Versión 23 de septiembre de 2026',intro:'Esta política explica cómo Filtra.AI trata datos personales en su sitio y plataforma conforme a la legislación aplicable, incluida la LGPD.',terms:'Términos de Uso',home:'Inicio',sections:[
['1. Responsable y contacto','FILTRA.AI TECNOLOGIA LTDA., CNPJ 69.113.166/0001-10, Rua 12, nº 457, Setor Oeste, Goiânia/GO, CEP 74140-040. Contacto: '+email+'.'],
['2. Datos tratados','Según el uso, pueden tratarse datos de cuenta, uso, reseñas y comentarios, suscripción y facturación, registros de aceptación y datos técnicos de seguridad.'],
['3. Finalidades y bases legales','Los datos pueden utilizarse para gestionar cuentas, prestar el SaaS, procesar suscripciones, soporte, seguridad, prevención de uso indebido y abuso, obligaciones legales y ejercicio de derechos.'],
['4. Roles bajo la LGPD','Normalmente la empresa cliente define las finalidades de los datos de sus clientes y actúa como Responsable, mientras FILTRA.AI actúa como Encargado dentro de las instrucciones y límites contractuales.'],
['5. Compartición y subencargados','Filtra.AI puede utilizar proveedores de alojamiento, base de datos, infraestructura, correo, pagos, observabilidad e IA según la funcionalidad contratada.'],
['6. Transferencias internacionales','Algunos proveedores pueden procesar datos fuera de Brasil; se aplicarán las salvaguardas y requisitos legales correspondientes.'],
['7. Cookies','El sitio y la plataforma pueden utilizar cookies, almacenamiento local y tecnologías similares para sesiones, preferencias, experiencia y seguridad.'],
['8. Inteligencia artificial','Algunas funciones utilizan IA para analizar comentarios, identificar temas, generar informes o ayudar con respuestas. El usuario es responsable de revisar la información generada.'],
['9. Conservación','Los datos se conservan durante el tiempo necesario para el servicio, obligaciones legales, seguridad, disputas y ejercicio de derechos.'],
['10. Seguridad','Se aplican medidas técnicas y administrativas razonables para proteger los datos frente a accesos no autorizados, pérdida, alteración o divulgación indebida.'],
['11. Derechos','Los titulares pueden ejercer los derechos previstos por la LGPD. Cuando FILTRA.AI actúe como Encargado, la solicitud deberá dirigirse normalmente a la empresa Responsable.'],
['12. Actualizaciones','Esta política puede actualizarse por cambios en el producto, proveedores, legislación o prácticas de tratamiento.']]},
zh:{title:'隐私政策',date:'版本：2026年9月23日',intro:'本政策说明 Filtra.AI 如何根据适用法律（包括巴西 LGPD）在网站和平台中处理个人数据。',terms:'使用条款',home:'首页',sections:[
['1. 控制方与联系方式','FILTRA.AI TECNOLOGIA LTDA.，CNPJ 69.113.166/0001-10，地址：Rua 12, nº 457, Setor Oeste, Goiânia/GO, CEP 74140-040。隐私联系：'+email+'。'],
['2. 处理的数据','根据使用情况，可能处理账户、使用、评价与反馈、订阅和账单、同意记录以及安全所需的技术数据。'],
['3. 目的与法律依据','数据可用于账户管理、身份验证、SaaS 服务、订阅处理、支持、防欺诈、安全、法律义务和行使权利。'],
['4. LGPD 角色','通常客户企业决定其客户数据的处理目的并作为控制方，FILTRA.AI 按照指示和合同限制作为处理方。'],
['5. 共享与子处理方','Filtra.AI 可根据功能使用托管、数据库、基础设施、邮件、支付、监控和 AI 服务商。'],
['6. 国际传输','部分服务商可能在巴西境外处理数据。发生国际传输时，将遵守适用法律要求并采取保障措施。'],
['7. Cookie','网站和平台可能使用 Cookie、本地存储等技术来维持会话、保存偏好、改善体验和保障安全。'],
['8. 人工智能','部分功能使用 AI 分析反馈、识别主题、生成报告或辅助回复。用户仍负责审核和使用生成的信息。'],
['9. 保存期限','数据将在提供服务、履行法律义务、保障安全、解决争议和行使权利所需期间保存。'],
['10. 安全','我们采取合理的技术和管理措施，防止未经授权的访问、丢失、修改、披露或破坏。'],
['11. 数据主体权利','根据 LGPD，数据主体可请求确认、访问、更正、匿名化、阻止或删除、可携带性及其他法定权利。'],
['12. 更新','本政策可能因产品、供应商、法律或处理实践变化而更新，并公布当前版本和更新日期。']]}}
;
export default function PrivacidadePage(){const{language}=useLanguage();const c=copy[language];return <div className="min-h-screen bg-black text-zinc-100 font-sans"><header className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-4 pt-6"><BrandMark size="md" subtitle="Reputation" href="/preview"/><LanguageSwitcher/></header><PreviewNavigator />
    <main className="mx-auto max-w-3xl space-y-7 px-4 pb-16 text-sm leading-relaxed text-zinc-300"><div className="space-y-2"><h1 className="text-2xl font-bold tracking-tight text-zinc-50">{c.title}</h1><p className="text-zinc-400">{c.date}</p><p className="text-zinc-400">{c.intro}</p></div>{c.sections.map(([h,t])=><section key={h} className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">{h}</h2><p>{t}</p></section>)}<div className="flex flex-wrap gap-4 pt-4"><Link href="/termos" className="text-indigo-400 underline">{c.terms}</Link><Link href="/preview" className="text-zinc-400 underline">{c.home}</Link></div></main></div>}
