
function joinns(endpoint){
  
    if(nsSocket){
        nsSocket.close();
        document.querySelector('#user-input').removeEventListener('submit',formsub)
    }
    nsSocket = io(endpoint);
 //   console.log(nsSocket);
    nsSocket.on('nsroomload',(nsRooms)=>{
     
        let roomList = document.querySelector('.room-list');
     
        roomList.innerHTML='';
      //  console.log(nsRooms,'kl');
       
        nsRooms.forEach((room)=>{
          
            roomList.innerHTML+=`<li class='room'>${room.roomTitle}</li>`
        })
        let roomNodes= document.getElementsByClassName('room');
        Array.from(roomNodes).forEach((element)=>{
            element.addEventListener('click',(e)=>{
                joinroom(e.target.innerText);
            })
        })

        const toproom = document.querySelector('.room');
//        console.log(toproom);
       const roomname = toproom.innerText;
       joinroom(roomname);
    });
    nsSocket.on('messagetoclient',(msg)=>{
  //     console.log(msg);
        const newmsg=buildHTML(msg);
        document.querySelector('#messages').innerHTML+=newmsg;
       
      
    })
    document.querySelector('.message-form').addEventListener('submit',formsub);
}  
    function formsub(event){
    //    console.log('Called');
        event.preventDefault();
        const newmsg = document.querySelector('#user-message').value;
        nsSocket.emit('newmessagetoserver',{ msg: newmsg, sender_id: 'YOUR USER ID' });
    }

    function buildHTML(msg){
        const date = new Date(msg.time).toLocaleString();
        const newHTML = `<li> <div class="user-message"> <div class="time-message">${msg.username} <span>${date}</span> </div>
        <div class="message-text"> ${msg.msg} </div> </div>
        </li> 
        `;
        return newHTML;
    }