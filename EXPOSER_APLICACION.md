# Cómo Exponer la Aplicación para Mostrarla

## Opción 1: Usando Localtunnel (Ya instalado)

### Paso 1: Iniciar la aplicación Next.js
En una terminal PowerShell, ejecuta:
```powershell
cd "c:\Users\Erick\Downloads\inventario tecni\impresorasTecni"
npm run dev
```

Espera a que veas el mensaje: `- Local: http://localhost:3000`

### Paso 2: Exponer con Localtunnel
En **otra terminal PowerShell** (deja la primera corriendo), ejecuta:
```powershell
lt --port 3000
```

Te dará una URL pública como: `https://xxxxx.loca.lt`

**¡Listo!** Comparte esa URL con tu jefe.

---

## Opción 2: Instalar y usar ngrok (Alternativa)

### Instalación de ngrok:

1. **Descargar ngrok:**
   - Ve a: https://ngrok.com/download
   - Descarga la versión para Windows
   - Extrae el archivo `ngrok.exe` en una carpeta (ej: `C:\ngrok\`)

2. **Agregar al PATH (opcional pero recomendado):**
   - Busca "Variables de entorno" en Windows
   - Agrega la carpeta donde está `ngrok.exe` al PATH

3. **Usar ngrok:**
   ```powershell
   # Primero asegúrate de que Next.js esté corriendo en puerto 3000
   ngrok http 3000
   ```

4. **Obtener la URL:**
   - ngrok mostrará una URL pública como: `https://xxxxx.ngrok-free.app`
   - Comparte esa URL con tu jefe

---

## Notas Importantes:

- ✅ La aplicación Next.js debe estar corriendo (`npm run dev`) mientras uses el túnel
- ✅ El túnel se cerrará si cierras la terminal
- ✅ Con localtunnel, la URL puede cambiar cada vez que lo ejecutes
- ✅ Con ngrok (versión gratuita), también puede cambiar la URL
- ⚠️ Si tu jefe ve una advertencia de seguridad, debe hacer clic en "Continue" o "Avanzar"

---

## Solución Rápida (Localtunnel):

```powershell
# Terminal 1: Iniciar Next.js
cd "c:\Users\Erick\Downloads\inventario tecni\impresorasTecni"
npm run dev

# Terminal 2: Exponer con localtunnel
lt --port 3000
```

¡Listo! Comparte la URL que te dé localtunnel.
