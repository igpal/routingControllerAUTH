import { refreshSession } from '../entity/sqlite/refreshSession';
import { AuthService } from './../service/authService';
import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');

const extractTokenFromHeader = (req: Request) => {
	if (
		req.headers.authorization &&
		req.headers.authorization.split(' ')[0] === 'Bearer'
	) {
		return req.headers.authorization.split(' ')[1];
	}
};

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
	//extract the jwt token from the Authorization header
	const token = extractTokenFromHeader(req);
	let jwtPayload;

	console.log(jwt.decode(token));
	console.log(new Date(jwt.decode(token).exp).toString());

	//Try to validate the token and get data
	try {
		jwtPayload = jwt.verify(token, process.env.JWT_SECRET);
		// for check role
		res.locals.jwtPayload = jwtPayload;
	} catch (error) {
		//If token is not valid, respond with 401 (unauthorized)
		res
			.status(401)
			.send({ response: 'You should be logged in to access this url' });
		return;
	}

	// //We refresh the token on every request by setting another 1h
	// const {
	// 	data: { id_klient, name },
	// } = jwtPayload;
	// const newToken = jwt.sign(
	// 	{ data: { id_klient, name } },
	// 	process.env.JWT_SECRET,
	// 	{
	// 		expiresIn: '1h',
	// 	}
	// );
	// res.setHeader('Authorization', 'Bearer ' + newToken);

	next();
};
