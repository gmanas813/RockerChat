let chatList={};
const NS=require('./models/namespace');
const Rooom=require('./models/room');
NS.find({}).then( ns=> {

   ns[0].rooms.map(rm=>{
      Rooom.findById(rm).then( room=> {
        chatList[room.roomTitle]=[];
        return room});
  })
 
});
module.exports= {chatList};
