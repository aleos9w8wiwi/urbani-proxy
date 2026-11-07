# Servidor propio gratis para Urbani 3.0.5

Este servidor sustituye al servidor anterior de la APK nueva
(`fraudbani-fyfr.onrender.com`).

No inventa datos ni saldo: cada petición la reenvía al servidor
real de Urbani que corresponde y devuelve su respuesta tal cual.

## Qué hace

| Ruta en tu servidor | A dónde reenvía |
|---|---|
| `/migration/*` | https://app.urbani.io |
| `/gets/*` | https://user-info.urbani.io |
| `/coupon/*` | https://urbani-coupons.urbani.io |
| `/segmented/*` | https://app.urbani.io |
| `/static/*` | https://app-static-prod.urbani.io |
| `/events/*` | https://urbani-app-eventos-prod.urbani.io |

También acepta `/api/migration/*`, `/api/gets/*`, etc.

## Probar en local

```bash
node server.js
```

Luego abre:

- http://localhost:3000/health

Debe decir `"ok": true`.

## Desplegar gratis en Render

1. Sube esta carpeta a GitHub (repositorio nuevo, puede ser privado).
2. Entra a https://dashboard.render.com y crea **New + → Web Service**.
3. Elige tu repositorio.
4. Render detecta `render.yaml`: plan **Free**, `npm install`, `npm start`.
5. Dale a **Create Web Service** y espera a que diga Live.
6. Copia tu URL, por ejemplo `https://urbani-proxy-xxxx.onrender.com`.
7. Prueba `https://tu-url.onrender.com/health`.

Nota del plan gratis de Render: si nadie lo usa en 15 minutos,
el servidor se duerme y la primera petición tarda unos 30-60
segundos en despertar. Es normal en el plan gratis.

## Conectar la APK

Usa los valores de `nuevo-env-para-apk.txt`, reemplazando
`TU-SERVIDOR` por tu URL de Render. Eso es lo que hay que
cambiar en el `.env` de la APK 3.0.5 y volver a firmarla.

## Archivos

- `server.js` — el servidor, sin dependencias.
- `package.json` — `npm start` corre `node server.js`.
- `render.yaml` — configuración para Render gratis.
- `nuevo-env-para-apk.txt` — valores nuevos del `.env`.
