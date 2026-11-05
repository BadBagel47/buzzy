// firebase-tools 15.34.2 creates a ProxyAgent even for NO_PROXY loopback URLs.
// Keep the inherited proxy for all external traffic; honor exact loopback exclusions.
const undici=require(require.resolve('undici',{paths:[require.resolve('firebase-tools/package.json')]}));
const OriginalProxyAgent=undici.ProxyAgent;
const direct=new undici.Agent();
const noProxy=new Set((process.env.NO_PROXY||process.env.no_proxy||'').split(',').map(s=>s.trim().toLowerCase()));
const loopbacks=new Set(['localhost','127.0.0.1','::1','[::1]']);
undici.ProxyAgent=class extends OriginalProxyAgent{
  dispatch(options,handler){
    const url=new URL(options.origin);
    if(url.protocol==='http:'&&loopbacks.has(url.hostname)&&noProxy.has(url.hostname))return direct.dispatch(options,handler);
    return super.dispatch(options,handler);
  }
};
