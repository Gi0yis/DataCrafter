# 🚀 Guía de Despliegue - DataCrafter Frontend

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Netlify
- Netlify CLI instalado

## 🔧 Configuración Local

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configuración Simplificada
✅ **¡No necesitas configurar variables de entorno!**
Todas las URLs y claves están directamente en el código para facilitar el despliegue:
- Backend URL: `https://2eb9-172-173-216-155.ngrok-free.app`
- Azure Document Intelligence: Configurado automáticamente
- Azure OpenAI: Configurado automáticamente

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

## 🌐 Despliegue en Netlify

### Opción 1: Despliegue Automático (GitHub)

1. **Conectar Repositorio**
   - Ve a [Netlify](https://app.netlify.com)
   - Clic en "New site from Git"
   - Conecta tu repositorio de GitHub

2. **Configurar Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

3. **¡Listo para Desplegar!**
   ✅ **No necesitas configurar variables de entorno**
   Todo está configurado automáticamente en el código.
   Solo asegúrate de que Node.js sea versión 18 (se configura automáticamente).

### Opción 2: Despliegue Manual (CLI)

1. **Login en Netlify**
   ```bash
   netlify login
   ```

2. **Inicializar Sitio**
   ```bash
   netlify init
   ```

3. **Construir y Desplegar**
   ```bash
   # Build local
   npm run build
   
   # Deploy de prueba
   netlify deploy
   
   # Deploy a producción
   netlify deploy --prod
   ```

### Opción 3: Drag & Drop

1. **Construir Localmente**
   ```bash
   npm run build
   ```

2. **Subir Manualmente**
   - Ve a [Netlify](https://app.netlify.com)
   - Arrastra la carpeta `dist` al área de deploy

## ⚙️ Configuración Avanzada

### Netlify.toml
El archivo `netlify.toml` incluye:
- Configuración de build
- Redirects para SPA
- Headers de seguridad
- Optimizaciones de caché
- Variables de entorno por contexto

### _redirects
El archivo `public/_redirects` maneja:
- Routing de Single Page Application
- Redirects de API
- Headers CORS

## 🔍 Scripts Disponibles

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run netlify:dev           # Netlify Dev (simula producción)

# Build
npm run build                 # Build de producción
npm run build:prod           # Build optimizado para producción
npm run build:dev            # Build para desarrollo

# Deploy
npm run netlify:deploy       # Deploy de prueba
npm run netlify:deploy:prod  # Deploy a producción

# Testing
npm run preview              # Preview del build
npm run serve               # Servidor local del build
npm run test:build          # Build + serve para testing

# Mantenimiento
npm run clean               # Limpiar caché y dist
npm run reinstall          # Reinstalar dependencias
```

## 🐛 Troubleshooting

### Error: "Missing script: dev"
- Asegúrate de estar en el directorio `frontend/`
- Verifica que `package.json` tenga el script `dev`

### Error de Build en Netlify
- Verifica que `NODE_VERSION=18` esté configurado
- Revisa que todas las variables de entorno estén configuradas
- Verifica que el comando de build sea correcto

### Problemas de CORS
- Configura las variables de entorno correctamente
- Verifica que el backend permita el dominio de Netlify
- Revisa los headers en `netlify.toml`

### Rutas no Funcionan (404)
- Verifica que `_redirects` esté en `public/`
- Asegúrate de que el redirect `/* /index.html 200` esté configurado

## 📈 Optimizaciones

### Performance
- Todas las dependencias están optimizadas para producción
- Assets se cachean por 1 año
- CSS y JS se minifican automáticamente

### Seguridad
- Headers de seguridad configurados
- CSP (Content Security Policy) implementado
- Variables sensibles solo en variables de entorno

### SEO
- Meta tags configurados
- Pretty URLs habilitados
- Sitemap automático (si se configura)

## 🔗 Enlaces Útiles

- [Netlify Docs](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router + Netlify](https://ui.dev/react-router-cannot-get-url-refresh)

## 📞 Soporte

Si tienes problemas con el despliegue:
1. Revisa los logs de build en Netlify
2. Verifica las variables de entorno
3. Asegúrate de que el backend esté accesible
4. Revisa la configuración de CORS 