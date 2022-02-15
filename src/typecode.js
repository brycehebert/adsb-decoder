const _memoize = require("lodash/memoize");

// Memoizing this isn't really necessary, but I'm already using lodash so why not?
module.exports.getTypeCodeString = _memoize((tc) => {
  if (tc <= 4) return "Aircraft Identification";
  if (tc >= 5 && tc <= 8) return "Surface Position";
  if (tc >= 9 && tc <= 18) return "Airborne Position (w/ Barometer Alt.)";
  if (tc === 19) return "Airborne Velocities";
  if (tc >= 20 && tc <= 22) return "Airborne Position (w/ GNSS Height)";
  if (tc === 28) return "Aircraft Status";
  if (tc === 29) return "Target State and Status Information";
  if (tc === 31) return "Aircraft Operation Status";
});