
const express=require("express");
const app=express();
const { faker } = require("@faker-js/faker");
const mysql =require('mysql2');
const path=require("path");
const method_overid=require("method-override");

app.use(method_overid("_method"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"/views"));
//app.set("public", path.join(__dirname,"/public"));
app.use(express.static(path.join(__dirname, 'public')));
const session = require('express-session'); 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');


// Session Middleware
app.use(session({
  secret: "your-secret-key",  // Change this to a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: {
      maxAge: 1000 * 60 * 60 * 24,  // Session valid for 24 hours (in milliseconds)
      secure: false,  // Set to true if using HTTPS
      httpOnly: true
  }
}));

app.use(flash());


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'delta_app',
    password: 'vishal@9146'
});


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

app.get("/login",(req,res)=>{
  res.render("login.ejs");
})


// Example route
app.get('/user/postpage', (req, res) => {
  if (!req.user) return res.redirect('/'); // Protect route
  console.log(`Welcome, ${res.locals.currUser.username}`);

  try{
    let q=`select * from user`;
    connection.query(q,(err,Alluser)=>{
      if(err)throw err;
      console.log(Alluser);
    res.render("postPage.ejs",{Alluser});  
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
});

//login user middleware
app.use((req, res, next) => {
  res.locals.currUser = req.session.currUser || null;
  next();
});


//home page rout and connection


  app.post("/login", (req, res) => {
    let { username, password } = req.body;

    let q = `SELECT * FROM user WHERE username = ?`;

    connection.query(q, [username], async (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.send("There is an error in the database");
        }

        if (result.length === 0) {
            // User does not exist
            console.log("User does not exist");
            req.flash( 'User not found');
            return res.redirect("/login");
        }

        let user = result[0]; // Get user data from database
        console.log(user)
        req.session.currUser = user;
        // Compare the entered password with the hashed password from the database
        let passwordMatch = password == user.password ;
        console.log(password)
        console.log(passwordMatch)
        if (passwordMatch) {
            // Store user in session
            req.session.currUser = user;
            res.locals.currUser = user;

            console.log("Login successful for:", user.username);
            try{
              let q=`select * from user`;
              connection.query(q,(err,Alluser)=>{
                if(err)throw err;
                console.log(Alluser);
              res.render("postPage.ejs",{Alluser});  
              });
            }
              catch(err){
                console.log("err");
                res.send("there is an err in the database");
              }
              return;
        }
        else {
            console.log("Incorrect password");
          
            return res.redirect("/login"); // Redirect back to login if password is incorrect
        }
    });
});




app.get("/",(req,res)=>{
  
let q=`select count(*) from user`;
  try{
    connection.query(q,(err,result)=>{
      if(err)throw err;
      let count=result[0] ["count(*)"];
     res.render("home.ejs",{count});
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
});

//add new user in delta
app.get("/user/add_new_user",(req,res)=>{
  res.render("add_user.ejs");
});

//add the user to database
app.post("/user_in_db",(req,res)=>{
  let {username,email,password,password2}=req.body;
  if (password !== password2) {
    res.send("Both passwords are not the same");
    return;
  }
  
  //console.log(name,gmail,password);
  let id=faker.string.uuid();
  let q=`insert into user (id,username,email,password)values(?,?,?,?)`;
  let values=[id,username,email,password];
  connection.query(q,values,(err,result)=>{
    try{
      if(err)throw err;
     
    console.log(result);
   res.redirect("/user");
    }
    catch(err){
      if(err.code == 'ER_DUP_ENTRY'){
        res.status(400).json({message:'duplicate entry on username or email plese try again'});
      }
      console.log(err);
    }

  })

});

//print user 
app.get("/user",(req,res)=>{
  try{
    let q=`select * from user`;
    connection.query(q,(err,user)=>{
      if(err)throw err;
    res.render("showuser.ejs",{user});  
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
})

//edit rout

app.get("/user/:id/edit",(req,res)=>{
  let{id}=req.params;

  // console.log(id);

  try{
    let q=`select * from user where id='${id}'`;
    connection.query(q,(err,result)=>{
      if(err)throw err;
      let user=result[0];
      console.log(user);
    res.render("edit.ejs",{user});  
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
});

//UPDATE IN DB

app.patch("/user/:id/update",(req,res)=>{

  let{id}=req.params;
  let q=`select * from user where id='${id}'`;
  let {username:newusername,password:newpassword}=req.body;
  try{
   
    connection.query(q,(err,result)=>{
      if(err)throw err;
      let user=result[0];
      
      if(newpassword != user.password){
        res.send("wroung password");
      }
      else{
             let q2=`update user set username="${newusername}"where id='${id}'`;
             
             try{
              connection.query(q2,(err,result)=>{
                if(err)throw err;
               res.redirect("/user");
              });
             }
             catch(err){
              console.log("the err in js or db",err);
             }
          }
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
});



app.delete("/user/delete/deleted", (req, res) => {
  let {newpassword } = req.body;

  console.log("in this we are printing user id",newpassword);
 
  let q=`SELECT * FROM user WHERE password = '${newpassword}'`;
  connection.query(q,(err,result)=>{
    try{
      if(err)throw err;
        console.log("the result in try box",result);
     
        let user=result[0];
        console.log(user);
  if (newpassword === user.password) {
    let q_del = `DELETE FROM user WHERE id = ? AND password = ?`;
    connection.query(q_del, [user.id, newpassword], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error deleting user");
      }

      console.log(result);
      return res.redirect("/user");
    });
  }    
  else {
    return res.status(401).send("Password does not match");
  }      
    }
    catch(err)
    {
      console.log(err);
    }
  })
})
  
  //login


//newpost 
app.get("/user/newpost",(req,res)=>{
  let {id}=req.params;
res.render("addpost.ejs",id);

})
//save message
app.get("/user/message/:message", (req, res) => {
  let msg = req.query.msg;
  // Get message from URL parameter
  console.log("Message:     msg=", msg);
  console.log("name :",msg);
  console.log("Current User in session:", req.session.currUser);

  let user = req.session.currUser;
  
  // Check if the user is logged in
  if (!user) {
      return res.status(401).send("User not logged in");
  }

  // Query to find user in the database by user ID
  let qd = "SELECT * FROM user WHERE id = ?";
  
  connection.query(qd, [user.id], (err, result) => {
      if (err) {
          console.error("Database error:", err);
          return res.send("Error retrieving user data");
      }

      if (result.length > 0) {
          let userId = result[0].id; // Retrieve the user ID
          console.log("User ID:", userId);

          // Update the 'message' column for the logged-in user
            let updateQuery = "UPDATE user SET message = ? WHERE id = ?";
          
          connection.query(updateQuery, [msg, userId], (updateErr, updateResult) => {
              if (updateErr) {
                  // console.error("Error updating message:", updateErr);
                  return res.send("Error saving message");
              }

              // console.log("Message updated successfully:", updateResult);
              // res.send("msg has added");
              res.send("message added to your profile");


          });

      } else {
          res.status(404).send("User not found");
      }
  });
});

//all user post page
app.post("/user/postpage",async (req,res)=>{
  try{
    let q=`select * from user`;
    connection.query(q,(err,Alluser)=>{
      if(err)throw err;
     // console.log(Alluser);
    res.render("postPage.ejs",{Alluser});  
    });
  }
    catch(err){
      console.log("err");
      res.send("there is an err in the database");
    }
})

//delete rout
app.get("/user/delete",(req,res)=>{
  let user = req.session.currUser;
  console.log("info of user",user);
  res.render("delete.ejs",{user});
})

//check password
app.post("/user/delete/record",(req,res)=>{
  let passwordComming=req.body.newpassword;
  console.log("comming password",passwordComming);
  let curruser = req.session.currUser;
  console.log("the password in db",curruser.password);
  if(curruser.password !== passwordComming){
    return res.send("Wroung password Try again");
  }
  let Id=curruser.id;
  let q = `DELETE FROM user WHERE id = ?`;
  connection.query(q,[Id],(err,result)=>{
   
    try
    {
      if(err)throw err;
     return res.redirect("/login");
      //console.log(result);
    }
    catch(err){
      console.log(err);
    }
  })
})
//logout session
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Error destroying session:", err);
          return res.send("Error logging out");
      }
      res.redirect("/login");  // Redirect to login page after logout
  });
});

app.get("*",(req,res)=>{
  res.send("page not found");
})
//listen port 
app.listen("8080",()=>{
  console.log("the server is lestining on port 8080");
})
// define local and try