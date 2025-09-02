const cookieParser = require("cookie-parser")
const express=require("express")
const app=express()
const path=require("path")
const mongoose=require("mongoose")
require('dotenv').config();
const usermodel =require("./models/user")
const postmodel =require("./models/post")
const { hash } = require("crypto")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const { read } = require("fs")
const { DefaultDeserializer } = require("v8")
const post = require("./models/post")

app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser())
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;


// 🔹 Express session (required for passport)
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔹 Passport config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  function (accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// 🔹 Routes
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const email = req.user.emails[0].value;

      // Check if user already exists
      let user = await usermodel.findOne({ email });

      if (!user) {
        // Create new user in DB
        user = await usermodel.create({
          name: req.user.displayName,
          email,
          username: req.user.displayName.replace(/\s+/g, '').toLowerCase(),
          password: "", // optional, since Google login
          age: null
        });
      }

      // Set JWT token
      const token = jwt.sign({ email: user.email, userid: user._id }, "shhh");
      res.cookie("token", token, { httpOnly: true });

      res.redirect("/profile");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
});


app.get("/delete/:id", loogedIn, async (req, res) => {
        let post = await postmodel.findOneAndDelete({ _id: req.params.id });

        res.redirect("/profile");

});

app.get('/index', (req, res) => {
    res.render('index'); // Assuming you have your index.ejs in the views folder
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