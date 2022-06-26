var http = require('http');
var fs = require('fs');
var url=require('url');
const ws = require('wss');
const wss = new ws.Server({port:2999},'0.0.0.0');
function SEND(F,M){
if(F.readyState==F.OPEN){
F.send(M);
}
}
let Users=new Map();
let Names=new Map();
let CLIENT=new Map();
let Grid=new Map();
let Pairs=new Map();
let BEAT=new Map();
let ROOM=new Map();
let LP=0;
var X;
async function heartbeat(){
BEAT.forEach(function(value, key){
if(Date.now()-value>=20000){
let GRID=Grid.get(key);
let A=0,B=0;
for(let i=0;i<3;i++)
for(let j=0;j<3;j++){
if(GRID[i][j]==1)
A++;
else if(GRID[i][j]==-1)
B++;
}
if(A<=B)
WINNER(Pairs.get(key),0);
else
WINNER(key,0);
}
});
await new Promise(resolve => setTimeout(resolve, 1000));
heartbeat();
}
heartbeat();
function MATCHMAKE(X,Y){
if(Math.random()>=0.5){
var Z=X;
X=Y;
Y=Z;
}
Pairs.set(X,Y);
Pairs.set(Y,X);
Grid.set(X,[[0,0,0],[0,0,0],[0,0,0]]);
BEAT.set(X,Date.now());
SEND(CLIENT.get(X),30);
SEND(CLIENT.get(Y),31);
}
function WINNER(X,B){
Y=Pairs.get(X);
Users.set(X,0);
Users.set(Y,0);
if(Grid.has(X)){
Grid.delete(X);
BEAT.delete(X);
}
else{
Grid.delete(Y);
BEAT.delete(Y);
}
Pairs.delete(X),Pairs.delete(Y);
if(!B){
SEND(CLIENT.get(X),90);
SEND(CLIENT.get(Y),91);
}
else{
SEND(CLIENT.get(X),92);
SEND(CLIENT.get(Y),92);
}
}
function MATCHPROCESS(X,VAL){
let FP=1;
var MAIN=X;
if(!Grid.has(X))
MAIN=Pairs.get(X),FP=-1;
let A=0,B=0,GRID=Grid.get(MAIN);
for(let i=0;i<3;i++)
for(let j=0;j<3;j++){
if(GRID[i][j]==1)
A++;
else if(GRID[i][j]==-1)
B++;
}
if(FP==-1&&B>=A)
return;
if(FP==1&&A>B)
return;
if(GRID[Math.floor((VAL-10)/3)][(VAL-10)%3])
return;
GRID[Math.floor((VAL-10)/3)][(VAL-10)%3]=FP;
if(FP==-1)
VAL+=10;
BEAT.set(MAIN,Date.now());
SEND(CLIENT.get(X),VAL);
SEND(CLIENT.get(Pairs.get(X)),VAL);
SEND(CLIENT.get(X),31);
SEND(CLIENT.get(Pairs.get(X)),30);
for(let i=0;i<3;i++){
if(GRID[i][0]+GRID[i][1]+GRID[i][2]==3){
WINNER(MAIN,0);
return;
}
else if(GRID[i][0]+GRID[i][1]+GRID[i][2]==-3){
WINNER(Pairs.get(MAIN),0);
return;
}
else if(GRID[0][i]+GRID[1][i]+GRID[2][i]==3){
WINNER(MAIN,0);
return;
}
else if(GRID[0][i]+GRID[1][i]+GRID[2][i]==-3){
WINNER(Pairs.get(MAIN),0);
return;
}
}
if(GRID[0][0]+GRID[1][1]+GRID[2][2]==3)
WINNER(MAIN,0);
else if(GRID[0][0]+GRID[1][1]+GRID[2][2]==-3)
WINNER(Pairs.get(MAIN),0);
else if(GRID[2][0]+GRID[1][1]+GRID[0][2]==3)
WINNER(MAIN,0);
else if(GRID[2][0]+GRID[1][1]+GRID[0][2]==-3)
WINNER(Pairs.get(MAIN),0);
let DRAW=1;
for(let i=0;i<3;i++){
for(let l=0;l<3;l++){
if(!GRID[i][l])
DRAW=0;
}
}
if(DRAW==1)
WINNER(MAIN,1);
}
http.createServer(function (req, res){
if(req.url==='/'){
fs.readFile('index.html', function(err, data) {
if (err) throw err;
res.writeHead(200, {'Content-Type': 'text/html'});
res.write(data);
return res.end();
});
}
else if(req.url === '/style.css') {
fs.readFile('style.css',function(err,data){
if (err) throw err;
res.writeHead(200,{"Content-Type": "text/css"});
res.write(data);
return res.end();
});
}
}).listen(80,'0.0.0.0');
wss.on("connection",(F,req)=>{
F.on("message",(message)=>{
message=JSON.parse(message);
var Val=message[1];
let M2="";
if(Val==-1){
M2=message[2];
}
console.log(M2);
if(Val.toString().length>=3){
console.log(Val);
Users.set(message[0],0);
CLIENT.set(message[0],F);
Names.set(message[0],Val);
}
if(Names.has(message[0])){
if((Val==1||Val==-1)&&Users.get(message[0])==0){
Users.set(message[0],1);
if(ROOM.has(M2)){
X=ROOM.get(M2);
if(CLIENT.get(X).readyState != CLIENT.get(X).OPEN){
ROOM.delete(M2);
}
}
if(ROOM.has(M2)){
X=ROOM.get(M2);
if(X!=message[0]){
F.send(2);
Users.set(message[0],2);
Users.set(X,2);
SEND(F,2);
SEND(F,Names.get(X));
SEND(CLIENT.get(X),2);
SEND(CLIENT.get(X),Names.get(message[0]));
MATCHMAKE(message[0],X);
ROOM.delete(M2);
}
else{
SEND(F,1);
}
}
else{
ROOM.set(M2,message[0]);
SEND(F,1);
}
}
if(Val>=10&&Val<=18&&Users.get(message[0])==2){
MATCHPROCESS(message[0],Val);
}
}
});
});
