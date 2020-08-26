import { refreshSession } from './../entity/sqlite/refreshSession';
import { Request, Response } from 'express';
import { checkJwt } from './../middleware/checkJWT';
import { Tb_klient } from '../entity/mssql/tb_klient';
import {
	Authorized,
	Body,
	Get,
	Header,
	JsonController,
	NotFoundError,
	Post,
	QueryParam,
	Req,
	Res,
	UnauthorizedError,
	Param,
	BodyParam,
	UseBefore,
	Action,
} from 'routing-controllers';
import { AuthService } from '../service/authService';
const jwt = require('jsonwebtoken');

@JsonController('/auth')
export class AuthController {
	authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	@Get('/getUser/:id_klient')
	login(@Param('id_klient') id_klient: number) {
		return this.authService.getUser(id_klient);
	}
	@Get('/getToken/:id_klient')
	getToken(@Param('id_klient') id_klient: number) {
		return this.authService.getToken(id_klient);
	}

	@Post('/signin')
	async signIn(
		@BodyParam('id_klient') id_klient: number,
		@BodyParam('password') password: string,
		@Req() req: any,
		@Res() res: any
	) {
		//Get user from database
		let user: Tb_klient;
		try {
			user = await this.authService.getUser(id_klient);
		} catch (error) {
			throw new UnauthorizedError('Username incorrect');
		}

		//Check if encrypted password match
		if (!this.authService.isPasswordCorrect(password, user.pw)) {
			throw new UnauthorizedError('Password Incorrect');
		}

		let { pw, email, name, ...payload } = user;
		//Sing JWT accsess token, valid for 1 hour
		const access_token = this.authService.generateJwt(
			payload,
			process.env.ACC_TOKEN_EXPIRES_IN_SECONDS
		);

		//Sing refresh token, valid for 1 week
		const refSession: refreshSession = this.authService.generateRefToken(
			id_klient
		);

		// save refresh token

		try {
			await this.authService.saveToken(refSession);
		} catch (error) {
			console.log(error);
		}

		const refExpiresInSeconds: number = Number(
			process.env.REF_TOKEN_EXPIRES_IN_SECONDS
		);

		res.cookie('refresh_token', refSession.refreshToken, {
			maxAge: refExpiresInSeconds * 1000,
			domain: 'localhost',
			path: '/api/auth',
			httpOnly: true,
		});

		return [
			{
				a_token: access_token,
				expires: jwt.decode(access_token).exp,
			},
			{
				r_token: refSession.refreshToken,
			},
		];
	}

	// @Post('/logout')
	// async logout();

	@Post('/refresh')
	async refresh(
		@BodyParam('id_klient') id_klient: number,
		@BodyParam('refToken') refToken: string,
		@Req() req: any,
		@Res() res: any
	) {
		const userSessions: refreshSession[] = await this.authService.getUserSessions(
			id_klient
		);

		const currentSession: refreshSession = await this.authService.getCurrentSession(
			refToken
		);

		if (
			currentSession &&
			currentSession.expires > new Date().getTime() / 1000
		) {
			const refSession: refreshSession = this.authService.generateRefToken(
				id_klient
			);

			try {
				await this.authService.saveToken(refSession);
			} catch (error) {
				throw new Error(error);
			}

			const payload = {
				id_klient,
			};
			const access_token = this.authService.generateJwt(
				payload,
				process.env.ACC_TOKEN_EXPIRES_IN_SECONDS
			);

			const refExpiresInSeconds: number = Number(
				process.env.REF_TOKEN_EXPIRES_IN_SECONDS
			);

			res.cookie('refresh_token', refSession.refreshToken, {
				maxAge: refExpiresInSeconds * 1000,
				domain: 'localhost',
				path: '/api/auth',
				httpOnly: true,
			});

			return [
				{
					a_token: access_token,
					expires: jwt.decode(access_token).exp,
				},
				{
					r_token: refSession.refreshToken,
					expires: refSession.expires,
				},
			];
		} else {
			res
				.status(401)
				.send({ response: 'You should be logged in to access this url' });
			return;
		}
	}

	@Get('/protectedURL')
	@UseBefore(checkJwt)
	async getProtectedUrl(@Req() req: any, @Res() res: any) {
		let username = res.locals.jwtPayload.data.name;
		return `You successfully reached This protected endpoint Mr: ${username}`;
	}
}
