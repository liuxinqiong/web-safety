const bluebird = require('bluebird');
const connectionModel = require('../models/connection');

exports.index = async function(ctx, next){
	ctx.render('index');
};

exports.post = async function(ctx, next){
	try{

		const data = ctx.request.body;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
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
					id: user.id,
					name: user.name
				}
			};
		}else{
			throw new Error('登录失败');
		}

		connection.end();
	}catch(e){
		console.log('[/user/login] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
