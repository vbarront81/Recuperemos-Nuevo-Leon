# Publicar Recuperemos Nuevo León en Render

La aplicación usa Next.js con lógica del servidor, autenticación y acciones protegidas. Debe publicarse como **Web Service de Node.js**, no como Static Site. Puedes usar una cuenta Render distinta o un servicio separado dentro de la misma cuenta de Cromosomas; este portal debe tener un servicio, repositorio, variables y dominio propios.

## Antes del despliegue

1. Sigue `GUIA_CONECTAR_SUPABASE.md` y confirma que funciona localmente.
2. Ejecuta `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build` en tu equipo.
3. Prueba los roles con usuarios de prueba. No publiques hasta que los permisos funcionen desde servidor y RLS.
4. Completa la configuración de Turnstile si utilizarás el formulario de contacto.
5. Revisa el Aviso de Privacidad y Términos con la persona responsable.

El entorno donde se generó este archivo no tuvo acceso al registro npm y no permitió ejecutar `npm install` ni validar un build completo. El usuario debe ejecutar y revisar esas verificaciones antes de producción.

## 1. GitHub

1. Crea un repositorio separado, por ejemplo `recuperemos-nuevo-leon`.
2. Sube **el contenido de esta carpeta** al repositorio.
3. Confirma que `.env.local` no esté incluido. El `.gitignore` debe seguir excluyéndolo.
4. No subas ninguna contraseña, publishable key no es secreta pero no hace falta guardarla en el repositorio, ni la secret key.

## 2. Crear el Web Service

En Render Dashboard selecciona **New → Web Service** y conecta el repositorio. Usa los siguientes valores:

| Configuración | Valor |
|---|---|
| Language / Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start -- -H 0.0.0.0 -p $PORT` |
| Health Check Path | `/api/health` |
| Node.js | `22` |

También existe `render.yaml` para crear un Blueprint. Revisa que el servicio se cree como Web Service, no como Static Site.

La configuración incluida usa el plan gratuito para pruebas. Los servicios gratuitos pueden suspenderse por inactividad y tener arranque en frío; para una portada pública estable, compara un plan de pago con el presupuesto del cliente antes de contratar.

## 3. Variables de entorno en Render

En el panel del servicio, abre **Environment** y configura las variables de abajo. Sustituye cada valor por el que te proporciona tu propio proyecto de Supabase y Turnstile:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://TU-DOMINIO-REAL
SUPABASE_SECRET_KEY=sb_secret_TU_CLAVE_PRIVADA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=TU_SITE_KEY
TURNSTILE_SECRET_KEY=TU_SECRET_KEY
```

Las variables `NEXT_PUBLIC_*` tienen que estar configuradas antes del build porque Next.js puede incorporarlas al bundle público. `SUPABASE_SECRET_KEY` y `TURNSTILE_SECRET_KEY` son secretos exclusivos del servidor. Nunca les agregues el prefijo `NEXT_PUBLIC_`, las publiques ni las incluyas en GitHub.

Si todavía no activarás contacto, Turnstile puede quedar sin configurar, pero el formulario mostrará un error de configuración hasta que incorpores ambas claves.

Después de guardar o cambiar las variables, haz un nuevo deploy.

## 4. Dominio comprado por separado

1. Compra el dominio que el cliente elija en GoDaddy u otro registrador.
2. En Render abre **Settings → Custom Domains → Add Domain** y agrega el dominio raíz y `www` si los utilizarás.
3. Render mostrará los registros DNS que corresponden a ese servicio nuevo.
4. Copia exactamente esos valores en la zona DNS del registrador.
5. Espera la validación DNS y la emisión del certificado HTTPS.
6. Cambia `NEXT_PUBLIC_SITE_URL` a la URL canónica y vuelve a desplegar.
7. En Supabase, revisa la configuración de URL del sitio y los redirect URLs permitidos, incluyendo el dominio de producción y `http://localhost:3000` para desarrollo.
8. Actualiza la configuración del widget de Turnstile para incluir el dominio real.

No reutilices ni copies los registros DNS de Cromosomas: Render proporciona los valores correctos para cada servicio y dominio.

## 5. Verificación de lanzamiento

- La portada y las cinco categorías abren en escritorio y móvil.
- Las noticias publicadas son públicas; borradores y revisión no son accesibles como visitante.
- `/acceso` inicia y cierra sesión.
- Un colaborador no puede publicar ni editar artículos ajenos.
- Un editor no puede administrar usuarios.
- Un moderador no puede editar noticias.
- Solo el administrador administra roles y configuración.
- Las imágenes se suben al bucket `media` y se muestran en las publicaciones.
- El formulario de contacto verifica Turnstile y registra los mensajes.
- `/robots.txt`, `/sitemap.xml` y `/api/health` responden correctamente.
- HTTPS, logs, política de privacidad y Términos están revisados.

## Diagnóstico rápido

- **El build falla:** revisa la salida completa de `npm install` / `npm run build`; no uses un build previo como evidencia.
- **La portada aparece vacía:** confirma que exista contenido en estado `published`, que la fecha `published_at` no sea futura y que las variables apunten al proyecto correcto.
- **El panel redirige a `/acceso`:** confirma usuario en Supabase Auth, perfil `active = true`, rol autorizado y variables correctas.
- **Error de permisos/RLS:** revisa migración y rol antes de cambiar políticas. No desactives RLS.
- **La carga de imagen falla:** verifica `SUPABASE_SECRET_KEY`, bucket `media`, formato y tamaño.
- **Contacto no funciona:** revisa Turnstile, las claves de servidor y los logs.
- **Dominio no resuelve:** utiliza los valores DNS actuales mostrados por Render para este Web Service.

## Documentación oficial

- [Render: deploy a Next.js app](https://render.com/docs/deploy-nextjs-app)
- [Supabase: Next.js Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase: crear clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
