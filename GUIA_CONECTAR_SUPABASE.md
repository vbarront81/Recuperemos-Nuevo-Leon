# Guía paso a paso: conectar Recuperemos Nuevo León con Supabase

Esta guía conecta el proyecto de Visual Studio Code a una **base de datos nueva y exclusiva** para Recuperemos Nuevo León. Sigue el orden indicado. No hace falta modificar código manualmente.

## 1. Crear el proyecto de Supabase

1. Abre el [Dashboard de Supabase](https://supabase.com/dashboard).
2. Crea un proyecto nuevo, independiente de cualquier otro proyecto que tengas.
3. Ponle un nombre identificable, por ejemplo `recuperemos-nuevo-leon`.
4. Guarda la contraseña de la base de datos en un gestor de contraseñas. No la pongas en el código ni en el repositorio.
5. Selecciona una región cercana a tus usuarios y espera a que el proyecto termine de crearse.
6. En Authentication, abre la configuración general de usuarios y desactiva **Allow new users to sign up**. Así nadie podrá crear una cuenta desde la aplicación pública; tú crearás cada cuenta desde el Dashboard de Supabase. La opción de crear usuarios manualmente desde el Dashboard sigue disponible. Deja también desactivados los inicios de sesión anónimos.

**Importante:** esta migración está diseñada para una base nueva. No la ejecutes en Cromosomas ni en otro proyecto con tablas existentes.

## 2. Crear las tablas y permisos

1. Abre tu proyecto de Supabase.
2. Ve a **SQL Editor** y crea una consulta nueva.
3. En Visual Studio Code abre `supabase/migrations/20261012_news_portal.sql`.
4. Copia todo el archivo, pégalo en SQL Editor y ejecútalo una sola vez.
5. Revisa que finalice sin errores.
6. En **Table Editor** confirma que aparezcan, entre otras, `articles`, `categories`, `profiles`, `settings`, `contact_messages` y `audit_logs`.
7. En **Storage** confirma que exista el bucket `media`.

La migración crea las cinco categorías, los perfiles que se generan al crear usuarios, las reglas de acceso (RLS), los permisos SQL y el bucket de imágenes. La web está hecha para consultar esas tablas.

Si aparece un error, **no vuelvas a ejecutar el archivo completo automáticamente**: algunos comandos crean políticas y triggers con nombres fijos. Copia el error exacto y revisa primero qué alcanzó a ejecutarse.

## 3. Copiar las claves correctas

En Supabase abre el diálogo **Connect** o el apartado de **Project Settings → API Keys** (el nombre puede variar con la versión del dashboard). Localiza:

- **Project URL**: la dirección HTTPS del proyecto.
- **Publishable key**: normalmente empieza por `sb_publishable_`. Esta va en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Secret key**: normalmente empieza por `sb_secret_`. Esta solo va en `SUPABASE_SECRET_KEY`, del lado servidor.

No confundas las claves. Nunca uses la secret key en una variable `NEXT_PUBLIC_`, en React del navegador, en GitHub ni en un mensaje. Esa clave puede eludir RLS y da acceso privilegiado. La publishable key sí puede estar en el frontend, pero solo es segura cuando los privilegios SQL y RLS de la migración se mantienen correctamente.

## 4. Poner las claves en Visual Studio Code

En la carpeta raíz del proyecto:

1. Copia `.env.example` como `.env.local` si todavía no existe.
2. Abre `.env.local`.
3. Rellena las variables con tus propios valores. No copies literalmente los valores de ejemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=sb_secret_TU_CLAVE_PRIVADA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

El dominio y las claves de arriba son ejemplos, no credenciales reales. No agregues comillas ni espacios alrededor del signo `=`.

Guarda el archivo. Si Next.js ya estaba corriendo, detén el servidor con `Ctrl + C` y vuelve a ejecutar:

```powershell
npm run dev
```

Las variables de entorno se leen al iniciar el servidor. Si cambias `.env.local`, reinícialo.

## 5. Crear tu cuenta de administrador inicial

Por seguridad, no hay registro público ni un botón que permita convertirse en administrador.

1. En Supabase abre **Authentication → Users**.
2. Selecciona **Add user / Create new user**.
3. Escribe el correo que usarás para administrar el sitio y define una contraseña fuerte, única y guardada de forma segura.
4. Si aparece una opción de confirmar el correo automáticamente, actívala para esta cuenta creada manualmente. No uses un flujo de invitación hasta que el sitio tenga configurado un proceso de invitación y restablecimiento de contraseña.
5. Guarda el usuario.
6. Copia su **UUID** desde la lista de usuarios.
7. Vuelve a **SQL Editor** y ejecuta esta consulta sustituyendo `UUID_REAL` por el UUID que acabas de copiar:

```sql
update public.profiles
set role = 'admin', active = true
where id = 'UUID_REAL'::uuid;

select id, email, role, active
from public.profiles
where id = 'UUID_REAL'::uuid;
```

La segunda consulta debe mostrar tu perfil con `role = admin` y `active = true`. El UUID debe ir entre comillas simples.

El perfil se crea automáticamente cuando el usuario se agrega a Authentication. Si el `UPDATE` afecta cero filas, primero revisa que el usuario exista y que la migración haya creado correctamente el trigger `on_auth_user_created`.

## 6. Iniciar sesión y asignar permisos a más personas

1. Abre `http://localhost:3000/acceso`.
2. Inicia sesión con el correo y la contraseña que creaste.
3. Abre **Usuarios y permisos** (`/admin/usuarios`).
4. Para dar acceso a otra persona, primero crea su usuario manualmente en **Supabase → Authentication → Users** y asigna una contraseña temporal segura por un canal privado.
5. Vuelve al panel, actualiza la página, encuentra a esa persona y asigna su rol. Todas las cuentas nuevas nacen como `visitante`.

Roles disponibles:

| Rol | Qué puede hacer |
|---|---|
| `admin` | Administrar el portal, configuración y roles de los demás usuarios. |
| `editor` | Crear, editar, publicar, archivar y borrar noticias; subir imágenes. |
| `colaborador` | Crear y editar sus propios borradores y enviarlos a revisión; no publicar. |
| `moderador` | Consultar y marcar mensajes de contacto como leídos. |
| `visitante` | Sin acceso al panel editorial. |

No puedes cambiar tu propio rol ni desactivar tu cuenta desde el panel. Esta restricción reduce el riesgo de bloquear o escalar la cuenta desde su propia sesión.

## 7. Comprobar que la integración sí funciona

Haz estas pruebas antes de seguir:

1. En `/acceso`, inicia y cierra sesión.
2. En `/admin/noticias/nueva`, crea un borrador de prueba con título, cuerpo y categoría.
3. Comprueba que aparezca en el listado administrativo pero **no** en `/noticias` si sigue como borrador.
4. Entra con un usuario editor y publica una noticia de prueba; debe aparecer en la web.
5. Crea un colaborador e intenta publicar una noticia con ese usuario: la aplicación debe impedirlo y las políticas RLS deben rechazar una modificación que viole el rol aunque se envíe una petición manipulada.
6. Intenta abrir `/admin/usuarios` como editor o colaborador: debe denegarse.
7. Sube una imagen JPEG, PNG o WebP de menos de 5 MB en `/admin/medios`; utiliza su URL en una noticia.

Después ejecuta en la terminal:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Si los pasos fallan, guarda el mensaje exacto de la terminal. No hagas pública la web hasta que los flujos y roles estén verificados.

## 8. Habilitar el formulario de contacto

El portal y la gestión de noticias pueden configurarse antes de activar el formulario, pero el formulario público requiere una verificación antispam de Cloudflare Turnstile.

1. Crea un widget de Turnstile para `localhost` para pruebas.
2. Copia la **site key** en `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Copia la **secret key** en `TURNSTILE_SECRET_KEY`.
4. Reinicia `npm run dev` y prueba el formulario.
5. Cuando tengas dominio definitivo, registra también ese dominio en el widget y actualiza las variables en Render.

Si no has configurado Turnstile, el formulario lo indicará y no guardará el mensaje; no simula una entrega exitosa.

## 9. Subir los cambios a Render después

Cuando funcione localmente:

- Sube el proyecto a su propio repositorio GitHub sin `.env.local` ni credenciales.
- Crea un **Web Service** nuevo en Render.
- Añade en Render las seis variables de `.env.local` antes del build; usa `NEXT_PUBLIC_SITE_URL` con el dominio público una vez que lo tengas.
- Usa la guía `GUIA_PUBLICAR_RENDER.md` para crear el servicio y conectar DNS.
- Después de modificar variables en Render, vuelve a desplegar.

Supabase debe seguir siendo el mismo proyecto de producción en los siguientes despliegues. No ejecutes otra vez la migración inicial en cada publicación.

## Errores comunes

- **La página muestra noticias vacías:** no hay artículos publicados, las variables están equivocadas o la migración no terminó. Los borradores no se muestran al público.
- **`/acceso` indica configuración pendiente:** falta `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, o no reiniciaste Next.js.
- **No puedes entrar:** la cuenta debe existir en Authentication, usar contraseña correcta, tener perfil activo y un rol distinto de `visitante`.
- **La carga de imágenes falla:** verifica `SUPABASE_SECRET_KEY`, el bucket `media`, los límites de tamaño y el tipo de archivo.
- **No se guardan mensajes:** verifica ambas claves Turnstile, la secret key de Supabase y los logs del servidor.
- **RLS rechaza una acción:** primero verifica el rol del usuario, grants y migración. No desactives RLS para que “funcione”.
