const mongoose=require("mongoose")


//no need to connect allredy connect
const postSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }   ,
    Dte:{
        type:Date,default:Date.now
    },
    content:String,
 
        likes:[{type:mongoose.Schema.Types.ObjectId,ref:"user"

        }]
})

module.exports=mongoose.model("post",postSchema)