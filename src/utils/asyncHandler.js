// recives a funtion and returns a promise
const asyncHandlerPromise = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asyncHandlerPromise };
