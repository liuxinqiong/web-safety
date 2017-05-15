const bluebird = require('bluebird');
const connectionModel = require('../models/connection');
const User = require('../models/user');
const crypt = require('../tools/crypt');
const session = require('../tools/session');

exports.login = async function(ctx, next){
	ctx.render('login');
};

exports.doLogin = async function(ctx, next){
	try{

		const data = ctx.request.body;
		const user = await User.findOne({
			where:{
				username: data.username,
				password: data.password
			}
		});
		if(user){

			console.log(crypt.cryptUserId(user.id));

			var sessionId = session.set(user.id, {
				userId: user.id
			});

			ctx.cookies.set('sessionId', sessionId, {
				httpOnly: true,
				// sameSite: 'strict'
			});

			// 登录成功，设置cookie
			/*ctx.cookies.set('sign', crypt.cryptUserId(user.id), {
				httpOnly:false,
				sameSite:'strict'
			});
			ctx.cookies.set('userId', user.id, {
				httpOnly:false,
				sameSite:'strict'
			});*/


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

	}catch(e){
		console.log('[/user/login] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
