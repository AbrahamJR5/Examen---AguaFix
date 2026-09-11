import { DataSource, DataSourceOptions } from 'typeorm';
import { envs } from '../config/envs';
import { User } from '../users/entities/user.entity'; 
import { Report } from '../reports/entities/report.entity';

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: envs.dbHost,
    port: envs.dbPort,
    username: envs.dbUsername,
    password: envs.dbPassword,
    database: envs.dbName,
    entities: [User, Report], 
    synchronize: false,
    migrations: ['dist/db/migrations/[0-9]*-*.js'] 
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;