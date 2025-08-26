// helpers/responseHelper.js
const successResponse = (res, message, data = {}) => {
  return res.json({
    status: true,
    message,
    data,
  });
};

const errorResponse = (res, message, code = 400) => {
  return res.status(code).json({
    status: false,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
