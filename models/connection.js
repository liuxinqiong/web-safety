const mysql = require('mysql2');
exports.getConnection = function(){
	let connection = mysql.createConnection({
		host: 'localhost',
		database: 'safety'
	});
	connection.connect();
	return connection;
};
