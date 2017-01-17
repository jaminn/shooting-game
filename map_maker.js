var testingMap=
`
p1 300 200
p2 200 300
p3 400 300
p4 200 300

map 0 0
b1 704 706
b2 124 156
b3 704 157
b4 123 704
b5 253 833
b6 255 93
b7 834 256
b8 59 256
b9 445 224
b10 447 543
b11 447 415
b12 447 672
b13 190 606
b14 575 351
b15 189 349
b16 574 609
b17 381 479
b18 576 672
b19 319 671
b20 576 223
b21 318 222
b22 637 477
b23 188 477

`
function make_rigid(state,image_name,x=100,y=200){
        let rigid = new Light.Sprite(game.asset.getImage(image_name));
        rigid.x = x;
        rigid.y = y;
        state.addChild(rigid);
        game.physics.add(rigid);
        rigid.body.isFixed = true;
        return rigid;
}


class MapMaker{
    constructor(mapName,mapData){
        this.mapName = mapName;
        this.playerXYs;
        this.blockNameXYs;
        this.background;
        this.myMaps;
        this.myXMarks=[];
        
        var rex = /^(\S+?) *?(\S+?) *?(\S+?)$/gm;
        var match = rex.exec(mapData);
        var pXYs = [];
        var bNameXYs = [];
         while(match != null){
             if(match[1][0] === 'p'){
                 pXYs.push({x:match[2], y:match[3]});
             }else{
                 bNameXYs.push({name:match[1], x:match[2], y:match[3]});
             }
             match = rex.exec(mapData);
         }
        this.playerXYs = pXYs;
        this.blockNameXYs = bNameXYs;
        
    }
    
    loadAll(loader){
        //console.log(this.blockNameXYs);
        loader.loadImage('xImg', 'xImg.png');
        for(let block of this.blockNameXYs){        loader.loadImage(block.name,`${this.mapName}/${block.name}.png`);
        }
    }
    drawMap(game){
        let state = game.states.currentState;
        let tmpMaps=[];
        let tmpMap;
        for(let block of this.blockNameXYs){
            tmpMap = new Light.Sprite(game.asset.getImage(`${block.name}`));
            state.addChild(tmpMap);
            tmpMaps.push(tmpMap);
            
            tmpMap.x = block.x;
            tmpMap.y = block.y;
            tmpMap.alpha = 0.5;
        }
        this.myMaps = tmpMaps;
    }
    
    drawXMarks(game){
        let state = game.states.currentState;
        let tmpSize;
        let tmpXMark;
        let tmpXMarks=[];
        for(let myMap of this.myMaps){
            tmpXMark = new Light.Sprite(game.asset.getImage('xImg'));
            state.addChild(tmpXMark);
            tmpXMarks.push(tmpXMark);
            
            
            tmpSize = (myMap.height > myMap.width)? myMap.height : myMap.width;
            tmpSize = tmpSize/8;
            if(tmpSize < 20){
                tmpSize = 20;
            }
            tmpXMark.height = tmpSize;
            tmpXMark.width  = tmpSize;
            tmpXMark.x = (parseInt(myMap.x)+myMap.width/2)  - tmpSize /2;
            tmpXMark.y = (parseInt(myMap.y)+myMap.height/2) - tmpSize /2;
        }
        this.myXMarks = tmpXMarks;
    }
    
    checkMarkClicked(game){
        let state = game.states.currentState;
        let localMousePos = game.camera.screenToLocal(game.input.mouse.position);
        
        function move(obj,thisObj){
            let myMap = thisObj.myMaps[obj.inx];
            let xMark = obj.mark;
            myMap.x = localMousePos.x - myMap.width/2;
            myMap.y = localMousePos.y - myMap.height/2;

            xMark.x = (parseInt(myMap.x)+myMap.width/2)  - xMark.width /2;
            xMark.y = (parseInt(myMap.y)+myMap.height/2) - xMark.height /2;
        }
        let isPressing = game.input.mouse.isPressed(Light.Mouse.LEFT);
        if(!isPressing){
            this.What2Move = false;
        }
        if(this.What2Move){
            move(this.What2Move,this);
        }else{
            if(game.input.mouse.isJustPressed(Light.Mouse.LEFT)){
                this.myXMarks.forEach((xMark,inx) =>{
                    if(xMark.getBounds().contains(localMousePos)){
                        this.What2Move = {mark:xMark,inx:inx};
                        this.myMaps.forEach((myMap,mapInx)=>{
                            if(mapInx == inx){
                                this.nowMap = myMap;
                                myMap.alpha = 1;
                            }else{
                                myMap.alpha = 0.5;
                            }
                        });
                    }
                });
            }
        }
    }
    printMap(){
        let str = "";
        this.blockNameXYs.forEach((block,inx)=>{
            let x = parseInt(this.myMaps[inx].x).toFixed(0);
            let y = parseInt(this.myMaps[inx].y).toFixed(0);
            str += `${block.name} ${x} ${y}\n`; 
       });
        console.log(str);
    }
    
    renderMap(game,size = 1,offset = 0){
        let state = game.states.currentState;
        let tmpMaps=[];
        let tmpMap;
        
        for(let block of this.blockNameXYs){
            if(block.name === 'map'){
                tmpMap = new Light.Sprite(game.asset.getImage(`${block.name}`));
                state.addChild(tmpMap);
                this.background = tmpMap;
                
                tmpMap.x = block.x * size +offset;
                tmpMap.y = block.y * size +offset;
                
                tmpMap.width  *= size;
                tmpMap.height *= size;
            }else{
                tmpMap = make_rigid(state,`${block.name}`);
                tmpMap.alpha = 0.5;
                
                tmpMap.x = block.x * size +offset;
                tmpMap.y = block.y * size +offset;
                
                tmpMap.width  *= size;
                tmpMap.height *= size;
                tmpMaps.push(tmpMap);
            }
        }
        this.myMaps = tmpMaps;
    }
    
}