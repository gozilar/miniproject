const express = require('express'); // call module "express"
const app = express(); //initialize express; ready to use
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.set('view engine','ejs')
app.set('views', __dirname + '/views')
app.use(express.static('static'))
app.use(session({secret: "abcd",resave: false}))

const adm = {
	username: 'admin',
	password: '1234'
}

const pool = mysql.createPool({
	connectionLimit:10,
	host: 'localhost',
	user: 'root',
	password: 'abcd1234',
	database: 'shop'
})

app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});

app.get("/home",(req,res)=> {
    pool.getConnection((err,connection)=>{
		if (err){res.sent("error"); return;}
		connection.query("SELECT * FROM products",(err,results)=>{
			//res.json(results)
			res.render("front", {products:results})
		})
	})	//res.send("Hello World")
})

app.get("/api/products",(req,res)=> {
    pool.getConnection((err,connection)=>{
		if (err){res.sent("error"); return;}
		connection.query("SELECT * FROM products",(err,results)=>{
			res.json(results)
			//res.render("front", {products:results})
		})
	})	//res.send("Hello World")
})

app.delete("/api/products/:productId",(req,res)=> {	
    let id = req.params.productId
	pool.query(`DELETE FROM products WHERE id=${id}`, (err,result)=>{
		if(err){res.send("error");}else{res.send("deleted");}
	})
})

app.post("/api/products",(req,res)=>{
	const sql = `INSERT INTO products (id, name, price, \`desc\`, imagefile, imagefile_big, discountprice, stock, stars, isnew, ispromo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`;
	pool.query(sql,[
		req.body.id,
		req.body.name,
		req.body.price,
		req.body.desc,
		req.body.imagefile,
		req.body.imagefile_big,
		req.body.discountprice,
		req.body.stock,
		req.body.stars
	],(err,result)=>{
		if(err){
			console.error(err.message);
			res.send("error");
		}else{ res.send("ok");}
	})
})

app.get("/product/:productId",(req,res)=> {	
    let id = req.params.productId
    pool.getConnection((err,connection)=>{
		if (err){res.sent("error"); return;}
		connection.query(`SELECT * FROM products where id=${id}`,(err,results)=>{
			product = results[0]
				connection.query(`SELECT * FROM products where id<>${id} LIMIT 3`,(err2,results2)=>{
					res.render("shopitem", {p:product, moreproducts:results2})
				})
			//res.render("front", {products:results})
			//product = results[0];
			//res.render("shopitem", {p:product})
		})
	})
	//res.render("shopitem"); 
})

app.get("/login",(req,res)=> {	
	res.render("login", {error:""}); 
})

app.post("/login",(req,res)=> {
	const {username,password} = req.body
	// this cmd map req.body with the same name
	// req.body.username -> username
	// req.body.password -> password
	if (username == adm.username && password == adm.password){
		req.session.isLoggedIn = true;
		res.render("admin");
	}else{
		res.render("login", {error:"invalid username or password"})
	}
	//res.render("login", {error:""}); 
})

app.get("/admin",(req,res)=> {
	if (req.session.isLoggedIn)	{
		res.render("admin");
	}else{
		res.render("login", {error:"ไม่พบ session กรุณาล็อกอิน"})
	}
})

app.get("/mycart",(req,res)=> {	
	res.render("cart", {cart: req.session.cart} )
})
app.post("/cart",(req,res)=> {	
	const {id, name, price, amount} = req.body
	if (!id || !name || !price || !amount){
		res.send("error")
	}
	req.session.cart.push({id, name, price, amount})
	res.render("cart", {cart: req.session.cart})
})

app.listen(3000, ()=>{ //port can be changed to 80 (http) or 443 (need certificate for https) 
	console.log("Server is running on port 3000")
}); 
