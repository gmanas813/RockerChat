const express=require('express');
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var passport=require("passport");
var bodyparser=require("body-parser");
var User=require("./models/user.js");
var Rooom = require("./models/room");
var Chat = require("./models/chat");
var methodOverride = require('method-override');
var NS=require("./models/namespace");
const app=express();
const path  = require('path');
 var {chatList}= require('./data');
const socketio = require('socket.io');
app.use(express.static(__dirname+'/public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride("__method"));
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
const server = app.listen(process.env.PORT);
//const server = app.listen(3000);
const io = socketio(server);

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

app.get('/:user/chat',isloggedin,async function(req,res){
 // console.log('AGAIn');
  try{
    namespaces=await NS.find({});
   
    if(namespaces){    namespaces.forEach(async (namespace)=>{
         const username = req.params.user;
         const rooms= namespace.rooms;
         let roomss=[];
         let Chats ={};
         rooms.map(rm=>{
          Rooom.findById(rm).then( room=> {//console.log(rom);
           // const room = rom[0];

       
           if(room.username==username || room.alias.includes(username) ){
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
         
         nsSocket.emit('nsroomload',{rmd:roomss,user:username});
  
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
           if(friends.includes(username)==false){
             friends.push(username);
           }
           if(friends.includes(nsRoom.username)==false){
            friends.push(nsRoom.username);
          }
           nsSocket.emit('historycatchup',{data:chatData,chat:chat,alias:friends,user:username,owner:nsRoom.username});
      
           updateUsers(namespace,roomName);
      }
         })
         
        nsSocket.on('newmessagetoserver',async (data)=>{
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
       await Rooom.find({'roomTitle':roomTitle}).then(room=>{
           Chat.create({
            msg:msg, time:Date.now(), username:username
           },function(err,chat){
            room[0].data.push(chat);
            room[0].save();
           })
           
         })


         io.of(namespace.endpoint).to(roomTitle).emit('messagetoclient',fullmsg);
     //   nsSocket.broadcast.emit('messagetoclient',msg);
     //  res.redirect(`/${req.params.user}/chat`);
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
  res.render('chat.ejs',{user:req.params.user});
});


// room create



app.post('/:user/create',function(req,res){
  const rmTtitle = req.body.roomTitle;
 var ct = Rooom.countDocuments({roomTitle:rmTtitle}).limit(1);
if(ct>0)
 console.log('ALready');
 else {
  Rooom.create({
    roomTitle:rmTtitle,
    roomId:1,
    namespace:'Sample',
    username:req.params.user,
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
  res.redirect(`/${req.params.user}/chat`);
})

// create alias


app.post('/:user/alias',function(req,res){
  const name=req.body.username;
  const user=req.params.user;
  Rooom.find({roomTitle:curRoom},function(err,rom){
    const room = rom[0];
    if(user==room.username && !room.alias.includes(name))
    room.alias.push(name);
    room.save();
  
  });
  
  res.redirect(`/${req.params.user}/chat`);
})

// removing alias

app.post('/:us/alias/:user',function(req,res){
    const user=req.params.user;
    Rooom.find({roomTitle:curRoom},function(err,rom){
      if(!err){
        const room=rom[0];
        if(room.username!=user){
          var i= room.alias.indexOf(user);
      room.alias.splice(i,1);
      room.save();
        }
      }
    })
    res.redirect(`/${req.params.us}chat`);
})

// edit room

app.get('/:user/room/:roomName',function(req,res){

  res.render('roomedit.ejs',{roomName:req.params.roomName,user:req.params.user});
})


app.post('/:user/room/:roomName',function(req,res){
  var newName=req.body.roomName;
  var old = req.params.roomName;
  Rooom.find({roomTitle:old},function(err,rom){
    if(!err){
    const room=rom[0];

    room.roomTitle=newName;
    room.save();
    }
  });
  res.redirect(`/${req.params.user}/chat`);
})

app.post('/:user/rooms/:roomName',function(req,res){
console.log(req.params.roomName);
  Rooom.find({roomTitle:req.params.roomName},function(err,rom){
    if(!err){
    const room=rom[0];
    console.log(room);
     if(room){
  Rooom.findByIdAndRemove(room._id,function(err){
    if(!err){

      NS.find({nsTitle:'Sample'},function(err,nss){
        const ns=nss[0];
        var i= ns.rooms.indexOf(room._id);
      ns.rooms.splice(i,1);
      ns.save();
      })
    }
  })
}
    }
  });
 
  res.redirect(`/${req.params.user}/chat`);
})

function updateUsers(namespace,roomName){
var numClients=3;
io.of(namespace.endpoint).in(roomName).emit('updatemembers',numClients);
}

// deleting and updating messages

app.post('/:user/chat/:id',function(req,res){
  console.log(req.params.id);
  if(req.params.id){
  Chat.findByIdAndRemove(req.params.id,function(err){
    if(err){
      console.log(err);
    }

  })
  Rooom.find({roomTitle:curRoom},function(err,rom){
    if(!err){
      const room=rom[0];
      var i= room.data.indexOf(req.params.id);
      room.data.splice(i,1);
      room.save();
    }
  })
}
res.redirect(`/${req.params.user}/chat`);
});

app.post('/:user/chats/:id',function(req,res){
  const mid=req.params.id;
  const msg=req.body.msg;
  const fullmsg={
    msg:msg, time:Date.now(), username:req.params.user
  };
  Chat.findByIdAndUpdate(mid,fullmsg,function(err){
    if(!err){
      res.redirect(`/${req.params.user}/chat`);
    }
  })
})


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
 

   passport.authenticate("local")(req, res, function(){
    res.redirect(`/${req.body.username}/chat`); 
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
  res.redirect(`/${req.body.username}/chat`); 
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