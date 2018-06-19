const M_TO_FEET = 3.28084;
const M_TO_SURVEY_FEET = 3937 / 1200;
const M_TO_INCH = 39.37008;

// Convert m to feet, inches. Can also be used for converting areas
module.exports = (val, units, area = false) => {
	const power = area ? 2 : 1;
	switch (units) {
		case 'm':
			return val;
		case 'ft':
			return val * Math.pow(M_TO_FEET, power);
		case 'foot_survey_us':
			return val * Math.pow(M_TO_SURVEY_FEET, power);
		case '″':
			return val * Math.pow(M_TO_INCH, power);
		default:
			return val;
	}
};
