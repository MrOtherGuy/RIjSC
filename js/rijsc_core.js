'use strict';

function n16BitField(o,i,aNames){
  for(let idx = 0; idx < aNames.length; idx++){
    Object.defineProperty(this,aNames[idx],{get:()=>((o[i] & (0x1 << idx)) > 0 ), set: (v)=>(o[i] = v ? o[i]|(0x1 << idx) : o[i]&(0xffff ^ (0x1 << idx)) )})
  }
  return Object.freeze(this)
}

function PromiseWrapper(){
  this.promise = new Promise((res)=>(this.resolve=res));
}

(function(){
  
  const Rvalue = (s) => (R[s]||(Number(s)|0)||0);
  
  const opCodes = new Map([

    /* lda */ [0,   (a)      => (R[0] = a)],
              [64,  (pc)     => (R[0] = R[6])],
    /* ldb */ [1,   (a)      => (R[1] = a)],
              [65,  (pc)     => (R[1] = R[6])],
    /* add */ [2,   (a,b)    => (R[0] = a + b)],
              [66,  (ra,b)   => (R[0] = R[ra] + b)],
              [194, (ra,rb)  => (R[0] = R[ra] + R[rb])],
    /* mul */ [3,   (a,b)    => (R[0] = a * b)],
              [67,  (ra,b)   => (R[0] = R[ra] * b)],
              [195, (ra,rb)  => (R[0] = R[ra] * R[rb])],
    /* mov */ [68,  (r,b)    => (R[r] = b)],
              [196, (r,b)    => (R[r] = R[b])],
    /* jmp */ [5,   (a)      => (R[6] = a)],
              [69,  (ra)     => (R[6] = R[ra])],
    /* jne */ [6,   (a,b)    => { if(R[0] != a){ R[6] = b } }],
              [70,  (ra,b)   => { if(R[0] != R[ra]){ R[6] = b } }],
              [198, (ra,rb)  => { if(R[0] != R[ra]){ R[6] = R[rb] } }],
    /* jmr */ [7,   (a,b)    => (R[6] += ((b ? -1 : 1 ) * a - 3))],
    /* jsr */ [8,   (adr)    => (STACK.push(R[6]),R[6] = adr)],  // R[6] here is the address of the next instr - ie. instr that would be executed after return
    /* rts */ [9,   ()       => (R[6] = STACK.pop())],
    /* ret */ [10,  ()       => (Registers.status.I = true)],
    /* sub */ [11,  (a,b)    => (R[0] = a - b)],
              [75,  (ra,b)   => (R[0] = R[ra] - b)],
              [203, (ra,rb)  => (R[0] = R[ra] - R[rb])],
    /* pop */ [76,  (ra)     => (R[ra] = STACK.pop())],
    /* push */[13,  (a)      => (STACK.push(a))],
    /* jbe */ [14,  (a,b)    => { if(R[0] >= a){ R[6] = b } }],
              [78,  (ra,b)   => { if(R[0] >= R[ra]){ R[6] = b } }],
              [206, (ra,rb)  => { if(R[0] >= R[ra]){ R[6] = R[rb] } }],
    /* jab */ [15,  (a,b)    => { if(R[0] < a){ R[6] = b } }],
              [79,  (ra,b)   => { if(R[0] < R[ra]){ R[6] = b } }],
              [207, (ra,rb)  => { if(R[0] < R[ra]){ R[6] = R[rb] } }],
    /* and */ [16,  (a,b)    => (R[0] = a & b)],
              [80,  (ra,b)   => (R[0] = R[ra] & b)],
              [208, (ra,rb)  => (R[0] = R[ra] & R[rb])],
    /* or */  [17,  (a,b)    => (R[0] = a | b)],
              [81,  (ra,b)   => (R[0] = R[ra] | b)],
              [209, (ra,rb)  => (R[0] = R[ra] | R[rb])],
    /* xor */ [18,  (a,b)    => (R[0] = a ^ b)],
              [82,  (ra,b)   => (R[0] = R[ra] ^ b)],
              [210, (ra,rb)  => (R[0] = R[ra] ^ R[rb])],
    /* shl */ [19,  (a,b)    => (R[0] = a << (b & 0xf))],
              [83,  (ra,b)   => (R[0] = R[ra] << (b & 0xf))],
              [211, (ra,rb)  => (R[0] = R[ra] << (R[rb] & 0xf))],
    /* shr */ [20,  (a,b)    => (R[0] = a >> (b & 0xf))],
              [84,  (ra,b)   => (R[0] = R[ra] >> (b & 0xf))],
              [212, (ra,rb)  => (R[0] = R[ra] >> (R[rb] & 0xf))],
    /* div */ [21,  (a,b)    => (R[0] = (a / b) & 0xffff)],
              [85,  (ra,b)   => (R[0] = (R[ra] / b) & 0xffff)],
              [213, (ra,rb)  => (R[0] = (R[ra] / R[rb]) & 0xffff)],
    /* mrd */ [86,  (ra,b)   => (R[ra] = MEMORY[b])],
              [214, (ra,rb)  => (R[ra] = MEMORY[R[rb]])],
    /* mwr */ [23,  (a,b)    => (MEMORY[a] = b & 0xff )],
              [87,  (ra,b)   => (MEMORY[R[ra]] = b & 0xff)],
              [215, (ra,rb)  => (MEMORY[R[ra]] = R[rb] & 0xff)],
    /* vwr */ [24,  (a,b)    => (FRAMEBUFFER[a] = b & 0xff)],
              [88,  (ra,b)   => (FRAMEBUFFER[R[ra]] = b & 0xff)],
              [216, (ra,rb)  => (FRAMEBUFFER[R[ra]] = R[rb] & 0xff)],
    /* vcp */ [25,  (ad,bd)  => (FRAMEBUFFER.set(MEMORY.subarray(ad,ad + R[5]), bd))],
              [89,  (rad,bd) => (FRAMEBUFFER.set(MEMORY.subarray(R[rad],R[rad] + R[5]), bd))],
              [217, (rad,rbd)=> (FRAMEBUFFER.set(MEMORY.subarray(R[rad],R[rad] + R[5]), R[rbd]))],
    /* chl */ [26,  (adr)    => (MEMORY.set(CHARMAP,adr))],
              [90,  (rdr)    => (MEMORY.set(CHARMAP,R[rdr]))],
    /* inc */ [91,  (ra)     => (R[ra] += 1)],
    /* dec */ [92,  (ra)     => (R[ra] -= 1)]
    
  ]);
  
  const opCodeBaseMap = {
      lda: 0,
      ldb: 1,
      add: 2,
      mul: 3,
      mov: 4,
      jmp: 5,
      jne: 6,
      jmr: 7,
      jsr: 8,
      rts: 9,
      ret: 10,
      sub: 11,
      jbe: 14,
      jab: 15,
      and: 16,
      or:  17,
      xor: 18,
      shl: 19,
      shr: 20,
      div: 21,
      mrd: 22,
      mwr: 23,
      vwr: 24,
      vcp: 25,
      chl: 26,
      inc: 27,
      dec: 28
    };
    
  const R = new Uint16Array(8);
  
  const Registers = new (function(){
    
    Object.defineProperty(this,"ax",{ value: 0 });
    Object.defineProperty(this,"bx",{ value: 1 });
    Object.defineProperty(this,"cx",{ value: 2 });
    Object.defineProperty(this,"dx",{ value: 3 });
    Object.defineProperty(this,"ex",{ value: 4 });
    Object.defineProperty(this,"fx",{ value: 5 });
    Object.defineProperty(this,"pc",{ value: 6 });
    
    Object.defineProperty(this,"pco",{ get: ()=>R[6]++, set: (a)=>(R[6] = a) });
    Object.defineProperty(this,"status",{value: new n16BitField(R,7,["Z","C","I"])});
    
    return Object.freeze(this)

  })();
  
  const QUEUE = new (function(){
    const data = Array(64);
    let pointer = data.length;

    this.push = (task) => (pointer -= (pointer > 0) ? 1 : 0,data[pointer] = task);
    this.pop = ()=>((pointer < 64) ? data[pointer++] : null);
    
    return Object.freeze(this)
  })();
  
  const RAM = new ArrayBuffer(65536);
  const FRAMEBUFFER = new Uint8ClampedArray(40000) // 100 x 100 x R G B A 
  
  const CHARMAP = Uint8Array.from([
    8, 20, 20, 34, 34, 126, 65, 129,
    120, 68, 66, 124, 68, 66, 66, 124,
    28, 34, 64, 64, 64, 64, 66, 60,
    124, 66, 67, 65, 65, 65, 66, 124,
    126, 64, 64, 124, 64, 64, 64, 126,
    126, 64, 64, 124, 64, 64, 64, 64,
    28, 34, 64, 64, 79, 65, 66, 60,
    66, 66, 66, 126, 66, 66, 66, 66,
    16, 16, 16, 16, 16, 16, 16, 16,
    8, 8, 8, 8, 8, 72, 72, 48,
    66, 68, 72, 112, 112, 72, 68, 66,
    64, 64, 64, 64, 64, 64, 64, 124,
    36, 36, 90, 66, 66, 129, 129, 129,
    66, 98, 82, 82, 74, 74, 70, 66,
    28, 34, 65, 65, 65, 65, 66, 60,
    124, 66, 66, 124, 64, 64, 64, 64,
    28, 34, 65, 65, 65, 69, 66, 61,
    124, 66, 66, 124, 80, 72, 68, 66,
    60, 64, 64, 64, 60, 2, 2, 124,
    254, 16, 16, 16, 16, 16, 16, 16,
    66, 66, 66, 66, 66, 66, 66, 60,
    66, 66, 66, 66, 66, 36, 40, 16,
    129, 129, 129, 66, 66, 74, 90, 36,
    129, 66, 36, 24, 24, 36, 66, 129,
    130, 68, 40, 16, 16, 16, 16, 16,
    126, 2, 4, 8, 16, 32, 64, 126
  ]);
  
  let MEMORY; // Initialized when a program loads
  let currentOp = "";
  
  const cpuState = new (function(){
    let internal = 0;
    
    this.set = (v)=>(internal = v);
    this.get = ()=>{
      switch(internal){
        case 0:
          return "idle"
        case 1:
          return "compiling"
        case 2:
          return "busy"
        case 3:
          return "illegal op-code"
        case 4:
          return "invalid register name"
        case 5:
          return "Runtime error"
        case 6:
          return "invalid label"
        default:
          return "undefined state"
      }
    };
    
    return this
  })();
  
  // This should handle incorrect number of arguments somehow
  const encodeInstruction = (code,labels,unresolved)=>{
    let args = code.split(" ").filter(a=>a);
    //currentOp = args[0];
    let v = new Uint16Array(args.length);
    let op = opCodeBaseMap[args[0]];
    let flagUnresolved = 0;
    if(op === undefined){
      currentOp = args[0];
      throw 3
    }else{
      for(let arg_i = 1; arg_i < v.length; arg_i++){
        if(args[arg_i][0] === "$"){
          let name = args[arg_i].substring(1).trim();
          let addr = labels.get(name);
          if(addr === undefined){
            if(!unresolved.has(name)){
              unresolved.set(name,[])
            }
            flagUnresolved |= arg_i;
            v[arg_i] = 0xffff;
            //throw 6
          }else{
            // label exists already
            v[arg_i] = addr;
          }
        }else{
          if(Registers.hasOwnProperty(args[arg_i])){
            if(args[arg_i].length != 2){
              currentOp = args[arg_i];
              throw 4
            }
            op |= (32 << arg_i);
            v[arg_i] = Registers[args[arg_i]];
          }else{
            v[arg_i] = Number(args[arg_i]) | 0
          }
        }
      }
      // Most significant bit tells if this is 2 or 3 words long
      v[0] = op|((args.length-2) << 15);
      v[0] |= (flagUnresolved << 13);

    }
    return v
  };
  
  const STACK = new (function(){
    const data = new Uint16Array(256);
    let pointer = data.length - 1;
    
    
    this.push = (val)=>(pointer--,data[pointer + 1] = val&0xffff);
    this.pop = ()=>(data[++pointer]);
    this.reset = ()=>(data.fill(0),pointer = data.length - 1);
    return Object.freeze(this)
  })();
  
  
  
  // Save the program to ram
  const compileAndLoad = function(task){ // task = { taskId, code }
    let lines = task.code.split("\n");
    let ramView = new Uint16Array(RAM);
    let labels = new Map(); // holds found label addresses
    let unresolvedLabels = new Map();
    
    let ramIdx = 0;
    try{
      for (let line of lines){
        if(line.length === 0 || line[0] === "#"){
          continue
        }
        //let labelname = (line[0] === ":") ? line.substring(1).trim() : "";
        if(line[0] === ":"){
          let name = line.substring(1).trim();
          let unresolved = unresolvedLabels.get(name);
          if(unresolved && unresolved.length){
            for(let adr of unresolved){
              ramView[adr] = ramIdx;
            }
            unresolvedLabels.delete(name);
          }
          
          labels.set(name,ramIdx);
        }else{
          let op = encodeInstruction(line,labels,unresolvedLabels);
          if(op[0] & 0x6000){
            let token = line.split(" ").filter(a=>a[0]==="$")[0].substring(1);
            unresolvedLabels.get(token).push(ramIdx+(op[0]>>13));
          }
          ramView[ramIdx++] = op[0] & 0xbfff;
          ramView[ramIdx++] = op[1];
          if(op.length > 2){
            ramView[ramIdx++] = op[2];
          }
        }
      }
      if(unresolvedLabels.size > 0){
        cpuState.set(1);
        currentOp = "Program has unresolved labels";
        return 1
      }
      // insert ret 0 to the end
      ramView[ramIdx++] = 0xa;
      ramView[ramIdx++] = 0x0;
      
      // Set program accessible memory to point to RAM offset by the size of the program
      MEMORY = new Uint8Array(RAM,(ramIdx + 1) * 2);
      
    }catch(err){
      cpuState.set(err);
      return 1
    }
    currentOp = "somewhere"
    return 0
  }
  
  const reset = function(){
    //let r = new Uint16Array(RAM);
    //r.fill(0);
    currentOp = "";
    Registers.status.I = false;
    Registers.pco = 0;
    STACK.reset();
    return 0
  };
  
  const executeProgram = function(){
    Registers.pco = 0;
    const ram = new Uint16Array(RAM);
    try{
      while(!Registers.status.I){
        const code = ram[Registers.pco];
        const op = code & 0x7fff;
        const instruction = opCodes.get(op & 0x1fff);
        if(op === code){
          instruction(ram[Registers.pco])
        }else{
          instruction(ram[Registers.pco],ram[Registers.pco])
        }
      }
    }catch(err){
      cpuState.set(5);
      console.log(err);
      return 1
    }
    Registers.status.I = false
    return 0
  };
  
  const runTask = function(task){ // task = { taskId, code }
    if(typeof(task.code) === "string"){
      let state = compileAndLoad(task);
      if(state){
        return 1
      }
      
      cpuState.set(2);
      
      return executeProgram()
    }
    return 1
  }
  
  
  
  const runningTask = function(data){
    reset();
    cpuState.set(1);
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        let result = runTask(data);
        if(result){
          reject(`Exception: ${cpuState.get()} @ ${currentOp}`)
        }
        switch(data.type){
          case "value":
            resolve(R[0]);
            break;
          case "frame":
            resolve(new ImageData(FRAMEBUFFER,100));
            break;
          case "memory":
            resolve(1);
            break;
          default:
            resolve(R[0]);
        }
      },500)
    });
  }
  // Messaging from main thread
  self.addEventListener("message",(event) => {
    let data = event.data;
    // Start the thing if message had action property
    if(data.action){
      switch (data.action){
        case "start":
          postMessage({"confirm":"Received startup code"});
          start();
          break;
        case "stop":
          postMessage({"confirm":"Stopping and Clearing tasks"});
          stop();
          break;
        case "pause":
          postMessage({"confirm":"Pausing execution"});
          pause();
          break;
        default:
          postMessage({"confirm":"LOLno"})
      }
    // If data has taskId it's pushed to task LIFO
    }else if(data.taskId){
      postMessage({"confirm":"Received: " + event.data.taskId});
      const task = { "data": event.data, "handle": new PromiseWrapper() };
      QUEUE.push(task);
      task.handle.promise
      // Send the result back when done
      .then((res)=>{
        postMessage({"taskId":task.data.taskId,"result":res})
      },
      (err) => (console.log(err),postMessage({"taskId":task.data.taskId,"result":err})))
      .finally(()=>(cpuState.set(0)))
    }
  });
  // Start cpu - called via "action" message
  // Once a second this will check if the cpu is busy and run the latest task in the queue/filo if there is any
  // This will then resolve the task-promise
  const start = ()=>( setInterval(()=>{
    if(cpuState.get()!="idle"){
      return
    }
    let task = QUEUE.pop();
    if(task){
      runningTask(task.data)
      .then(
        (b) => task.handle.resolve(b),
        (err) => task.handle.resolve(err)
      ).finally(()=>cpuState.set(0));
    }
  }, 1000 ) );
  
  const stop = ()=>(true);
  
  const pause = ()=>(false);
  
})();
