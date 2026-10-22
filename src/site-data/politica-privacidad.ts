// Política de privacidad de Revista Motors (texto entregado por el organizador
// el 22-oct-2026, conforme a la LOPDP de Ecuador). Se sirve en
// /politica-de-privacidad/ montada en el marco de página simple del tema
// (ver getPoliticaPrivacidad en db-loader.ts). Solo contenido: nada de layout.

export const POLITICA_PRIVACIDAD_RUTA = "/politica-de-privacidad/";
export const POLITICA_PRIVACIDAD_TITULO = "Política de Privacidad";
export const POLITICA_PRIVACIDAD_DESCRIPCION =
  "Cómo Revista Motors recoge, usa y protege tus datos personales conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador, y cómo ejercer tus derechos.";

// Único correo para asuntos de datos personales (el de marketing no va aquí).
export const CORREO_PRIVACIDAD = "privacidad@revistamotors.com.ec";

const MAIL = `<a href="mailto:${CORREO_PRIVACIDAD}">${CORREO_PRIVACIDAD}</a>`;

export const POLITICA_PRIVACIDAD_HTML = `
<p><em>Última actualización: 22 de octubre de 2026</em></p>
<p>En Revista Motors protegemos tus datos personales conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador (LOPDP) y su normativa complementaria. Esta política explica qué datos recogemos en www.revistamotors.com.ec, para qué los usamos y cómo puedes ejercer tus derechos.</p>

<h2>1. Datos personales que recopilamos</h2>
<p>Solo recopilamos los datos necesarios para las finalidades descritas en esta política. Según cómo uses el sitio, podemos tratar:</p>
<ul>
<li><strong>Datos de identificación y contacto:</strong> nombre, apellido, correo electrónico, teléfono, ciudad y país, cuando completas formularios de contacto, suscripción o publicidad.</li>
<li><strong>Datos de suscripción y facturación:</strong> cédula o RUC, dirección y datos de facturación, si adquieres una suscripción o ediciones de la revista.</li>
<li><strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo y navegador, páginas visitadas, fecha y hora de acceso, y datos obtenidos mediante cookies.</li>
<li><strong>Contenido que nos envías:</strong> comentarios, mensajes, fotografías o textos que remitas voluntariamente a la redacción.</li>
</ul>
<p>No solicitamos datos sensibles (salud, origen étnico, religión, orientación sexual, datos biométricos, entre otros). Te pedimos no incluirlos en tus mensajes.</p>

<h2>2. Finalidades y base de legitimación</h2>
<p>Tratamos tus datos únicamente cuando existe una base legal prevista en el artículo 7 de la LOPDP:</p>
<figure class="wp-block-table"><table>
<thead><tr><th>Finalidad</th><th>Base de legitimación</th></tr></thead>
<tbody>
<tr><td>Responder consultas, sugerencias y solicitudes enviadas por formulario o correo</td><td>Consentimiento / medidas precontractuales</td></tr>
<tr><td>Gestionar suscripciones, ventas y entrega de ediciones</td><td>Ejecución de un contrato</td></tr>
<tr><td>Emitir facturas y cumplir obligaciones tributarias y contables</td><td>Cumplimiento de una obligación legal</td></tr>
<tr><td>Enviar boletines, novedades y promociones de Revista Motors</td><td>Consentimiento</td></tr>
<tr><td>Gestionar pautas publicitarias y relaciones comerciales con anunciantes</td><td>Ejecución de un contrato / interés legítimo</td></tr>
<tr><td>Analizar el uso del sitio, mejorar contenidos y garantizar su seguridad</td><td>Interés legítimo / consentimiento (cookies no esenciales)</td></tr>
</tbody>
</table></figure>
<p>No usaremos tus datos para finalidades distintas o incompatibles con las anteriores sin informarte y, cuando corresponda, obtener tu consentimiento.</p>

<h2>3. Consentimiento, cookies y comunicaciones comerciales</h2>
<p><strong>Consentimiento.</strong> Cuando el tratamiento se basa en tu consentimiento, este será libre, específico, informado e inequívoco. Puedes retirarlo en cualquier momento, sin que ello afecte la licitud del tratamiento realizado antes del retiro.</p>
<p><strong>Cookies.</strong> Usamos cookies esenciales para el funcionamiento del sitio y, solo con tu consentimiento, cookies de analítica y publicidad. Puedes aceptar, rechazar o configurar las cookies desde el aviso que aparece al ingresar, y modificarlas luego desde la configuración de tu navegador.</p>
<p><strong>Comunicaciones comerciales.</strong> Solo te enviaremos boletines o promociones si te suscribes o lo autorizas. En cada correo encontrarás un enlace para darte de baja, o puedes escribirnos a ${MAIL}.</p>

<h2>4. Destinatarios y transferencias internacionales</h2>
<p>No vendemos tus datos personales. Solo los compartimos cuando es necesario con:</p>
<ul>
<li><strong>Proveedores de servicios</strong> que actúan como encargados del tratamiento bajo contrato: alojamiento web, envío de correos, analítica, pasarelas de pago y mensajería o logística.</li>
<li><strong>Autoridades públicas</strong> (por ejemplo, el SRI o autoridades judiciales), cuando una norma o una orden legítima lo exija.</li>
</ul>
<p>Algunos de estos proveedores pueden estar fuera de Ecuador. En esos casos, la transferencia se realiza solo hacia países u organizaciones con nivel adecuado de protección, o aplicando garantías adecuadas, conforme a la LOPDP.</p>

<h2>5. Conservación y seguridad</h2>
<p><strong>Plazos.</strong> Conservamos tus datos solo el tiempo necesario para cumplir la finalidad para la que fueron recogidos y las obligaciones legales aplicables. Como referencia: datos de contacto y consultas, hasta 12 meses desde la última interacción; datos de suscripción y facturación, durante el plazo exigido por la normativa tributaria y contable; datos de boletines, hasta que retires tu consentimiento. Después, los eliminamos o anonimizamos.</p>
<p><strong>Seguridad.</strong> Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra acceso no autorizado, pérdida, alteración o destrucción, entre ellas conexión cifrada (HTTPS), control de accesos y copias de seguridad. Si ocurriera una vulneración de seguridad que ponga en riesgo tus derechos, la notificaremos a la autoridad de protección de datos y, cuando corresponda, a ti, en los plazos que establece la ley.</p>

<h2>6. Tus derechos como titular de datos</h2>
<p>La LOPDP te reconoce los siguientes derechos:</p>
<ul>
<li><strong>Acceso:</strong> conocer si tratamos tus datos y obtener una copia de ellos.</li>
<li><strong>Rectificación y actualización:</strong> corregir datos inexactos o incompletos.</li>
<li><strong>Eliminación:</strong> solicitar que borremos tus datos cuando proceda legalmente.</li>
<li><strong>Oposición:</strong> oponerte al tratamiento de tus datos, incluido el envío de publicidad.</li>
<li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.</li>
<li><strong>Suspensión del tratamiento:</strong> pedir que limitemos el uso de tus datos en los casos previstos por la ley.</li>
<li><strong>No ser objeto de decisiones automatizadas:</strong> no estar sujeto a decisiones basadas únicamente en tratamientos automatizados que produzcan efectos jurídicos sobre ti.</li>
<li><strong>Retirar tu consentimiento</strong> en cualquier momento.</li>
</ul>
<p><strong>Cómo ejercerlos.</strong> Envía tu solicitud a ${MAIL} indicando tu nombre completo, número de cédula o pasaporte, el derecho que deseas ejercer y una descripción clara de tu petición. Podemos pedirte que acredites tu identidad.</p>

<h2>7. Menores de edad, cambios y contacto</h2>
<p><strong>Menores de edad.</strong> Nuestro sitio no está dirigido a menores de 18 años y no recopilamos sus datos de forma intencional. Si eres madre, padre o representante legal y crees que un menor nos ha entregado datos personales, escríbenos y los eliminaremos.</p>
<p><strong>Cambios en esta política.</strong> Podemos actualizar esta política para reflejar cambios legales o en nuestros servicios. Publicaremos la versión vigente en esta página con su fecha de actualización y, si el cambio es importante, te lo comunicaremos por un medio visible.</p>
<p><strong>Contacto.</strong> Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos, escríbenos a ${MAIL}.</p>
`;
