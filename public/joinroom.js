function joinroom (roomName) {
    document.querySelector('.curr-room-text').innerText=`${roomName}`;
    nsSocket.emit('joinroom',roomName,(Member)=>{
        console.log(Member);
        document.querySelector('.curr-room-text').innerHTML = `${roomName}`;
    });
    nsSocket.once('historycatchup',(data)=>{

   console.log('Called Room');
       const history=data.data;
       const chat=data.chat;
       const aliases=data.alias;
        const messagesUl = document.querySelector('#messages');
        messagesUl.innerHTML="";
        
        history.forEach((msg)=>{
            const newMsg = buildHTML(msg);
            messagesUl.innerHTML+=newMsg;
        })
        chat.forEach((msg)=>{
            const newMsg = buildHTML(msg);
            messagesUl.innerHTML+=newMsg;
        })
        const friendUl=document.querySelector('.friend-list');
        friendUl.innerHTML="";
        aliases.forEach((friend)=>{
          
            friendUl.innerHTML+=`<li class='friend'>${friend}</li>`
        });
        messagesUl.scrollTo(0,messagesUl.scrollHeight);
    });
    nsSocket.on('updatemembers',(numMembers)=>{
    //    console.log(numMembers,'s');
        document.querySelector('.curr-room-num-users').innerHTML = `${numMembers}<span class='icon'></span>`;
        document.querySelector('.curr-room-text').innerText = `${roomName}`;
    });
    

}