
const CPU = new Worker("js/rijsc_core.js");
let SCREEN;

function MessageManager(){
  
  const PromiseWrapper = function(){
    this.promise = new Promise((res)=>(this.resolve=res));
  }
  
  const Tasks = {};
  const createId = function(){
    let str = "";
    for(let i = 0; i < 8; i++){
      str += Math.floor(Math.random() * 256).toString(16)
    }
    return str
  };
  
  this.Task = function(obj){
    let taskId = createId();
    let handle = new PromiseWrapper();
    Tasks[taskId] = handle;
    obj.taskId = taskId;
    CPU.postMessage(obj)
    
    return handle.promise
    
  }
  
  CPU.onmessage = function(event){
    if(event.data.hasOwnProperty("confirm")){
      console.log(event.data.confirm);
    }
    let task = Tasks[event.data.taskId];
    if(task){
      task.resolve(event.data.result);
      delete Tasks[event.data.taskId];
    }
  }
  
}


const sampleText = 
`

ldb 0
lda 0
jmp $start

:putPixel
and ax 1
mul ax 255
mov bx ax
mov ax dx

vwr ax bx
inc ax
vwr ax bx
inc ax
vwr ax bx
inc ax
vwr ax 255
inc ax
mov dx ax
rts 0

:printChar
mul ex 8
mov ex ax
mov fx 8
mul dx 4
mov dx ax

:charLineLoop
mrd cx ex

shr cx 7
jsr $putPixel
shr cx 6
jsr $putPixel
shr cx 5
jsr $putPixel
shr cx 4
jsr $putPixel
shr cx 3
jsr $putPixel
shr cx 2
jsr $putPixel
shr cx 1
jsr $putPixel
shr cx 0
jsr $putPixel

add dx 368
mov dx ax

inc ex

sub fx 1
mov fx ax

jbe 1 $charLineLoop

rts 0

:start
mwr ax 0
inc ax
mwr ax 0
inc ax
mwr ax 0
inc ax
mwr ax 255
inc ax
jab 400 $start
lda 0
mov fx 400

:copyLoop
vcp bx ax
add ax fx
jab 40000 $copyLoop

#load chars
chl 0

#print chars
mov dx 202
mov ex 7
jsr $printChar
mov dx 211
mov ex 4
jsr $printChar
mov dx 220
mov ex 11
jsr $printChar
mov dx 229
mov ex 11
jsr $printChar
mov dx 238
mov ex 14
jsr $printChar
mov dx 1202
mov ex 22
jsr $printChar
mov dx 1211
mov ex 14
jsr $printChar
mov dx 1220
mov ex 17
jsr $printChar
mov dx 1229
mov ex 11
jsr $printChar
mov dx 1238
mov ex 3
jsr $printChar
ret 0
`;

function loadSample(){
  const area = document.querySelector("#programCode");
  if(area.value){
    if(!window.confirm("textfield contents will be replaced. Are you sure?")){
      return
    }
  }
  area.value = sampleText;
}

function print(s){
  document.querySelector("#output").textContent = s
}

function startCPU(){
  CPU.postMessage({"action":true})
}

function runTask(a){
  MM.Task(a)
  .then((a)=>{
    if(a instanceof ImageData){
      SCREEN.putImageData(a,0,0);
    }else{
      print(a)
    }
  },
  (s)=>print(s))
}

console.log("done");

const MM = new MessageManager();
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    document.querySelector("#button").addEventListener("click",()=>runTask({"code":document.querySelector("textarea").value,"type":document.querySelector("#isFrameOutput").checked ? "frame" : "value"}));
    document.querySelector("#startbutton").addEventListener("click",()=>startCPU());
    SCREEN = document.querySelector("#screen").getContext("2d");
    document.querySelector("#sampleButton").addEventListener("click",loadSample);

  }
  
}
