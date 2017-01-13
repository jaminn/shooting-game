    var socket = io();

    let isStarted = false;

    let his = {x:300,y:300,rot:0};
    let mine_hp = 300;
    let his_bullet;
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
        his = data;
    });

    socket.on('get_my_hp', (data) =>{
//        console.log('START|ONget_my_hp');
//        console.log(data);
//        console.log('END|ONget_my_hp');
        mine_hp = data;
    });

    socket.on('get_his_bullet', (data)=>{
        his_bullet = data;
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

    function pass_mine(mine){
    //        console.log('START|pass_mine');
    //        console.log(mine);
    //        console.log('END|pass_mine');
        socket.emit('pass_mine',mine);
        //my_pos = pos;
    }

    function add_bullet(){
        socket.emit('pass_my_bullet',1);
    }

    function pass_his_hp(hp){
        //console.log('START|pass_his_hp');
        //console.log(hp);
        //console.log('END|pass_his_hp');
        socket.emit('pass_his_hp',hp);
    }

    let his_wait_cnt = 0;
    socket.on('get_his_bullet',(data)=>{
        his_wait_cnt = data;
    });

    function get_bullet_cnt(){
        var cnt = his_wait_cnt;
        his_wait_cnt = 0;
        return cnt;
    }

    Array.prototype.removeEle = function(ele) {
        this.splice(this.indexOf(ele), 1);
    }

    var game = new Light.Game('game', 1100, 600, '#004A7B', function (asset) {
        asset.loadImage('e1', 'image/enemy1.png');
        asset.loadImage('e2', 'image/enemy2.png');
        asset.loadImage('player', 'image/player.png');
        asset.loadImage('g1', 'image/ground1.png');
        asset.loadImage('g2', 'image/ground2.png');
        asset.loadImage('bullet', 'image/bullet.png');
        asset.loadImage('weapon', 'image/weapon.png');
        asset.loadImage('back', 'image/back.png');
        asset.loadImage('test','image/test.png');
        asset.loadAudio('gunfire', 'audio/gun.wav');
        asset.loadImage('arrow','image/arrow.png');
        asset.loadImage('player_front','image/pFront.gif');
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
        display_text(this,"동팡이",40,300,"#f0f","100px Dosis");
        display_text(this,"기다리셈",40,400,"#fff","30px Dosis");

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
            this.speed = speed;

            this.width = this.sprite.width;
            this.height = this.sprite.height;
        }
    }

    class Player extends Unit {
        constructor(img='player_front', mouse_key, key_up,key_right,key_down,key_left){
            super(game.asset.getImage(img), 25);
            this.body.friction.x = 0.95;
            this.body.friction.y = 0.95;

            this.weapon = new Weapon();
            this.weapon.x = 10;
            this.weapon.y = 17;
            this.weapon.rotationCenter.x = 4;
            this.weapon.rotationCenter.y = 5;
            this.addChild(this.weapon);

            this.bullets = [];
            this.hpText;
            this.nickText;
            this.walkState = "stop";

            this.sprite.scaleCenter.x = this.width / 2;
            this.weapon.scaleCenter.y = 5;
            this.hp = 300;

            this.key_up = key_up || Light.Keyboard.W;
            this.key_right= key_right || Light.Keyboard.D;
            this.key_down= key_down || Light.Keyboard.S;
            this.key_left= key_left || Light.Keyboard.A;

            this.mouse_key= mouse_key || Light.Mouse.LEFT;
        }
    }


    Weapon = function () {
        Light.Sprite.call(this, game.asset.getImage('weapon'));
        this.shootDelay = 50;
        this.lastShootTime = Date.now();
    };
    Weapon.prototype = Object.create(Light.Sprite.prototype);
    Weapon.prototype.constructor = Weapon;

    gameState.onInit = function () {
        game.input.keyboard.keyCapturing = [Light.Keyboard.A, Light.Keyboard.D, Light.Keyboard.W,Light.Keyboard.S, Light.Keyboard.CONTROL, Light.Keyboard.ALTERNATE, Light.Keyboard.ESCAPE,
                                            Light.Keyboard.UP,Light.Keyboard.RIGHT,Light.Keyboard.LEFT,Light.Keyboard.DOWN];
        this.SPAWN_DELAY = 1.5;

        this.otherPs = [];
        this.enemies = [];
        this.grounds = [];
        this.gameTime = Date.now();

        this.addChild(new Light.Sprite(game.asset.getImage('back')));

        this.grounds[0] = make_rigid(this,'g1',0,1100);
        this.grounds[1] = make_rigid(this,'g2',400,900);
        this.grounds[2] = make_rigid(this,'g2',60,700);
        this.grounds[3] = make_rigid(this,'g2',600,700);
        this.grounds[4] = make_rigid(this,'g2', 800, 850);
        this.grounds[4].width = 100;
        this.grounds[5] = make_rigid(this,'g2',1400,900);
        this.grounds[5].width = 500;

        this.lightSprite = new Light.Sprite('image/light.png');
        this.addChild(this.lightSprite);

        this.unitLayer = new Light.EntityContainer();
        this.addChild(this.unitLayer);

        this.mousePointer = new Light.Sprite('image/mouse_pointer.png');
        this.addChild(this.mousePointer);

        this.pointerCenter = new Light.Sprite('image/pointer_center.png');
        this.addChild(this.pointerCenter);

        //내 플레이어 처리
        this.player = new Player();
        this.player.x = 100;
        this.player.y = 400;
        this.unitLayer.addChild(this.player);

        this.player.nickText = display_text(this,nickname,0,0,"#fff","30px Dosis");
        this.player.hpText = display_text(this,"",30,100,"#fff","30px Dosis");
        //내 플레이어 처리End

        //카메라 처리
        game.camera.smoothFollow = 5;
        game.camera.smoothZoom = 5;
        game.camera.follow(this.pointerCenter, new Light.Point(0, 0));

        this.gameArea = new Light.Rectangle(0, 0, 4000, 4000);
        game.camera.moveBounds = this.gameArea;
        //카메라 처리End

        //other 처리
        this.otherPs[0] = new Player('arrow');
        this.otherPs[0].x = 600;
        this.otherPs[0].y = 400;
        this.unitLayer.addChild(this.otherPs[0]);

        this.otherPs[0].hpText = display_text(this,"",800,100,"#fff","30px Dosis");
        this.otherPs[0].nickText = display_text(this,"test",0,0,"#fff","30px Dosis");
        //other 처리END

        if (this.leftTimer) game.timers.splice(game.timers.indexOf(this.leftTimer), 1);
        if (this.rightTimer) game.timers.splice(game.timers.indexOf(this.rightTimer), 1);
        if (this.backTimer) game.timers.splice(game.timers.indexOf(this.backTimer), 1);
        if (this.frontTimer) game.timers.splice(game.timers.indexOf(this.frontTimer), 1);

        this.leftTimer = new Light.Timer(game, 0.2, -1, ()=>{
            if(!checkImg(gameState.player,"pLeftW")){
		      gameState.player.sprite.texture.src = "image/pLeftW.png";
	       }else{
		      gameState.player.sprite.texture.src = "image/pLeft.gif";
	       }
             this.frontTimer.pause();
             this.rightTimer.pause();
             this.backTimer.pause();
        });

        this.frontTimer = new Light.Timer(game, 0.2, -1, ()=>{
             this.leftTimer.pause();
             this.rightTimer.pause();
             this.backTimer.pause();

            if(!checkImg(gameState.player,"pFront1")){
                gameState.player.sprite.texture.src = "image/pFront1.png";
            }else{
                gameState.player.sprite.texture.src = "image/pFront2.png";
            }
        });

        this.rightTimer = new Light.Timer(game, 0.2, -1, ()=>{
             this.leftTimer.pause();
             this.frontTimer.pause();
             this.backTimer.pause();

            if(!checkImg(gameState.player,"pRightW")){
                gameState.player.sprite.texture.src = "image/pRightW.png";
            }else{
                gameState.player.sprite.texture.src = "image/pRight.gif";
            }

        });

        this.backTimer = new Light.Timer(game, 0.2, -1, ()=>{
            this.leftTimer.pause();
             this.frontTimer.pause();
             this.rightTimer.pause();

            if(!checkImg(gameState.player,"pBack1")){
                gameState.player.sprite.texture.src = "image/pBack1.png";
            }else{
                gameState.player.sprite.texture.src = "image/pBack2.png";
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

    };

    gameState.onUpdate = function (elapsed) {
        var localMousePos = game.camera.screenToLocal(game.input.mouse.position);
        this.mousePointer.x = (localMousePos.x-25);
        this.mousePointer.y = (localMousePos.y-25);

        this.pointerCenter.x = this.player.x + (this.mousePointer.x - this.player.x )/3;
        this.pointerCenter.y = this.player.y + (this.mousePointer.y - this.player.y )/3;

        let player = this.player;
        let otherPs = this.otherPs;

        player.hpText.x = player.x;
        player.hpText.y = player.y+20;

        player.nickText.x = player.x;
        player.nickText.y = player.y-20;//플레이어 따라다니는 체력&닉네임

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
        //HP 처리 END

            //내 player  처리
                let w = player.weapon;
                w.x += (10 - w.x) / 3;
                w.y += (17 - w.y) / 3;
                w.rotation = player.getBounds().getCenter().getRotation(localMousePos);// 무기 위치&각도

                let TOG = new toggler(3);
                if (Light.degToRad(-45) < w.rotation && w.rotation < Light.degToRad(45)) {
                    if(player.walkState != "stop"){
                        this.rightTimer.resume();
                    }else{
                        this.rightTimer.pause();
                        player.sprite.texture.src = "image/pRight.gif";
                    }
                    w.scale.y = 1;
                }else if (Light.degToRad(45) < w.rotation && w.rotation < Light.degToRad(135)) {
                    if(player.walkState != "stop"){
                        this.frontTimer.resume();
                    }else{
                        this.frontTimer.pause();
                        player.sprite.texture.src = "image/pFront.gif";
                    }
                    w.scale.y = -1;
                }else if (Light.degToRad(-135) < w.rotation && w.rotation < Light.degToRad(135)) {
                    if(player.walkState != "stop"){
                        this.backTimer.resume();
                    }else{
                        this.backTimer.pause();
                        player.sprite.texture.src = "image/pBack.gif";
                    }
                    w.scale.y = -1;
                }else {
                    if(player.walkState != "stop"){
                        this.leftTimer.resume();
                    }else{
                        this.leftTimer.pause();
                        player.sprite.texture.src = "image/pLeft.gif";
                    }
                    w.scale.y = -1;
                }//마우스에 따른 무기&캐릭터 방향 설정

                player.walkState = "stop";
                if (game.input.keyboard.isPressed(player.key_left)) {
                    player.walkState = "left";
                    player.x -= 5;
                    //player.body.velocity.x -= player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_right)) {
                    player.walkState = "right";
                    player.x += 5;
                    //player.body.velocity.x += player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_up)) {
                    player.walkState = "up";
                    player.y -= 5;
                    //player.body.velocity.y -= player.speed * elapsed;
                }
                if (game.input.keyboard.isPressed(player.key_down)) {
                    player.walkState = "down";
                    player.y += 5;

                }//키보드 상하좌우 입력
                if(toggle()){
                    pass_mine({x: player.x,
                               y: player.y,
                               rot: player.weapon.rotation,
                               hp:player.hp});
                }// x,y,hp,각도 동기화

                //bullet 처리
                if (game.input.mouse.isPressed(player.mouse_key) && (this.gameTime - w.lastShootTime) > w.shootDelay) {
                    var b = new Light.Sprite(game.asset.getImage('bullet'));
                    b.rotation = w.rotation;
                    //b.rotationCenter.y = -20;
                    b.position = player.getBounds().getCenter().offset(Math.cos(b.rotation) * 30, Math.sin(b.rotation) * 30);
                    b.position.x = b.position.x+ 0;
                    b.position.y = b.position.y- 20;

                    b.speed = 1500;
                    w.lastShootTime = Date.now();
                    w.position.offset(-Math.cos(b.rotation) * 5, -Math.sin(b.rotation) * 5);
                    game.camera.shake(0.1, 1, 10, 10);
                    var sound = game.asset.getAudio('gunfire');
                    sound.currentTime = 0;
                    sound.volume = 0.3;
                    sound.play();
                    player.bullets.push(b);
                    this.addChild(b);
                    add_bullet();
                }//총알 발사
                for (var i = 0; i < player.bullets.length; i++) {
                    var bullet = player.bullets[i];

                    bullet.x += Math.cos(bullet.rotation) * bullet.speed * elapsed;
                    bullet.y += Math.sin(bullet.rotation) * bullet.speed * elapsed;


                    if(bullet.getBounds().intersects(otherPs[0].getBounds())){
                        //console.log("other 맞음 collide");
                        otherPs[0].hp--;
                        otherPs[0].hpText.alpha = 1;
                        pass_his_hp(otherPs[0].hp);
                    }

                    gameState.grounds.forEach((ground,inx)=>{
                    if(coll_check(ground, bullet)){
                            player.bullets.removeEle(bullet);
                            this.removeChild(bullet);
                        }
                    });

                    if (!bullet.getBounds().intersects(this.gameArea)){
                        player.bullets.removeEle(bullet);
                        this.removeChild(bullet);
                    }

                } //총알 충돌 처리
                //bullet 처리 END
            //내 player 처리END


            //other 처리
                otherPs[0].x = his.x;
                otherPs[0].y = his.y;
                otherPs[0].weapon.rotation = his.rot;


                otherPs[0].hpText.x = otherPs[0].x;
                otherPs[0].hpText.y = otherPs[0].y+20;

                otherPs[0].nickText.x = otherPs[0].x;
                otherPs[0].nickText.y = otherPs[0].y-20;//플레이어 따라다니는 체력&닉네임


                if (otherPs[0].hp <= 0) {
                    otherPs[0].hp = 0;
                    game.camera.removeChild(otherPs[0].hpText);
                    game.states.change('end');
                }

                else if (otherPs[0].hp < 90) otherPs[0].hpText.fillStyle = '#f00';
                else if (otherPs[0].hp < 180) otherPs[0].hpText.fillStyle = '#ffba00';// HP관련

                this.gameTime = Date.now();
                player.hpText.text = 'HP ' + ((player.hp / 300) * 100).toFixed(2) + '%';
                otherPs[0].hpText.text= 'HP ' + ((otherPs[0].hp / 300) * 100).toFixed(2) + '%';

                player.hpText.alpha += (0.4 - player.hpText.alpha) / 15;
                otherPs[0].hpText.alpha += (0.4 - otherPs[0].hpText.alpha) / 15;//HP 관련


                let w_his = otherPs[0].weapon;
                w_his.x += (10 - w_his.x) / 3;
                w_his.y += (17 - w_his.y) / 3; // 무기 위치

                if (w_his.rotation > Light.degToRad(-90) && w_his.rotation < Light.degToRad(90)) {
                    otherPs[0].sprite.scale.x = 1;
                    w_his.scale.y = 1;
                }
                else {
                    otherPs[0].sprite.scale.x = -1;
                    w_his.scale.y = -1;
                } // 마우스 포인터 방향에 따라서
                //bullet 처리
                for(var b_cnt = get_bullet_cnt();b_cnt>0;b_cnt--){
                    var b = new Light.Sprite(game.asset.getImage('bullet'));
                    b.rotation = w_his.rotation;
                    b.rotationCenter.y = 5;

                    b.position = otherPs[0].getBounds().getCenter().offset(Math.cos(b.rotation) * 30, Math.sin(b.rotation) * 30);
                    b.speed = 1500;

                    w_his.lastShootTime = Date.now();
                    w_his.position.offset(-Math.cos(b.rotation) * 5, -Math.sin(b.rotation) * 5);

                    //game.camera.shake(0.1, 1, 10, 10);

                    var sound = game.asset.getAudio('gunfire');
                    sound.currentTime = 0;
                    sound.volume = 0.3;
                    sound.play();

                    otherPs[0].bullets.push(b);
                    this.addChild(b);
                }//총알 발사
                for (var i = 0; i < otherPs[0].bullets.length; i++) {
                    var bullet = otherPs[0].bullets[i];

                    bullet.x += Math.cos(bullet.rotation) * bullet.speed * elapsed;
                    bullet.y += Math.sin(bullet.rotation) * bullet.speed * elapsed;

                    gameState.grounds.forEach((ground,inx)=>{
                    if(coll_check(ground, bullet)){
                            otherPs[0].bullets.removeEle(bullet);
                            this.removeChild(bullet);
                        }
                    });

                    if (!bullet.getBounds().intersects(this.gameArea)){
                        otherPs[0].bullets.removeEle(bullet);
                        this.removeChild(bullet);
                        bullet = null;
                    }

                }//총알 충돌 처리
                //bullet 처리 END
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
