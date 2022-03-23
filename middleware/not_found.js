const not_found = (req, res, next) => {
	res.status(404).send("Route does not exist");
};

export default not_found;
