export class CustomError extends Error {
	constructor(message, status_code) {
		super(message);
		this.status_code = status_code;
	}
}

export const create_custom_error = (message, status_code) => {
	return new CustomError(message, status_code);
};
