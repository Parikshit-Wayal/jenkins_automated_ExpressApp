// server.js
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

// Models
const usermodel = require("./models/user");
const postmodel = require("./models/post");

// Express app setup
const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Passport Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Express session
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check logged-in user
function loogedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    try {
        const data = jwt.verify(token, "shhh");
        req.user = data;
        next();
    } catch (err) {
        res.redirect("/login");
    }
}

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/index", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));

// Google OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
        try {
            const email = req.user.emails[0].value;
            let user = await usermodel.findOne({ email });

            if (!user) {
                user = await usermodel.create({
                    name: req.user.displayName,
                    email,
                    username: req.user.displayName.replace(/\s+/g, '').toLowerCase(),
                    password: "",
                    age: null
                });
            }

            const token = jwt.sign({ email: user.email, userid: user._id }, "shhh");
            res.cookie("token", token, { httpOnly: true });
            res.redirect("/profile");
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
        }
    }
);

// User profile
app.get("/profile", loogedIn, async (req, res) => {
    const user = await usermodel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user });
});

// Post CRUD
app.post("/post", loogedIn, async (req, res) => {
    const user = await usermodel.findOne({ email: req.user.email });
    const { content } = req.body;
    const post = await postmodel.create({ user: user._id, content });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.get("/delete/:id", loogedIn, async (req, res) => {
    await postmodel.findOneAndDelete({ _id: req.params.id });
    res.redirect("/profile");
});

app.post("/update/:id", loogedIn, async (req, res) => {
    await postmodel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });
    res.redirect("/profile");
});

app.get("/like/:id", loogedIn, async (req, res) => {
    const post = await postmodel.findOne({ _id: req.params.id });
    if (!post.likes.includes(req.user.userid)) {
        post.likes.push(req.user.userid);
    } else {
        post.likes = post.likes.filter(id => id.toString() !== req.user.userid);
    }
    await post.save();
    res.redirect("/profile");
});

// Auth with email/password
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await usermodel.findOne({ email });
    if (!user) return res.status(500).send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({ email: user.email, userid: user._id }, "shhh");
            res.cookie("token", token);
            res.redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

app.post("/register", async (req, res) => {
    const { username, name, email, age, password } = req.body;
    let user = await usermodel.findOne({ email });
    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = await usermodel.create({ username, name, email, age, password: hash });
            const token = jwt.sign({ email, userid: user._id }, "shhh");
            res.cookie("token", token);
            res.redirect("/login");
        });
    });
});

// Logout
app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// Start server
app.listen(3006, () => console.log("Server running on port 3006"));
// webhook test
// webhook trigger 2
