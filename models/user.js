const mongoose=require("mongoose")
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

const userSchema=mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    password:String,
    posts:[
            {type:mongoose.Schema.Types.ObjectId,ref:"post"}
    ]
})

module.exports=mongoose.model("user",userSchema)