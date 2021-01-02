const express=require('express');
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var passport=require("passport");
var bodyparser=require("body-parser");
var User=require("./models/user.js");
var Rooom = require("./models/room");
var Chat = require("./models/chat");
var Q=require('q');
var NS=require("./models/namespace");
const app=express();
const path  = require('path');
 var {chatList}= require('./data');
const socketio = require('socket.io');
app.use(express.static(__dirname+'/public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require("express-session")({
  secret: "Rusty is the best and cutest dog in the world",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//var currentUser;
let namespaces=[];

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
   // currentUser=req.user;
    next();
 });
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const port=3000 || process.env.PORT;
const server = app.listen(3000 || process.env.PORT);
const io = socketio(server);
var usernamee="";
var curRoom="";
var mongoose = require('mongoose');
const Room = require('./helper/room.js');
const room = require('./models/room');
const { compile } = require('ejs');
mongoose.Promise = require('bluebird');
mongoose.set('debug',true);
//const connectdb = mongoose.connect("mongodb://127.0.0.1:27017/Users?readPreference=primary&ssl=false",{useNewUrlParser:true});
const connectdb = mongoose.connect("mongodb+srv://rocko:rockalways@rockershock-ptdgc.mongodb.net/Users?retryWrites=true&w=majority",{useNewUrlParser:true});

app.get('/',async function(req,res){
 try{
  namespaces=await NS.find({});
 }
 catch(err){
   console.log(err);
 }
  res.render('index.ejs'); 
})

    io.on('connection',  (socket)=>{
      
    console.log(' %s sockets connected', io.engine.clientsCount);

      let nsData = namespaces.map((ns)=>{
      return{
        img:ns.img,
        endpoint:ns.endpoint
      }
    });
 
     socket.emit('nslist',nsData);
     });

app.get('/chat',isloggedin,async function(req,res){
 // console.log('AGAIn');
  try{
    namespaces=await NS.find({});
   
    if(namespaces){    namespaces.forEach(async (namespace)=>{
         const username = usernamee;
         const rooms= namespace.rooms;
         let roomss=[];
         let Chats ={};
         rooms.map(rm=>{
          Rooom.findById(rm).then( room=> {//console.log(rom);
           // const room = rom[0];

       
           if(room.username==usernamee || room.alias.includes(usernamee) ){
            roomss.push(room);
            Chats[room.roomTitle]=[];
            room.data.forEach(chatid=>{
              Chat.findById(chatid).then(chat=>{
                Chats[room.roomTitle].push(chat);
              })
            })
            chatList[room.roomTitle]=[];
          }

          })
        });
        
        

       io.of(namespace.endpoint).once('connection',(nsSocket)=>{
      
        //  var roomss= Roomlist['Sample'];
         
         nsSocket.emit('nsroomload',roomss);
  
         nsSocket.on('joinroom',(roomName,Member)=>{
           
           const roomArray = Array.from(nsSocket.rooms);
           const roomLeave= roomArray[1];
           
      
           nsSocket.leave(roomLeave);
           updateUsers(namespace,roomLeave);
           nsSocket.join(roomName);
  
           const nsRoom = roomss.find((room)=>{ return room.roomTitle===roomName});
      if(nsRoom){    
          curRoom=nsRoom.roomTitle;
           let chat= chatList[nsRoom.roomTitle];
           let chatData = Chats[nsRoom.roomTitle];
           let friends= nsRoom.alias;
           if(friends.includes(usernamee)==false){
             friends.push(usernamee);
           }
           nsSocket.emit('historycatchup',{data:chatData,chat:chat,alias:friends});
      
           updateUsers(namespace,roomName);
      }
         })
         
        nsSocket.on('newmessagetoserver',(data)=>{
          const msg = data.msg;
         const fullmsg ={
          msg:msg, time:Date.now(), username:username
         };
         const roomArray = Array.from(nsSocket.rooms);
         const roomTitle=roomArray[1];
         const nsRoom = roomss.find((room)=>{ return room.roomTitle===roomTitle});
         if(nsRoom){
         chatList[nsRoom.roomTitle].push(fullmsg);
         //console.log(chatList[nsRoom.roomId]);
         Rooom.find({'roomTitle':roomTitle}).then(room=>{
           Chat.create({
            msg:msg, time:Date.now(), username:username
           },function(err,chat){
            room[0].data.push(chat);
            room[0].save();
           })
           
         })


         io.of(namespace.endpoint).to(roomTitle).emit('messagetoclient',fullmsg);
     //   nsSocket.broadcast.emit('messagetoclient',msg);
        }
        }) 
         
       nsSocket.on('disconnect',function(){
        nsSocket.removeAllListeners();
  //       console.log('disconnect');
       })
       })
       
     }) 
    }
  
  }
  catch (err){
    console.log(err);
  }
  res.sendFile(__dirname + '/public/chat.html');
});


// room create

app.get('/create',function(req,res){
  res.render('createroom.ejs');
})

app.post('/create',function(req,res){
  const rmTtitle = req.body.roomTitle;
 var ct = Rooom.countDocuments({roomTitle:rmTtitle}).limit(1);
if(ct>0)
 console.log('ALready');
 else {
  Rooom.create({
    roomTitle:rmTtitle,
    roomId:1,
    namespace:'Sample',
    username:usernamee,
    data:[]
  },function(err,room){
    if(!err){
      NS.find({nsTitle:'Sample'},function(err,found){
          if(!err){
        found[0].rooms.push(room);
        found[0].save(); 
        
        }
        });
    }
  });
  chatList[rmTtitle]=[];
 }
  res.redirect('/chat');
})

// create alias

app.get('/alias',function(req,res){
  res.render('alias.ejs');
});

app.post('/alias',function(req,res){
  const name=req.body.username;
  Rooom.find({roomTitle:curRoom},function(err,rom){
    const room = rom[0];
    if(usernamee==room.username && !room.alias.includes(name))
    room.alias.push(name);
    room.save();
  })
  res.redirect('/chat');
})


function updateUsers(namespace,roomName){
var numClients=3;
io.of(namespace.endpoint).in(roomName).emit('updatemembers',numClients);
}
//  auth part

app.get("/register",function(req, res) {
  res.render("register.ejs");
  
});

app.post("/register",async function(req,res){
var newUser = new User({
username: req.body.username,
email:req.body.email,
});
User.register(newUser, req.body.password,async function(err, user){
   if(err){
       console.log(err);
       return res.render("register.ejs");
   }
   usernamee=req.body.username ;

   passport.authenticate("local")(req, res, function(){
     res.redirect("/chat"); 
   }); 
});
});


app.get("/login",function(req, res) {
  res.render("login.ejs");
});

app.post("/login",passport.authenticate("local", { failureRedirect: '/login' })
// successRedirect : "/",
// failureRedirect : "/login"
,function(req,res){
  usernamee=req.body.username ;

  res.redirect('/chat');
});

app.get("/logout",isloggedin,function(req,res){
req.logout();
res.redirect("/");
}) ;


function isloggedin(req,res,next){
  if(req.isAuthenticated()){
   return next();
  }
 
  res.redirect("/");
 }


 app.get('/account',function(req,res){
   res.render('account.ejs');
 })


// NS.find({nsTitle:'Sample'},function(err,found){
//   if(!err){
//   Rooom.find({roomId:3},function(err,room){
// if(!err){

//     found[0].rooms.push(room[0]);
//     found[0].save();
// }
// else console.log(err);
//   })

// }
// });