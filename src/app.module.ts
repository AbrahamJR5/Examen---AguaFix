import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config/envs';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: envs.dbPort,
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbName,
      autoLoadEntities: true,
      synchronize: false, 
    }),
    UsersModule,
    AuthModule,
    EmailModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}