var mongoose=require("mongoose");

var chatschema=new mongoose.Schema({
   username:String,
   msg:String,
   time:Date
});

module.exports=mongoose.model("Chat",chatschema);