// Deadlines bound the UI wait, not the SDK operation: a queued write may still commit.
export function deadline(promise,ms=15000,message='Connection is taking too long. Check your connection and try again.'){
 let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error(message),{code:'network/timeout'})),ms);})]).finally(()=>clearTimeout(timer));
}

export function connectionRecovery({subscribe,disconnect,connect,events=window,visibility=document,network=navigator,retryMs=8000}){
 let connected=false,paused=false,timer,delay=retryMs,lastKick=0,hiddenAt=0;
 const listeners=new Set();
 const notify=value=>{connected=value;for(const next of listeners)next(value);};
 function schedule(){clearTimeout(timer);if(!connected&&!paused)timer=setTimeout(()=>{recover();delay=Math.min(delay*2,30000);schedule();},delay);}
 function recover(force=false){
  if(paused||network.onLine===false||visibility.hidden)return;
  if(!force&&Date.now()-lastKick<1000)return;
  lastKick=Date.now();disconnect();connect();
 }
 const stop=subscribe(value=>{notify(value);if(value)delay=retryMs;schedule();});
 const online=()=>{paused=false;recover(true);schedule();};
 const offline=()=>{disconnect();notify(false);schedule();};
 const visible=()=>{if(visibility.hidden){hiddenAt=Date.now();return;}if(!connected||Date.now()-hiddenAt>15000)recover(true);schedule();};
 const shown=e=>{if(e.persisted)online();};
 network.connection?.addEventListener('change',online);
 events.addEventListener('online',online);events.addEventListener('offline',offline);events.addEventListener('pageshow',shown);visibility.addEventListener('visibilitychange',visible);
 return {
  watch(next){listeners.add(next);next(connected);return ()=>listeners.delete(next);},
  async ready(){if(connected)return;let unwatch;try{await deadline(new Promise(resolve=>{unwatch=this.watch(value=>{if(value)resolve();});}));}finally{unwatch?.();}},
  recover(){recover(true);schedule();},
  setOnline(value){paused=!value;if(value){recover(true);schedule();}else{clearTimeout(timer);disconnect();notify(false);}},
  stop(){clearTimeout(timer);stop();listeners.clear();network.connection?.removeEventListener('change',online);events.removeEventListener('online',online);events.removeEventListener('offline',offline);events.removeEventListener('pageshow',shown);visibility.removeEventListener('visibilitychange',visible);}
 };
}
