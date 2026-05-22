# Rentabilify Content Studio

Generador de contenido para Instagram con IA — sin API key para el usuario.

## Deploy en Vercel (2 minutos)

### Opción A — Desde GitHub (recomendado)
1. Crea un repo en GitHub y sube esta carpeta
2. Ve a vercel.com → "New Project" → importa el repo
3. En "Environment Variables" agrega:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (tu key de console.anthropic.com)
4. Clic en "Deploy"
5. ¡Listo! Vercel te da un link tipo `rentabilify-studio.vercel.app`

### Opción B — Vercel CLI
```bash
npm i -g vercel
cd rentabilify-studio
vercel
# Cuando pida Environment Variables, agrega ANTHROPIC_API_KEY
```

## Estructura
```
rentabilify-studio/
├── api/
│   └── claude.js        # Proxy serverless → Anthropic API
├── public/
│   └── index.html       # App completa
├── vercel.json          # Config de rutas
└── package.json
```

## Variables de entorno requeridas
| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Tu API key de Anthropic (console.anthropic.com) |

## Costos aproximados
- Claude Sonnet 4: ~$0.003 por imagen generada
- Vercel: gratis en plan Hobby
- Anthropic: ~$3 por 1000 imágenes generadas
