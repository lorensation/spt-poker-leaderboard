## Optimized Prompt

Analiza el estado actual del repositorio `/spt-poker-leaderboard`, asociado al despliegue:

```text
https://spt-poker-leaderboard.vercel.app/
```

Objetivo: definir una ruta clara de diseño e implementación para añadir una nueva funcionalidad de `Texas Hold’em Poker Clock`, sin implementar cambios todavía salvo que se indique explícitamente.

### Contexto de la nueva funcionalidad

Quiero añadir a la web una pantalla pública de reloj de torneo de póker y una pantalla de configuración/admin.

Referencia visual:

```text
/workspace/.cache/01-image.png
```

La funcionalidad debe incluir:

1. Página pública del reloj

   * Timer principal de countdown en grande.
   * Nivel actual de ciegas:

     * formato: `ciega pequeña / ciega grande`
     * ejemplo: `200 / 400`
   * Nivel previo debajo o lateral.
   * Nivel siguiente al lado.
   * Niveles configurables.
   * Soporte para niveles tipo `BREAK` o descanso:

     * deben tener timer
     * no deben mostrar ciega pequeña ni ciega grande.
   * Información lateral:

     * average stack
     * jugadores restantes respecto al total de entradas
     * prize pool total
   * Logo de SPT visible.
   * Estética coherente con el proyecto:

     * blanco y negro
     * resaltados/accent colors existentes
     * interfaz limpia tipo poker clock.

2. Página admin/configuración

   Crear o proponer la ruta:

   ```text
   /admin/clock-partida
   ```

   Esta página debe ser mobile-friendly y permitir:

   * Crear/configurar estructura de niveles.
   * Editar niveles existentes.
   * Añadir niveles de descanso `BREAK`.
   * Configurar duración de cada nivel.
   * Configurar:

     * número total de entradas/compras
     * número de jugadores restantes
     * stack inicial del buy-in
   * Calcular:

     * `average stack = total fichas en juego / jugadores restantes`
     * `total fichas en juego = entradas totales * stack inicial`
     * `prize pool = entradas totales * 10€`
   * Controlar el reloj:

     * iniciar
     * pausar
     * reanudar
     * reiniciar nivel actual
     * avanzar nivel
     * retroceder nivel
   * Guardar configuración.
   * Modificar configuración existente.

3. Tiempo real

   Los cambios hechos desde `/admin/clock-partida` deben reflejarse en tiempo real en una página pública accesible a clientes.

   Analiza primero qué tecnologías usa actualmente el proyecto y propón la opción más coherente para tiempo real según el stack existente, por ejemplo:

   * Supabase Realtime
   * WebSockets
   * polling ligero
   * server actions/API routes + estado persistente
   * cualquier solución ya existente en el repositorio

   Justifica la opción recomendada.

---

### Instrucciones de análisis

Antes de proponer la solución:

1. Inspecciona la estructura del repositorio.
2. Identifica:

   * framework usado
   * estructura de rutas
   * sistema de estilos
   * componentes reutilizables
   * sistema de autenticación/admin, si existe
   * almacenamiento de datos actual
   * forma actual de desplegar en Vercel
3. Localiza dónde está el logo de SPT o cómo se está usando actualmente.
4. Revisa si ya existe una zona `/admin`.
5. Revisa si ya hay páginas públicas similares.
6. No modifiques archivos todavía.
7. Si falta información crítica, indícala claramente.

---

### Output esperado

Devuelve el análisis en español con esta estructura:

```markdown
## 1. Estado actual del repositorio

- Framework:
- Rutas principales:
- Sistema de estilos:
- Componentes reutilizables:
- Admin/autenticación:
- Persistencia de datos:
- Observaciones relevantes:

## 2. Encaje de la nueva funcionalidad

Explica cómo debería integrarse el Poker Clock dentro de la arquitectura actual.

## 3. Propuesta de arquitectura

Incluye:

- Página pública recomendada
- Página admin recomendada
- Modelo de datos
- Estado del timer
- Estrategia de tiempo real
- Cálculos derivados

## 4. Modelo de datos propuesto

Define una estructura clara para:

- configuración de partida
- niveles
- nivel tipo ciegas
- nivel tipo BREAK
- estado actual del reloj

Usa ejemplos JSON o TypeScript si encaja con el stack.

## 5. Diseño UI/UX

Describe:

- layout desktop
- layout mobile
- jerarquía visual
- uso de colores
- integración del logo SPT
- adaptación de la referencia visual adjunta

## 6. Ruta de implementación por fases

Divide en fases:

1. Preparación de estructura
2. Modelo de datos
3. Página pública
4. Página admin
5. Tiempo real
6. Controles de reloj
7. Testing
8. Deploy/verificación

Para cada fase indica:

- archivos probables a crear/modificar
- objetivo
- riesgos
- validaciones

## 7. Riesgos técnicos y decisiones pendientes

Lista decisiones que debería confirmar antes de implementar.

## 8. Plan de testing

Incluye pruebas para:

- cálculo de average stack
- prize pool
- cambio de niveles
- BREAK
- pausar/reanudar
- reiniciar nivel
- sincronización en tiempo real
- responsive mobile
```

---

### Constraints

* No implementes cambios todavía.
* No hagas commit.
* No borres ni reestructures partes existentes sin justificarlo.
* Mantén coherencia visual con la web actual.
* Prioriza una solución simple, robusta y compatible con Vercel.
* Si el repositorio local no existe en `/workspace/spt-poker-leaderboard`, intenta localizarlo dentro de `/workspace`. Si no está disponible, pide el `owner/repo` de GitHub.
* Usa GitHub/local repo inspection para basar el análisis en código real, no en suposiciones.

---

### Few-shot Examples

#### Example 1 — Nivel normal

Input conceptual:

```json
{
  "type": "blind",
  "durationMinutes": 20,
  "smallBlind": 200,
  "bigBlind": 400
}
```

Output esperado en pantalla:

```text
20:00
200 / 400
```

#### Example 2 — Nivel BREAK

Input conceptual:

```json
{
  "type": "break",
  "durationMinutes": 10,
  "label": "BREAK"
}
```

Output esperado en pantalla:

```text
10:00
BREAK
```

No debe mostrar:

```text
small blind / big blind
```

#### Example 3 — Cálculos laterales

Input:

```json
{
  "entries": 24,
  "remainingPlayers": 8,
  "buyInStack": 10000,
  "entryPrice": 10
}
```

Output calculado:

```text
Total chips: 240000
Average stack: 30000
Prize pool: 240€
Players: 8 / 24
```
