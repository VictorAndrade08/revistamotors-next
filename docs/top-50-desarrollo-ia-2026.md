# Top 50 — Desarrollo de software en la era de la IA (2026–2027)

> Investigado el 2026-07-10 con Apify (Reddit Scraper) sobre los hilos top del
> último año en r/ExperiencedDevs, r/webdev y r/ClaudeCode (~45 hilos, algunos
> con más de 20.000 votos). Ordenado del 1 (más importante) al 50 (mitos y
> errores a evitar). Fuentes al final.

## 🥇 Control y auditoría (1–10) — tú mandas, no el LLM

1. **Auditoría crítica y "des-alucinación" del código generado.** La habilidad nº1 de la era: leer TODO lo que genera el agente y detectar la *complejidad cosmética* — el audit real de 340 PRs encontró try-catch alrededor de un console.log, funciones de 40 líneas que hacían lo mismo que `Array.map`, y variables llamadas `userPreferences` que en realidad guardaban un token de sesión. Se ve plausible, funciona… y pudre el repo.
2. **Nunca aprobar (ni enviar) un PR que su autor no entiende.** El hilo más comentado de r/ExperiencedDevs: la revisión colapsa cuando el revisor es el único que razona sobre el código. El costo de generar cayó a casi cero; el costo de revisar lo absorbe otro. No traslades esa factura.
3. **Las primeras mil líneas lo determinan todo.** El agente replica los patrones que encuentra: si los cimientos están limpios, las siguientes 100.000 líneas salen limpias. Obsesiónate con la calidad al inicio del proyecto.
4. **La IA multiplica la dirección que ya llevas.** Repo limpio → más limpio y más rápido. Repo desordenado → desorden a velocidad récord. La dopamina de "shippear" con agentes te ciega: crees ir rápido y vas más lento por los refactors que vienen.
5. **Jamás dejes que un agente ejecute operaciones irreversibles.** Caso real: Claude Code borró un archivo de 202 GB tras la instrucción explícita "no borres nada" (hasta etiquetó su propio comando como peligroso… y lo ejecutó). Si es destructivo y te importa: backups verificados, sandbox, listas de comandos prohibidos, o hazlo tú mismo.
6. **Plan antes de código.** Pide al agente leer el repo y proponer un plan; revísalo tú; recién entonces que escriba. Es la práctica nº1 del propio equipo de Anthropic.
7. **El test del intento único.** Si una tarea no sale bien en un prompt, la causa es una de tres: el código se está volviendo un desastre, no entiendes esa parte del sistema, o la tarea es muy grande y hay que dividirla. Úsalo como termómetro de salud del proyecto.
8. **Verifica en runtime, no por lectura.** "El código se ve bien" es exactamente el modo en que fallan los cambios de IA. Ejecuta el flujo real, escribe tests de integración de los escenarios principales.
9. **Secretos jamás en código, prompts ni configs compartidas.** El caso viral: una app "vibe-codeada" publicó sus claves de Stripe. (Nos pasó en este mismo repo: un token de API terminó en `.claude/settings.json` y GitHub bloqueó el push — por eso `.claude/` está ahora en `.gitignore`.)
10. **Reglas del repo en un `CLAUDE.md`/`AGENTS.md` corto** en vez de repetir prompts. Corto es la palabra clave: un repo heredado tenía 309k líneas de código con 240k líneas de "documentación para agentes" — nadie sabía qué servía.

## 🥈 Flujo de trabajo (11–20)

11. **Contexto limpio por tarea**: sesión nueva para cada trabajo, no una conversación eterna que arrastra basura.
12. **Tareas pequeñas y bien definidas**; divide lo grande antes de delegarlo.
13. **Tests, commits y review aunque estés "vibe codeando"** — la IA no reemplaza las prácticas de ingeniería, las amplifica.
14. **Commits chicos y reversibles**: git es tu red de seguridad cuando el agente se equivoca.
15. **Capturas y mockups como contexto** — el agente entiende mejor una imagen del bug/diseño que tres párrafos.
16. **Conecta herramientas reales** (CLI de GitHub, bash, MCP) en vez de copiar y pegar salidas a mano.
17. **Agentes en paralelo solo cuando los guardrails están sólidos** — es un superpoder que se gana, no un punto de partida.
18. **Mide tu velocidad real.** El estudio METR de 2025: los devs se *sentían* 20% más rápidos con IA y eran 19% más lentos. Los números de sprint inflados no son productividad.
19. **No delegues las decisiones de fundación**: framework, esquema de base de datos, arquitectura. La IA no aceleró todos los pasos por igual; esos errores se pagan por años.
20. **Borra el código "por si acaso".** Repo real heredado de un "vibe engineer": 220 endpoints y solo 20 usados; 40 secretos y 2 necesarios. YAGNI aplica el doble con agentes.

## 🥉 Calidad del código (21–30)

21. **Rechaza la sobre-abstracción cosmética**: seis helpers genéricos (`processData`, `formatOutput`) donde bastaban tres líneas inline no es "código limpio", es ruido con esteroides.
22. **Nombres que digan la verdad** — el bug más traicionero del código IA es el identificador plausible que miente.
23. **Estilo consistente con TU repo**, no el "estilo IA" genérico. Cuando todos los PRs del equipo parecen escritos por "un extraño educado", perdiste la propiedad del código.
24. **Reusa la librería estándar y las utilidades existentes** antes de aceptar una reimplementación.
25. **Comentarios solo para el porqué** — los comentarios obvios de IA ("// incrementa el contador") se borran en el review.
26. **No construyas lógica para un futuro imaginado**: cuando ese futuro llega, nunca es como lo imaginaste; toca reescribir igual.
27. **Arquitectura simple y obvia** gana a los patrones enterprise que el agente mete por defecto.
28. **Documentación mínima y viva**, no montañas de markdown generado que nadie lee.
29. **Audita cada dependencia que el agente agrega** — le encanta instalar paquetes para cosas de cinco líneas.
30. **Refactoriza al detectar el olor**, no "cuando haya tiempo": con agentes, la deuda crece a la velocidad de generación.

## Seguridad y producción (31–40)

31. **Pasada de seguridad específica para código IA**: inyección SQL, authz, manejo de secretos — los errores clásicos vuelven en código nuevo.
32. **Variables de entorno + push protection activada** (GitHub bloqueó nuestro token: el sistema funciona, úsalo).
33. **Permisos mínimos para el agente** — listas de comandos permitidos/prohibidos, nada de acceso total por comodidad.
34. **Sandbox o worktrees para experimentos** — que el agente rompa una copia, no tu rama.
35. **CI con tests y lint obligatorios** sin importar quién (o qué) escribió el código.
36. **Staging antes de producción, siempre** — "el agente lo probó" no es prueba.
37. **Observabilidad en producción**: el código IA falla en modo "plausible pero roto", que es invisible sin monitoreo.
38. **Backups verificados antes de que un agente toque datos** (relee el punto 5).
39. **Vigila costos y rate limits** — un agente en loop quema APIs y dinero mientras duermes.
40. **Auditorías periódicas del repo** al estilo "340 PRs en 6 meses": la degradación es gradual y consistente; solo se ve mirando el conjunto.

## ⚠️ Mitos y errores de la era IA (41–50) — lo peor del ranking

41. **"Ya no necesito saber programar."** El experimento del ingeniero con 15 años que intentó vibe-codear un juego: "en cuanto la lógica se puso medianamente compleja, todo se fue a la mierda". La IA es multiplicador de expertos, no reemplazo de expertise.
42. **Celebrar métricas de velocity infladas** mientras la calidad se derrite (management feliz, producción en llamas).
43. **Vibe-codear lógica de negocio crítica sin entenderla** — la era del "AI slop cleanup" ya es una industria: freelancers cobrando por arreglar apps generadas que "funcionan terriblemente".
44. **Acumular skills, agentes y knowledge-bases convolutos** que nadie sabe si ayudan — la pregunta honesta del hilo top de r/ClaudeCode: ¿te ayuda o solo *sientes* que haces mucho?
45. **Dejar que los juniors deleguen el aprendizaje** — quien nunca depura a mano no sabrá auditar lo generado.
46. **Ignorar el costo de review que trasladas al equipo** — generar es gratis para ti y carísimo para quien revisa.
47. **Confundir "funciona" con "está bien"** — el slop compila, pasa el demo y explota en producción.
48. **Prompts kilométricos para compensar un repo confuso** — arregla el repo; el prompt corto es el síntoma de un código sano (punto 7).
49. **Cambiar de herramienta cada semana** persiguiendo el hype en vez de dominar un flujo.
50. **Olvidar que tú firmas el código.** La responsabilidad no se delega en el modelo: ni ante tu equipo, ni ante tus usuarios, ni ante un juez. Tú tienes el control absoluto — ese es el punto de todo este ranking.

---

## Fuentes (hilos analizados)

- [I audited 6 months of PRs after my team went all-in on AI code generation](https://www.reddit.com/r/webdev/comments/1sin68g/i_audited_6_months_of_prs_after_my_team_went/) — r/webdev (2.087↑)
- [Today I announced that I won't be reviewing AI generated PRs](https://www.reddit.com/r/ExperiencedDevs/comments/1towli9/today_i_announced_that_i_wont_be_reviewing_ai/) — r/ExperiencedDevs (1.901↑)
- [The era of AI slop cleanup has begun](https://www.reddit.com/r/ExperiencedDevs/comments/1mg2r6y/the_era_of_ai_slop_cleanup_has_begun/) — r/ExperiencedDevs (4.265↑)
- [I've used AI to write 100% of my code for 1+ year. 13 no-bs lessons](https://www.reddit.com/r/ClaudeCode/comments/1qxvobt/ive_used_ai_to_write_100_of_my_code_for_1_year_as/) — r/ClaudeCode (842↑)
- [Inherited a 3-month old repo from a Vibe Engineer](https://www.reddit.com/r/ClaudeCode/comments/1tb7edc/inherited_a_3month_old_repo_from_a_vibe_engineer/) — r/ClaudeCode (7.317↑)
- [Anthropic released a video: how they use Claude effectively internally](https://www.reddit.com/r/ClaudeCode/comments/1ugss5i/anthropic_released_a_video_how_they_use_claude/) — r/ClaudeCode (804↑)
- [Claude Code deleted my entire 202GB archive](https://www.reddit.com/r/ClaudeCode/comments/1sbpfdl/claude_code_deleted_my_entire_202gb_archive_after/) — r/ClaudeCode (622↑)
- [AI Coding Tools Slow Down Developers (estudio METR)](https://www.reddit.com/r/webdev/comments/1ly53mb/ai_coding_tools_slow_down_developers/) — r/webdev (3.754↑)
- [I tried vibe coding and it made me realise my career is absolutely safe](https://www.reddit.com/r/webdev/comments/1pw8w8e/i_tried_vibe_coding_and_it_made_me_realise_my/) — r/webdev (2.454↑)
- [Vibe code IRL: left Stripe API keys public](https://www.reddit.com/r/webdev/comments/1rl0yp0/vibe_code_irl_left_stripe_api_keys_public/) — r/webdev (2.133↑)
- [Claude Code is a Beast – Tips from 6 Months of Hardcore Use](https://www.reddit.com/r/ClaudeCode/comments/1oivs81/claude_code_is_a_beast_tips_from_6_months_of/) — r/ClaudeCode (872↑)
