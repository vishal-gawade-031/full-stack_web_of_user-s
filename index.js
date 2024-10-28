
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

//home page rout and connection
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
  let {username,email,password}=req.body;
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

app.delete("/user/:id/delete",(req,res)=>{
let {id}=req.params;
let qd=`select * from user where id ='${id}'`;

connection.query(qd,(err,result)=>{

  let user=result[0];
  console.log(user);
  
  try
  {
    if(err)throw err;
    res.render("delete.ejs",{user});
    //console.log(result);
  }
  catch(err){
    console.log(err);
  }
})
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
  // console.log("we are printing the use ",user.username);

  // if (newpassword === user.password) {
  //   let q_del = `DELETE FROM user WHERE id = ? AND password = ?`;
  //   connection.query(q_del, [user.id, newpassword], (err, result) => {
  //     if (err) {
  //       console.log(err);
  //       return res.status(500).send("Error deleting user");
  //     }

  //     console.log(result);
  //     return res.redirect("/user");
  //   });
  // } else {
  //   return res.status(401).send("Password does not match");
  // }
});



//deleted
// app.delete("/user/delete/deleted",(req,res)=>{

//   let {user,newpassword}=req.body;

//   console.log(user);
//  // console.log(password);
//   if(newpassword === user.password){
//     let q_del=`delete from user where id = ? and password = ?`;
//     connection.query(q_del,[user.id,newpassword],(err,result)=>{
//       try{
//       if(err)throw err;
//       console.log(result);
//         res.redirect("/user");
//       }
//       catch(err){
//         console.log(err);
//       }
//     })
//   }
// });

//listen port 
app.listen("8080",()=>{
  console.log("the server is lestining on port 8080");
});




// //query

// let q="insert into user (id ,username,email,password)values ?";
// let data=[];

// for(let i=1;i<=100;i++){
//   data.push(random_user());
// }

//random_userr
// let random_user = () => {
//   return [
//      faker.string.uuid(),
//      faker.internet.userName(),
//      faker.internet.email(),
//      faker.internet.password(),
//   ];
// };
// console.log(random_user());

//connection

// try{
//   connection.query(q,[data],(err,result) => {
         
//       if(err)throw err;
//           console.log(result);
//       });
//       }
//       catch(err){
//           console.log(err);
//       }
  
//   connection.end();
  