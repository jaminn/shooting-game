var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('./'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var ids=[];
var nicks=[];
var hps =[];

var Rnicks=[];
var Rids=[];
var Rhps=[];


var count = 1;

var isStarted = false;
let change_interval;

//change_interval = setInterval(()=>{
//    if(isStarted){
//        io.sockets.emit('start',nicks);
//    }
//},1000);

io.on('connection', function(socket){
    let tmpNick = "P" + (count++);
    while(nicks.includes(tmpNick)){
        tmpNick = "P" + (count++);
    }
    let nickname = tmpNick;
    ids.push(socket.id);
    nicks.push(nickname);
    hps.push(300);
    
    socket.emit("get_nickname",nickname);
    
    
    console.log("__Conn__");
    console.log(socket.id);
    console.log("current Users:");
    console.log(ids);
    console.log("__ConnEND__\n");
    
    //console.log(io.sockets.adapter.rooms);
    
    socket.on('start_check',(debug)=>{
        //console.log(debug);        
        if(!isStarted){
            if(Rids.length >= 2){
                console.log('시작');
                console.log(nicks);
                socket.emit('start',Rnicks);
                socket.emit('init_hp',Rhps);
                isStarted = true;
            }
        }else{
            
            if(!Rids.includes(socket.id)){
                Rids.push(socket.id);
                Rnicks.push(nickname);
                Rhps.push(300);
            
                console.log(Rnicks);
                io.sockets.in('death match').emit('start',Rnicks);
                io.sockets.in('death match').emit('init_hp',Rhps);
            }else{
                io.sockets.in('death match').emit('start',Rnicks);
                io.sockets.in('death match').emit('init_hp',Rhps);    
            }   
        }
    });
    
    socket.on('change_nick',(nick)=>{
        console.log(nick);
        console.log(nicks);
        console.log(ids.indexOf(socket.id));
        
        if(nicks.indexOf(nick) !== -1 && nick !== nicks[ids.indexOf(socket.id)] ){//같아도 통과
            socket.emit('invalid_nick','이미 존재 합니다.');
        }else{
            socket.emit('valid_nick',nick);
            nicks.splice(ids.indexOf(socket.id),1,nick);
            socket.join('death match');
            
            if(!Rids.includes(socket.id)){
                Rids.push(socket.id);
                Rnicks.push(nick);
                Rhps.push(300);   
            }
        }
            
    });
    
    
    socket.on('restart_check',(debug)=>{
        //socket.leave('death match');
        //console.log(debug);     
        if(Rids.length < 2){
            console.log('restart|ONrestart_check');
            socket.emit('restart','restart:ONrestart_check');
            isStarted = false;
        }
    });
    
    socket.on('die_check', (debug)=> {
        console.log(debug);
        Rhps.splice(Rids.indexOf(socket.id),1);
        Rnicks.splice(Rids.indexOf(socket.id),1);
        Rids.splice(Rids.indexOf(socket.id),1);
        socket.in('death match').emit('start',Rnicks);
        socket.leave('death match');
    });
    
    socket.on('pass_mine',(mine)=>{
//        console.log('START|pass_mine');
//        console.log(mine);
//        console.log('END|pass_mine');
        socket.in('death match').emit('get_his',mine);
    });
    
    socket.on('pass_his_hpNick',(hpNick)=>{
        
//        console.log('START|pass_mine');
//        console.log(mine);
//        console.log('END|pass_mine');
        hps[nicks.indexOf(hpNick.nick)] = hpNick.hp;
        Rhps[Rnicks.indexOf(hpNick.nick)] = hpNick.hp;
        //console.log(hps);
        socket.in('death match').emit('get_my_hpNick', hpNick);
    });
    
    socket.on('pass_my_bullet',(bullet_cnt)=>{
//        console.log('START|pass_my_bullet');
//        console.log(bullet_cnt);
//        console.log('END|pass_my_bullet');
        socket.in('death match').emit('get_his_bullet',bullet_cnt);
    });
    

    socket.on('disconnect', function() {
        
        hps.splice(ids.indexOf(socket.id),1);
        nicks.splice(ids.indexOf(socket.id),1);
        ids.splice(ids.indexOf(socket.id),1);
        
        Rhps.splice(Rids.indexOf(socket.id),1);
        Rnicks.splice(Rids.indexOf(socket.id),1);
        Rids.splice(Rids.indexOf(socket.id),1);
        socket.leave('death match');
        
        io.sockets.in('death match').emit('start',nicks);
        
        console.log("__Exit__");
        console.log(socket.id);
        console.log("current Users:");
        console.log(ids);
        console.log(nicks);
        console.log("__ExitEND__\n");
        
    });
});


http.listen(process.env.PORT || 3000, function(){
  if(process.env.PORT){
      console.log('listening on *:'+process.env.PORT);
  }else{
      console.log('listening on *:3000');
  }
});