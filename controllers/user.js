const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	database: 'safety'
});
const bluebird = require('bluebird');
const query = bluebird.promisify(connection.query.bind(connection));

exports.login = async function(ctx, next){
	try{

		const data = ctx.request.body;

		connection.connect();

		const results = await query(
			`select * from user where
			username = '${data.username}'
			and password = '${data.password}'`
		);

		if(results.length){
			let user = results[0];
			ctx.body = {
				status: 0,
				data:{
					userId: user.id
				}
			};
		}else{
			throw new Error('登录失败');
		}

		connection.end();
	}catch(e){
		connection.end();
		console.log('[/user/login] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
