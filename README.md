# Recuperemos Nuevo León — portal de noticias

Portal editorial responsive de **noticias** con cinco secciones fijas: **Local, Nacional, Política, Espectáculos y Viral**. El proyecto utiliza Next.js App Router, React, TypeScript y Supabase (PostgreSQL + Auth + Storage).

> **Estado local:** TypeScript, ESLint, las pruebas disponibles y el build de producción pasan. La integración con un proyecto real de Supabase todavía requiere completar `.env.local`, aplicar la migración únicamente en una base nueva y comprobar los flujos de datos y roles descritos en la guía.

## Qué incluye

- Portada editorial con noticia destacada, titulares y secciones sin repetir artículos; conserva el banner y la identidad visual proporcionados.
- Navegación y filtros por las cinco categorías Local, Nacional, Política, Espectáculos y Viral.
- Búsqueda de noticias y paginación.
- Fichas individuales con imagen alternativa cuando no hay portada, noticias relacionadas, SEO, sitemap y metadatos Open Graph/Twitter.
- No se presentan noticias de demostración como si fueran reales: las secciones vacías indican que aún no hay publicaciones.
- Panel editorial `/admin` para noticias, medios, configuración, mensajes y usuarios.
- Editor enriquecido que admite formato de texto seguro; el servidor sanitiza el contenido antes de guardarlo.
- Roles: `admin`, `editor`, `colaborador`, `moderador` y `visitante`.
- Políticas de seguridad a nivel de fila (RLS) y permisos SQL explícitos.
- Subida de imágenes a un bucket separado en Supabase Storage.
- Formulario de contacto con verificación Turnstile. Este formulario no funcionará hasta configurar sus dos claves.
- Páginas legales con avisos de revisión pendientes para los datos legales reales.
- Configuración para Render como Web Service.

Los artículos tienen un identificador de autor, pero el esquema actual restringe los nombres de perfil mediante RLS y no ofrece un nombre de autor público. Por ello, la portada y las fichas no inventan firmas ni exponen identificadores privados.

## Requisitos locales

- Node.js 22 LTS.
- npm.
- Un proyecto de Supabase para activar inicio de sesión, publicación y medios.

## 1. Instalar y arrancar

Abre la carpeta raíz que contiene `package.json` en Visual Studio Code. En la terminal integrada ejecuta:

```powershell
node -v
npm -v
npm install
Copy-Item .env.example .env.local
```

Si `.env.local` ya existe, no lo sobrescribas: edítalo directamente. Al principio puedes dejar las variables vacías para ver las secciones públicas y sus estados sin noticias; para iniciar sesión y guardar contenido, primero conecta Supabase usando `GUIA_CONECTAR_SUPABASE.md`.

El primer `npm install` generará `package-lock.json`; consérvalo y súbelo al repositorio para fijar las dependencias de despliegues posteriores.

Cuando hayas completado el archivo `.env.local`:

```powershell
npm run dev
```

Abre `http://localhost:3000`. Para detener el servidor, presiona `Ctrl + C` en la terminal.

## 2. Conectar Supabase

**Sigue `GUIA_CONECTAR_SUPABASE.md` completo.** Resume lo que harás:

1. Crear un proyecto nuevo e independiente en Supabase.
2. Ejecutar una sola vez `supabase/migrations/20261012_news_portal.sql` desde SQL Editor en ese proyecto vacío.
3. Configurar la Project URL, la publishable key y la secret key en `.env.local`.
4. Crear manualmente la primera cuenta y promover su perfil a administrador desde SQL.
5. Reiniciar Next.js, entrar en `/acceso` y administrar usuarios desde `/admin/usuarios`.

No ejecutes esta migración sobre una base existente ni la vuelvas a ejecutar a ciegas si marca un error: revisa el mensaje y resuelve el punto antes de continuar.

## 3. Roles y permisos

| Rol | Permisos |
|---|---|
| `admin` | Todo el panel: noticias, configuración, medios, mensajes y roles de otros usuarios. No puede modificarse a sí mismo desde la pantalla de usuarios. |
| `editor` | Crear, editar, publicar, archivar y borrar noticias; subir medios. No administra usuarios. |
| `colaborador` | Crear y editar sus propios borradores o noticias en revisión. No puede publicar ni editar contenido ajeno. |
| `moderador` | Consultar y marcar como leídos los mensajes de contacto. No puede administrar noticias ni usuarios. |
| `visitante` | Sin acceso al panel editorial. |

No hay registro público. En Authentication de Supabase desactiva **Allow new users to sign up** y los inicios anónimos. Crea las cuentas manualmente desde **Supabase → Authentication → Users**; todas nacen como `visitante`. Después, entra con tu administrador a `/admin/usuarios` y asigna el rol que corresponda. No compartas cuentas ni contraseñas entre colaboradores.

Los permisos no se basan solo en esconder botones: se comprueban en las acciones del servidor y en las políticas RLS. La clave privilegiada solo se usa del lado servidor para las operaciones que la requieren.

## 4. Publicar una noticia

1. Entra a `/acceso`.
2. Abre `/admin/noticias` y selecciona **Crear noticia**.
3. Escribe título, resumen y cuerpo; el slug se puede generar a partir del título.
4. Selecciona una categoría fija.
5. Para utilizar una fotografía, súbela primero en `/admin/medios` y copia su URL.
6. Guarda como borrador o revisión. Un editor o administrador puede publicar.
7. Verifica la noticia desde `/noticias` y la portada.

Las imágenes aceptadas son JPEG, PNG y WebP, máximo 5 MB. Los SVG no están permitidos. Las noticias de prueba deben identificarse como tales; no publiques titulares inventados como información real.

## 5. Comprobaciones antes de subir a internet

Con dependencias instaladas y variables configuradas, ejecuta:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

O `npm run verify` para ejecutar todos los pasos en secuencia. Resuelve cualquier error real antes del despliegue. Verifica manualmente la matriz de roles con cinco cuentas de prueba, incluidos intentos de abrir URLs protegidas directamente.

La comprobación de build requiere `npm install` con acceso al registro de npm; no fue posible ejecutarla en el entorno de preparación de este ZIP.

## 6. Publicar en Render

Sigue `GUIA_PUBLICAR_RENDER.md`. El sitio debe alojarse como **Web Service de Node.js**, no como Static Site, ya que usa renderizado de servidor, autenticación y acciones del servidor. Es un servicio separado del sitio de Cromosomas.

## Archivos importantes

- `src/app/`: sitio público, noticias, panel y formularios.
- `src/app/admin/actions.ts`: acciones protegidas del panel.
- `src/lib/permissions.ts`: reglas de roles usadas por la interfaz.
- `src/lib/supabase.ts`: clientes públicos con sesión y cliente privilegiado de servidor.
- `src/lib/sanitize-article.ts`: sanitización del contenido editorial.
- `supabase/migrations/20261012_news_portal.sql`: esquema, privilegios, políticas RLS y bucket `media`.
- `.env.example`: plantilla sin credenciales.
- `GUIA_CONECTAR_SUPABASE.md`: configuración de base de datos y cuentas.
- `GUIA_PUBLICAR_RENDER.md`: despliegue y dominio.
- `vista-previa.html`: muestra estática independiente; no es la aplicación dinámica.

## Advertencias de seguridad y legalidad

- Nunca subas `.env.local` al repositorio. `SUPABASE_SECRET_KEY` y `TURNSTILE_SECRET_KEY` son secretos de servidor.
- La publishable key puede estar en una variable `NEXT_PUBLIC_`; la seguridad de las tablas depende de RLS y los privilegios correctos.
- No crees una ruta pública para asignar roles.
- Antes del lanzamiento, la persona responsable debe revisar los Términos y el Aviso de Privacidad y completar su identidad, domicilio, medios de contacto y procedimientos legalmente aplicables.
- Realiza respaldos y define quién tiene acceso al dashboard de Supabase, Render y GitHub.
