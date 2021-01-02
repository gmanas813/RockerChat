var mongoose=require("mongoose");

var nsschema=new mongoose.Schema({
   id:Number,
   endpoint:String,
   nsTitle:String,
   img: String,
   rooms:[{
       type: mongoose.Schema.Types.ObjectId,
       ref:'Rooom'
   }]
});

module.exports=mongoose.model("NS",nsschema);