var mongoose=require("mongoose");

var roomschema=new mongoose.Schema({
   roomId:Number,
   namespace:String,
   roomTitle:String,
   username:String,
   data:[{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Chat'
  }],
  alias:Array
   
});

module.exports=mongoose.model("Rooom",roomschema);