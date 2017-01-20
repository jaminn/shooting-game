    var socket = io();

    let isStarted = false;

    let preStart_interval;
    let start_interval;
    let restart_interval;

    class ManagePlayers{
        constructor(){
            this.nicks = [];
            this.my;
        }
        setNicks(nicks,game){
            //console.log('__플레이어 변경__');
            let state = gameState;
            let player = state.player;
            
            if(this.nicks.length === 0){
                console.log('플레이어 초기화');
                this.nicks = nicks;
            }else{
                if(this.nicks.length < nicks.length){
                    console.log('플레이어 추가');
                    this.nicks = nicks; 

                    let x = parseInt(testMap.playerXYs[this.getInxLast()%testMap.playerXYs.length].x);
                    let y = parseInt(testMap.playerXYs[this.getInxLast()%testMap.playerXYs.length].y);
                    let inx = this.getInxLast()-1;

                    state.otherPs[inx] = new Player(game,x,y,this.nicks[this.getInxLast()]);
                    state.unitLayer.addChild(state.otherPs[inx]);
                    state.otherPs[inx].init_Timers(game);
                }else if(this.nicks.length > nicks.length){
                    console.log('플레이어 제거');
                    console.log(this.nicks);
                    console.log(this.nicks.diff(nicks));
                    console.log(state.otherPs);
                    console.log(state.unitLayer.children);
                    this.nicks.diff(nicks).forEach((nick)=>{
                        state.otherPs.forEach((p,inx)=>{
                            if(p.nick === nick)
                                state.otherPs.splice(inx,1);
                        });
                        state.unitLayer.children.forEach((ch,inx)=>{
                            if(ch.nick === nick)
                                state.unitLayer.children.splice(inx,1); 
                        });
                    });
                    
                    this.nicks = nicks;
                }else{
                    //console.log('플레이어 변경 X');
                }
            }
        }
        getNicks(){
            return this.nicks;
        }
        getOthers(){
            let tmpPlayers = [...this.nicks];
            tmpPlayers.splice(this.getMyInx(),1);
            return tmpPlayers;
        }
        setMy(p){
            this.my = p;
        }
        getMy(){
            return this.my;
        }
        getMyInx(){
            return this.getInx(this.my);
        }
        getInxLast(){
            return this.nicks.length-1;
        }
        getInx(p){
            return this.nicks.indexOf(p);
        }        
    }
    let manageP = new ManagePlayers();

    class Toggler{
        constructor(N){
            this.N = N;
            this.cnt =0;
        }
        test_toggle(){
            if(this.N == this.cnt){
                this.cnt = 0;
                return true;
            }else{
                this.cnt++;
                return false;
            }
        }
    }

    socket.on('get_nickname',(nick)=>{
        console.log("닉네임은:");
        console.log(nick);
        manageP.setMy(nick);
    });


    socket.on('start',(nicks)=>{
        if(!isStarted){
            manageP.setNicks(nicks,game);
            
            console.log("nicks 는?")
            console.log(nicks);
            
            game.states.change('mainGame');
            
            clearInterval(start_interval);
            start_interval = null;
            isStarted = true;

            
            if(!restart_interval){
                restart_interval = setInterval(()=>{
                    socket.emit('restart_check','restart_check_emitted');
                },1000);
            }
            
        }else{// 플레이어 추가 또는 삭제
            manageP.setNicks(nicks,game);
        }
    });

    socket.on('restart', (debug)=>{
        console.log(debug);
        clearInterval(restart_interval);
        restart_interval = null;
        isStarted = false;
        game.states.change('intro');
    });
    
    socket.on('init_hp',(hps)=>{
        gameState.unitLayer.children.forEach((P,inx)=>{
            P.mine_hp=hps[manageP.nicks.indexOf(P.nick)];
        });
    })

    socket.on('get_his', (data) =>{
    //        console.log('START|ONget_his');
    //        console.log(data);
    //        console.log('END|ONget_his');
        if(gameState.otherPs){
            gameState.otherPs.forEach((P,inx)=>{
                if(P.nick === data.nick){
                    P.his_past = clone(P.his);
                    P.his = data;
                    P.NoEmittedCnt = 0;
                }
            });   
        }
    });

    socket.on('get_my_hpNick', (hpNick) =>{
//        console.log('START|ONget_my_hp');
//        console.log(data);
//        console.log('END|ONget_my_hp');
        let player = gameState.player;
        let otherPs = gameState.otherPs;
        
        if(player.nick === hpNick.nick){
            player.mine_hp = hpNick.hp;  
        }else{
            if(otherPs){
                otherPs.forEach((P,inx)=>{
                    if(P.nick === hpNick.nick){
                        P.mine_hp = hpNick.hp;  
                    }
                });   
            }
        }
    });
    
    socket.on('get_his_bullet',(nick)=>{
        if(gameState.otherPs){
            gameState.otherPs.forEach((P,inx)=>{
                if(P.nick === nick){
                    P.his_wait_cnt++;
                }
            });
        }
    });

    function display_text(my_game,text="test",x=300, y=300,fillStyle="#fff",font="50px Dosis"){
        let label;
        label = new Light.Text();
        label.font = font;
        label.fillStyle = fillStyle;
        label.position.set(x,y);
        label.text = text;
        my_game.addChild(label);
        return label;
    }

    function display_img(my_game,img,x=100,y=100){
        let result_img = new Light.Sprite(game.asset.getImage(img));
        my_game.addChild(result_img);
        result_img.x= x;
        result_img.y= y;
        return result_img;
    };

    function make_rigid(my_game,image_name,x=100,y=200){
        let rigid = new Light.Sprite(game.asset.getImage(image_name));
        rigid.x = x;
        rigid.y = y;
        my_game.addChild(rigid);
        game.physics.add(rigid);
        rigid.body.isFixed = true;
        return rigid;
    }

    function coll_check(obj1,obj2){
        let obj1_bound = obj1.getBounds();
        let obj2_bound = obj2.getBounds();
        return obj1_bound.intersects(obj2_bound);
    }
    function checkImg(obj,img){
	   return img == obj.sprite.texture.src.replace(/^.*\/(.*?)\..*$/,"$1");
    }

    function change_sprite_inx(game, obj, img, inx){
        obj.removeChild(obj.sprite);
        obj.sprite = new Light.Sprite(game.asset.getImage(img));
        obj.addInxChild(inx,obj.sprite);
    }

    function change_sprite(game, obj, img){
        obj.removeChild(obj.sprite);
        obj.sprite = new Light.Sprite(game.asset.getImage(img));
        obj.addChild(obj.sprite);
    }

    function pass_mine(mine){
    //        console.log('START|pass_mine');
    //        console.log(mine);
    //        console.log('END|pass_mine');
        socket.emit('pass_mine',mine);
        //my_pos = pos;
    }

    function pass_bullet(nick){
        socket.emit('pass_my_bullet',nick);
    }

    function pass_his_hpNick(hp,nick){
        //console.log('START|pass_his_hp');
        //console.log(hp);
        //console.log('END|pass_his_hp');
        socket.emit('pass_his_hpNick',{hp:hp,nick:nick});
    }

    function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}
    
    Array.prototype.removeEle = function(ele) {
        this.splice(this.indexOf(ele), 1);
    }
    Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};
    
    var testMap = new MapMaker("map",testingMap);
    
    var game = new Light.Game('game', 1100, 600, '#282828', function (asset) {
        testMap.loadAll(asset);
        asset.loadImage('e1', 'image/enemy1.png');
        asset.loadImage('e2', 'image/enemy2.png');
        asset.loadImage('player', 'image/player.png');
        asset.loadImage('g1', 'image/ground1.png');
        asset.loadImage('g2', 'image/ground2.png');
        asset.loadImage('bullet', 'image/bullet.png');
        asset.loadImage('bullet2', 'image/bullet2.png');
        
        asset.loadImage('gunR', 'image/p1/p1Onehand_R.png');
        asset.loadImage('gunL', 'image/p1/p1Onehand_L.png');
        asset.loadImage('gunTwo', 'image/p1/p1Twohand.png');
        
        asset.loadImage('test','image/test.png');
        asset.loadAudio('gunfire', 'audio/gun.wav');
        asset.loadImage('arrow','image/arrow.png');
        
        asset.loadImage('p1Front','image/p1/p1Front.png');
        asset.loadImage('p1Right','image/p1/p1Right.png');
        asset.loadImage('p1Back','image/p1/p1Back.png');
        asset.loadImage('p1Left','image/p1/p1Left.png');
        
        asset.loadImage('p1FrontW1','image/p1/p1FrontW1.png');
        asset.loadImage('p1FrontW2','image/p1/p1FrontW2.png');
        asset.loadImage('p1RightW','image/p1/p1RightW.png');
        asset.loadImage('p1BackW1','image/p1/p1BackW1.png');
        asset.loadImage('p1BackW2','image/p1/p1BackW2.png');
        asset.loadImage('p1LeftW','image/p1/p1LeftW.png');
        
        asset.loadImage('backX','image/backX.jpg');
    });

    var introState = new Light.State(game);
    var gameState = new Light.State(game);
    var endState = new Light.State(game);

    introState.onInit = function () {
        isStarted = false;
        introState.children = [];
        gameState.children = [];
        endState.children = [];
        game.camera.children = [];
        manageP.nicks = [];

        this.addChild(new Light.Sprite(game.asset.getImage('backX')));
        display_text(this,"동팡 앗!",40,300,"#00f","100px Dosis");
        display_text(this,"창을 두개 이상 띄우셈",40,400,"#fff","30px Dosis");

        if(!start_interval){
            start_interval = setInterval(()=>{
                socket.emit('start_check','start_check_emitted');
            },1000);
        }

    };
    introState.onUpdate = function () {
    // 정보를 받아 올때 까지 기다림
    };

    class Unit extends Light.EntityContainer{
        constructor(imgSrc, speed) {
            super();
            this.sprite = new Light.Sprite(imgSrc);
            this.addChild(this.sprite);
            game.physics.add(this);
            this.body.maxVelocity.x = speed;
            this.body.maxVelocity.y = speed;
            this.body.isCollisionAllowed = false;
            this.speed = speed;

            this.width = this.sprite.width;
            this.height = this.sprite.height;
        }
    }

    class Player extends Unit {
        constructor(game,x,y,nickname,img='p1Front'){
            super(game.asset.getImage(img), 500);
            this.x = x;
            this.y = y;
            this.toggler = new Toggler(0);
            this.mine_hp = 300;
            this.nick = nickname;

            this.weapon = new Weapon();
            this.weapon.rotationCenter.x = 0;
            this.weapon.rotationCenter.y = 16;
            this.addChild(this.weapon);
            
            this.nickText = display_text(this,this.nick,0,20,"#fff","30px Dosis");
            this.hpText = display_text(this,"",0,-20,"#fff","30px Dosis");
            
            this.hpText;
            this.nickText;
            this.walkState = "stop";

            this.sprite.scaleCenter.x = this.width / 2;
            this.weapon.scaleCenter.y = 5;
            this.hp = 300;
            this.bullets = [];
            this.his={x: x, y: y, rot: 0, mousePos: new Light.Point(0,0), hp: 300};
            this.his_past={x: x, y: y, rot: 0, mousePos: new Light.Point(0,0), hp: 300};
            this.his_wait_cnt = 0;
            this.NoEmittedCnt = 1;
    
            this.key_up = Light.Keyboard.W;
            this.key_right= Light.Keyboard.D;
            this.key_down= Light.Keyboard.S;
            this.key_left= Light.Keyboard.A;

            this.mouse_key= Light.Mouse.LEFT;
        }
        
        syncHpXY(){
            let player = this;
            if(this.toggler.test_toggle()){
                pass_mine({nick:player.nick,
                           x: player.x,
                           y: player.y,
                           rot: player.weapon.rotation,
                           mousePos: game.camera.screenToLocal(game.input.mouse.position),
                           hp:player.hp});
            }// x,y,hp,각도 동기화
        }
        
        init_Timers(game){
            let player = this;
            let timerSpeed = 0.1;
        
            if (this.leftTimer) game.timers.splice(game.timers.indexOf(this.leftTimer), 1);
            if (this.rightTimer) game.timers.splice(game.timers.indexOf(this.rightTimer), 1);
            if (this.backTimer) game.timers.splice(game.timers.indexOf(this.backTimer), 1);
            if (this.frontTimer) game.timers.splice(game.timers.indexOf(this.frontTimer), 1);

            this.leftTimer = new Light.Timer(game, timerSpeed, -1, ()=>{
                this.frontTimer.pause();
                this.rightTimer.pause();
                this.backTimer.pause();  
                
                if(!checkImg(player,"p1LeftW")){
                    change_sprite_inx(game, player,"p1LeftW",0);
                   }else{
                    change_sprite_inx(game, player,"p1Left",0);
                   }
            });

            this.frontTimer = new Light.Timer(game, timerSpeed, -1, ()=>{
                this.leftTimer.pause();
                this.rightTimer.pause();
                this.backTimer.pause();

                if(!checkImg(player,"p1FrontW1")){
                    change_sprite_inx(game, player,"p1FrontW1",0);
                }else{
                    change_sprite_inx(game, player,"p1FrontW2",0);
                }
            });

            this.rightTimer = new Light.Timer(game, timerSpeed, -1, ()=>{
                 this.leftTimer.pause();
                 this.frontTimer.pause();
                 this.backTimer.pause();

                if(!checkImg(player,"p1RightW")){
                    change_sprite_inx(game, player,"p1RightW",0);
                }else{
                    change_sprite_inx(game, player,"p1Right", 0);
                }

            });

            this.backTimer = new Light.Timer(game, timerSpeed, -1, ()=>{
                this.leftTimer.pause();
                this.frontTimer.pause();
                this.rightTimer.pause();

                if(!checkImg(player,"p1BackW1")){
                    change_sprite_inx(game, player,"p1BackW1",1);
                }else{
                    change_sprite_inx(game, player,"p1BackW2",1);
                }

            });

            this.backTimer.start();
            this.rightTimer.start();
            this.frontTimer.start();
            this.leftTimer.start();

            this.backTimer.pause();
            this.rightTimer.pause();
            this.frontTimer.pause();
            this.leftTimer.pause();
        }
        
        mineHpChange(){
            let player = this;
            let mine_hp = this.mine_hp;
            //HP 처리
            if(player.hp !== mine_hp){
                player.hpText.alpha = 1;
                game.camera.shake(0.1, 3, 15, 15);
                player.hp = mine_hp;
            }

            if (player.hp <= 0) {
                game.states.change('end');
                socket.emit('die_check',"죽었습니다.");
            }

            else if (player.hp < 90) player.hpText.fillStyle = '#f00';
            else if (player.hp < 180) player.hpText.fillStyle = '#ffba00';
            else player.hpText.fillStyle = '#fff';// HP관련
            
            player.hpText.text = 'HP ' + ((player.hp / 300) * 100).toFixed(2) + '%';
            player.hpText.alpha += (0.4 - player.hpText.alpha) / 15;
        }
        
        otherHpChange(){
            let player = this;
            let mine_hp = this.mine_hp;
            //HP 처리
            if(player.hp !== mine_hp){
                player.hpText.alpha = 1;
                //game.camera.shake(0.1, 3, 15, 15);
                player.hp = mine_hp;
            }

//            if (player.hp <= 0) {
//                player.hp = 0;
//                game.camera.removeChild(player.hpText);
//                game.states.change('end');
//            }

            else if (player.hp < 90) player.hpText.fillStyle = '#f00';
            else if (player.hp < 180) player.hpText.fillStyle = '#ffba00';
            else player.hpText.fillStyle = '#fff';// HP관련
            
            player.hpText.text = 'HP ' + ((player.hp / 300) * 100).toFixed(2) + '%';
            player.hpText.alpha += (0.4 - player.hpText.alpha) / 15;
        }
        
        faceMouse(game){
            let player = this;
            let localMousePos = game.camera.screenToLocal(game.input.mouse.position);
            let mouseRot = player.getBounds().getCenter().getRotation(localMousePos);// 무기 위치&각도
            this.faceSomething(game,mouseRot);
        }
        
        faceSomething(game,someRot){
            let player = this;
            let w = player.weapon;
            w.x = 17 ;
            w.y = 20 ;
            w.rotation = someRot;
            
            if (w.isRightFaced()) {
                    w.changeLoaded(game,'gunR');
                    if(player.walkState != "stop"){
                        this.rightTimer.resume();
                    }else{
                        this.rightTimer.pause();
                        change_sprite_inx(game, player,"p1Right",0);
                    }
                }else if (w.isFrontFaced()) {
                    w.changeLoaded(game,'gunTwo');
                    if(player.walkState != "stop"){
                        this.frontTimer.resume();
                    }else{
                        this.frontTimer.pause();
                        change_sprite_inx(game, player,"p1Front",0);
                    }
                }else if (w.isBackFaced()) {
                    w.changeLoaded(game,'gunTwo');
                    if(player.walkState != "stop"){
                        this.backTimer.resume();
                    }else{
                        this.backTimer.pause();
                        change_sprite_inx(game, player,"p1Back",1);
                    }
                }else {
                    w.changeLoaded(game,'gunL');
                    if(player.walkState != "stop"){
                        this.leftTimer.resume();
                    }else{
                        this.leftTimer.pause();
                        change_sprite_inx(game, player,"p1Left",0);
                    }
                }//마우스에 따른 무기&캐릭터 방향 설정
        }
        
        keyControl(game,pre_elapsed){
            let player = this;
            let elapsed
            if(pre_elapsed > 0.05){
                elapsed = 0.05;
            }else{
                elapsed = pre_elapsed;
            }
            //console.log("elapsed :"+elapsed)
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            player.walkState = "stop";
                if (game.input.keyboard.isPressed(player.key_left)) {
                    player.walkState = "left";
                    //player.x -= player.speed * elapsed;
                    player.body.velocity.x = -1*(player.speed * elapsed);
                }
                if (game.input.keyboard.isPressed(player.key_right)) {
                    player.walkState = "right";
                    //player.x += player.speed * elapsed;
                    player.body.velocity.x = (player.speed * elapsed);
                }
                if (game.input.keyboard.isPressed(player.key_up)) {
                    player.walkState = "up";
                    //player.y -= player.speed * elapsed;
                    player.body.velocity.y = -1*(player.speed * elapsed);
                }
                if (game.input.keyboard.isPressed(player.key_down)) {
                    player.walkState = "down";
                    //player.y += player.speed * elapsed;
                    player.body.velocity.y = (player.speed * elapsed);

                }//키보드 상하좌우 입력
        }
        
        getSocketedXYRot(){
            let player = this;
            let his = this.his;
            let his_past = this.his_past;
            
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            if(this.NoEmittedCnt === 0){
                player.weapon.rotation = his.rot;
                if(player.x != his.x || player.y != his.y){
                    player.x = his.x;
                    player.y = his.y;
                    player.walkState = "move";
                }else{
                    player.walkState = "stop";
                }
                this.NoEmittedCnt = 1;
            }else{
                if(this.NoEmittedCnt !== 0 && this.NoEmittedCnt <= 3){
                    let x_move = his.x-his_past.x;
                    let y_move = his.y-his_past.y;
                    let M = player.speed * 0.001;
                    if(x_move>0 && y_move>0){
                        this.Move(M,M);
                        player.walkState = "move";
                    }else if(x_move<0 && y_move>0){
                        this.Move(-M,M);
                        player.walkState = "move";
                    }else if(x_move>0 && y_move<0){
                        this.Move(M,-M);
                        player.walkState = "move";
                    }else if(x_move<0 && y_move<0){
                        this.Move(-M,-M);
                        player.walkState = "move";
                    }else if(x_move == 0 && y_move<0){
                        this.Move(0,-M);
                        player.walkState = "move";
                    }else if(x_move == 0 && y_move>0){
                        this.Move(0,M);
                        player.walkState = "move";
                    }else if(x_move > 0 && y_move==0){
                        this.Move(M,0);
                        player.walkState = "move";
                    }else if(x_move < 0 && y_move==0){
                        this.Move(-M,0);
                        player.walkState = "move";
                    }else{
                        player.walkState = "stop";
                    }
                    
                    this.NoEmittedCnt++;
                }
            }
        }
        
        Move(x,y){
            let player = this;   
            player.body.velocity.x = x;
            player.body.velocity.y = y;
            //}            
        }
        
        bulletControlByClick(game){
            let player = this;
            let w = player.weapon;
            //bullet 처리
            if (game.input.mouse.isPressed(player.mouse_key) && (gameState.gameTime - w.lastShootTime) > w.shootDelay) {  
                this.createBullet2MouseRot(game);
                game.camera.shake(0.1, 1, 10, 10);
                var sound = game.asset.getAudio('gunfire');
                sound.currentTime = 0;
                sound.volume = 0.3;
                sound.play();
                
                pass_bullet(this.nick);
            }//총알 발사
        }
        
        bulletControlBySocket(game,mouseRot){
            for( ; this.his_wait_cnt>0; this.his_wait_cnt--){
                this.createBullet2MouseRot(game,mouseRot);
            }
        }
        
        createBullet2MouseRot(game, localMousePos = game.camera.screenToLocal(game.input.mouse.position)){
            let player = this;
            let w = player.weapon;

            
            let b = new Light.Sprite(game.asset.getImage('bullet2'));
            b.rotationCenter= new Light.Point(0,b.height/2);
            let bOneHandYOffset = -24;
            let bTwoHandYOffset = -15;

            if (w.isRightFaced()) {//right
                b.rotation = player.getBounds().getCenter().offset(0,bOneHandYOffset).getRotation(localMousePos);
                b.position = player.getBounds().getCenter().offset(Math.cos(b.rotation) * 27, Math.sin(b.rotation) * 27);
                b.position.offset(0,bOneHandYOffset);

            }else if (w.isFrontFaced()) {//front
                b.rotation = player.getBounds().getCenter().offset(0,bTwoHandYOffset).getRotation(localMousePos);
                b.position = player.getBounds().getCenter().offset(Math.cos(b.rotation) * 27, Math.sin(b.rotation) * 27);
                b.position.offset(0,bTwoHandYOffset);
            }
            else if (w.isBackFaced()) {//back
                b.rotation = player.getBounds().getCenter().offset(0,bTwoHandYOffset).getRotation(localMousePos);
                b.position = player.getBounds().getCenter().offset(Math.cos(b.rotation) * 27, Math.sin(b.rotation) * 27);
                b.position.offset(0,bTwoHandYOffset);
            }
            else {//left
                b.rotation = player.getBounds().getCenter().offset(0,bOneHandYOffset).getRotation(localMousePos);
                b.position = player.getBounds().getCenter().offset(Math.cos(b.rotation) * 27, Math.sin(b.rotation) * 27);
                b.position.offset(0,bOneHandYOffset);
            }
            w.position.offset(-Math.cos(b.rotation) * 5, -Math.sin(b.rotation) * 5);
            w.lastShootTime = Date.now();
            b.speed = 1500;
            player.bullets.push(b);
            gameState.bulletLayer.addChild(b);
        }
        
        renderBullet(elapsed){
            let player = this;
            for (var i = 0; i < player.bullets.length; i++) {
                var bullet = player.bullets[i];

                bullet.x += Math.cos(bullet.rotation) * bullet.speed * elapsed;
                bullet.y += Math.sin(bullet.rotation) * bullet.speed * elapsed;

                gameState.grounds.forEach((ground,inx)=>{
                if(ground.getBounds().contains(bullet.getBounds().getCenter())){
                        player.bullets.removeEle(bullet);
                        gameState.bulletLayer.removeChild(bullet);
                    }
                });

                if (!bullet.getBounds().intersects(gameState.gameArea)){
                    player.bullets.removeEle(bullet);
                    gameState.bulletLayer.removeChild(bullet);
                }

            } //총알 충돌 처리 
        }
        colWithBulletCheck(other){
            let player = this;
            for (var i = 0; i < player.bullets.length; i++) {
                var bullet = player.bullets[i];
                if(bullet.getBounds().intersects(other.getBounds())){
                    //console.log("other 맞음 collide");
                    other.hp--;
                    other.mine_hp = other.hp;
                    other.hpText.alpha = 1;
                    pass_his_hpNick(other.hp,other.nick);
                }
            }
        }
    }

    class Weapon extends Light.Sprite{
        constructor(){
            super(game.asset.getImage('gunR'));
            this.shootDelay = 100;
            this.lastShootTime = Date.now();
        }
        
        isLeftFaced(){
	           return Light.degToRad(-135) < this.rotation && this.rotation < Light.degToRad(135);
        };
        isRightFaced(){
                return Light.degToRad(-45) < this.rotation && this.rotation < Light.degToRad(45);
        };
        isFrontFaced(){
                return Light.degToRad(45) < this.rotation && this.rotation < Light.degToRad(135);
        };
        isBackFaced(){
                return Light.degToRad(-135) < this.rotation && this.rotation < Light.degToRad(-45);
        };
    };

    gameState.onInit = function () {
        game.input.keyboard.keyCapturing = [Light.Keyboard.A, Light.Keyboard.D, Light.Keyboard.W,Light.Keyboard.S, Light.Keyboard.CONTROL, Light.Keyboard.ALTERNATE, Light.Keyboard.ESCAPE,
                                            Light.Keyboard.UP,Light.Keyboard.RIGHT,Light.Keyboard.LEFT,Light.Keyboard.DOWN];
        this.SPAWN_DELAY = 1.5;

        this.otherPs = [];
        this.enemies = [];
        this.grounds = [];
        this.gameTime = Date.now();
        
        testMap.renderMap(game,3,500);
        this.grounds = testMap.myMaps;
        //this.addChild(new Light.Sprite(game.asset.getImage('backX')));

//        this.grounds[0] = make_rigid(this,'g1',0,1100);
//        this.grounds[1] = make_rigid(this,'g2',400,900);
//        this.grounds[2] = make_rigid(this,'g2',60,700);
//        this.grounds[3] = make_rigid(this,'g2',600,700);
//        this.grounds[4] = make_rigid(this,'g2', 800, 850);
//        this.grounds[4].width = 100;
//        this.grounds[5] = make_rigid(this,'g2',1400,900);
//        this.grounds[5].width = 500;
        
        this.lightSprite = new Light.Sprite('image/light.png');
        this.addChild(this.lightSprite);

        this.unitLayer = new Light.EntityContainer();
        this.addChild(this.unitLayer);
        
        this.bulletLayer = new Light.EntityContainer();
        this.addChild(this.bulletLayer);
        
        testMap.addForeground(game);
        
        this.mousePointer = new Light.Sprite('image/mouse_pointer.png');
        this.addChild(this.mousePointer);

        this.pointerCenter = new Light.Sprite('image/pointer_center.png');
        this.pointerCenter.alpha=0;
        this.addChild(this.pointerCenter);
        
        //카메라 처리
        game.camera.smoothFollow = 2;
        game.camera.smoothZoom = 5;
        game.camera.follow(this.pointerCenter, new Light.Point(0, 0));

        this.gameArea = new Light.Rectangle(0, 0, 4000, 4000);
        game.camera.moveBounds = this.gameArea;
        //카메라 처리End
        
        //내 플레이어 처리
        {
            let x = parseInt(testMap.playerXYs[manageP.getMyInx()%testMap.playerXYs.length].x);
            let y = parseInt(testMap.playerXYs[manageP.getMyInx()%testMap.playerXYs.length].y);
            this.player = new Player(game,x,y,manageP.getMy());
        }
        this.unitLayer.addChild(this.player);
        this.player.init_Timers(game);
        //내 플레이어 
        
        manageP.getOthers().forEach((player,inx)=>{
            //other 처리
            {
                let x = parseInt(testMap.playerXYs[manageP.getInx(player)%testMap.playerXYs.length].x);
                let y = parseInt(testMap.playerXYs[manageP.getInx(player)%testMap.playerXYs.length].y);
                this.otherPs[inx] = new Player(game,x,y,player);
            }
            this.unitLayer.addChild(this.otherPs[inx]);
            this.otherPs[inx].init_Timers(game);
            //other 처리END            
        });
        
    };

    gameState.onUpdate = function (elapsed) {
        this.gameTime = Date.now();
        
        var localMousePos = game.camera.screenToLocal(game.input.mouse.position);
        this.mousePointer.x = (localMousePos.x-25);
        this.mousePointer.y = (localMousePos.y-25);

        this.pointerCenter.x = this.player.x + (this.mousePointer.x - this.player.x )/3;
        this.pointerCenter.y = this.player.y + (this.mousePointer.y - this.player.y )/3;

        let player = this.player;
        let otherPs = this.otherPs;
        

        //내 player  처리
        player.faceMouse(game);
        player.keyControl(game,elapsed);
        player.syncHpXY();

        player.bulletControlByClick(game,gameState,localMousePos);
        player.renderBullet(elapsed);
        manageP.getOthers().forEach((p,inx)=>{
            player.colWithBulletCheck(otherPs[inx]);
        });
        player.mineHpChange();
        //내 player 처리END

        
        //other 처리
         manageP.getOthers().forEach((player,inx)=>{
            otherPs[inx].otherHpChange();
            otherPs[inx].faceSomething(game,otherPs[inx].his.rot);
            otherPs[inx].getSocketedXYRot();
             
            otherPs[inx].bulletControlBySocket(game,otherPs[inx].his.mousePos);
            otherPs[inx].renderBullet(elapsed);
         });
         //other 처리END
        };


    let infoText;
    endState.onInit = function () {
        game.backgroundColor = '#071e2e';
        infoText = display_text(this,"Click to Restart",40,400,"#fff","30px Dosis");
        this.coolTime = 0;
    };

    endState.onUpdate = function (elapsed) {
        this.coolTime += elapsed;
        if (this.coolTime > 1 && game.input.mouse.isJustPressed(Light.Mouse.LEFT)){
            game.states.change('intro');

        }
    };

    game.states.add('intro', introState);
    game.states.add('mainGame', gameState);
    game.states.add('end', endState);
    game.states.change('intro');
