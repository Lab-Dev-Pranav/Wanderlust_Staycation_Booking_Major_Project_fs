/**
 * Custom Error class for Express routes.
 * Exported as the module's default export so it should be required
 * with `const ExpressError = require('./utils/expressError');`
 */
class ExpressError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;
