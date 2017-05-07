const bluebird = require('bluebird');
const connectionModel = require('../models/connection');

var escapeHtml = function(str) {
	if(!str) return '';
	str = str.replace(/&/g, '&amp;');
	str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');
	str = str.replace(/"/g, '&quto;');
	str = str.replace(/'/g, '&#39;');
	// str = str.replace(/ /g, '&#32;');
	return str;
};

var escapeForJs = function(str) {
	if(!str) return '';
	str = str.replace(/\\/g, '\\\\');
	str = str.replace(/"/g, '\\"');
	return str;
};

exports.index = async function(ctx, next){
	const connection = connectionModel.getConnection();
	const query = bluebird.promisify(connection.query.bind(connection));
	const posts = await query(
			'select post.*,count(comment.id) as commentCount from post left join comment on post.id = comment.postId group by post.id limit 10'
		);
	const comments = await query(
			'select comment.*,post.id as postId,post.title as postTitle,user.username as username from comment left join post on comment.postId = post.id left join user on comment.userId = user.id order by comment.id desc limit 10'
		);
	ctx.render('index', {
		posts,
		comments,
		from: escapeHtml(ctx.query.from) || '',
		fromForJs: JSON.stringify(ctx.query.from),
		avatarId: escapeHtml(ctx.query.avatarId) || ''
	});
	connection.end();
};

var xssFilter = function(html){
	if(!html) return '';

	var xss = require('xss');
	var ret = xss(html, {
		whiteList:{
			img: ['src'],
			a: ['href'],
			font: ['size', 'color']
		},
		onIgnoreTag: function(){
			return '';
		}
	});


	console.log(html, ret);

	return ret;
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
		comments.forEach(function(comment) {
			comment.content = xssFilter(comment.content);
		});
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
		var data;
		if(ctx.request.method.toLowerCase() === 'post'){
			data = ctx.request.body;
		}else{
			data = ctx.request.query;
		}
		console.log(data.captcha);
		if(!data.captcha){
			throw new Error('验证码错误');
		}

		var captcha = require('../tools/captcha');
		var captchaResult = captcha.validCache(ctx.cookies.get('userId'), data.captcha);
		console.log('result', captchaResult);
		if(!captchaResult){
			throw new Error('验证码错误');
		}

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
