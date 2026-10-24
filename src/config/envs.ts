import 'dotenv/config';
import * as env from 'env-var';

export const envs = {
  port: env.get('PORT').default(3000).asPortNumber(),

  dbHost: env.get('DB_HOST').required().asString(),
  dbPort: env.get('DB_PORT').required().asPortNumber(),
  dbUsername: env.get('DB_USERNAME').required().asString(),
  dbPassword: env.get('DB_PASSWORD').required().asString(),
  dbName: env.get('DB_NAME').required().asString(),

  mailerEmail: env.get('MAILER_EMAIL').required().asEmailString(),
  mailerSecretKey: env.get('MAILER_SECRET_KEY').required().asString(),
  crewEmail: env
    .get('CREW_EMAIL')
    .default(env.get('MAILER_EMAIL').required().asString())
    .asEmailString(),
};
