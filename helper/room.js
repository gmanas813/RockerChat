class Room {
    constructor(roomId,roomTitle,namespace,pvt=false){
        this.roomId=roomId;
        this.roomTitle=roomTitle;
        this.namespace=namespace;
        this.pvt=pvt;
        this.history = [];
    }
    addMessage(message){
        this.history.push(message);
    }
    clearHistory(){
        this.history=[];
    }
}
module.exports=Room;