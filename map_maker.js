var testingMap=
`
p1 220 200
p2 350 200
p3 220 200
p4 220 200

back 0 0
fore 0 0
b1 704 735
b2 125 160
b3 704 157
b4 126 735
b5 255 862
b6 255 97
b7 832 286
b8 61 289
b9 447 228
b10 447 543
b11 447 415
b12 447 672
b13 190 606
b14 574 350
b15 190 352
b16 574 613
b17 381 479
b18 576 672
b19 319 671
b20 574 223
b21 318 229
b22 639 480
b23 194 478

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
        this.ori_playerXYs=[];
        this.playerXYs=[];
        this.blockNameXYs;
        this.background;
        this.foreground;
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
        this.ori_playerXYs = pXYs;
        this.blockNameXYs = bNameXYs;
        
    }
    
    loadAll(loader){
        //console.log(this.blockNameXYs);
        loader.loadImage('xImg', 'xImg.png');
        for(let block of this.blockNameXYs){        
            loader.loadImage(block.name,`${this.mapName}/${block.name}.png`);
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
        
        let tmpXYs = [];
        this.ori_playerXYs.forEach((XY,inx)=>{
            tmpXYs.push({x: XY.x * size +offset, y: XY.y * size +offset});
        });
        this.playerXYs = tmpXYs;
        
        for(let block of this.blockNameXYs){
            if(block.name === 'back'){
                tmpMap = new Light.Sprite(game.asset.getImage(`${block.name}`));
                state.addChild(tmpMap);
                this.background = tmpMap;
                
                tmpMap.x = block.x * size +offset;
                tmpMap.y = block.y * size +offset;
                
                tmpMap.width  *= size;
                tmpMap.height *= size;
            }else if(block.name === 'fore'){
                tmpMap = new Light.Sprite(game.asset.getImage(`${block.name}`));
                this.foreground = tmpMap;
                
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
    
    addForeground(game){
        let state = game.states.currentState;
        state.addChild(this.foreground);
    }
    
}