const userRouter = require('./users/routeUser.js');
const adminRouter = require('./users/routeAdmin.js');
const loginRouter = require('./users/login.js');

const routes = (server) => {
    server.use('/user', userRouter);
    server.use('/admin', adminRouter);
    server.use('/user', loginRouter);
}

module.exports = routes;
