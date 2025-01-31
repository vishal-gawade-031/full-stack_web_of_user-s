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