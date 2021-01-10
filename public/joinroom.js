


function joinroom (roomName,userr) {
    console.log(userr);
   // document.querySelector('.curr-room-text').innerText=`${roomName}`;
    nsSocket.emit('joinroom',roomName,(Member)=>{
        console.log(Member);
        var x =document.querySelector('.curr-room-text');
        x.innerHTML='';
        console.log(roomName);
        x.innerHTML+= `<div> <span class='rmtitle'> ${roomName}</span> <a class='rmedit' href='${userr}/room/${roomName}'> EDIT </a> </div>`;
    });
    nsSocket.once('historycatchup',(data)=>{

        console.log(roomName);
       const history=data.data;
       const chat=data.chat;
       const name=data.user;
       const owner=data.owner;
       const aliases=data.alias;
        const messagesUl = document.querySelector('#messages');
        messagesUl.innerHTML="";
        console.log(history);
        if(name==owner){
          var x = document.querySelector('.newa');
          x.style.display='inline';
        }
        else{
            var x = document.querySelector('.newa');
          x.style.display='none';
        }
        history.forEach((msg)=>{
            var dp='none';
            if(name==msg.username || name==owner){
                dp='block';
            }
            var sendu=msg.username;
            if(msg.username==undefined) sendu="Manas";
            const newMsg = buildHTML(msg,dp,sendu);
            messagesUl.innerHTML+=newMsg;
        })
        chat.forEach((msg)=>{
            var dp='none';
            if(name==msg.username || name==owner){
                dp='block';
            }
            var sendu=msg.username;
            if(msg.username==undefined) sendu="Manas";
            const newMsg = buildHTML(msg,dp,sendu);
            messagesUl.innerHTML+=newMsg;
        });
  
        
        const friendUl=document.querySelector('.friend-list');
        friendUl.innerHTML="";
        aliases.forEach((friend)=>{
            var dp='none';
            var wd='29px';
            if(friend==name || name==owner){
                dp='block';
                wd='0px';
            }
            if(friend==owner) {dp='none'; wd='29px'; }
            friendUl.innerHTML+=`
            <li class='friend'>
            <form action='/${userr}/alias/${friend}?_method=DELETE' method='POST'>
            <button style='display:${dp}' class='frdlt'> &#10006;     </button>
            </form>
            <span style='margin-left:${wd}'>
            ${friend}</span></li>`
        });
        messagesUl.scrollTo(0,messagesUl.scrollHeight);
    });
    nsSocket.on('updatemembers',(numMembers)=>{
    //    console.log(numMembers,'s');
    var x =document.querySelector('.curr-room-text');
    x.innerHTML='';
    x.innerHTML+= `<div> <span class='rmtitle'> ${roomName}</span> <a class='rmedit' href='${userr}/room/${roomName}'> EDIT </a></div>`;     
    console.log(roomName);
     //   document.querySelector('.curr-room-text').innerText = `${roomName}`;
    });

  
    

}