import { AuthController } from './controllers/AuthController';
import 'reflect-metadata';
import { createConnections, createConnection } from 'typeorm';
import { Tb_klient } from './entity/mssql/tb_klient';
import { createExpressServer } from 'routing-controllers';
import * as dotenv from 'dotenv';

const cookieParser = require('cookie-parser');
dotenv.config();

createConnections([
	{
		name: process.env.MSSQL_BASE_NAME,
		type: 'mssql',
		host: 's123',
		username: '1cApplicationServer',
		password: '1c_proc_1c',
		database: 'Basa Piter Plus',
		synchronize: false,
		logging: false,
		entities: ['src/entity/mssql/**/*.ts'],
		migrations: ['src/migration/**/*.ts'],
		subscribers: ['src/subscriber/**/*.ts'],
		cli: {
			entitiesDir: 'src/entity/mssql',
			migrationsDir: 'src/migration',
			subscribersDir: 'src/subscriber',
		},
	},
	{
		name: process.env.SQLITE_BASE_NAME,
		type: 'sqlite',
		database: './sqlite/tokens.db',
		entities: ['src/entity/sqlite/**/*.ts'],
	},
])
	.then(async (connection) => {
		connection.forEach((v) => {
			console.log(
				v.isConnected
					? `Connection to ${v.name} sucsses!`
					: `Connection to ${v.name} break`
			);
		});
	})
	.catch((error) => console.log(error));

const app = createExpressServer({
	cors: true,
	routePrefix: '/api',
	controllers: [AuthController],
});

app.use(cookieParser);

app.listen(3000, () => {
	console.log('Express server has started on port 3000');
});
