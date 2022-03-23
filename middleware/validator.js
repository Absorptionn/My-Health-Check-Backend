export const validate_email = (email) => {
	let regex = /^\w+[-._]*\w*@(auf[.]edu[.]ph)$/;
	return regex.test(email);
};
export const validate_number = (number) => {
	let regex = /[0-9]{11}/;
	return regex.test(number);
};
