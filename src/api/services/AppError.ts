'use strict';

class AppError extends Error {
	httpStatus: number;
	message: string;
	developerMessage: string;
	name: string;
	stack: any;

	constructor(httpStatus, message, developerMessage = '') {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		this.developerMessage = developerMessage;
		this.httpStatus = httpStatus;

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = (new Error(message)).stack;
		}
	}
}

export default AppError;