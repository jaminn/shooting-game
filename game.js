    var socket = io();

    let isStarted = false;

    let his={x: 0,y: 0,rot: 0,
    mousePos:new Light.Point(0,0),
    hp:300};

    let his_past={x: 0,y: 0,rot: 0,
    mousePos:new Light.Point(0,0),
    hp:300};

    let NoEmittedCnt = 0;
    let mine_hp = 300;
    let nickname;

    let preStart_interval;
    let start_interval;
    let restart_interval;

    class toggler{
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

    var counter = 1;
    function toggle(){
        if(counter == 1){
            counter = 1;
            return true;
        }else{
            counter++;
            return false;
        }
    }

    socket.on('get_nickname',(nick)=>{
        console.log("닉네임은:");
        console.log(nick);
        nickname = nick;
    });


    socket.on('start',(debug)=>{
        console.log(debug);
        clearInterval(start_interval);
        start_interval = null;
        isStarted = true;
        game.states.change('mainGame');

        if(!restart_interval){
            restart_interval = setInterval(()=>{
                socket.emit('restart_check','restart_check_emitted');
            },1000);
        }
    });

    socket.on('restart', (debug)=>{
        console.log(debug);
        clearInterval(restart_interval);
        restart_interval = null;
        isStarted = false;
        game.states.change('intro');
    });


    socket.on('get_his', (data) =>{
    //        console.log('START|ONget_his');
    //        console.log(data);
    //        console.log('END|ONget_his');
        his_past =  clone(his);
        his = data;
        NoEmittedCnt = 0;
    });

    socket.on('get_my_hp', (data) =>{
//        console.log('START|ONget_my_hp');
//        console.log(data);
//        console.log('END|ONget_my_hp');
        mine_hp = data;
    });
    
    let his_wait_cnt = 0;
    socket.on('get_his_bullet',(data)=>{
        his_wait_cnt = data;
    });

    function get_bullet_cnt(){
        var cnt = his_wait_cnt;
        his_wait_cnt = 0;
        return cnt;
    }

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

    function pass_bullet(){
        socket.emit('pass_my_bullet',1);
    }

    function pass_his_hp(hp){
        //console.log('START|pass_his_hp');
        //console.log(hp);
        //console.log('END|pass_his_hp');
        socket.emit('pass_his_hp',hp);
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
    
    var testMap = new MapMaker("map",testingMap);
    
    var game = new Light.Game('game', 1100, 600, '#004A7B', function (asset) {
        testMap.loadAll(asset);
        asset.loadImage('e1', 'image/enemy1.png');
        asset.loadImage('e2', 'image/enemy2.png');
        asset.loadImage('player', 'image/player.png');
        asset.loadImage('g1', 'image/ground1.png');
        asset.loadImage('g2', 'image/ground2.png');
        asset.loadImage('bullet', 'image/bullet.png');
        
        asset.loadImage('gunR', 'image/p1/p1Onehand_R.png');
        asset.loadImage('gunL', 'image/p1/p1Onehand_L.png');
        asset.loadImage('gunTwo', 'image/p1/p1Twohand.png');
        
        asset.loadImage('back', 'image/back.png');
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
        introState.children = [];
        gameState.children = [];
        endState.children = [];
        game.camera.children = [];

        this.addChild(new Light.Sprite(game.asset.getImage('back')));
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
//            this.body.maxVelocity.x = speed;
//            this.body.maxVelocity.y = speed;
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
            this.textInit(game,nickname);

            this.weapon = new Weapon();
            this.weapon.rotationCenter.x = 0;
            this.weapon.rotationCenter.y = 16;
            this.addChild(this.weapon);

            this.bullets = [];
            this.hpText;
            this.nickText;
            this.walkState = "stop";

            this.sprite.scaleCenter.x = this.width / 2;
            this.weapon.scaleCenter.y = 5;
            this.hp = 300;

            this.key_up = Light.Keyboard.W;
            this.key_right= Light.Keyboard.D;
            this.key_down= Light.Keyboard.S;
            this.key_left= Light.Keyboard.A;

            this.mouse_key= Light.Mouse.LEFT;
        }
        textInit(game,nick){
            let player = this;
            player.nickText = display_text(game.states.current,nick,0,0,"#fff","30px Dosis");
            player.hpText = display_text(game.states.current,"",30,100,"#fff","30px Dosis");
        }
        
        textFollow(){
            let player = this;
            player.hpText.x = player.x;
            player.hpText.y = player.y+20;

            player.nickText.x = player.x;
            player.nickText.y = player.y-20;//플레이어 따라다니는 체력&닉네임

        }
        syncHpXY(){
            let player = this;
            if(toggle()){
                pass_mine({x: player.x,
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
                    change_sprite(game, player,"p1BackW1");
                }else{
                    change_sprite(game, player,"p1BackW2");
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
            //HP 처리
            if(player.hp !== mine_hp){
                player.hpText.alpha = 1;
                game.camera.shake(0.1, 3, 15, 15);
                player.hp = mine_hp;
            }

            if (player.hp <= 0) {
                player.hp = 0;
                game.camera.removeChild(player.hpText);
                game.states.change('end');
            }

            else if (player.hp < 90) player.hpText.fillStyle = '#f00';
            else if (player.hp < 180) player.hpText.fillStyle = '#ffba00';
            else player.hpText.fillStyle = '#fff';// HP관련
            
            player.hpText.text = 'HP ' + ((player.hp / 300) * 100).toFixed(2) + '%';
            player.hpText.alpha += (0.4 - player.hpText.alpha) / 15;
        }
        
        otherHpChange(){
            let player = this;
            if (player.hp <= 0) {
                player.hp = 0;
                game.camera.removeChild(player.hpText);
                game.states.change('end');
            }else if (player.hp < 90) player.hpText.fillStyle = '#f00';
            else if (player.hp < 180) player.hpText.fillStyle = '#ffba00';// HP관련
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
                        change_sprite(game, player,"p1Back");
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
            player.walkState = "stop";
                if (game.input.keyboard.isPressed(player.key_left)) {
                    player.walkState = "left";
                    player.x -= player.speed * elapsed;
                    //player.body.velocity.x -= player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_right)) {
                    player.walkState = "right";
                    player.x += player.speed * elapsed;
                    //player.body.velocity.x += player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_up)) {
                    player.walkState = "up";
                    player.y -= player.speed * elapsed;
                    //player.body.velocity.y -= player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_down)) {
                    player.walkState = "down";
                    player.y += player.speed * elapsed;

                }//키보드 상하좌우 입력
        }
        
        getSocketedXYRot(elapsed){
            let player = this;
            if(NoEmittedCnt == 0){
                player.weapon.rotation = his.rot;
                if(player.x != his.x || player.y != his.y){
                    player.x = his.x;
                    player.y = his.y;
                    player.walkState = "move";
                }else{
                    player.walkState = "stop";
                }
                NoEmittedCnt = 1;
            }else{
                if(NoEmittedCnt != 0 && NoEmittedCnt <= 3){
                    let x_move = his.x-his_past.x;
                    let y_move = his.y-his_past.y;
                    if(x_move>0 && y_move>0){
                        player.x += player.speed * elapsed;
                        player.y += player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move<0 && y_move>0){
                        player.x -= player.speed * elapsed;
                        player.y += player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move>0 && y_move<0){
                        player.x += player.speed * elapsed;
                        player.y -= player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move<0 && y_move<0){
                        player.x -= player.speed * elapsed;
                        player.y -= player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move == 0 && y_move<0){
                        player.y -= player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move == 0 && y_move>0){
                        player.y += player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move > 0 && y_move==0){
                        player.x += player.speed * elapsed;
                        player.walkState = "move";
                    }else if(x_move < 0 && y_move==0){
                        player.x -= player.speed * elapsed;
                        player.walkState = "move";
                    }else{
                        player.walkState = "stop";
                    }
                    
                    NoEmittedCnt++;
                }
            }
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
                
                pass_bullet();
            }//총알 발사
        }
        
        bulletControlBySocket(game,mouseRot){
            for(var b_cnt = get_bullet_cnt();b_cnt>0;b_cnt--){
                this.createBullet2MouseRot(game,mouseRot);
            }
        }
        
        createBullet2MouseRot(game, localMousePos = game.camera.screenToLocal(game.input.mouse.position)){
            let player = this;
            let w = player.weapon;

            
            let b = new Light.Sprite(game.asset.getImage('bullet'));
            b.rotationCenter= new Light.Point(0,5);
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
            game.states.current.addChild(b);
        }
        
        renderBullet(elapsed){
            let player = this;
            for (var i = 0; i < player.bullets.length; i++) {
                var bullet = player.bullets[i];

                bullet.x += Math.cos(bullet.rotation) * bullet.speed * elapsed;
                bullet.y += Math.sin(bullet.rotation) * bullet.speed * elapsed;

                game.states.current.grounds.forEach((ground,inx)=>{
                if(ground.getBounds().contains(bullet.getBounds().getCenter())){
                        player.bullets.removeEle(bullet);
                        game.states.current.removeChild(bullet);
                    }
                });

                if (!bullet.getBounds().intersects(game.states.current.gameArea)){
                    player.bullets.removeEle(bullet);
                    game.states.current.removeChild(bullet);
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
                    other.hpText.alpha = 1;
                    pass_his_hp(other.hp);
                }
            }
        }
    }


    class Weapon extends Light.Sprite{
        constructor(){
            super(game.asset.getImage('gunR'));
            this.shootDelay = 50;
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
        this.player = new Player(game,800 +500,700+500,nickname);
        this.unitLayer.addChild(this.player);
        this.player.init_Timers(game);
        //내 플레이어 처리End

        //other 처리
        this.otherPs[0] = new Player(game,800+500,700+500,"test0354");
        this.unitLayer.addChild(this.otherPs[0]);
        this.otherPs[0].init_Timers(game);
        //other 처리END
        
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
        player.textFollow();
        player.mineHpChange();
        

        //내 player  처리
        player.faceMouse(game);
        player.keyControl(game,elapsed);
        player.syncHpXY();

        player.bulletControlByClick(game,gameState,localMousePos);
        player.renderBullet(elapsed);
        player.colWithBulletCheck(otherPs[0]);
        //내 player 처리END


        //other 처리
        otherPs[0].textFollow();
        otherPs[0].otherHpChange();
        
        otherPs[0].faceSomething(game,his.rot);
        otherPs[0].getSocketedXYRot(elapsed);

        
        otherPs[0].bulletControlBySocket(game,his.mousePos);
        otherPs[0].renderBullet(elapsed);
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
