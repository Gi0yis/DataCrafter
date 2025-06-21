# 🚀 Despliegue Súper Fácil - DataCrafter

## ✅ **¡Configuración Automática!**
**No necesitas configurar variables de entorno** - Todo está listo en el código:
- ✅ Backend URL configurada
- ✅ Azure Document Intelligence configurado
- ✅ Azure OpenAI configurado
- ✅ Todas las claves incluidas

## 🎯 **3 Formas de Desplegar**

### 1. **GitHub + Netlify (Recomendado)**
1. Sube tu código a GitHub
2. Ve a [Netlify](https://app.netlify.com)
3. Clic en "New site from Git"
4. Selecciona tu repositorio
5. Configuración automática:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `frontend`
6. ¡Deploy automático! 🎉

### 2. **Netlify CLI**
```bash
# Instalar CLI (si no lo tienes)
npm install -g netlify-cli

# Login
netlify login

# Deploy desde la carpeta frontend
cd frontend
npm install
npm run build
netlify deploy --prod
```

### 3. **Drag & Drop**
```bash
cd frontend
npm install
npm run build
```
Luego arrastra la carpeta `dist` a [Netlify Drop](https://app.netlify.com/drop)

## 🔧 **Scripts Disponibles**
```bash
npm run dev          # Desarrollo local
npm run build        # Build para producción
npm run preview      # Preview del build
npm run netlify:dev  # Simular Netlify localmente
```

## 🎯 **URLs Configuradas**
- **Backend**: `https://2eb9-172-173-216-155.ngrok-free.app`
- **Azure Document Intelligence**: Configurado automáticamente
- **Azure OpenAI**: Configurado automáticamente

## 🐛 **Solución de Problemas**

### Error: "Missing script: dev"
```bash
# Asegúrate de estar en la carpeta correcta
cd frontend
npm install
npm run dev
```

### Error de Build
```bash
# Limpiar y reinstalar
npm run clean
npm install
npm run build
```

### Error 404 en rutas
✅ **Ya configurado** - Los redirects de SPA están listos

## 🚀 **¡Eso es todo!**
Tu aplicación está lista para desplegarse sin configuración adicional.
Todas las claves y URLs están en el código para máxima simplicidad.

---
**💡 Tip**: Una vez desplegado, tu app funcionará inmediatamente con todas las funcionalidades:
- Subida de documentos con análisis inteligente
- Conversión automática de imágenes a PDF
- Chat con IA sobre tus documentos
- Analytics y métricas en tiempo real 