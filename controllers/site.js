const bluebird = require('bluebird');
const connectionModel = require('../models/connection');

exports.index = async function(ctx, next){
	const connection = connectionModel.getConnection();
	const query = bluebird.promisify(connection.query.bind(connection));
	const results = await query(
			'select * from post limit 10'
		);
	ctx.render('index', {posts: results, from:ctx.query.from || ''});
	connection.end();
};

exports.post = async function(ctx, next){
	try{
		console.log('enter post');

		const id = ctx.params.id;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const posts = await query(
			`select * from post where id = "${id}"`
		);
		let post = posts[0];

		const comments = await query(
			`select comment.*,user.username from comment left join user on comment.userId = user.id where postId = "${post.id}" order by comment.createdAt desc`
		);
		if(post){
			ctx.render('post', {post, comments});
		}else{
			ctx.status = 404;
		}
		connection.end();
	}catch(e){
		console.log('[/site/post] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};

exports.addComment = async function(ctx, next){
	try{
		const data = ctx.request.body;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const result = await query(
			`insert into comment(userId,postId,content,createdAt) values("${ctx.cookies.get('userId')}", "${data.postId}", "${data.content}","${new Date().toISOString()}")`
		);
		if(result){
			ctx.redirect(`/post/${data.postId}`);
		}else{
			ctx.body = 'DB操作失败';
		}
	}catch(e){
		console.log('[/site/addComment] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
