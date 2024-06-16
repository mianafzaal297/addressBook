const express = require('express');
const app = express();
const ejs = require('ejs');
const fs = require('fs');
const bodyParser = require('body-parser');
const expressSession = require('express-session');

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('homePage');
});

app.use(bodyParser.urlencoded({extended: true}));

app.use(expressSession({
    secret: "this is secret key. don't disclose it",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000, path: '/'} // 24 hours
}));

function readfile(){
    try {
        fileData = fs.readFileSync('users.json', 'utf8');
        console.log(fileData);
        console.log(JSON.parse(fileData));
        return JSON.parse(fileData);
    } catch (error) {
        console.log("Error Reading File...", error);
    }
}

function writeFile(fileData){
    try {
        fs.writeFileSync('users.json', JSON.stringify(fileData, null,2), 'utf8');
    } catch (error) {
        console.log("Error Writing File....", error);
    }
}

app.get('/home', (req, res) => {
    user = readfile();
    if(req.session.userLoggedIn){
        console.log("Authenticated User");
        req.session.message = "Authorized User";
    }
    else{
        console.log("Unauthorized User");
        req.session.message = "Unauthorized User";
    }
    console.log(user);
    let model = {
        userLoggedIn : req.session.userLoggedIn,
        users : user,
        message : req.session.message
    };
    res.render('home', {model});
});

app.get('/update',(req, res) => {
    if(req.session.userLoggedIn){
        users = readfile();
        const userToUpdate = users.find(user => user.id == req.query.id);
        res.render('update', { user: userToUpdate });
    }else{
        req.session.message = "First Authenticate for Updating Data..!!";
        res.redirect("login");
    }
    
});

app.post('/update',(req,res) => {

    users = readfile();

    const userToUpdate = users.find(user => user.id == req.body.id);

    userToUpdate.name = req.body.name;

    writeFile(users);
    res.redirect('/home');
});

app.delete('/delete', (req, res)=>{
    if(!req.session.userLoggedIn) {
        console.log("User Not LogIn in Delete");
        return res.status(401).json({ message: 'Unauthorized '});
    }

    const id = parseInt(req.body.id);
    let users = readfile();
    const index = users.findIndex(obj => obj.id == id);
    users.splice(index, 1);
    console.log(users);
    writeFile(users);
    res.json({ message: 'User deleted'});
});


app.get('/add', (req, res) => {
    if(req.session.userLoggedIn){
        res.render('add');
    }else{
        req.session.message = "First Confirm Your Authentication..!!";
        res.redirect("login");
    }
    
});

app.post('/add', (req, res) => {
    const users = readfile();
    const newUser = {
        id: req.body.id, 
        name: req.body.name,
        gender: req.body.gender,
        email: req.body.email,
        city: req.body.city,
        phone: req.body.phone
    };

    users.push(newUser);

    writeFile(users);
    res.redirect('/home');
});

app.get('/show', (req, res) => {
    const users = readfile();
    const userToShow = users.find(user => user.id == req.query.id);
    model = {
        user : userToShow,
        message : req.session.message
    }
    res.render('show', {model});
});

app.get("/login", (req,res) => {
    //if(req.session.message){
        model = {
            message : req.session.message
        }
    //}
    res.render("login", {model});
});

app.post("/login", (req, res) =>{
    if(req.body.username == "admin" && req.body.password == "admin123"){
        console.log("User Login Successfuly...!!");
        req.session.userLoggedIn = true;
        req.session.message = "Authorized User";
        res.redirect("/home");
    }
    else{
        console.log("Login Credential Not Meet...!!");
        req.session.message = "Invalid Username and Password";
        res.redirect("/login?message=Invalid Username or Password");
    }
    res.send();
});

app.get("/logout", (req, res) =>{
    req.session.userLoggedIn = false;
    req.session.message = "Unauthorized User";
    res.redirect("/home");
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
