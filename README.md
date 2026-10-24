# AguaFix con fotos en S3

API de reportes de fugas hecha con NestJS y PostgreSQL. Conserva las rutas del primer parcial y agrega una foto obligatoria por reporte, envío de correo con imagen y publicación de Docker desde GitHub Actions.

## Requisitos del examen y archivos

| Requisito                                   | Implementación                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Subir archivos con AWS SDK v3               | `src/storage/storage.service.ts` usa `@aws-sdk/client-s3`                                  |
| `uploadFile(file, folder): Promise<string>` | `StorageService`, exportado por `StorageModule`                                            |
| Foto obligatoria en `POST /reports`         | `FileInterceptor('photo')`, memoria, máximo 5 MB; JPEG, PNG o WebP                         |
| Guardar URL y conservar reportes anteriores | Migración `1792800000000-AddReportPhotos.ts`; `synchronize: false`                         |
| Devolver ambas URLs                         | `photoUrl` y `repairPhotoUrl` en la entidad; históricos y reparación pendiente usan `null` |
| Correo a la cuadrilla con imagen            | `generateReportTemplate(dto, photoUrl)` y `CREW_EMAIL`                                     |
| Node 22 Alpine                              | Dockerfile de dos etapas, ejecución `node dist/main`                                       |
| Publicación automática                      | `.github/workflows/docker-publish.yml`, push a `main`, tag `latest` y SHA                  |
| Credenciales fuera de Git e imagen          | `.env` local, GitHub Secrets y reglas de exclusión                                         |

El enunciado no define un endpoint de reparación. Se agrega `repairPhotoUrl` opcional para cumplir la respuesta de GET; no se inventa un flujo de reparación.

## 1. Configuración local

Instala Docker Desktop y usa Node 22 actualizado. Desde esta carpeta:

```bash
npm ci
```

Si ya tienes `.env` del primer parcial, consérvalo: no lo reemplaces con `.env.example`. Solo en una instalación nueva, sin ese archivo, ejecuta `cp -n .env.example .env`.

Completa las variables que falten en tu editor cuando tengas los datos de AWS. No muestres `.env` en el video ni lo pegues en chats. Sus valores se suministran al contenedor durante la ejecución; no se copian a la imagen.

- Conserva tus variables `DB_*` existentes. Para una instalación nueva puedes usar `DB_NAME=aguafix`, `DB_USERNAME=postgres`, `DB_HOST=localhost`, `DB_PORT=5433` y una contraseña propia. Para ejecutar la API localmente contra la base de Compose, `DB_HOST` debe ser `localhost` y `DB_PORT` el puerto publicado. Dentro del contenedor, Compose configura automáticamente la conexión.
- `MAILER_EMAIL`: cuenta Gmail remitente. `MAILER_SECRET_KEY`: contraseña de aplicación de Gmail. Conserva las que ya configuraste si siguen vigentes.
- `CREW_EMAIL`: destinatario de la cuadrilla; puede ser tu propia cuenta para la demostración. Si omites esta variable, se usa `MAILER_EMAIL`.
- `AWS_REGION`: región real del bucket, por ejemplo `us-east-1`.
- `AWS_S3_BUCKET`: nombre exacto del bucket.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: credenciales locales de una identidad autorizada. Si son temporales, completa también `AWS_SESSION_TOKEN`; si no, déjalo vacío.
- `DOCKER_USER=cvabraham13`.

`compose.yaml` utiliza el proyecto `aguafix-examen` y un volumen nuevo `postgres_examen_data`. No reutiliza los volúmenes de Animal API o Pet Radar. El código del repositorio no usa Redis ni tipos PostGIS; la base del examen utiliza PostgreSQL 16.

## 2. Bucket e identidad de AWS

1. Inicia sesión en la cuenta que utilizas en clase. Si es AWS Academy/Learner Lab, inicia el laboratorio y utiliza sus credenciales temporales, incluido el token de sesión. No crees claves del usuario root.
2. Abre S3 y crea un bucket de propósito general en `us-east-1` (o la región permitida por tu laboratorio). Ejemplo de nombre: `aguafix-cvabraham13-20261024`; cambia el sufijo si ya está ocupado.
3. Mantén ACL deshabilitadas (Bucket owner enforced) y cifrado SSE-S3. No necesitas activar alojamiento de sitios web.
4. El examen exige una URL pública estable. En los permisos de este bucket, permite políticas públicas: desmarca los dos bloqueos relacionados con políticas públicas; puedes mantener los dos bloqueos relacionados con ACL. Si hay un bloqueo a nivel de cuenta o del laboratorio, consulta al administrador/profesor antes de cambiar políticas generales.
5. Agrega la siguiente política de lectura pública, reemplazando `NOMBRE_BUCKET` por el nombre real. Permite leer solamente los objetos de `reports/`; no concede escritura pública.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadReportPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::NOMBRE_BUCKET/reports/*"
    }
  ]
}
```

Usa imágenes de prueba apropiadas para acceso público. La aplicación devuelve una URL HTTPS del objeto; esta URL solo será legible anónimamente si la política anterior está permitida.

La identidad que utiliza la API necesita esta política de escritura (es una política IAM, distinta de la política pública del bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::NOMBRE_BUCKET/reports/*"
    }
  ]
}
```

`DeleteObject` se usa para retirar una foto si falla el guardado del reporte. En una cuenta propia, configura una identidad IAM con estos permisos y acceso programático; en Academy usa la identidad/rol disponible. Guarda las credenciales únicamente en tu configuración local. Las credenciales temporales vencidas deben renovarse antes de la grabación.

## 3. Verificar el desarrollo

Desde la carpeta del proyecto, con `.env` completo:

```bash
docker compose up -d postgres
npm run migration:run
npm run start:dev
```

`migration:run` ejecuta las migraciones iniciales y después la de fotos. No modifica las migraciones iniciales. En una base existente solo agrega las columnas nuevas y conserva los reportes sin foto con `null`. La aplicación siempre mantiene `synchronize: false`.

Las rutas originales `/api/auth/register`, `/api/auth/login` y `/api/reports` se mantienen. También se exponen `/auth/...` y `/reports` para los nombres exactos del examen.

## 4. Bruno o Postman

Puedes importar `docs/AguaFix.postman_collection.json` para tener las peticiones preparadas. Selecciona manualmente una foto en la petición de creación y completa las variables de usuario solo para probar registro e inicio de sesión.

En Bruno, usa **Import Collection → Postman Collection**, selecciona ese JSON y guarda la colección en una carpeta nueva. Abre **3 Crear reporte con foto**, entra en **Body → Multipart Form** y selecciona una imagen en el campo `photo`, de tipo **File**. Si la importación no conserva ese campo, agrégalo con ese nombre exacto. Las claves AWS se quedan en el `.env` de la API; no se agregan a Bruno.

El enunciado menciona Postman expresamente para el video. Bruno permite comprobar el mismo endpoint; si debes seguir literalmente la herramienta indicada, importa también la colección en Postman para la grabación.

### Crear un reporte

- Método: `POST`
- URL: `http://localhost:3000/reports`
- Body: `form-data`

| Key           | Tipo | Valor de ejemplo                            |
| ------------- | ---- | ------------------------------------------- |
| address       | Text | Calle de prueba 123                         |
| description   | Text | Fuga de agua en la banqueta                 |
| severity      | Text | high                                        |
| reporterPhone | Text | 5551234567                                  |
| photo         | File | Selecciona una imagen PNG, JPEG o WebP real |

No escribas manualmente el encabezado `Content-Type`: Bruno o Postman deben generar el boundary de multipart. `severity` acepta `low`, `medium` o `high`.

Resultado esperado: `201 Created` con el reporte, una `photoUrl` con ruta `reports/` y `repairPhotoUrl: null`.

1. Abre `photoUrl` en una ventana privada para verificar lectura pública sin sesión AWS.
2. En S3, entra en el bucket y abre `reports/`; el objeto tiene un nombre UUID para evitar colisiones.
3. Revisa el correo de `CREW_EMAIL`. Debe contener imagen, dirección, descripción, severidad y teléfono. Si el cliente bloquea imágenes externas, permite mostrarlas.
4. Ejecuta `GET http://localhost:3000/reports` y verifica las dos propiedades de fotos.
5. Desmarca el campo `photo` y repite POST: debe devolver `400 Bad Request`.

La plantilla escapa el texto proporcionado por el ciudadano. Si S3 falla, el reporte no se guarda. Si falla el correo después de guardar el reporte, la solicitud devuelve un error pero el reporte ya existe: revisa GET y la configuración de correo antes de reintentar, para evitar duplicados.

### Comprobar el primer parcial

Registra una cuenta con `POST /api/auth/register` usando JSON con `name`, `email`, `password` e `isNotificationEnabled` opcional. Inicia sesión con `POST /api/auth/login` y JSON con `email` y `password`. Usa datos de prueba y no muestres contraseñas en la grabación.

## 5. Docker Hub y GitHub Actions

1. En Docker Hub, crea el repositorio público `cvabraham13/aguafix-api`.
2. Crea un token personal de Docker Hub con permisos de lectura y escritura.
3. En GitHub abre tu repositorio → Settings → Secrets and variables → Actions → New repository secret.
4. Crea exactamente estos dos secrets:
   - `DOCKER_USER`: `cvabraham13`.
   - `DOCKER_PASSWORD`: el token de Docker Hub.
5. No se requieren credenciales de AWS, correo o PostgreSQL para construir la imagen ni para las pruebas unitarias del workflow.
6. Al hacer push a `main`, el workflow prueba, compila y publica `latest` y una etiqueta con el SHA. Construye para `linux/amd64` y `linux/arm64`, incluyendo tu Mac con Apple silicon.

Los archivos `compose.yaml` y `.env.example` sí se versionan en Git. El enunciado prohíbe incluir `compose.yaml` dentro de la imagen; `.dockerignore` y las instrucciones COPY explícitas lo excluyen. `.env` no se versiona ni se incluye en la imagen.

## 6. Ejecutar la imagen publicada

Primero detén el servidor de desarrollo con Control+C para liberar el puerto 3000. Después de que Actions termine en verde:

```bash
docker compose pull
docker compose up -d
docker compose ps -a
docker compose logs --tail=50 migrate api
```

Compose inicia PostgreSQL, espera a que esté listo, ejecuta las migraciones con la imagen publicada y arranca la API. Es normal que `migrate` termine con código 0; `api` y `postgres` deben seguir activos.

Para detener solo este proyecto y conservar datos:

```bash
docker compose stop
```

No necesitas ejecutar `docker system prune`, `docker container prune`, `docker volume prune` ni `down -v` para el examen.

## 7. Guion del video

Haz primero un ensayo completo con S3 y correo reales. Después graba en este orden:

1. En el editor, realiza un cambio visible y pequeño, por ejemplo mejora el texto del asunto o una frase de la plantilla. Explica su efecto.
2. Muestra `git status`, revisa los cambios y confirma que `.env` está ignorado con `git check-ignore .env`.
3. Haz el commit y el push a `main` con el cambio. Si estás trabajando en una rama, integra primero el trabajo a `main` según el flujo de tu repositorio. No uses push forzado.
4. Abre Actions y muestra la ejecución correspondiente a ese commit hasta que termine en verde.
5. Abre Docker Hub → `cvabraham13/aguafix-api` → Tags. Muestra `latest`, la fecha de actualización y, si es útil, la etiqueta del SHA del commit.
6. Ejecuta `docker compose pull` y `docker compose up -d`; muestra que la API usa la imagen publicada. Si existe un contenedor de migraciones ya completado de un ensayo anterior, puedes ejecutar `docker compose up -d --force-recreate migrate api` para repetirlo con la imagen actual.
7. En Postman, realiza POST con foto y muestra la respuesta.
8. Muestra el objeto creado en S3 y abre la URL pública.
9. Muestra el correo recibido con la foto visible. Como evidencia adicional, muestra GET con ambas URLs y POST sin foto con 400.

Entrega:

- Repositorio: https://github.com/AbrahamJR5/Examen---AguaFix
- Imagen, una vez publicada: https://hub.docker.com/r/cvabraham13/aguafix-api
- Video en el formato o plataforma que solicite el profesor.

No muestres `.env`, tokens, claves ni la pantalla donde se revelan credenciales.

## Pruebas

```bash
npm test -- --runInBand
npm run build
npm run test:e2e
```

Las pruebas unitarias usan adaptadores simulados. `test:e2e` necesita Docker Desktop, crea una base PostgreSQL temporal propia, comprueba una migración con datos anteriores, registro/login y POST/GET con fotos, y elimina solo su contenedor de prueba. S3 y correo se simulan en esa prueba: no reemplaza la comprobación real exigida para el video.

## Fuentes de consulta

- https://docs.nestjs.com/techniques/file-upload
- https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html
- https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
- https://docs.docker.com/build/ci/github-actions/multi-platform/
- https://docs.docker.com/security/access-tokens/
