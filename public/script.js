const username="";
const socket = io('/',{
    query:{username}
});

let nsSocket = '';
socket.on('nslist',(nsData)=>{
    let namespacesDiv= document.querySelector('.namespaces');
    namespacesDiv.innerHTML='';

    nsData.forEach((ns)=>{
        console.log(String(ns.endpoint));
        namespacesDiv.innerHTML+=`<div class='namespace' ns=${ns.endpoint}> <img src="${ns.img}"> </div> `
    }) 
    Array.from(document.getElementsByClassName('namespace')).forEach((elem)=>{
        elem.addEventListener('click',(e)=>{
            const nsEnd= elem.getAttribute('ns');
//            console.log(nsEnd);
            joinns(nsEnd);
        })
    })
     joinns('/sample');
})
