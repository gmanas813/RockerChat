const username="";
const socket = io('/',{
    query:{username}
});

let nsSocket = '';
socket.on('nslist',(nsData)=>{
    let namespacesDiv= document.querySelector('.namespaces');
    namespacesDiv.innerHTML='';

    nsData.forEach((ns)=>{
      //  console.log(String(ns.endpoint));
        namespacesDiv.innerHTML+=`<div class='namespace' ns=${ns.endpoint}> <img src="${ns.img}"> </div> `
    })
    
    var tit=['R','O','C','K','E','R','C','H','A','T'];
    tit.forEach(val=>{
        namespacesDiv.innerHTML+=`<span class='titlens'> ${val} </span> `
    });
    Array.from(document.getElementsByClassName('namespace')).forEach((elem)=>{
        elem.addEventListener('click',(e)=>{
            const nsEnd= elem.getAttribute('ns');
//            console.log(nsEnd);
            joinns(nsEnd);
        })
    })
     joinns('/sample');
})

var aliasel=document.querySelector('.newa');
var elemdi = document.querySelector('.aliasform');
aliasel.addEventListener('click',(e)=>{
    if(elemdi.style.display=='block')
    elemdi.style.display='none';
    else elemdi.style.display='block';
})
var roomel=document.querySelector('.newr');
var elemdis = document.querySelector('.roomform');
roomel.addEventListener('click',(e)=>{
    if(elemdis.style.display=='block')
    elemdis.style.display='none';
    else elemdis.style.display='block';
})

