const Router = require('koa-router');
const router = new Router({
	prefix: '/user'
});

const user = require('../controllers/user');

/*router.all('/*', async function(ctx, next){
	await next();
});*/

router.post('/login', user.login);

module.exports = router;
