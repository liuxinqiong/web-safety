const Router = require('koa-router');
const router = new Router({
	prefix: '/'
});

const site = require('../controllers/site');

/*router.all('/*', async function(ctx, next){
	await next();
});*/

router.get('/', site.index);
router.get('/post/:id', site.post);


module.exports = router;
