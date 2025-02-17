
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
const { userInfo } = require("os");


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

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});


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
if (!req.session.currUser) return res.redirect('/login');
console.log("it is in currUser is = ",req.session.currUser)
let currUser=req.session.currUser;

  try{
    let q=`select * from user`;
    connection.query(q,(err,Alluser)=>{
      if(err)throw err;
     // console.log(Alluser);
    res.render("postPage.ejs",{Alluser,currUser});  
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
            req.flash( "error",'User not found');
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
               // console.log(Alluser);
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
        
            req.flash( "error",'Incorrect password');
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

//signup
app.post("/user_in_db",(req,res)=>{
  let {username,email,password,password2}=req.body;
 // console.log("line 167 user info ",username,email,password,password2);
 
  let usserInfo={username,email,password,password2}
  req.session.currUser=usserInfo;
 // console.log("line no 171",req.session.currUser);

  if (password !== password2) {
    req.flash("error","Bouth password must be same")
    res.redirect("/user/add_new_user")
    return;
  }
  let currUser=req.session.currUser;
  
  //console.log(name,gmail,password);
  let id=faker.string.uuid();
  let q=`insert into user (id,username,email,password)values(?,?,?,?)`;
  let values=[id,username,email,password];
  connection.query(q,values,(err,result)=>{
    try{
      if(err)throw err;
     
   // console.log(result);
    try{
      let q=`select * from user`;
      connection.query(q,(err,Alluser)=>{
        if(err)throw err;
       // console.log(Alluser);
      res.render("postPage.ejs",{Alluser,currUser});  
      });
    }
      catch(err){
        console.log("err");
        res.send("there is an err in the database");
      }
    }
    catch(err){
      if(err.code == 'ER_DUP_ENTRY'){
        req.flash("error","username must be diffrent")
        res.redirect("/user/add_new_user")
       // res.status(400).json({message:'duplicate entry on username or email plese try again'});
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
      // console.log(user);
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
  console.log("line no 344",user)
  // Check if the user is logged in
  if (!user) {
      return res.status(401).send("re login");
  }

  // Query to find user in the database by user ID
  let qd = "SELECT * FROM user WHERE username = ?";
  
  connection.query(qd, [user.username], (err, result) => {
      if (err) {
          console.error("Database error:", err);
          return res.send("Error retrieving user data");
      }
      console.log("line no 358",result)
      if (result.length > 0) {
          let username= result[0].username; // Retrieve the user ID
          console.log("User ID:", username);

          // Update the 'message' column for the logged-in user
            let updateQuery = "UPDATE user SET message = ? WHERE username = ?";
          
          connection.query(updateQuery, [msg, username], (updateErr, updateResult) => {
              if (updateErr) {
                  // console.error("Error updating message:", updateErr);
                  return res.send("Error saving message");
              }

              // console.log("Message updated successfully:", updateResult);
              // res.send("msg has added");
          res.redirect("/user/postpage")
            //  res.send("Message updated successfully:");


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
// app.get("/user/postpage",async (req,res)=>{
//   try{
//     let q=`select * from user`;
//     connection.query(q,(err,Alluser)=>{
//       if(err)throw err;
//      // console.log(Alluser);
//     res.render("postPage.ejs",{Alluser});  
//     });
//   }
//     catch(err){
//       console.log("err");
//       res.send("there is an err in the database");
//     }
// })

//delete rout
app.get("/user/delete",(req,res)=>{
  let user = req.session.currUser;
  console.log("info of user",user);

   res.render("delete.ejs",{user});
})

// //check password
app.post("/user/delete/record",(req,res)=>{
  console.log("we are in the line 438")
  let passwordComming=req.body.newpassword;
  console.log("comming password",passwordComming);
  
  let curruser = req.session.currUser;
  console.log("the lin 442 ",curruser);
  if(curruser.password !== passwordComming){
    req.flash("error","wroung password Try again")
    return res.redirect("/user/delete");// we have to use flash hear 
  }
  let usernamee=curruser.username;
  let msg="";
  let q = `UPDATE  user SET message = ? WHERE username = ?`;
    connection.query(q,[msg,usernamee],(err,result)=>{
   
    try
    {
      if(err)throw err;
      console.log(result)
     return res.redirect("/user/postpage");
      //console.log(result);
    }
    catch(err){
      console.log(err);
    }
  })
})

//deleteMsg
// app.get("/deleteMsg",(req,res)=>{
// console.log(req.params);
// })
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

app.get("/user/account",(req,res)=>{
  let currUser=req.session.currUser;
  console.log("account",currUser);
  res.render("account.ejs",{currUser});

})


// accounts forms

app.get("/user/editusername/:name",(req,res)=>{
  console.log(req.params);
  res.send("working to editusername");
})


app.get("/user/addgmail/:name",(req,res)=>{
  console.log(req.params);
  res.send("working to user gmail");
})

app.get("/user/changepassword/:name",(req,res)=>{
  console.log(req.params);
  res.send("working to change password");
})

app.get("/user/feedback/:name",(req,res)=>{
  console.log(req.params);
  res.send("working to feedback");
})






app.get("*",(req,res)=>{
  res.send("page not found");
})
//listen port 
app.listen("8080",()=>{
  console.log("the server is lestining on port 8080");
})
//user_in_db