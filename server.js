var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('./'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var Clients=[];
var count = 1;


function get_client_nick(id){
    console.log(id);
    Clients.forEach((client,idx)=>{
        if(client.id == id){
            return client.nick;
        }
    });
}




io.on('connection', function(socket){
    let nickname = "P" + (count++);
    Clients.push({id:socket.id, nick:nickname});
    socket.emit("get_nickname",nickname);
    
    console.log("__Conn__");
    console.log(socket.id);
    console.log("current Users:");
    console.log(Clients);
    console.log("__ConnEND__");
    
    
    socket.on('start_check',(debug)=>{
        //console.log(debug);
        if(Clients.length >= 2){
            socket.emit('start',{players: Clients});
        }
    });
    
    socket.on('restart_check',(debug)=>{
        //console.log(debug);     
        if(Clients.length < 2){
            console.log('restart|ONrestart_check');
            socket.emit('restart','restart:ONrestart_check');
        }
    });
    
    socket.broadcast.on('pass_mine',(mine)=>{
//        console.log('START|pass_mine');
//        console.log(mine);
//        console.log('END|pass_mine');
        socket.broadcast.emit('get_his',mine);
    });
    
    socket.broadcast.on('pass_his_hp',(his_hp)=>{
//        console.log('START|pass_mine');
//        console.log(mine);
//        console.log('END|pass_mine');
        socket.broadcast.emit('get_my_hp',his_hp);
    });
    
     socket.broadcast.on('pass_my_bullet',(bullet_cnt)=>{
//        console.log('START|pass_mine');
//        console.log(mine);
//        console.log('END|pass_mine');
        socket.broadcast.emit('get_his_bullet',bullet_cnt);
    });
    

    socket.on('disconnect', function() {
        
        Clients.forEach((data,idx)=>{
            if(data.id == socket.id){
                Clients.splice(idx,1);
            }
        });
        
        console.log("__Exit__");
        console.log(socket.id);
        console.log("current Users:");
        console.log(Clients);
        console.log("__ExitEND__");
        
    });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});