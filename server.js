const cookieParser = require("cookie-parser")
const express=require("express")
const app=express()
const path=require("path")
const mongoose=require("mongoose")
require('dotenv').config();

const usermodel =require("./models/user")
const postmodel =require("./models/post")
const { hash } = require("crypto")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const { read } = require("fs")
const { DefaultDeserializer } = require("v8")
const post = require("./models/post")

app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser())


app.get("/delete/:id", loogedIn, async (req, res) => {
        let post = await postmodel.findOneAndDelete({ _id: req.params.id });

        res.redirect("/profile");

});



app.get("/",(req,res)=>{
    res.render("index")
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/profile",loogedIn, async(req,res)=>{
  let user=  await usermodel.findOne({email:req.user.email}).populate("posts")
    res.render("profile",{user})
})
app.get("/edit/:id",loogedIn, async(req,res)=>{
  let post=  await postmodel.findOne({_id:req.params.id}).populate("user")
    res.render("edit",{post})
})
app.post("/update/:id",loogedIn, async(req,res)=>{
  let post=  await postmodel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
  res.redirect("/profile")
  

})


app.get("/like/:id",loogedIn, async(req,res)=>{
  let post=  await postmodel.findOne({_id:req.params.id}).populate("user")
  if(post.likes.indexOf(req.user.userid)===-1){
    post.likes.push(req.user.userid)
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
  }

    await post.save()
    res.redirect("/profile")
})
app.post("/post",loogedIn, async(req,res)=>{
  let user=  await usermodel.findOne({email:req.user.email})
  let {content}=req.body
   let post=await postmodel.create({
        user:user._id,
        content
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
})


app.post("/login",async(req,res)=>{
    let{email,password }=req.body;
    let user=await usermodel.findOne({email})
    if(!user) return res.status(500).send("something went wrong")
//checking the registered password and login password by comparing...and also token will send as cookies 
    //which have the info of email and user id in hash form
        bcrypt.compare(password,user.password,function(err,result){
            if(result){ 
                let token=jwt.sign({email:email,userid:user._id},"shhh");
                res.cookie("token",token);
                res.status(200).redirect("/profile");
            }
            else res.redirect("/login")
        })
       

})

app.post("/register",async(req,res)=>{
    let{username,name,email,age,password }=req.body;
    let user=await usermodel.findOne({email})
    if(user) return res.status(500).send("user allready register")

        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(password,salt,async(err,hash)=>{
               let user=  await usermodel.create({
                    username,
                    name,
                    email,
                    age,
                    password:hash
                })
                let token=jwt.sign({email:email,userid:user._id},"shhh");
                res.cookie("token",token);
                res.redirect("login")
            })
            })

})

app.get("/logout",(req,res)=>{
    res.cookie("token","")
    res.redirect("login")
})

function loogedIn(req,res,next){
    if(req.cookies.token==="")res.redirect("/login");
    else{
        let data=jwt.verify(req.cookies.token, "shhh")
        req.user=data;

        next()
    }
}


 




app.listen(3006)


//user can write post
//login and register`ih
//logout
//post creation
//post like karna
//post delete