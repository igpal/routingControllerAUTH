import { refreshSession } from '../entity/sqlite/refreshSession';
import { Tb_klient } from '../entity/mssql/tb_klient';
import { getRepository, getConnection } from 'typeorm';
const jwt = require('jsonwebtoken');
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
	async getUser(clientId: number) {
		const userRepository = getRepository(
			Tb_klient,
			process.env.MSSQL_BASE_NAME
		);
		const user = await userRepository.findOne(clientId);
		return user;
	}
	async getToken(clientId: number) {
		const tokenRepository = getRepository(
			refreshSession,
			process.env.SQLITE_BASE_NAME
		);
		const token = await tokenRepository.findOne(clientId);
		return token;
	}

	async saveToken(refSession) {
		const sessionRepository = getRepository(
			refreshSession,
			process.env.SQLITE_BASE_NAME
		);
		return await sessionRepository.save(refSession);
	}

	async getUserSessions(clientId: number) {
		const sessionRepository = getRepository(
			refreshSession,
			process.env.SQLITE_BASE_NAME
		);

		return await sessionRepository
			.createQueryBuilder('session')
			.where('session.id_client = :clientId', { clientId: clientId })
			.getMany();
	}

	async getCurrentSession(refToken: string) {
		const sessionRepository = getRepository(
			refreshSession,
			process.env.SQLITE_BASE_NAME
		);

		const currentSession = await sessionRepository
			.createQueryBuilder('session')
			.select()
			.where('session.refreshToken = :refreshToken', { refreshToken: refToken })
			.getOne();

		if (currentSession) {
			try {
				await sessionRepository
					.createQueryBuilder()
					.delete()
					.where('refreshToken = :refreshToken', {
						refreshToken: refToken,
					})
					.execute();
			} catch (error) {
				throw new Error(error);
			}
		}

		return currentSession;
	}

	isPasswordCorrect(password: string, savedPassword: string): boolean {
		// if (bcrypt.compareSync(password, savedPassword)) return true;
		// else return false;

		return password.trim() === savedPassword.trim();
	}

	generateJwt(payload, expiresIn) {
		return jwt.sign({ data: payload }, process.env.JWT_SECRET, { expiresIn });
	}

	generateRefToken(clientId: number) {
		const refSession: refreshSession = new refreshSession();

		const refresh_token = uuidv4();
		const refresh_token_expires = Math.floor(
			new Date().getTime() / 1000 + 86400 * 7
		);

		refSession.id_client = clientId;
		refSession.userId = uuidv4();
		refSession.refreshToken = refresh_token;
		refSession.expires = refresh_token_expires;

		return refSession;
	}
}
