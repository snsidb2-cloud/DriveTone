
(() => {
  const $ = id => document.getElementById(id);
  const ui = {
    speed:$('speed'),rpm:$('rpm'),gear:$('gear'),accel:$('accel'),throttle:$('throttle'),boost:$('boost'),accuracy:$('accuracy'),source:$('source'),
    gauge:$('gauge'),road:$('roadSurface'),speedGlow:$('speedGlow'),shiftFlash:$('shiftFlash'),gpsDot:$('gpsDot'),gpsText:$('gpsText'),
    demoSpeed:$('demoSpeed'),demoValue:$('demoValue'),sensitivity:$('sensitivity'),sensValue:$('sensValue'),volume:$('volume'),volValue:$('volValue'),
    exhaust:$('exhaust'),exhaustValue:$('exhaustValue'),popMode:$('popMode'),engineType:$('engineType'),modeGroup:$('modeGroup'),sampleStatus:$('sampleStatus'),modelInfo:$('modelInfo'),
    motionBtn:$('motionBtn'),coldStartBtn:$('coldStartBtn'),revDemoBtn:$('revDemoBtn'),driveModeBtn:$('driveModeBtn'),exitDriveMode:$('exitDriveMode'),driveHud:$('driveHud'),driveGpsDot:$('driveGpsDot'),driveGpsText:$('driveGpsText'),driveAudioDot:$('driveAudioDot'),driveAudioText:$('driveAudioText'),driveEngineText:$('driveEngineText'),driveModeText:$('driveModeText'),
    driveCanvas:$('driveCanvas'),visualHud:$('visualHud'),visualSpeed:$('visualSpeed'),visualRpm:$('visualRpm'),visualGear:$('visualGear'),visualBoost:$('visualBoost'),visualRpmFill:$('visualRpmFill'),visualBoostFill:$('visualBoostFill'),visualSceneTag:$('visualSceneTag'),sceneType:$('sceneType'),teslaCarStage:$('teslaCarStage'),teslaCarLabel:$('teslaCarLabel'),teslaModel:$('teslaModel'),carSize:$('carSize'),colorGrid:$('colorGrid'),teslaMiniInfo:$('teslaMiniInfo'),sceneEdgeZone:$('sceneEdgeZone'),sceneDrawer:$('sceneDrawer'),sceneDrawerOverlay:$('sceneDrawerOverlay'),sceneDrawerClose:$('sceneDrawerClose'),sceneDrawerList:$('sceneDrawerList'),weatherAutoBtn:$('weatherAutoBtn'),weatherRefreshBtn:$('weatherRefreshBtn'),weatherLiveStatus:$('weatherLiveStatus')
  };

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;

  class RoadViz{
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.distance=0;this.lastW=0;this.lastH=0;this.dpr=1;this.scene='highway';
      window.addEventListener('resize',()=>this.resize(true),{passive:true});this.resize(true);
    }
    setScene(scene){this.scene=scene||'highway';}
    resize(force=false){
      if(!this.canvas)return;const r=this.canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!force&&Math.abs(r.width-this.lastW)<1&&Math.abs(r.height-this.lastH)<1&&dpr===this.dpr)return;
      this.lastW=r.width;this.lastH=r.height;this.dpr=dpr;this.canvas.width=Math.max(1,Math.round(r.width*dpr));this.canvas.height=Math.max(1,Math.round(r.height*dpr));this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    _project(z,w,h,horizon,curve=0){const zz=Math.max(2.6,z),cameraHeight=1.32,roadHalfMeters=5.25,focalY=h*1.42,focalX=w*.78,y=horizon+(focalY*cameraHeight)/zz,half=(focalX*roadHalfMeters)/zz,p=clamp((y-horizon)/Math.max(1,h-horizon),0,1),center=w*.5+curve*p;return {y,half,center,p};}
    _sky(w,h,horizon,scene){
      const c=this.ctx;let g=c.createLinearGradient(0,0,0,horizon);
      if(scene==='city' || scene==='night'){g.addColorStop(0,scene==='night'?'#02060d':'#07101f');g.addColorStop(.55,scene==='night'?'#0a1322':'#17233a');g.addColorStop(1,scene==='night'?'#19283b':'#da6d4e');}
      else if(scene==='tunnel'){g.addColorStop(0,'#080a0d');g.addColorStop(1,'#14171a');}
      else if(scene==='sunny'){g.addColorStop(0,'#5eb8ff');g.addColorStop(.62,'#bce7ff');g.addColorStop(1,'#eef6ff');}
      else if(scene==='cloudy'){g.addColorStop(0,'#77818d');g.addColorStop(.6,'#aeb7c0');g.addColorStop(1,'#dde3e8');}
      else if(scene==='sunset'){g.addColorStop(0,'#4d379d');g.addColorStop(.45,'#bb5d76');g.addColorStop(1,'#ffb16a');}
      else if(scene==='rainy' || scene==='storm'){g.addColorStop(0,scene==='storm'?'#161b23':'#2a3341');g.addColorStop(.55,scene==='storm'?'#343f4d':'#556273');g.addColorStop(1,scene==='storm'?'#606c78':'#8894a0');}
      else if(scene==='foggy'){g.addColorStop(0,'#8b9498');g.addColorStop(.55,'#b9c0c3');g.addColorStop(1,'#d9dddd');}
      else if(scene==='snowy'){g.addColorStop(0,'#8298ac');g.addColorStop(.55,'#bed1df');g.addColorStop(1,'#eef5f9');}
      else{g.addColorStop(0,'#06101c');g.addColorStop(.58,'#132238');g.addColorStop(1,'#c26a52');}
      c.fillStyle=g;c.fillRect(0,0,w,horizon+2);
      if(scene==='sunny'){const sun=c.createRadialGradient(w*.78,horizon*.35,0,w*.78,horizon*.35,w*.16);sun.addColorStop(0,'rgba(255,245,190,.97)');sun.addColorStop(.35,'rgba(255,238,160,.58)');sun.addColorStop(1,'rgba(255,230,150,0)');c.fillStyle=sun;c.fillRect(0,0,w,horizon+10);}
      else if(scene==='cloudy' || scene==='rainy' || scene==='storm' || scene==='foggy' || scene==='snowy'){c.fillStyle=(scene==='rainy'||scene==='storm')?'rgba(214,224,234,.20)':scene==='foggy'?'rgba(248,250,250,.32)':scene==='snowy'?'rgba(248,252,255,.28)':'rgba(240,245,250,.22)';for(let i=0;i<7;i++){const x=(i/6)*w-(w*.08),y=horizon*(.18+.08*(i%3)),ww=w*(.18+.04*(i%2)),hh=horizon*.09;c.beginPath();c.ellipse(x,y,ww*.28,hh*.48,0,0,Math.PI*2);c.ellipse(x+ww*.18,y-8,ww*.22,hh*.42,0,0,Math.PI*2);c.ellipse(x+ww*.36,y,ww*.26,hh*.50,0,0,Math.PI*2);c.fill();}}
      else if(scene==='city' || scene==='night'){c.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<36;i++){const x=(i*83.13)%w,y=(i*41.9)%(horizon*.55),r=(i%5===0)?1.4:.8;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}const moon=c.createRadialGradient(w*.80,horizon*.22,0,w*.80,horizon*.22,w*.06);moon.addColorStop(0,'rgba(245,246,255,.95)');moon.addColorStop(1,'rgba(245,246,255,0)');c.fillStyle=moon;c.fillRect(0,0,w,horizon);}
      else if(scene!=='tunnel'){const glow=c.createRadialGradient(w*.72,horizon*.76,0,w*.72,horizon*.76,w*.28);glow.addColorStop(0,'rgba(255,154,101,.35)');glow.addColorStop(1,'rgba(255,120,80,0)');c.fillStyle=glow;c.fillRect(0,0,w,horizon+30);}
    }
    _skyline(w,horizon,scene){
      if(scene==='tunnel')return;const c=this.ctx,base=horizon+2;
      if(scene==='city'){
        c.fillStyle='#0a0d13'; const count=28;
        for(let i=0;i<count;i++){const x=(i/count)*w-8,ww=w/count*(.55+((i*37)%31)/40),hh=48+((i*53)%97)*.75;c.fillRect(x,base-hh,ww,hh);
          if(ww>16){c.fillStyle='rgba(255,210,124,.24)';for(let yy=base-hh+10;yy<base-6;yy+=15)for(let xx=x+8;xx<x+ww-4;xx+=13)if(((xx+yy+i)|0)%3===0)c.fillRect(xx,yy,2,3);c.fillStyle='#0a0d13';}}
        return;
      }
      // distant hills / tree line
      c.beginPath(); c.moveTo(0,base+2);
      const amp=scene==='sunset'?18:(scene==='sunny'?14:10), cols=scene==='sunny'?'#4b6032':scene==='cloudy'?'#4d5550':(scene==='rainy'||scene==='storm')?'#39434a':scene==='snowy'?'#aab8c1':scene==='foggy'?'#8b9491':scene==='night'?'#0c1118':'#20242b';
      for(let x=0;x<=w;x+=w/9){const y=base-18-Math.sin((x/w)*Math.PI*2.4+1.1)*amp-Math.cos((x/w)*Math.PI*4.2)*amp*.34;c.lineTo(x,y);} c.lineTo(w,base+20); c.lineTo(0,base+20); c.closePath(); c.fillStyle=cols; c.fill();
      if(scene==='sunny' || scene==='cloudy' || scene==='rainy' || scene==='storm' || scene==='foggy' || scene==='snowy'){c.fillStyle=scene==='sunny'?'rgba(48,66,36,.75)':scene==='cloudy'?'rgba(57,64,58,.78)':'rgba(47,55,62,.75)';for(let i=0;i<26;i++){const x=(i/25)*w+((i*17)%13)-8,y=base-6-((i*31)%14),r=6+((i*23)%8);c.beginPath();c.moveTo(x,y-r);c.arc(x-r*.5,y-r*.3,r*.45,0,Math.PI*2);c.arc(x+r*.1,y-r*.55,r*.55,0,Math.PI*2);c.arc(x+r*.55,y-r*.2,r*.48,0,Math.PI*2);c.fill();}}
    }
    _road(w,h,horizon,curve,scene){
      const c=this.ctx,far=this._project(220,w,h,horizon,curve),near=this._project(2.6,w,h,horizon,curve);
      // shoulders
      c.beginPath();c.moveTo(far.center-far.half*1.12,far.y);c.lineTo(far.center+far.half*1.12,far.y);c.lineTo(near.center+near.half*1.12,near.y);c.lineTo(near.center-near.half*1.12,near.y);c.closePath();
      const sg=c.createLinearGradient(0,horizon,0,h);sg.addColorStop(0,scene==='sunny'?'#6a7547':scene==='cloudy'?'#636860':scene==='rainy'?'#495059':scene==='city'?'#231a18':scene==='sunset'?'#4a372d':'#1d1f23');sg.addColorStop(1,scene==='sunny'?'#1e2318':scene==='rainy'?'#161b22':'#0d1013');c.fillStyle=sg;c.fill();
      // road body
      c.beginPath();c.moveTo(far.center-far.half,far.y);c.lineTo(far.center+far.half,far.y);c.lineTo(near.center+near.half,near.y);c.lineTo(near.center-near.half,near.y);c.closePath();
      const rg=c.createLinearGradient(0,horizon,0,h);if(scene==='tunnel'){rg.addColorStop(0,'#1a1c1e');rg.addColorStop(1,'#090a0b');}else if(scene==='sunny'){rg.addColorStop(0,'#4a4c50');rg.addColorStop(.72,'#23272b');rg.addColorStop(1,'#111317');}else if(scene==='cloudy'){rg.addColorStop(0,'#3e4145');rg.addColorStop(.72,'#202328');rg.addColorStop(1,'#101215');}else if(scene==='rainy'||scene==='storm'){rg.addColorStop(0,scene==='storm'?'#2d333b':'#404850');rg.addColorStop(.72,scene==='storm'?'#171c23':'#222932');rg.addColorStop(1,'#0b0e12');}else if(scene==='foggy'){rg.addColorStop(0,'#555b5d');rg.addColorStop(.72,'#2e3335');rg.addColorStop(1,'#171a1c');}else if(scene==='snowy'){rg.addColorStop(0,'#535a60');rg.addColorStop(.72,'#2c3237');rg.addColorStop(1,'#171b1f');}else if(scene==='night'){rg.addColorStop(0,'#282c33');rg.addColorStop(.72,'#15191f');rg.addColorStop(1,'#090b0f');}else{rg.addColorStop(0,'#343538');rg.addColorStop(.7,'#17191d');rg.addColorStop(1,'#0d0f13');}c.fillStyle=rg;c.fill();
      // subtle asphalt texture / wet reflection
      c.save();c.beginPath();c.moveTo(far.center-far.half,far.y);c.lineTo(far.center+far.half,far.y);c.lineTo(near.center+near.half,near.y);c.lineTo(near.center-near.half,near.y);c.closePath();c.clip();
      c.strokeStyle=(scene==='rainy'||scene==='storm'||scene==='snowy')?'rgba(255,255,255,.05)':'rgba(255,255,255,.022)'; c.lineWidth=1;
      for(let i=0;i<22;i++){const yy=horizon+((i+1)/(22))* (h-horizon); c.beginPath(); c.moveTo(0,yy); c.lineTo(w,yy); c.stroke();}
      if(scene==='rainy'||scene==='storm'||scene==='snowy'){const gl=c.createLinearGradient(0,horizon,0,h);gl.addColorStop(0,'rgba(255,255,255,.10)');gl.addColorStop(.45,'rgba(255,255,255,.03)');gl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gl;c.fillRect(0,horizon,w,h-horizon);} c.restore();
      c.strokeStyle=scene==='tunnel'?'rgba(210,220,228,.34)':'rgba(228,236,244,.52)';c.lineWidth=2;c.beginPath();c.moveTo(far.center-far.half,far.y);c.lineTo(near.center-near.half,near.y);c.moveTo(far.center+far.half,far.y);c.lineTo(near.center+near.half,near.y);c.stroke();
    }
    _laneDash(w,h,horizon,curve,offset,color,widthFactor=.007){
      const c=this.ctx,visible=220,period=12,dash=6,phase=this.distance%period;
      for(let z=-phase;z<visible;z+=period){const z0=Math.max(0,z),z1=Math.min(visible,z+dash);if(z1<=0||z0>=visible)continue;const a=this._project(z1,w,h,horizon,curve),b=this._project(z0,w,h,horizon,curve),xa=a.center+a.half*offset,xb=b.center+b.half*offset,wa=Math.max(1,a.half*widthFactor),wb=Math.max(1,b.half*widthFactor);c.fillStyle=color;c.beginPath();c.moveTo(xa-wa,a.y);c.lineTo(xa+wa,a.y);c.lineTo(xb+wb,b.y);c.lineTo(xb-wb,b.y);c.closePath();c.fill();}
    }
    _roadside(w,h,horizon,curve,scene){
      const c=this.ctx,visible=220,period=24,phase=(this.distance*1.02)%period;
      for(let side of [-1,1])for(let z=-phase;z<visible;z+=period){if(z<2)continue;const p=this._project(z,w,h,horizon,curve),x=p.center+side*p.half*1.08,size=lerp(.4,10.0,Math.pow(p,.82));
        if(scene==='tunnel'){c.strokeStyle='rgba(231,238,242,.24)';c.lineWidth=Math.max(1,size*.10);c.beginPath();c.moveTo(x,p.y);c.lineTo(x,p.y-size*7);c.stroke();}
        else if(scene==='sunny' || scene==='cloudy' || scene==='rainy' || scene==='storm' || scene==='foggy' || scene==='snowy'){c.fillStyle=scene==='sunny'?'rgba(86,91,53,.88)':scene==='cloudy'?'rgba(79,86,79,.72)':'rgba(84,91,101,.72)';c.fillRect(x-size*.08,p.y-size*1.55,size*.16,size*1.55);c.beginPath();c.arc(x,p.y-size*1.95,Math.max(1,size*.42),0,Math.PI*2);c.fill();c.beginPath();c.arc(x-size*.28,p.y-size*1.8,Math.max(1,size*.30),0,Math.PI*2);c.fill();c.beginPath();c.arc(x+size*.28,p.y-size*1.8,Math.max(1,size*.30),0,Math.PI*2);c.fill();}
        else{c.fillStyle='rgba(240,244,250,.42)';c.fillRect(x-size*.11,p.y-size*2.8,size*.22,size*2.8);c.fillStyle=scene==='city'?'rgba(255,196,105,.86)':'rgba(225,238,255,.75)';c.beginPath();c.arc(x,p.y-size*3.15,Math.max(1,size*.28),0,Math.PI*2);c.fill();}}
    }

    _guardrails(w,h,horizon,curve,scene){
      if(scene==='tunnel') return; const c=this.ctx,visible=220,period=12,phase=(this.distance*1.10)%period;
      c.strokeStyle=scene==='city'?'rgba(220,230,240,.16)':scene==='rainy'?'rgba(206,220,232,.18)':'rgba(225,232,238,.12)';
      for(let side of [-1,1]){for(let z=-phase;z<visible-period;z+=period){const z0=Math.max(3,z),z1=Math.min(visible,z+period); if(z1<=3) continue; const a=this._project(z1,w,h,horizon,curve),b=this._project(z0,w,h,horizon,curve); const xa=a.center+side*a.half*1.18, xb=b.center+side*b.half*1.18; c.lineWidth=Math.max(1,.8+b.p*2.2); c.beginPath(); c.moveTo(xa,a.y); c.lineTo(xb,b.y); c.stroke(); if(z%24===0){c.strokeStyle=scene==='city'?'rgba(255,203,116,.38)':scene==='rainy'?'rgba(214,230,244,.28)':'rgba(255,255,255,.22)'; c.lineWidth=Math.max(1,1.1+b.p*2.5); c.beginPath(); c.moveTo(xb,b.y); c.lineTo(xb,b.y-6-b.p*18); c.stroke(); c.strokeStyle=scene==='city'?'rgba(220,230,240,.16)':scene==='rainy'?'rgba(206,220,232,.18)':'rgba(225,232,238,.12)';}}}
    }
    _atmosphere(w,h,horizon,scene){
      const c=this.ctx; const haze=c.createLinearGradient(0,horizon-8,0,horizon+130); haze.addColorStop(0,scene==='sunny'?'rgba(255,255,255,.15)':scene==='rainy'?'rgba(214,226,238,.10)':scene==='city'?'rgba(255,173,110,.06)':'rgba(255,255,255,.08)'); haze.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=haze; c.fillRect(0,horizon-8,w,140);
      const vignette=c.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.18,w*.5,h*.48,Math.max(w,h)*.68); vignette.addColorStop(.68,'rgba(0,0,0,0)'); vignette.addColorStop(1,'rgba(0,0,0,.26)'); c.fillStyle=vignette; c.fillRect(0,0,w,h);
    }
    _tunnel(w,h,horizon,curve){
      const c=this.ctx,visible=220,period=18,phase=(this.distance*1.05)%period;
      for(let z=-phase;z<visible;z+=period){if(z<3)continue;const p=this._project(z,w,h,horizon,curve),left=p.center-p.half*1.16,right=p.center+p.half*1.16,top=p.y-(h-horizon)*p.p*.72-12;c.strokeStyle=`rgba(190,202,210,${.08+.22*p.p})`;c.lineWidth=Math.max(1,4*p.p);c.beginPath();c.moveTo(left,p.y);c.lineTo(left,top);c.quadraticCurveTo(p.center,top-(right-left)*.16,right,top);c.lineTo(right,p.y);c.stroke();c.strokeStyle=`rgba(255,244,196,${.10+.65*p.p})`;c.lineWidth=Math.max(1,5*p.p);c.beginPath();c.moveTo(p.center-p.half*.48,top+4);c.lineTo(p.center+p.half*.48,top+4);c.stroke();}
    }
    _speedStreaks(w,h,horizon,speed){
      if(speed<75)return;const c=this.ctx,n=Math.min(28,Math.floor((speed-58)/5));c.strokeStyle=`rgba(240,246,255,${clamp((speed-80)/260,.06,.24)})`;c.lineWidth=1.2;
      for(let i=0;i<n;i++){const side=i%2?-1:1,seed=(i*73.19)%1,x=w*.5+side*(w*.35+seed*w*.14),y=horizon+(seed*(h-horizon)),len=10+(speed/240)*55*(.3+seed);c.beginPath();c.moveTo(x,y);c.lineTo(x+side*len*.24,y+len);c.stroke();}
    }
    _rain(w,h,horizon,speed){
      const c=this.ctx,count=Math.min(70,18+Math.floor(speed/3)),spd=.25+speed/180;
      c.strokeStyle='rgba(220,235,245,.18)';c.lineWidth=1;
      for(let i=0;i<count;i++){const seed=((i*37.2)+this.distance*spd)%1,x=(seed*w*1.25)%w,y=horizon+((i*53)%100)/100*(h-horizon),len=6+(((i*17)%13)/13)*14;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+len);c.stroke();}
    }
    _snow(w,h,horizon,speed){const c=this.ctx,count=46;c.fillStyle='rgba(246,251,255,.70)';for(let i=0;i<count;i++){const x=((i*79.7)+this.distance*(.25+speed/300))%w,y=((i*47.3)+this.distance*(.45+speed/220))%h,r=1+((i*17)%7)/4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}}
    _fog(w,h,horizon){const c=this.ctx;let g=c.createLinearGradient(0,horizon-60,0,h);g.addColorStop(0,'rgba(235,240,240,.42)');g.addColorStop(.55,'rgba(226,231,232,.22)');g.addColorStop(1,'rgba(230,235,236,.08)');c.fillStyle=g;c.fillRect(0,horizon-60,w,h-horizon+60);}
    _stormFlash(w,h){if(Math.floor(this.distance*1.7)%97===0){const c=this.ctx;c.fillStyle='rgba(230,240,255,.10)';c.fillRect(0,0,w,h);}}
    render(dt,speed,rpm,gear,boost,accel){
      this.resize();const c=this.ctx,w=this.lastW,h=this.lastH;if(!w||!h)return;const visualSpeedGain=1.72;this.distance+=Math.max(0,speed)/3.6*dt*visualSpeedGain;
      const horizon=h*(this.scene==='tunnel'?.445:.455),curve=Math.sin(this.distance*.0048)*w*.006+Math.sin(this.distance*.0018)*w*.003;
      this._sky(w,h,horizon,this.scene);this._skyline(w,horizon,this.scene);
      if(this.scene==='tunnel'){c.fillStyle='#0e1012';c.fillRect(0,horizon,w,h-horizon);this._road(w,h,horizon,curve,this.scene);this._tunnel(w,h,horizon,curve);}
      else{const ground=c.createLinearGradient(0,horizon,0,h);ground.addColorStop(0,this.scene==='city'?'#2c1d19':this.scene==='sunny'?'#526133':this.scene==='cloudy'?'#4f5650':(this.scene==='rainy'||this.scene==='storm')?'#384149':this.scene==='snowy'?'#d6dee3':this.scene==='foggy'?'#929a98':this.scene==='night'?'#10151c':this.scene==='sunset'?'#433026':'#1f2023');ground.addColorStop(1,this.scene==='sunny'?'#10140f':(this.scene==='rainy'||this.scene==='storm')?'#11151a':this.scene==='snowy'?'#9ba6ad':this.scene==='foggy'?'#66706d':'#090b0e');c.fillStyle=ground;c.fillRect(0,horizon,w,h-horizon);this._road(w,h,horizon,curve,this.scene);}
      this._laneDash(w,h,horizon,curve,0,'#f3bd29',.010);this._laneDash(w,h,horizon,curve,-.50,'rgba(238,243,248,.84)',.006);this._laneDash(w,h,horizon,curve,.50,'rgba(238,243,248,.84)',.006);this._guardrails(w,h,horizon,curve,this.scene);this._roadside(w,h,horizon,curve,this.scene);this._speedStreaks(w,h,horizon,speed);if(this.scene==='rainy'||this.scene==='storm')this._rain(w,h,horizon,speed);if(this.scene==='snowy')this._snow(w,h,horizon,speed);if(this.scene==='foggy')this._fog(w,h,horizon);if(this.scene==='storm')this._stormFlash(w,h);this._atmosphere(w,h,horizon,this.scene);
      const gg=c.createRadialGradient(w*.5,h*1.02,0,w*.5,h*1.02,w*.54);gg.addColorStop(0,`rgba(255,106,0,${clamp(Math.abs(accel)/9,0,.16)})`);gg.addColorStop(1,'rgba(255,106,0,0)');c.fillStyle=gg;c.fillRect(0,h*.64,w,h*.36);
    }
  }
  const teslaPaints={
    white:{label:'Pearl White',hex:'#eef1f4',dark:'#bbc1c8'},black:{label:'Solid Black',hex:'#15181c',dark:'#07090c'},grey:{label:'Stealth Grey',hex:'#676c71',dark:'#373c41'},blue:{label:'Deep Blue',hex:'#23509d',dark:'#102b5c'},red:{label:'Ultra Red',hex:'#b51a29',dark:'#66101a'},silver:{label:'Quicksilver',hex:'#bcc0c5',dark:'#7d838a'}
  };
  const teslaCars={
    model_s:{label:'Tesla Model S',type:'Fastback',note:'منخفض وعريض؛ أفضل اختيار للطريق السريع.'},model_3:{label:'Tesla Model 3',type:'Sedan',note:'أصغر وأضيق من Model S.'},model_y:{label:'Tesla Model Y',type:'Crossover',note:'أعلى من Model 3 مع سقف ممتد.'},model_x:{label:'Tesla Model X',type:'SUV',note:'أعرض وأعلى مع كتلة خلفية أكبر.'},roadster:{label:'Tesla Roadster',type:'Sports car',note:'منخفض جداً وعريض بطابع رياضي.'},cybertruck:{label:'Tesla Cybertruck',type:'Pickup',note:'هيكل زاوي واضح ومختلف عن بقية الموديلات.'}
  };
  let selectedTesla='model_s',selectedPaint='white',selectedCarSize='medium';
  function rearCarSvg(model,paint){
    const p=teslaPaints[paint]||teslaPaints.white;
    const shell=(body,glass,lights,extra='')=>`<svg viewBox="0 0 560 300" xmlns="http://www.w3.org/2000/svg"><ellipse class="shadow" cx="280" cy="260" rx="184" ry="22"/><ellipse class="tire" cx="151" cy="228" rx="31" ry="43"/><ellipse class="tire" cx="409" cy="228" rx="31" ry="43"/><ellipse class="rim" cx="151" cy="228" rx="17" ry="25"/><ellipse class="rim" cx="409" cy="228" rx="17" ry="25"/><path class="paint" d="${body}"/><path class="glass" d="${glass}"/><path class="glassGlow" d="${glass}" transform="scale(.97 .93) translate(9 9)"/>${lights}${extra}<path class="trim" d="M130 223 Q280 252 430 223 L421 245 Q280 273 139 245 Z"/><rect class="plate" x="247" y="219" width="66" height="20" rx="5"/><path class="highlight" d="M152 162 Q280 134 408 162 Q366 150 280 148 Q194 150 152 162Z"/></svg>`;
    if(model==='model_3')return shell('M116 215 Q124 167 172 144 Q196 102 232 82 Q280 61 328 82 Q364 102 388 144 Q436 167 444 215 Q405 241 280 245 Q155 241 116 215Z','M198 143 Q216 95 247 83 Q280 72 313 83 Q344 95 362 143 Q280 128 198 143Z','<path class="tail" d="M139 177 Q177 157 216 166 L207 184 Q170 178 141 191Z"/><path class="tail" d="M421 177 Q383 157 344 166 L353 184 Q390 178 419 191Z"/>');
    if(model==='model_y')return shell('M108 219 Q118 160 168 137 Q185 94 226 69 Q280 45 334 69 Q375 94 392 137 Q442 160 452 219 Q405 247 280 251 Q155 247 108 219Z','M188 139 Q205 88 240 72 Q280 57 320 72 Q355 88 372 139 Q280 123 188 139Z','<path class="tail" d="M132 177 Q178 152 221 164 L210 187 Q170 180 135 193Z"/><path class="tail" d="M428 177 Q382 152 339 164 L350 187 Q390 180 425 193Z"/>');
    if(model==='model_x')return shell('M98 222 Q110 153 162 132 Q176 86 222 61 Q280 36 338 61 Q384 86 398 132 Q450 153 462 222 Q411 251 280 256 Q149 251 98 222Z','M180 135 Q197 82 236 65 Q280 48 324 65 Q363 82 380 135 Q280 119 180 135Z','<path class="tail" d="M124 176 Q174 148 224 162 L211 188 Q166 181 128 195Z"/><path class="tail" d="M436 176 Q386 148 336 162 L349 188 Q394 181 432 195Z"/>');
    if(model==='roadster')return shell('M110 220 Q124 178 174 157 Q206 108 238 95 Q280 82 322 95 Q354 108 386 157 Q436 178 450 220 Q401 244 280 248 Q159 244 110 220Z','M206 156 Q223 112 251 100 Q280 91 309 100 Q337 112 354 156 Q280 144 206 156Z','<path class="tail" d="M137 184 Q183 165 222 172 L212 190 Q170 187 139 197Z"/><path class="tail" d="M423 184 Q377 165 338 172 L348 190 Q390 187 421 197Z"/>');
    if(model==='cybertruck')return shell('M92 224 L111 145 L195 119 L238 70 L363 70 L451 145 L468 224 Q410 251 280 256 Q150 251 92 224Z','M205 121 L247 80 L354 80 L420 139 Q302 121 205 121Z','<path class="tail" d="M108 172 L451 172 L447 181 L112 181Z"/>','<path class="paintDark" d="M112 145 L196 119 L238 70 L247 80 L205 121 Z"/><path class="paintDark" d="M354 80 L363 70 L451 145 L420 139 Z"/>');
    return shell('M105 219 Q118 166 169 145 Q192 101 230 79 Q280 56 330 79 Q368 101 391 145 Q442 166 455 219 Q407 247 280 252 Q153 247 105 219Z','M190 144 Q210 94 244 81 Q280 67 316 81 Q350 94 370 144 Q280 127 190 144Z','<path class="tail" d="M131 178 Q177 154 219 165 L208 188 Q168 181 134 194Z"/><path class="tail" d="M429 178 Q383 154 341 165 L352 188 Q392 181 426 194Z"/>');
  }
  function renderTeslaCar(){
    const meta=teslaCars[selectedTesla]||teslaCars.model_s,p=teslaPaints[selectedPaint]||teslaPaints.white;
    document.documentElement.style.setProperty('--tesla-paint',p.hex);document.documentElement.style.setProperty('--tesla-paint-dark',p.dark);
    if(ui.teslaCarStage)ui.teslaCarStage.innerHTML=rearCarSvg(selectedTesla,selectedPaint);
    if(ui.teslaCarLabel)ui.teslaCarLabel.innerHTML=`<strong>${meta.label}</strong> • ${p.label}`;
    const sizes={small:'min(28vw,320px)',medium:'min(34vw,400px)',large:'min(40vw,470px)'};
    if(ui.teslaCarStage)ui.teslaCarStage.style.width=sizes[selectedCarSize]||sizes.medium;
    if(ui.teslaMiniInfo)ui.teslaMiniInfo.textContent=`${meta.label} — ${meta.type}. ${meta.note}`;
    if(ui.colorGrid)[...ui.colorGrid.querySelectorAll('.colorBtn')].forEach(b=>b.classList.toggle('active',b.dataset.color===selectedPaint));
    localStorage.setItem('drivetone.teslaModel',selectedTesla);localStorage.setItem('drivetone.teslaPaint',selectedPaint);localStorage.setItem('drivetone.carSize',selectedCarSize);
  }

  let demo=true, speed=0, targetSpeed=0, accel=0, lastSpeed=0, lastT=performance.now(), gear=1, rpm=850, throttle=0, boost=0, watchId=null;
  let driveMode='normal', shiftState=null, lastShiftAt=0, prevPos=null, wakeLock=null, drivingView=false, motionAssist=false, motionEnergy=0, motionPeak=0; let gpsStatusText='GPS غير متصل', gpsFallbackTimer=null;
  const roadViz=new RoadViz(ui.driveCanvas);

  const modes={
    relaxed:{ranges:[0,22,42,68,100,138,999],idle:780,redline:5600,shiftCut:.52,response:.78},
    normal:{ranges:[0,30,55,90,130,175,999],idle:850,redline:6400,shiftCut:.45,response:1.0},
    sport:{ranges:[0,38,70,110,155,205,999],idle:950,redline:7000,shiftCut:.38,response:1.28}
  };

  function gearForSpeed(kmh){
    const r=modes[driveMode].ranges;
    for(let g=1;g<=6;g++) if(kmh<r[g]) return g;
    return 6;
  }

  function rpmFor(kmh,g){
    const m=modes[driveMode], r=m.ranges;
    const low=r[g-1], high=r[g];
    const pos=clamp((kmh-low)/Math.max(1,high-low),0,1);
    const base=m.idle + (g-1)*90;
    return Math.round(lerp(base,m.redline,pos));
  }

  function makeDistortionCurve(amount=18){
    const n=2048, curve=new Float32Array(n), deg=Math.PI/180;
    for(let i=0;i<n;i++){const x=i*2/n-1;curve[i]=((3+amount)*x*20*deg)/(Math.PI+amount*Math.abs(x));}
    return curve;
  }

  class EngineAudio{
    constructor(){
      this.ctx=null;this.master=null;this.engineBus=null;this.exhaustBus=null;this.intakeBus=null;this.filter=null;this.highShelf=null;this.comp=null;this.drive=null;
      this.voices=[];this.turboOsc=null;this.turboGain=null;this.turboFilter=null;this.airSrc=null;this.airGain=null;this.airFilter=null;this.noiseBuffer=null;
      this.running=false;this.lastCrackle=0;this.lastBlowoff=0;this.prevBoost=0;this.prevThrottle=.04;this.realSamples=[];this.realReady=false;this.realStarted=false;
    }
    async start(){
      if(this.running){await this.ctx.resume();return;}
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C) return alert('Web Audio غير مدعوم في هذا المتصفح');
      this.ctx=new C();
      this.master=this.ctx.createGain(); this.master.gain.value=+ui.volume.value;
      this.comp=this.ctx.createDynamicsCompressor(); this.comp.threshold.value=-18; this.comp.knee.value=18; this.comp.ratio.value=4.5; this.comp.attack.value=.003; this.comp.release.value=.16;
      this.engineBus=this.ctx.createGain(); this.exhaustBus=this.ctx.createGain(); this.intakeBus=this.ctx.createGain();
      this.filter=this.ctx.createBiquadFilter(); this.filter.type='lowpass'; this.filter.frequency.value=1700; this.filter.Q.value=.75;
      this.highShelf=this.ctx.createBiquadFilter(); this.highShelf.type='highshelf'; this.highShelf.frequency.value=1900; this.highShelf.gain.value=-4;
      this.drive=this.ctx.createWaveShaper(); this.drive.curve=makeDistortionCurve(20); this.drive.oversample='4x';
      this.engineBus.connect(this.filter); this.filter.connect(this.drive); this.drive.connect(this.highShelf); this.highShelf.connect(this.comp);
      this.exhaustBus.connect(this.comp); this.intakeBus.connect(this.comp); this.comp.connect(this.master); this.master.connect(this.ctx.destination);

      const defs=[
        {type:'sawtooth',ratio:1,gain:.18,detune:-8},
        {type:'square',ratio:.5,gain:.072,detune:4},
        {type:'triangle',ratio:2.01,gain:.055,detune:10},
        {type:'sine',ratio:4.02,gain:.026,detune:-5},
        {type:'sine',ratio:.252,gain:.032,detune:2}
      ];
      defs.forEach(d=>{
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type=d.type; o.detune.value=d.detune; g.gain.value=d.gain; o.connect(g); g.connect(this.engineBus); o.start(); this.voices.push({o,g,...d});
      });

      // Independent turbo whistle layer.
      this.turboOsc=this.ctx.createOscillator(); this.turboOsc.type='sine';
      this.turboGain=this.ctx.createGain(); this.turboGain.gain.value=.0001;
      this.turboFilter=this.ctx.createBiquadFilter(); this.turboFilter.type='bandpass'; this.turboFilter.frequency.value=4200; this.turboFilter.Q.value=5.5;
      this.turboOsc.connect(this.turboFilter);this.turboFilter.connect(this.turboGain);this.turboGain.connect(this.intakeBus);this.turboOsc.start();

      // Looping air/noise layer for intake, exhaust texture and blow-off effects.
      this.noiseBuffer=this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate*1.2),this.ctx.sampleRate);
      const data=this.noiseBuffer.getChannelData(0);
      let brown=0;
      for(let i=0;i<data.length;i++){
        const white=Math.random()*2-1; brown=(brown+.025*white)/1.025; data[i]=clamp(brown*3.3,-1,1);
      }
      this.airSrc=this.ctx.createBufferSource();this.airSrc.buffer=this.noiseBuffer;this.airSrc.loop=true;
      this.airGain=this.ctx.createGain();this.airGain.gain.value=.0001;
      this.airFilter=this.ctx.createBiquadFilter();this.airFilter.type='bandpass';this.airFilter.frequency.value=1200;this.airFilter.Q.value=.65;
      this.airSrc.connect(this.airFilter);this.airFilter.connect(this.airGain);this.airGain.connect(this.intakeBus);this.airSrc.start();

      this.running=true; await this.ctx.resume();
      // v1.2: brand-inspired physical engine profiles. Legacy synth remains internal only as an emergency audio fallback and is not user-selectable.
    }

    initRealSamples(){
      if(this.realSamples.length) return;
      const defs=[
        {rpm:900, url:'https://opengameart.org/sites/default/files/loop_0.wav'},
        {rpm:1500,url:'https://opengameart.org/sites/default/files/loop_1_0.wav'},
        {rpm:2300,url:'https://opengameart.org/sites/default/files/loop_2_0.wav'},
        {rpm:3200,url:'https://opengameart.org/sites/default/files/loop_3_0.wav'},
        {rpm:4500,url:'https://opengameart.org/sites/default/files/loop_4_0.wav'},
        {rpm:6000,url:'https://opengameart.org/sites/default/files/loop_5_0.wav'}
      ];
      this.realSamples=defs.map((d,i)=>{
        const a=new Audio(); a.src=d.url; a.loop=true; a.preload='auto'; a.playsInline=true; a.volume=0;
        try{a.preservesPitch=false;a.webkitPreservesPitch=false;a.mozPreservesPitch=false;}catch(e){}
        a.addEventListener('canplaythrough',()=>{this.checkRealReady();},{once:true});
        a.addEventListener('error',()=>{
          if(ui.sampleStatus)ui.sampleStatus.textContent='تعذر تحميل إحدى العينات الحقيقية. سيستمر الصوت الاصطناعي كاحتياط.';
        });
        return {audio:a,rpm:d.rpm,url:d.url,index:i};
      });
    }
    checkRealReady(){
      const ready=this.realSamples.filter(s=>s.audio.readyState>=3).length;
      this.realReady=ready>=4;
      if(ui.sampleStatus){
        ui.sampleStatus.textContent=this.realReady?`تم تجهيز ${ready}/6 طبقات صوت حقيقية — Real Sample Engine جاهز.`:`تحميل العينات الحقيقية: ${ready}/6…`;
      }
    }
    async startRealSamples(){
      this.initRealSamples();
      const results=await Promise.allSettled(this.realSamples.map(s=>s.audio.play()));
      this.realStarted=results.some(r=>r.status==='fulfilled');
      this.checkRealReady();
      if(!this.realStarted && ui.sampleStatus)ui.sampleStatus.textContent='المتصفح منع تشغيل العينات الحقيقية؛ اضغط تشغيل الصوت مرة أخرى أو استخدم HTTPS.';
    }
    updateRealSamples(rpm,thr,isDecel,shiftCut){
      if(!this.realSamples.length)return;
      const global=clamp(+ui.volume.value,0,1);
      const exhaust=0.55+0.45*(+ui.exhaust.value);
      const load=isDecel?0.56:(0.42+0.58*thr);
      const cut=clamp(shiftCut,0.12,1);
      const centers=this.realSamples.map(s=>s.rpm);
      // Crossfade only neighboring RPM recordings. The real recording supplies timbre; playbackRate only fine-tunes pitch.
      let lo=0;
      while(lo<centers.length-2 && rpm>centers[lo+1])lo++;
      const hi=Math.min(lo+1,centers.length-1);
      const span=Math.max(1,centers[hi]-centers[lo]);
      const mix=clamp((rpm-centers[lo])/span,0,1);
      this.realSamples.forEach((s,i)=>{
        let w=0;
        if(i===lo)w=Math.cos(mix*Math.PI/2);
        if(i===hi)w=Math.sin(mix*Math.PI/2);
        if(rpm<=centers[0] && i===0)w=1;
        if(rpm>=centers[centers.length-1] && i===centers.length-1)w=1;
        const rate=clamp(rpm/Math.max(1,s.rpm),.84,1.18);
        s.audio.playbackRate=rate;
        const target=clamp(w*global*exhaust*load*cut*.88,0,1);
        // HTMLMediaElement volume has no automation; smoothing avoids zipper noise.
        s.audio.volume=lerp(s.audio.volume,target,.22);
      });
    }
    muteRealSamples(){
      this.realSamples.forEach(s=>{s.audio.volume=lerp(s.audio.volume,0,.28);});
    }

    transient(kind='shift',strength=.7){
      if(!this.running) return;
      const t=this.ctx.currentTime, src=this.ctx.createBufferSource(), gain=this.ctx.createGain(), f=this.ctx.createBiquadFilter();
      src.buffer=this.noiseBuffer;
      if(kind==='upshift'){
        f.type='bandpass';f.frequency.value=470;f.Q.value=.7;
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.11*strength,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
      }else if(kind==='downshift'){
        f.type='bandpass';f.frequency.value=680;f.Q.value=1.0;
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.14*strength,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+.24);
        // Short rev-match blip tone.
        const o=this.ctx.createOscillator(), og=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(230,t+.09);o.frequency.exponentialRampToValueAtTime(150,t+.23);
        og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.055*strength,t+.02);og.gain.exponentialRampToValueAtTime(.0001,t+.24);o.connect(og);og.connect(this.engineBus);o.start(t);o.stop(t+.26);
      }else if(kind==='blowoff'){
        f.type='highpass';f.frequency.value=1550;f.Q.value=.45;
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.19*strength,t+.008);gain.gain.exponentialRampToValueAtTime(.065*strength,t+.075);gain.gain.exponentialRampToValueAtTime(.0001,t+.34);
      }else{
        f.type='bandpass';f.frequency.value=190+Math.random()*650;f.Q.value=1.7+Math.random()*1.3;
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.15*strength,t+.003);gain.gain.exponentialRampToValueAtTime(.0001,t+.065+Math.random()*.08);
      }
      src.connect(f);f.connect(gain);gain.connect(kind==='blowoff'?this.intakeBus:this.exhaustBus);src.start(t);src.stop(t+.42);
    }

    update(rpm,thr,type,isDecel,shiftCut,boostAmount){
      if(!this.running) return;
      const t=this.ctx.currentTime;
      let fireHz, ratios, driveAmount, lowpass, voiceProfile;
      if(type==='real'){
        fireHz=(rpm/60)*4; ratios=[1,.502,2.01,4.02,.252]; driveAmount=8; lowpass=1300+(rpm/7000)*3500; voiceProfile=[.0001,.0001,.0001,.0001,.0001];
      }else if(type==='v8'){
        fireHz=(rpm/60)*4; ratios=[1,.502,2.01,4.02,.252]; driveAmount=25; lowpass=760+(rpm/7000)*3100+thr*1050; voiceProfile=[.215,.078,.052,.021,.042];
      }else if(type==='i6'){
        fireHz=(rpm/60)*3; ratios=[1,1.5,3.02,6.01,.335]; driveAmount=14; lowpass=1080+(rpm/7000)*3850+thr*1350; voiceProfile=[.175,.058,.046,.019,.028];
      }else{
        fireHz=48+(rpm/7000)*420; ratios=[1,2,3.01,5.02,.5]; driveAmount=4; lowpass=2550+(rpm/7000)*6400; voiceProfile=[.09,.04,.035,.018,.012];
      }

      this.drive.curve=makeDistortionCurve(driveAmount);
      const cut=clamp(shiftCut,0.14,1);
      this.voices.forEach((v,i)=>{
        const irregular=type==='v8' ? (1+Math.sin(t*(6.4+i*.8)+i*1.9)*.0052+Math.sin(t*2.3+i)*.0022) : (1+Math.sin(t*(10.7+i)+i)*.0022);
        v.o.frequency.setTargetAtTime(Math.max(18,fireHz*ratios[i]*irregular),t,.014);
        let g=(type==='real'?.0001:(.018+voiceProfile[i]*(.25+1.02*thr))*cut);
        if(i===4) g*=type==='hyper'?.35:(.7+.35*(1-thr));
        v.g.gain.setTargetAtTime(g,t,.022);
      });

      this.filter.frequency.setTargetAtTime(lowpass,t,.035);
      this.highShelf.gain.setTargetAtTime(type==='hyper'?2.2:(-6.5+thr*5.4+boostAmount*2.4),t,.07);
      this.exhaustBus.gain.setTargetAtTime((.30+.70*+ui.exhaust.value)*(type==='hyper'?.08:type==='real'?.12:.86),t,.06);
      this.intakeBus.gain.setTargetAtTime(type==='hyper'?.35:type==='real'?.08:(.30+.75*thr),t,.07);
      this.master.gain.setTargetAtTime(+ui.volume.value,t,.06);
      this.muteRealSamples();

      // Intake noise follows throttle and RPM.
      const airLevel=type==='hyper'?.008:type==='real'?.0015:(.004+.045*thr*clamp((rpm-900)/5000,0,1));
      this.airGain.gain.setTargetAtTime(airLevel,t,.05);
      this.airFilter.frequency.setTargetAtTime(type==='i6'?1100+rpm*.22:760+rpm*.16,t,.06);

      // Turbo is a separate oscillator, not just EQ.
      if(type==='i6'){
        const turboHz=1650+boostAmount*4700+rpm*.08;
        this.turboOsc.frequency.setTargetAtTime(turboHz,t,.045);
        this.turboFilter.frequency.setTargetAtTime(turboHz,t,.055);
        this.turboGain.gain.setTargetAtTime(.002+boostAmount*.07*clamp(thr*1.2,0,1),t,.055);
      }else{
        this.turboGain.gain.setTargetAtTime(.0001,t,.06);
      }

      // Blow-off when boost collapses after lifting throttle.
      const boostDrop=this.prevBoost-boostAmount, throttleDrop=this.prevThrottle-thr;
      if(type==='i6' && this.prevBoost>.34 && (boostDrop>.10 || throttleDrop>.34) && performance.now()-this.lastBlowoff>650){
        this.transient('blowoff',clamp(.55+this.prevBoost*.6,.55,1.15)); this.lastBlowoff=performance.now();
      }
      this.prevBoost=boostAmount; this.prevThrottle=thr;

      // Exhaust pops on overrun. Kept rate-limited to avoid machine-gun audio.
      if(isDecel && type!=='hyper' && rpm>2350 && performance.now()-this.lastCrackle>105){
        const chance=(type==='v8'||type==='real')?.22:.11;
        if(Math.random()<chance*(.35+.8*+ui.exhaust.value)){
          this.transient('crackle',clamp(.45+(rpm/7000)*.48,.45,.95));this.lastCrackle=performance.now();
        }
      }
    }
  }
  class PhysicalEngineAudio{
    constructor(fallback){
      this.fallback=fallback;this.sim=null;this.running=false;this.failed=false;this.loading=null;this.lastT=performance.now();this.engineKey='phys_v8';
      this.fxBus=null;this.lastPopAt=0;this.lastPopThrottle=.05;this.popSeq=0;this.sequence=null;this.sequenceToken=0;
      this.repoRevision='f16e3f5ded382716f4342843d7e4463ebb7d0bd8';
      this.moduleUrl=`https://cdn.jsdelivr.net/gh/YigitSalihEmecen/Engine_Sim@${this.repoRevision}/src/engine-sim.js`;
    }
    _styleFor(type){
      const styles={
        amg_gt63:{profile:'v8tt',vehicle:'supercar',tone:{rumble:1.28,brightness:.72,punch:1.24},inputs:{aggression:.91,roughness:.045,strain:.18,distance:.04,environment:0},dynamics:.66,width:.74,reverb:{mix:.035,size:.12,damping:.79}},
        mclaren_720s:{profile:'v8tt',vehicle:'supercar',tone:{rumble:.86,brightness:1.20,punch:1.08},inputs:{aggression:.74,roughness:.020,strain:.14,distance:.035,environment:0},dynamics:.60,width:.82,reverb:{mix:.028,size:.10,damping:.72}},
        bmw_m3:{profile:'i6',vehicle:'sports',tone:{rumble:.92,brightness:1.04,punch:1.01},inputs:{aggression:.61,roughness:.016,strain:.12,distance:.05,environment:0},dynamics:.70,width:.70,reverb:{mix:.035,size:.12,damping:.76}},
        ferrari_458:{profile:'v8flat',vehicle:'supercar',tone:{rumble:.64,brightness:1.44,punch:1.14},inputs:{aggression:.88,roughness:.008,strain:.17,distance:.025,environment:0},dynamics:.54,width:.88,reverb:{mix:.022,size:.08,damping:.64}},
        ferrari_v12:{profile:'v12',vehicle:'supercar',tone:{rumble:.74,brightness:1.30,punch:1.08},inputs:{aggression:.78,roughness:.006,strain:.15,distance:.03,environment:0},dynamics:.58,width:.86,reverb:{mix:.025,size:.09,damping:.68}},
        porsche_911gt3:{profile:'flat6',vehicle:'supercar',tone:{rumble:.72,brightness:1.30,punch:1.02},inputs:{aggression:.74,roughness:.010,strain:.13,distance:.03,environment:0},dynamics:.58,width:.86,reverb:{mix:.024,size:.09,damping:.70}},
        phys_v8:{profile:'v8cross',vehicle:'muscle',tone:{rumble:1.08,brightness:.92,punch:1.08},inputs:{aggression:.58,roughness:.04,strain:.08,distance:.08,environment:0},dynamics:.72,width:.65,reverb:{mix:.08,size:.2,damping:.7}},
        phys_v8tt:{profile:'v8tt',vehicle:'supercar',tone:{rumble:1.02,brightness:.92,punch:1.06},inputs:{aggression:.60,roughness:.035,strain:.10,distance:.06,environment:0},dynamics:.70,width:.70,reverb:{mix:.06,size:.17,damping:.72}},
        phys_i6:{profile:'i6',vehicle:'sports',tone:{rumble:.92,brightness:1.02,punch:1.00},inputs:{aggression:.56,roughness:.025,strain:.10,distance:.06,environment:0},dynamics:.72,width:.68,reverb:{mix:.05,size:.15,damping:.74}},
        phys_v10:{profile:'v10',vehicle:'supercar',tone:{rumble:.82,brightness:1.18,punch:1.08},inputs:{aggression:.68,roughness:.015,strain:.12,distance:.04,environment:0},dynamics:.64,width:.80,reverb:{mix:.04,size:.12,damping:.70}}
      };
      return styles[type]||styles.phys_v8;
    }
    _modelSpec(type){
      const specs={
        amg_gt63:{label:'AMG GT 63',arch:'4.0 V8 Biturbo',redline:6800,gears:9,note:'عزم منخفض قوي • نبرة عميقة • Biturbo مكتوم نسبيًا',params:{'engine.idleRpm':680,'engine.redlineRpm':6800,'engine.peakTorque':800,'engine.peakTorqueRpm':3500,'engine.gears':9,'engine.engineInertia':.43,'engine.exhaust.bank':1.18,'engine.exhaust.collector':1.58,'engine.exhaust.damping':.52,'engine.intake.helmholtz':76,'engine.intake.level':.30,'engine.turbo.inertia':.38,'engine.turbo.maxBoost':1.25,'engine.turbo.whineOrder':42,'engine.turbo.bov':.38,'engine.turbo.surge':.72,'mix.exhaust':1.20,'mix.intake':.62,'mix.turbo':.34,'mix.transmission':.42,'mix.transients':.60,'mix.sub':.34,'fx.popDepth':1.30,'eq.0':2.5,'eq.1':2.0,'eq.3':-1.0}},
        mclaren_720s:{label:'McLaren 720S',arch:'4.0 V8 Twin‑Turbo',redline:8200,gears:7,note:'V8 أخف وأحدّ • استجابة أسرع • Turbo أكثر سماعًا',params:{'engine.idleRpm':850,'engine.redlineRpm':8200,'engine.peakTorque':770,'engine.peakTorqueRpm':4300,'engine.gears':7,'engine.engineInertia':.31,'engine.gasTempFactor':1.24,'engine.pulse.attack':34,'engine.pulse.hardness':.66,'engine.exhaust.bank':.92,'engine.exhaust.collector':1.18,'engine.exhaust.damping':.46,'engine.intake.helmholtz':118,'engine.intake.level':.38,'engine.turbo.inertia':.26,'engine.turbo.maxBoost':1.35,'engine.turbo.whineOrder':58,'engine.turbo.bov':.55,'engine.turbo.surge':.92,'mix.exhaust':1.06,'mix.intake':.80,'mix.turbo':.52,'mix.transmission':.48,'mix.transients':.52,'mix.sub':.20,'fx.popDepth':1.12,'eq.2':.5,'eq.3':2.0,'eq.4':1.0}},
        bmw_m3:{label:'BMW M3/M4 Competition',arch:'3.0 Inline‑6 Twin‑Turbo',redline:7200,gears:8,note:'Inline‑6 ناعم • 7200 RPM • Turbo واضح بدون خشونة V8',params:{'engine.idleRpm':760,'engine.redlineRpm':7200,'engine.peakTorque':650,'engine.peakTorqueRpm':3600,'engine.gears':8,'engine.engineInertia':.27,'engine.pulse.jitter':.55,'engine.exhaust.bank':1.42,'engine.exhaust.collector':1.14,'engine.exhaust.damping':.40,'engine.intake.helmholtz':104,'engine.intake.level':.39,'engine.turbo.inertia':.34,'engine.turbo.maxBoost':1.70,'engine.turbo.whineOrder':50,'engine.turbo.bov':.30,'engine.turbo.surge':.95,'mix.exhaust':1.02,'mix.intake':.78,'mix.turbo':.46,'mix.transmission':.44,'mix.transients':.48,'mix.sub':.24,'fx.popDepth':.92,'eq.1':1.0,'eq.2':.8,'eq.3':.8}},
        ferrari_458:{label:'Ferrari 458 Italia',arch:'4.5 NA Flat‑Plane V8',redline:9000,gears:7,note:'طبيعي بدون Turbo • Flat‑plane • صرخة عالية حتى 9000 RPM',params:{'engine.idleRpm':900,'engine.redlineRpm':9000,'engine.peakTorque':540,'engine.peakTorqueRpm':6000,'engine.gears':7,'engine.engineInertia':.22,'engine.gasTempFactor':1.35,'engine.pulse.attack':58,'engine.pulse.decay':8.8,'engine.pulse.hardness':.88,'engine.pulse.jitter':.38,'engine.exhaust.bank':.72,'engine.exhaust.collector':.58,'engine.exhaust.reflection':.42,'engine.exhaust.damping':.22,'engine.intake.helmholtz':162,'engine.intake.q':8.2,'engine.intake.level':.54,'mix.exhaust':1.16,'mix.intake':1.04,'mix.turbo':0,'mix.transmission':.42,'mix.transients':.58,'mix.sub':.12,'fx.popDepth':.86,'eq.0':-2.0,'eq.1':-1.0,'eq.3':3.0,'eq.4':2.0}},
        ferrari_v12:{label:'Ferrari V12',arch:'6.5 NA V12',redline:8500,gears:8,note:'V12 طبيعي • متصل وناعم • طبقات عالية كثيفة',params:{'engine.idleRpm':850,'engine.redlineRpm':8500,'engine.peakTorque':690,'engine.peakTorqueRpm':5800,'engine.gears':8,'engine.engineInertia':.34,'engine.intake.helmholtz':148,'engine.intake.level':.48,'mix.exhaust':1.12,'mix.intake':.94,'mix.turbo':0,'mix.transients':.48,'mix.sub':.16,'eq.3':2.0,'eq.4':1.5}},
        porsche_911gt3:{label:'Porsche 911 GT3',arch:'4.0 NA Flat‑6',redline:9000,gears:7,note:'Flat‑6 طبيعي • Intake howl واضح • يمتد حتى 9000 RPM',params:{'engine.idleRpm':850,'engine.redlineRpm':9000,'engine.peakTorque':450,'engine.peakTorqueRpm':6200,'engine.gears':7,'engine.engineInertia':.20,'engine.gasTempFactor':1.33,'engine.pulse.attack':48,'engine.pulse.decay':7.4,'engine.pulse.hardness':.78,'engine.pulse.jitter':.50,'engine.exhaust.bank':.80,'engine.exhaust.collector':.68,'engine.exhaust.damping':.27,'engine.intake.helmholtz':148,'engine.intake.q':8.0,'engine.intake.level':.58,'mix.exhaust':1.05,'mix.intake':1.12,'mix.turbo':0,'mix.transmission':.46,'mix.transients':.46,'mix.sub':.14,'fx.popDepth':.78,'eq.0':-1.5,'eq.2':.8,'eq.3':2.3,'eq.4':1.7}}
      };
      return specs[type]||null;
    }
    _applyModelParams(type){
      const spec=this._modelSpec(type);
      if(!spec||!this.sim)return;
      // Apply the whole machine in one preset rebuild. This avoids rebuilding
      // the exhaust waveguides repeatedly for every pipe/intake parameter.
      try{
        if(this.sim.getPreset&&this.sim.loadPreset){
          const preset=this.sim.getPreset();
          const setPath=(obj,path,val)=>{const k=path.split('.');let n=obj;for(let i=0;i<k.length-1;i++){if(n[k[i]]==null)n[k[i]]={};n=n[k[i]];}n[k[k.length-1]]=val;};
          for(const [path,val] of Object.entries(spec.params))setPath(preset,path,val);
          preset.label=spec.label+' — DriveTone';
          this.sim.loadPreset(preset);
        }else if(this.sim.setParam){
          for(const [path,val] of Object.entries(spec.params))this.sim.setParam(path,val);
        }
      }catch(e){console.warn('model preset',e);}
    }
    _popStyle(type){
      const m={
        amg_gt63:{low:68,mid:198,crack:1250,boom:1.30,snap:.68,decay:.46,pattern:[0,.12]},
        mclaren_720s:{low:92,mid:330,crack:2200,boom:.75,snap:1.16,decay:.23,pattern:[0,.07,.15]},
        bmw_m3:{low:82,mid:275,crack:1700,boom:.80,snap:.88,decay:.30,pattern:[0,.12,.23]},
        ferrari_458:{low:106,mid:395,crack:2800,boom:.58,snap:1.34,decay:.18,pattern:[0,.065,.14]},
        ferrari_v12:{low:96,mid:345,crack:2400,boom:.68,snap:1.18,decay:.22,pattern:[0,.085]},
        porsche_911gt3:{low:90,mid:315,crack:2050,boom:.68,snap:1.10,decay:.25,pattern:[0,.09,.19]},
        phys_v8:{low:70,mid:205,crack:1250,boom:1.08,snap:.70,decay:.40,pattern:[0,.13]},
        phys_v8tt:{low:74,mid:225,crack:1450,boom:1.06,snap:.78,decay:.36,pattern:[0,.11]},
        phys_i6:{low:84,mid:275,crack:1700,boom:.82,snap:.90,decay:.30,pattern:[0,.12,.24]},
        phys_v10:{low:98,mid:355,crack:2450,boom:.68,snap:1.16,decay:.22,pattern:[0,.08,.17]}
      };
      return m[type]||m.phys_v8;
    }
    _ensureFx(){
      if(this.fxBus||!this.sim?.ctx)return;
      const c=this.sim.ctx;
      this.fxBus=c.createGain();this.fxBus.gain.value=.78;
      const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=16;comp.ratio.value=4;comp.attack.value=.002;comp.release.value=.12;
      this.fxBus.connect(comp);comp.connect(c.destination);
    }
    _noiseBuffer(ctx,d=.45){
      const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*d),ctx.sampleRate),a=b.getChannelData(0);
      for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length*.18);
      return b;
    }
    _oneBang(type,strength=1,delay=0){
      if(!this.sim?.ctx)return;this._ensureFx();
      const c=this.sim.ctx, st=this._popStyle(type), t=c.currentTime+delay;
      const global=clamp(strength,0,1.45)*(+ui.volume.value)*(.55+.65*(+ui.exhaust.value));
      // Deep exhaust pressure wave: the audible "BOOM".
      const o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(st.low*1.18,t);o.frequency.exponentialRampToValueAtTime(st.low*.66,t+st.decay);
      og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.34*st.boom*global,t+.008);og.gain.exponentialRampToValueAtTime(.0001,t+st.decay);
      o.connect(og);og.connect(this.fxBus);o.start(t);o.stop(t+st.decay+.04);
      // Exhaust body / pressure burst.
      const n=c.createBufferSource(),nf=c.createBiquadFilter(),ng=c.createGain();n.buffer=this._noiseBuffer(c,st.decay+.12);nf.type='bandpass';nf.frequency.value=st.mid*(.9+Math.random()*.22);nf.Q.value=.78;
      ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(.24*st.boom*global,t+.004);ng.gain.exponentialRampToValueAtTime(.0001,t+st.decay*.82);
      n.connect(nf);nf.connect(ng);ng.connect(this.fxBus);n.start(t);n.stop(t+st.decay+.1);
      // Sharp tailpipe crack.
      const n2=c.createBufferSource(),hf=c.createBiquadFilter(),hg=c.createGain();n2.buffer=this._noiseBuffer(c,.18);hf.type='highpass';hf.frequency.value=st.crack*(.86+Math.random()*.28);hf.Q.value=.35;
      hg.gain.setValueAtTime(.0001,t);hg.gain.exponentialRampToValueAtTime(.11*st.snap*global,t+.002);hg.gain.exponentialRampToValueAtTime(.0001,t+.055+Math.random()*.055);
      n2.connect(hf);hf.connect(hg);hg.connect(this.fxBus);n2.start(t);n2.stop(t+.2);
    }
    _popBurst(type,strength=1,reason='lift'){
      if(!this.sim||ui.popMode?.value==='off')return;
      const mode=ui.popMode?.value||'sport', st=this._popStyle(type);
      const modeGain=mode==='natural'?.60:mode==='wild'?1.24:1.0;
      let pat=st.pattern.slice();
      if(mode==='natural')pat=pat.slice(0,1);
      if(mode==='wild')pat=pat.concat(pat.map(x=>x+.25)).slice(0,5);
      if(reason==='downshift')pat=[0,.075];
      pat.forEach((d,i)=>this._oneBang(type,strength*modeGain*(1-i*.09),d));
    }
    _startStyle(type){
      const m={
        amg_gt63:{starter:62,flare:.70,boom:.92,settle:.13},
        mclaren_720s:{starter:80,flare:.84,boom:.64,settle:.09},
        bmw_m3:{starter:72,flare:.62,boom:.50,settle:.09},
        ferrari_458:{starter:90,flare:.92,boom:.52,settle:.07},
        ferrari_v12:{starter:92,flare:.82,boom:.50,settle:.08},
        porsche_911gt3:{starter:84,flare:.82,boom:.48,settle:.08},
        phys_v8:{starter:62,flare:.68,boom:.78,settle:.13},
        phys_v8tt:{starter:66,flare:.68,boom:.74,settle:.12},
        phys_i6:{starter:72,flare:.58,boom:.50,settle:.09},
        phys_v10:{starter:90,flare:.84,boom:.52,settle:.08}
      };
      return m[type]||m.phys_v8;
    }
    _starterSound(type){
      if(!this.sim?.ctx)return;this._ensureFx();
      const c=this.sim.ctx,st=this._startStyle(type),t=c.currentTime;
      const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
      o.type='sawtooth';o.frequency.setValueAtTime(st.starter,t);o.frequency.exponentialRampToValueAtTime(st.starter*1.55,t+.48);
      f.type='lowpass';f.frequency.value=520;f.Q.value=.8;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.075*(+ui.volume.value),t+.035);g.gain.setValueAtTime(.068*(+ui.volume.value),t+.36);g.gain.exponentialRampToValueAtTime(.0001,t+.64);
      o.connect(f);f.connect(g);g.connect(this.fxBus);o.start(t);o.stop(t+.68);
      const n=c.createBufferSource(),nf=c.createBiquadFilter(),ng=c.createGain();n.buffer=this._noiseBuffer(c,.66);nf.type='bandpass';nf.frequency.value=410;nf.Q.value=.55;
      ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(.045*(+ui.volume.value),t+.025);ng.gain.exponentialRampToValueAtTime(.0001,t+.62);
      n.connect(nf);nf.connect(ng);ng.connect(this.fxBus);n.start(t);n.stop(t+.66);
    }
    _finishSequence(){
      if(!this.sequence)return;
      this.sequence=null;
      try{if(this.sim){this.sim.setThrottle(0);this.sim.setBrake(.55);if(this.sim.setClutch)this.sim.setClutch(0);if(this.sim.setAutoShift)this.sim.setAutoShift(true);}}catch(e){}
      if(ui.sampleStatus)ui.sampleStatus.textContent='Physical Engine جاهز — Model Profiles + Cold Start + Rev Demo جاهزة للتجربة.';
    }
    async coldStart(){
      await this.start();
      if(!this.sim||!this._isPhysical(this.engineKey)){this.fallback.transient('downshift',.8);return;}
      this._finishSequence();
      this.sequence={kind:'cold',start:performance.now(),events:{},type:this.engineKey,token:++this.sequenceToken};
      try{if(this.sim.setAutoShift)this.sim.setAutoShift(false);if(this.sim.setClutch)this.sim.setClutch(1);if(this.sim.setBrake)this.sim.setBrake(1);}catch(e){}
      this._starterSound(this.engineKey);
      if(ui.sampleStatus)ui.sampleStatus.textContent='Cold Start… ستسمع السلف ثم flare قصير واستقرار الـIdle.';
    }
    async revDemo(){
      await this.start();
      if(!this.sim||!this._isPhysical(this.engineKey)){this.fallback.transient('upshift',1);return;}
      this._finishSequence();
      this.sequence={kind:'rev',start:performance.now(),events:{},type:this.engineKey,token:++this.sequenceToken};
      try{if(this.sim.setAutoShift)this.sim.setAutoShift(false);if(this.sim.setClutch)this.sim.setClutch(1);if(this.sim.setBrake)this.sim.setBrake(1);}catch(e){}
      if(ui.sampleStatus)ui.sampleStatus.textContent='Rev + Bangs Demo… ارفع الصوت قليلًا لسماع الـBOOM والـcrackles بوضوح.';
    }
    _profileFor(type){return this._styleFor(type).profile;}
    _isPhysical(type){return type.startsWith('phys_')||['amg_gt63','mclaren_720s','bmw_m3','ferrari_458','ferrari_v12','porsche_911gt3'].includes(type);}
    _applyStyle(type){
      if(!this.sim)return;
      const st=this._styleFor(type);
      try{
        if(this.sim.setVehicle)this.sim.setVehicle(st.vehicle);
        this._applyModelParams(type);
        // Re-design the virtual gearbox after gear-count / torque changes.
        if(this.sim.setVehicleProfile&&this.sim.vehicle)this.sim.setVehicleProfile(this.sim.vehicle);
        if(this.sim.setTone)this.sim.setTone(st.tone);
        if(this.sim.setDynamics)this.sim.setDynamics(st.dynamics);
        if(this.sim.setWidth)this.sim.setWidth(st.width);
        if(this.sim.setReverb)this.sim.setReverb(st.reverb);
        if(this.sim.setInputs)this.sim.setInputs(st.inputs);
      }catch(e){console.warn('style apply',e);}
    }
    async _load(){
      if(this.sim||this.failed)return;
      if(this.loading)return this.loading;
      this.loading=(async()=>{
        try{
          if(ui.sampleStatus)ui.sampleStatus.textContent='تحميل محرك الاحتراق الفيزيائي…';
          const mod=await import(this.moduleUrl);
          this.EngineSim=mod.EngineSim;
          const C=window.AudioContext||window.webkitAudioContext;
          if(!C)throw new Error('Web Audio غير مدعوم');
          const ctx=new C();
          const initialStyle=this._styleFor(ui.engineType.value);
          this.sim=new this.EngineSim(ctx,{engine:initialStyle.profile,vehicle:initialStyle.vehicle,volume:+ui.volume.value,perspective:'exterior'});
          if(this.sim.setAutoShift)this.sim.setAutoShift(true);
          this._applyStyle(ui.engineType.value);
          await this.sim.start();
          this.running=true;this.engineKey=ui.engineType.value;
          if(ui.sampleStatus)ui.sampleStatus.textContent='Physical Engine جاهز — الاشتعال والعادم والـdrivetrain يتم توليدها في الزمن الحقيقي.';
        }catch(e){
          console.warn('Physical Engine unavailable, using fallback',e);
          this.failed=true;this.sim=null;
          await this.fallback.start();this.running=true;
          if(ui.sampleStatus)ui.sampleStatus.textContent='تعذر تحميل Physical Engine؛ تم تشغيل الصوت الاحتياطي. جرّب الصفحة عبر HTTPS مع اتصال إنترنت.';
        }
      })();
      return this.loading;
    }
    async start(){
      if(this._isPhysical(ui.engineType.value)){
        await this._load();
        if(this.sim && this.sim.ctx?.state==='suspended')await this.sim.ctx.resume();
      }else{
        await this.fallback.start();this.running=true;
      }
    }
    async setEngine(type){
      this.engineKey=type;
      if(this._isPhysical(type)){
        if(!this.sim && !this.failed)await this._load();
        if(this.sim && this.sim.setEngineType){
          try{this.sim.setEngineType(this._profileFor(type));this._applyStyle(type);}catch(e){console.warn(e);}
        }
      }
    }
    transient(kind,strength){
      if(this._isPhysical(this.engineKey)&&this.sim){
        if(kind==='downshift' && ui.popMode?.value!=='off')this._popBurst(this.engineKey,clamp(strength*1.05,.45,1.2),'downshift');
        return;
      }
      this.fallback.transient(kind,strength);
    }
    update(rpm,thr,type,isDecel,shiftCut,boostAmount,roadSpeed=0,roadAccel=0){
      this.engineKey=type;
      if(this._isPhysical(type)&&this.sim){
        const now=performance.now();const dt=Math.min(.05,Math.max(.005,(now-this.lastT)/1000));this.lastT=now;
        const st=this.sim.getState?this.sim.getState():null;
        const simSpeed=st?.speedKmh||0;
        const err=roadSpeed-simSpeed;
        let gas=clamp(thr+Math.max(0,err)*.022,0,1);
        let brake=err<-.8?clamp((-err)/22,0,1):0;
        if(roadAccel<-.25)brake=Math.max(brake,clamp(-roadAccel/5,0,.75));
        if(roadSpeed<.8){gas=0;brake=Math.max(brake,.28);}
        try{
          // Stationary showcase sequences. Clutch pedal is held down so the engine can rev without moving the virtual car.
          if(this.sequence){
            const age=(now-this.sequence.start)/1000,ev=this.sequence.events,sty=this._startStyle(type);
            if(this.sim.setAutoShift)this.sim.setAutoShift(false);
            if(this.sim.setClutch)this.sim.setClutch(1);
            brake=1;
            if(this.sequence.kind==='cold'){
              if(age<.48)gas=.015;
              else if(age<.90)gas=lerp(.08,sty.flare,(age-.48)/.42);
              else if(age<1.45)gas=lerp(sty.flare,.16,(age-.90)/.55);
              else if(age<2.45)gas=.08+Math.sin(age*9)*.018;
              else gas=.035;
              if(age>.52&&!ev.ignite){ev.ignite=1;this._oneBang(type,sty.boom*.72,.02);}
              if(age>.98&&!ev.cough){ev.cough=1;this._oneBang(type,sty.boom*.44,.03);}
              if(age>3.0)this._finishSequence();
            }else if(this.sequence.kind==='rev'){
              // Two revs with a full lift in between, to expose each profile's overrun character.
              if(age<.35)gas=.05;
              else if(age<1.00)gas=lerp(.08,.86,(age-.35)/.65);
              else if(age<1.42)gas=lerp(.86,.02,(age-1.00)/.42);
              else if(age<1.95)gas=.025;
              else if(age<2.60)gas=lerp(.06,.76,(age-1.95)/.65);
              else if(age<3.02)gas=lerp(.76,.015,(age-2.60)/.42);
              else gas=.025;
              if(age>1.16&&!ev.pop1){ev.pop1=1;this._popBurst(type,1.02,'lift');}
              if(age>2.78&&!ev.pop2){ev.pop2=1;this._popBurst(type,1.10,'lift');}
              if(age>3.65)this._finishSequence();
            }
          }
          this.sim.setThrottle(gas);this.sim.setBrake(brake);
          this.sim.setVolume(+ui.volume.value);
          const style=this._styleFor(type), bi=style.inputs, bt=style.tone;
          if(this.sim.setInputs)this.sim.setInputs({
            aggression:clamp(bi.aggression*(.62+.58*(+ui.exhaust.value)),0,1),
            roughness:clamp(bi.roughness+(.045*(1-thr)),0,.22),
            strain:clamp(bi.strain+thr*.09,0,.32),distance:bi.distance,environment:ui.sceneType?.value==='tunnel'?.92:(ui.sceneType?.value==='city'?.18:0)
          });
          if(this.sim.setTone)this.sim.setTone({
            rumble:clamp(bt.rumble*(.90+.18*(+ui.exhaust.value)),.45,1.45),
            brightness:clamp(bt.brightness*(isDecel?1.08:(.90+.18*thr)),.55,1.65),
            punch:clamp(bt.punch*(isDecel?.88:(.90+.18*(+ui.exhaust.value))),.50,1.50)
          });
          this.sim.update(dt);
          // Pops & Bangs: only on a real lift/overrun, never as a constant machine-gun loop.
          const nowMs=performance.now(), throttleDrop=this.lastPopThrottle-thr;
          const mode=ui.popMode?.value||'sport';
          const minGap=mode==='wild'?190:mode==='natural'?650:330;
          const minRpm=mode==='natural'?2900:2200;
          if(!this.sequence && ui.popMode?.value!=='off' && isDecel && rpm>minRpm && (throttleDrop>.16 || thr<.16) && nowMs-this.lastPopAt>minGap){
            const rpmEnergy=clamp((rpm-minRpm)/4200,0,1);
            const liftEnergy=clamp(throttleDrop*1.8 + Math.max(0,-roadAccel)*.12 + .28,0,1.15);
            let chance=mode==='wild'?.92:mode==='natural'?.36:.68;
            const brandBias=this.engineKey==='amg_gt63'?1.18:this.engineKey==='ferrari_458'?.90:this.engineKey==='porsche_911gt3'?.82:1;
            if(Math.random()<chance*brandBias){
              this._popBurst(type,clamp(.58+rpmEnergy*.38+liftEnergy*.28,.55,1.22),'lift');this.lastPopAt=nowMs;
            }
          }
          this.lastPopThrottle=thr;
        }catch(e){console.warn('EngineSim update',e);}
        return;
      }
      const legacyType=type==='hyper'?'hyper':'v8';
      this.fallback.update(rpm,thr,legacyType,isDecel,shiftCut,boostAmount);
    }
    getState(){
      if(this.sim&&this._isPhysical(this.engineKey)){try{return this.sim.getState();}catch(e){}}
      return null;
    }
  }
  const audio=new PhysicalEngineAudio(new EngineAudio());

  function haversine(a,b){const R=6371000,r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

  function onMotion(e){
    const a=e.acceleration;
    if(!a)return;
    const x=Number.isFinite(a.x)?a.x:0,y=Number.isFinite(a.y)?a.y:0,z=Number.isFinite(a.z)?a.z:0;
    const mag=Math.sqrt(x*x+y*y+z*z);
    // Motion is used only as a short load transient. It never edits GPS speed.
    const normalized=clamp((mag-.16)/2.4,0,1);
    motionEnergy=lerp(motionEnergy,normalized,.22);
    motionPeak=Math.max(motionPeak*.94,motionEnergy);
  }
  async function enableMotionAssist(){
    try{
      if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){
        const permission=await DeviceMotionEvent.requestPermission();
        if(permission!=='granted')throw new Error('permission denied');
      }
      if(typeof DeviceMotionEvent==='undefined')throw new Error('not supported');
      window.addEventListener('devicemotion',onMotion,{passive:true});
      motionAssist=true;ui.motionBtn.classList.add('active');ui.motionBtn.textContent='الحساس يعمل';
      syncSourceLabel();
    }catch(e){
      motionAssist=false;ui.motionBtn.classList.remove('active');ui.motionBtn.textContent='الحساس غير متاح';
    }
  }
  function syncSourceLabel(){
    ui.source.textContent=demo?'تجريبي':(motionAssist?'GPS + Motion':'GPS');
  }
  function setGpsStatus(text,ok=false){gpsStatusText=text;ui.gpsText.textContent=text;ui.gpsDot.classList.toggle('ok',!!ok);syncDriveHud();}
  function onPosition(p){
    const lat=Number(p.coords.latitude),lon=Number(p.coords.longitude),acc=Number(p.coords.accuracy||9999);
    if(Number.isFinite(lat)&&Number.isFinite(lon)){
      lastWeatherPos={lat,lon};
      ui.accuracy.textContent=Math.round(acc)+' m';
      setGpsStatus('GPS متصل • دقة '+Math.round(acc)+' م',true);syncSourceLabel();
      applyImmediateLightScene(lat,lon).then(()=>refreshLiveWeather(lat,lon,false));
    }
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||acc>120){return;}
    let v=p.coords.speed!=null&&p.coords.speed>=0?p.coords.speed*3.6:null;
    const now=p.timestamp||Date.now(), pos={lat,lon,t:now};
    if(v==null&&prevPos){const dt=(now-prevPos.t)/1000;if(dt>.7)v=(haversine(prevPos,pos)/dt)*3.6;}
    prevPos=pos;
    if(v!=null&&isFinite(v))targetSpeed=clamp(v,0,280);
  }
  function onGeoError(e){
    const map={1:'تم رفض إذن الموقع',2:'تعذر تحديد الموقع',3:'انتهت مهلة تحديد الموقع'};
    setGpsStatus('GPS: '+(map[e?.code]||e?.message||'خطأ غير معروف'),false);
  }
  function startGpsWatch(highAccuracy=true){
    if(watchId!=null)navigator.geolocation.clearWatch(watchId);
    watchId=navigator.geolocation.watchPosition(onPosition,onGeoError,{enableHighAccuracy:highAccuracy,maximumAge:highAccuracy?1500:60000,timeout:highAccuracy?18000:12000});
  }
  async function requestGps(){
    if(!('geolocation' in navigator)){setGpsStatus('GPS غير مدعوم في هذا المتصفح');return;}
    if(!window.isSecureContext){setGpsStatus('GPS يحتاج HTTPS — لا تفتح index.html مباشرة');alert('GPS في المتصفح يحتاج HTTPS. إذا فتحت index.html مباشرة من الهاتف فلن يعمل الموقع. افتح التطبيق من رابط https://.');return;}
    setGpsStatus('جاري طلب إذن الموقع…');
    try{
      if(navigator.permissions?.query){const ps=await navigator.permissions.query({name:'geolocation'});if(ps.state==='denied'){setGpsStatus('إذن الموقع مرفوض من إعدادات المتصفح');return;}}
    }catch(_){ }
    navigator.geolocation.getCurrentPosition(p=>{onPosition(p);startGpsWatch(true);},e=>{
      if(e?.code===1){onGeoError(e);return;}
      setGpsStatus('محاولة GPS تقريبي…');
      navigator.geolocation.getCurrentPosition(p=>{onPosition(p);startGpsWatch(false);},e2=>{onGeoError(e2);startGpsWatch(false);},{enableHighAccuracy:false,maximumAge:120000,timeout:12000});
    },{enableHighAccuracy:false,maximumAge:60000,timeout:12000});
  }

  function triggerShift(nextGear){
    const now=performance.now(); if(now-lastShiftAt<280||nextGear===gear)return;
    const from=gear, down=nextGear<from;
    shiftState={from,to:nextGear,start:now,duration:down?390:320,down}; lastShiftAt=now;
    ui.shiftFlash.classList.remove('on');void ui.shiftFlash.offsetWidth;ui.shiftFlash.classList.add('on');
    audio.transient(down?'downshift':'upshift',down?.9:.78); gear=nextGear;
  }

  const engineNames={amg_gt63:'AMG GT 63',mclaren_720s:'McLaren 720S',bmw_m3:'BMW M3/M4',ferrari_458:'Ferrari 458',ferrari_v12:'Ferrari V12',porsche_911gt3:'911 GT3',phys_v8:'Physical V8',phys_v8tt:'V8 Twin‑Turbo',phys_i6:'Inline‑6 Turbo',phys_v10:'V10'};
  const modelMeta={
    amg_gt63:{arch:'4.0 V8 Biturbo',rpm:'6,800 RPM',gear:'9‑speed',note:'نبرة عميقة وعزم منخفض قوي مع فرقعات AMG ثقيلة.'},
    mclaren_720s:{arch:'4.0 V8 Twin‑Turbo',rpm:'8,200 RPM tune',gear:'7‑speed',note:'أخف وأحدّ من AMG مع Turbo وشفط هواء أوضح.'},
    bmw_m3:{arch:'3.0 Inline‑6 Twin‑Turbo',rpm:'7,200 RPM',gear:'8‑speed',note:'صوت مستقيم وناعم مع Turbo واضح واستجابة متدرجة.'},
    ferrari_458:{arch:'4.5 NA Flat‑Plane V8',rpm:'9,000 RPM',gear:'7‑speed DCT',note:'بدون Turbo: intake + exhaust حادان وصعود سريع حتى 9000.'},
    ferrari_v12:{arch:'NA V12',rpm:'8,500 RPM',gear:'8‑speed tune',note:'نبرة متصلة وكثيفة وعالية بدل الـburble.'},
    porsche_911gt3:{arch:'4.0 NA Flat‑6',rpm:'9,000 RPM',gear:'7‑speed PDK tune',note:'Flat‑6 مع Intake howl واضح وصوت أعلى كلما اقترب من 9000.'}
  };
  function syncModelInfo(){
    if(!ui.modelInfo)return; const m=modelMeta[ui.engineType.value];
    ui.modelInfo.innerHTML=m?`<div><small>المحرك</small><strong>${m.arch}</strong></div><div><small>الحد الأعلى</small><strong>${m.rpm}</strong></div><div><small>الناقل</small><strong>${m.gear}</strong></div><div class="modelNote">${m.note}</div>`:`<div class="modelNote">Physical Engine profile عام للاختبار.</div>`;
  }
  const scenePresets={
    sunny:{label:'نهاري مشمس',scene:'sunny',engine:'amg_gt63',desc:'طريق نهاري واضح وإضاءة قوية.',engineLabel:'Mercedes‑AMG GT 63'},
    cloudy:{label:'غائم',scene:'cloudy',engine:'porsche_911gt3',desc:'جو غائم ونبرة قيادة أخف.',engineLabel:'Porsche 911 GT3'},
    night:{label:'ليل',scene:'night',engine:'bmw_m3',desc:'طريق ليلي داكن خارج المدينة.',engineLabel:'BMW M3/M4 Competition'},
    city:{label:'مدينة ليلية',scene:'city',engine:'phys_i6',desc:'مدينة ليلية وأضواء بعيدة.',engineLabel:'Inline‑6 Turbo'},
    sunset:{label:'غروب',scene:'sunset',engine:'mclaren_720s',desc:'غروب دافئ وطابع استعراضي.',engineLabel:'McLaren 720S'},
    foggy:{label:'ضباب',scene:'foggy',engine:'phys_v8',desc:'رؤية منخفضة وضباب كثيف.',engineLabel:'Physical V8'},
    rainy:{label:'ممطر',scene:'rainy',engine:'ferrari_v12',desc:'طريق ممطر وانعكاسات.',engineLabel:'Ferrari V12'},
    snowy:{label:'ثلجي',scene:'snowy',engine:'phys_v10',desc:'ثلج وتساقط خفيف.',engineLabel:'Physical V10'},
    storm:{label:'عاصفة',scene:'storm',engine:'phys_v8tt',desc:'سماء داكنة ومطر قوي.',engineLabel:'V8 Twin‑Turbo'},
    tunnel:{label:'نفق',scene:'tunnel',engine:'ferrari_458',desc:'صدى أقوى داخل النفق.',engineLabel:'Ferrari 458 Italia'}
  };
  let weatherAuto=localStorage.getItem('drivetone.weatherAuto')!=='false',lastWeatherAt=0,lastWeatherPos=null,lastWeatherData=null;
  function solarElevationDeg(lat,lon,date=new Date()){
    // NOAA-style solar position approximation. Works offline and avoids depending on weather API for day/night.
    const rad=Math.PI/180,deg=180/Math.PI;
    const jd=date.getTime()/86400000+2440587.5;
    const n=jd-2451545.0;
    const L=(280.460+0.9856474*n)%360;
    const g=(357.528+0.9856003*n)%360;
    const lambda=(L+1.915*Math.sin(g*rad)+0.020*Math.sin(2*g*rad))*rad;
    const eps=(23.439-0.0000004*n)*rad;
    const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda));
    const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));
    const gmst=(280.46061837+360.98564736629*(jd-2451545.0))%360;
    let H=(gmst+lon)*rad-ra;
    H=((H+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
    const phi=lat*rad;
    return Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H))*deg;
  }
  function localLightPhase(lat,lon,date=new Date()){
    const elev=solarElevationDeg(lat,lon,date);
    if(elev<-6)return {phase:'night',elev};
    if(elev<2)return {phase:'twilight',elev};
    return {phase:'day',elev};
  }
  async function applyImmediateLightScene(lat,lon){
    if(!weatherAuto)return; const light=localLightPhase(lat,lon,new Date());
    const next=light.phase==='night'?'night':light.phase==='twilight'?'sunset':null;
    if(next && scenePresets[next] && ui.sceneType?.value!==next) await applyScenePreset(next,{close:false});
    return light;
  }
  function weatherSceneFromCurrent(cur,daily,lat=null,lon=null){
    const code=Number(cur?.weather_code??0),apiIsDay=Number(cur?.is_day??1)===1,cloud=Number(cur?.cloud_cover??0),precip=Number(cur?.precipitation??0),snow=Number(cur?.snowfall??0);
    const light=(Number.isFinite(lat)&&Number.isFinite(lon))?localLightPhase(lat,lon,new Date()):null;
    const isDay=light?light.phase==='day':apiIsDay;
    if(code>=95) return 'storm';
    if(snow>0 || (code>=71&&code<=77) || code===85 || code===86) return 'snowy';
    if(code===45||code===48) return 'foggy';
    if(precip>0 || (code>=51&&code<=67) || (code>=80&&code<=82)) return 'rainy';
    if(light?.phase==='night' || !isDay) return 'night';
    if(light?.phase==='twilight') return 'sunset';
    try{const now=new Date().getTime(),sunset=new Date(daily?.sunset?.[0]).getTime(),sunrise=new Date(daily?.sunrise?.[0]).getTime();if(Math.abs(now-sunset)<45*60000||Math.abs(now-sunrise)<35*60000)return 'sunset';}catch(e){}
    if(cloud>=58 || code>=2) return 'cloudy';
    return 'sunny';
  }
  function weatherPhrase(code){if(code>=95)return 'عاصفة رعدية';if((code>=71&&code<=77)||code===85||code===86)return 'ثلوج';if(code===45||code===48)return 'ضباب';if((code>=51&&code<=67)||(code>=80&&code<=82))return 'مطر';if(code===0)return 'صحو';if(code<=3)return 'غيوم جزئية';return 'حالة جوية';}
  async function refreshLiveWeather(lat,lon,force=false){
    if(!weatherAuto && !force)return;const now=Date.now();if(!force&&now-lastWeatherAt<8*60*1000)return;lastWeatherAt=now;lastWeatherPos={lat,lon};
    if(ui.weatherLiveStatus)ui.weatherLiveStatus.innerHTML='<div class="modelNote">جارٍ تحديث الطقس اللحظي…</div>';
    try{const q=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,is_day,weather_code,cloud_cover,precipitation,rain,showers,snowfall,visibility,wind_speed_10m',daily:'sunrise,sunset',timezone:'auto',forecast_days:'1'});const res=await fetch('https://api.open-meteo.com/v1/forecast?'+q.toString(),{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();lastWeatherData=data;const cur=data.current||{},scene=weatherSceneFromCurrent(cur,data.daily||{},lat,lon);const key=scenePresets[scene]?scene:(scene==='night'?'night':'sunny');if(weatherAuto)await applyScenePreset(key,{close:false});const t=Number(cur.temperature_2m);const cloud=Math.round(Number(cur.cloud_cover||0));const wind=Math.round(Number(cur.wind_speed_10m||0));const light=localLightPhase(lat,lon,new Date());if(ui.weatherLiveStatus)ui.weatherLiveStatus.innerHTML=`<div><small>الحالة</small><strong>${weatherPhrase(Number(cur.weather_code||0))}</strong></div><div><small>الحرارة</small><strong>${Number.isFinite(t)?t.toFixed(1)+'°C':'—'}</strong></div><div><small>الغيوم / الرياح</small><strong>${cloud}% • ${wind} km/h</strong></div><div><small>الإضاءة</small><strong>${light.phase==='night'?'ليل':light.phase==='twilight'?'شفق':'نهار'}</strong></div><div class="modelNote">المشهد التلقائي: ${scenePresets[key]?.label||key}</div>`;
    }catch(e){const light=localLightPhase(lat,lon,new Date());if(weatherAuto){const fallback=light.phase==='night'?'night':light.phase==='twilight'?'sunset':'sunny';if(scenePresets[fallback])await applyScenePreset(fallback,{close:false});}if(ui.weatherLiveStatus)ui.weatherLiveStatus.innerHTML=`<div class="modelNote">تعذر تحديث الطقس، لكن تحديد ${light.phase==='night'?'الليل':'النهار'} يعمل محليًا من GPS. المشهد الحالي: ${scenePresets[ui.sceneType?.value]?.label||ui.sceneType?.value}.</div>`;}
  }
  function syncWeatherButton(){if(!ui.weatherAutoBtn)return;ui.weatherAutoBtn.classList.toggle('active',weatherAuto);ui.weatherAutoBtn.textContent='الطقس التلقائي: '+(weatherAuto?'يعمل':'متوقف');}
  let sceneDrawerOpen=false,sceneSwipe=null;
  function renderSceneDrawer(){
    if(!ui.sceneDrawerList)return;
    const active=ui.sceneType?.value||'sunny';
    ui.sceneDrawerList.innerHTML=Object.entries(scenePresets).map(([key,p])=>`<button class="sceneCard ${p.scene===active?'active':''}" type="button" data-preset="${key}" aria-label="${p.label}" title="${p.label}"><div class="sceneThumb"><canvas class="scenePreviewCanvas" data-scene="${p.scene}"></canvas><div class="scenePreviewShade"></div><div class="sceneDot"></div></div></button>`).join('');
    requestAnimationFrame(()=>ui.sceneDrawerList.querySelectorAll('.scenePreviewCanvas').forEach((cv,i)=>drawStaticPreview(cv,cv.dataset.scene,i)));
  }
  function drawStaticPreview(canvas,scene,seed=0){
    const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(220,Math.round((r.width||270)*dpr)),h=Math.max(110,Math.round((r.height||124)*dpr));canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const W=w/dpr,H=h/dpr,hor=H*.48;
    let top='#4aa8ff',mid='#cbeaff',ground='#58653c',road='#25292d';
    if(scene==='cloudy'){top='#697581';mid='#c2c9cf';ground='#566057';road='#2b2f33';} if(scene==='night'){top='#030711';mid='#132039';ground='#11161b';road='#101319';} if(scene==='city'){top='#07101f';mid='#1d2940';ground='#2d1f28';road='#12161c';} if(scene==='sunset'){top='#4e3a9d';mid='#ed8063';ground='#574033';road='#211d20';} if(scene==='foggy'){top='#959ea1';mid='#d2d7d8';ground='#89908d';road='#555b5e';} if(scene==='rainy'){top='#2f3b48';mid='#738597';ground='#45515b';road='#20262d';} if(scene==='snowy'){top='#8297aa';mid='#e2edf4';ground='#d7e0e5';road='#545c63';} if(scene==='storm'){top='#151a23';mid='#455160';ground='#303943';road='#171c22';} if(scene==='tunnel'){top='#080a0d';mid='#171a1f';ground='#111317';road='#0b0c0e';}
    const sky=c.createLinearGradient(0,0,0,hor);sky.addColorStop(0,top);sky.addColorStop(1,mid);c.fillStyle=sky;c.fillRect(0,0,W,hor);
    if(scene==='sunny'||scene==='sunset'){c.fillStyle=scene==='sunny'?'#fff2b5':'#ffd18b';c.beginPath();c.arc(W*.78,H*.20,10,0,Math.PI*2);c.fill();}
    if(scene==='night'||scene==='city'){c.fillStyle='rgba(255,255,255,.72)';for(let i=0;i<20;i++){c.fillRect((i*37+seed*13)%W,(i*19)%Math.max(20,hor*.55),1,1);}}
    if(['cloudy','rainy','storm','foggy','snowy'].includes(scene)){c.fillStyle=scene==='storm'?'rgba(220,228,236,.18)':'rgba(245,248,250,.30)';for(let i=0;i<4;i++){const x=18+i*64,y=18+(i%2)*10;c.beginPath();c.ellipse(x,y,25,8,0,0,Math.PI*2);c.ellipse(x+15,y-5,18,10,0,0,Math.PI*2);c.fill();}}
    if(scene==='city'){c.fillStyle='#0b0e14';for(let i=0;i<10;i++){let bw=18,bh=20+((i*17)%38);c.fillRect(i*(W/10),hor-bh,bw,bh);}}
    else if(scene!=='tunnel'){c.fillStyle=scene==='snowy'?'#b8c5cc':scene==='sunny'?'#4d5f38':'#39433f';c.beginPath();c.moveTo(0,hor);for(let x=0;x<=W;x+=W/6)c.lineTo(x,hor-12-Math.sin(x*.06+seed)*9);c.lineTo(W,hor);c.closePath();c.fill();}
    c.fillStyle=ground;c.fillRect(0,hor,W,H-hor);
    if(scene==='tunnel'){c.strokeStyle='rgba(220,228,236,.26)';c.lineWidth=3;c.beginPath();c.moveTo(12,H);c.lineTo(22,hor+12);c.quadraticCurveTo(W/2,hor-36,W-22,hor+12);c.lineTo(W-12,H);c.stroke();for(let i=0;i<5;i++){c.strokeStyle='rgba(255,241,188,.5)';c.beginPath();c.moveTo(W*.38+i*W*.06,hor+4);c.lineTo(W*.42+i*W*.04,hor+4);c.stroke();}}
    c.fillStyle=road;c.beginPath();c.moveTo(W*.47,hor);c.lineTo(W*.53,hor);c.lineTo(W*.96,H);c.lineTo(W*.04,H);c.closePath();c.fill();
    c.strokeStyle='rgba(245,246,247,.78)';c.lineWidth=2;c.beginPath();c.moveTo(W*.47,hor);c.lineTo(W*.04,H);c.moveTo(W*.53,hor);c.lineTo(W*.96,H);c.stroke();
    for(let lane of [-.25,.25]){c.strokeStyle='rgba(255,255,255,.72)';for(let i=0;i<5;i++){const y1=hor+8+i*18,y2=y1+8,t1=(y1-hor)/(H-hor),t2=(y2-hor)/(H-hor),cx=W/2;c.lineWidth=1.2+i*.25;c.beginPath();c.moveTo(cx+lane*(W*.05+W*.42*t1),y1);c.lineTo(cx+lane*(W*.05+W*.42*t2),y2);c.stroke();}}
    if(scene==='rainy'||scene==='storm'){c.strokeStyle='rgba(230,240,248,.28)';for(let i=0;i<28;i++){const x=(i*29)%W,y=(i*17)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+10);c.stroke();}}
    if(scene==='snowy'){c.fillStyle='rgba(255,255,255,.82)';for(let i=0;i<34;i++){c.beginPath();c.arc((i*43)%W,(i*27)%H,1.5,0,Math.PI*2);c.fill();}}
    if(scene==='foggy'){let fg=c.createLinearGradient(0,hor-20,0,H);fg.addColorStop(0,'rgba(240,244,244,.55)');fg.addColorStop(1,'rgba(240,244,244,.15)');c.fillStyle=fg;c.fillRect(0,hor-20,W,H-hor+20);}
  }
  function openSceneDrawer(){sceneDrawerOpen=true;document.body.classList.add('scene-drawer-open');ui.sceneDrawer?.setAttribute('aria-hidden','false');ui.sceneDrawerOverlay?.setAttribute('aria-hidden','false');renderSceneDrawer();}
  function closeSceneDrawer(){sceneDrawerOpen=false;document.body.classList.remove('scene-drawer-open');ui.sceneDrawer?.setAttribute('aria-hidden','true');ui.sceneDrawerOverlay?.setAttribute('aria-hidden','true');}
  async function applyScenePreset(key,{close=true}={}){
    const p=scenePresets[key]; if(!p) return;
    if(ui.sceneType) ui.sceneType.value=p.scene;
    localStorage.setItem('drivetone.scene',p.scene);
    roadViz.setScene(p.scene);
    if(ui.engineType) ui.engineType.value=p.engine;
    localStorage.setItem('drivetone.engine',p.engine);
    if(audio.running) await audio.setEngine(p.engine);
    syncModelInfo();syncDriveHud();renderSceneDrawer();
    if(close) closeSceneDrawer();
  }

  function syncDriveHud(){
    if(!ui.driveHud)return;
    const gpsOk=ui.gpsDot.classList.contains('ok');
    ui.driveGpsDot.classList.toggle('ok',gpsOk || demo);
    ui.driveGpsText.textContent=demo?'وضع تجريبي':(gpsOk?'GPS متصل':gpsStatusText);
    ui.driveAudioDot.classList.toggle('ok',audio.running);
    ui.driveAudioText.textContent=audio.running?'الصوت يعمل':'الصوت متوقف';
    ui.driveEngineText.textContent=engineNames[ui.engineType.value]||'Engine';
    ui.driveModeText.textContent=driveMode[0].toUpperCase()+driveMode.slice(1);
    if(ui.visualSceneTag){const names={sunny:'SUNNY DAY',cloudy:'CLOUDY ROAD',night:'NIGHT ROAD',city:'NIGHT CITY',sunset:'SUNSET DRIVE',foggy:'FOGGY ROAD',rainy:'RAINY ROAD',snowy:'SNOW ROAD',storm:'STORM ROAD',tunnel:'TUNNEL',highway:'HIGHWAY'};ui.visualSceneTag.textContent=(names[ui.sceneType?.value]||'SUNNY DAY')+' • LIVE SPEED';}
  }

  async function requestWakeLock(){
    try{
      if('wakeLock' in navigator && !wakeLock){
        wakeLock=await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release',()=>{wakeLock=null;});
      }
    }catch(e){/* Optional capability: driving mode still works without it. */}
  }
  async function releaseWakeLock(){
    try{if(wakeLock)await wakeLock.release();}catch(e){}
    wakeLock=null;
  }
  async function enterDrivingView(){
    drivingView=true;document.body.classList.add('driving-mode');ui.driveHud.setAttribute('aria-hidden','false');syncDriveHud();renderSceneDrawer();
    setTimeout(()=>roadViz.resize(true),60);
    await requestWakeLock();
    try{if(!document.fullscreenElement && document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch(e){}
  }
  async function exitDrivingView(fromFullscreen=false){
    drivingView=false;document.body.classList.remove('driving-mode');ui.driveHud.setAttribute('aria-hidden','true');closeSceneDrawer();await releaseWakeLock();
    try{if(!fromFullscreen && document.fullscreenElement && document.exitFullscreen)await document.exitFullscreen();}catch(e){}
  }

  function applyMode(mode){
    driveMode=mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    localStorage.setItem('drivetone.mode',mode);
    syncDriveHud();
  }

  $('startGps').onclick=async()=>{
    demo=false;$('demoBtn').classList.remove('active');ui.source.textContent='GPS';
    weatherAuto=true;localStorage.setItem('drivetone.weatherAuto','true');syncWeatherButton();syncDriveHud();syncSourceLabel();
    await requestGps();
  };
  $('demoBtn').onclick=()=>{demo=true;targetSpeed=+ui.demoSpeed.value;$('demoBtn').classList.add('active');syncSourceLabel();syncDriveHud();};
  $('startAudio').onclick=async()=>{await audio.start();$('startAudio').classList.remove('pulse');$('startAudio').textContent='الصوت يعمل';syncDriveHud();};
  ui.coldStartBtn.onclick=async()=>{ui.coldStartBtn.classList.add('active');await audio.coldStart();setTimeout(()=>ui.coldStartBtn.classList.remove('active'),3200);};
  ui.revDemoBtn.onclick=async()=>{ui.revDemoBtn.classList.add('active');await audio.revDemo();setTimeout(()=>ui.revDemoBtn.classList.remove('active'),3900);};
  ui.motionBtn.onclick=enableMotionAssist;
  ui.driveModeBtn.onclick=enterDrivingView;
  ui.exitDriveMode.onclick=()=>exitDrivingView(false);
  document.addEventListener('fullscreenchange',()=>{if(drivingView && !document.fullscreenElement)exitDrivingView(true);});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible' && drivingView)requestWakeLock();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && drivingView)exitDrivingView(false);});
  ui.demoSpeed.oninput=()=>{ui.demoValue.textContent=ui.demoSpeed.value+' كم/س';if(demo)targetSpeed=+ui.demoSpeed.value;};
  ui.sensitivity.oninput=()=>{ui.sensValue.textContent=(+ui.sensitivity.value).toFixed(1)+'x';localStorage.setItem('drivetone.sens',ui.sensitivity.value);};
  ui.volume.oninput=()=>{ui.volValue.textContent=Math.round(+ui.volume.value*100)+'%';localStorage.setItem('drivetone.vol',ui.volume.value);};
  ui.exhaust.oninput=()=>{ui.exhaustValue.textContent=Math.round(+ui.exhaust.value*100)+'%';localStorage.setItem('drivetone.exhaust',ui.exhaust.value);};
  ui.engineType.onchange=async()=>{localStorage.setItem('drivetone.engine',ui.engineType.value);if(audio.running)await audio.setEngine(ui.engineType.value);syncModelInfo();syncDriveHud();};
  ui.sceneType.onchange=()=>{localStorage.setItem('drivetone.scene',ui.sceneType.value);roadViz.setScene(ui.sceneType.value);syncDriveHud();renderSceneDrawer();};
  ui.sceneDrawerOverlay.onclick=closeSceneDrawer;
  ui.sceneDrawerClose.onclick=closeSceneDrawer;
  ui.sceneDrawerList.onclick=e=>{const card=e.target.closest('[data-preset]'); if(card) applyScenePreset(card.dataset.preset);};
  ui.weatherAutoBtn.onclick=()=>{weatherAuto=!weatherAuto;localStorage.setItem('drivetone.weatherAuto',String(weatherAuto));syncWeatherButton();if(weatherAuto&&lastWeatherPos)refreshLiveWeather(lastWeatherPos.lat,lastWeatherPos.lon,true);};
  ui.weatherRefreshBtn.onclick=()=>{if(lastWeatherPos)refreshLiveWeather(lastWeatherPos.lat,lastWeatherPos.lon,true);else ui.weatherLiveStatus.innerHTML='<div class="modelNote">شغّل GPS أولًا لتحديد الموقع وجلب الطقس.</div>';};
  ui.sceneEdgeZone.addEventListener('pointerdown',()=>{if(drivingView && !sceneDrawerOpen) openSceneDrawer();});
  document.addEventListener('touchstart',e=>{if(!drivingView) return; const x=e.touches[0].clientX; if(!sceneDrawerOpen && x<=28){sceneSwipe={mode:'open',x};} else if(sceneDrawerOpen){sceneSwipe={mode:'close',x};}} ,{passive:true});
  document.addEventListener('touchmove',e=>{if(!sceneSwipe||!drivingView) return; const dx=e.touches[0].clientX-sceneSwipe.x; if(sceneSwipe.mode==='open' && dx>44){openSceneDrawer(); sceneSwipe=null;} else if(sceneSwipe.mode==='close' && dx<-44){closeSceneDrawer(); sceneSwipe=null;}},{passive:true});
  document.addEventListener('touchend',()=>{sceneSwipe=null;},{passive:true});
  ui.teslaModel.onchange=()=>{selectedTesla=ui.teslaModel.value;renderTeslaCar();};
  ui.carSize.onchange=()=>{selectedCarSize=ui.carSize.value;renderTeslaCar();};
  ui.colorGrid.onclick=e=>{const b=e.target.closest('.colorBtn');if(!b)return;selectedPaint=b.dataset.color||'white';renderTeslaCar();};
  ui.modeGroup.onclick=e=>{const b=e.target.closest('[data-mode]');if(b)applyMode(b.dataset.mode);};

  const saved={mode:localStorage.getItem('drivetone.mode'),sens:localStorage.getItem('drivetone.sens'),vol:localStorage.getItem('drivetone.vol'),exhaust:localStorage.getItem('drivetone.exhaust'),engine:localStorage.getItem('drivetone.engine'),scene:localStorage.getItem('drivetone.scene'),teslaModel:localStorage.getItem('drivetone.teslaModel'),teslaPaint:localStorage.getItem('drivetone.teslaPaint'),carSize:localStorage.getItem('drivetone.carSize')};
  if(saved.mode&&modes[saved.mode])applyMode(saved.mode); else applyMode('normal');
  if(saved.sens){ui.sensitivity.value=saved.sens;ui.sensValue.textContent=(+saved.sens).toFixed(1)+'x';}
  if(saved.vol){ui.volume.value=saved.vol;ui.volValue.textContent=Math.round(+saved.vol*100)+'%';}
  if(saved.exhaust){ui.exhaust.value=saved.exhaust;ui.exhaustValue.textContent=Math.round(+saved.exhaust*100)+'%';}
  if(saved.scene&&['sunny','cloudy','night','city','sunset','foggy','rainy','snowy','storm','tunnel','highway'].includes(saved.scene))ui.sceneType.value=saved.scene; else ui.sceneType.value='sunny'; roadViz.setScene(ui.sceneType.value);
  const migrateEngine={amg_v8tt:'amg_gt63',mclaren_v8tt:'mclaren_720s',bmw_i6:'bmw_m3',ferrari_v8:'ferrari_458',porsche_flat6:'porsche_911gt3'};
  const restored=migrateEngine[saved.engine]||saved.engine;
  if(restored&&engineNames[restored])ui.engineType.value=restored; else ui.engineType.value='amg_gt63';
  if(saved.teslaModel&&teslaCars[saved.teslaModel])selectedTesla=saved.teslaModel;if(saved.teslaPaint&&teslaPaints[saved.teslaPaint])selectedPaint=saved.teslaPaint;if(saved.carSize&&['small','medium','large'].includes(saved.carSize))selectedCarSize=saved.carSize;
  ui.teslaModel.value=selectedTesla;ui.carSize.value=selectedCarSize;renderTeslaCar();
  syncModelInfo();syncDriveHud();

  function tick(now){
    const dt=Math.min(.10,(now-lastT)/1000||.016);lastT=now;
    if(demo)targetSpeed=+ui.demoSpeed.value;
    const modeResp=modes[driveMode].response, response=.86*+ui.sensitivity.value*modeResp;
    speed+=(targetSpeed-speed)*Math.min(1,dt*response*2.55);
    accel=((speed-lastSpeed)/3.6)/Math.max(dt,.016);lastSpeed=speed;

    const wanted=gearForSpeed(speed);
    if(wanted!==gear)triggerShift(wanted);
    let rpmTarget=rpmFor(speed,gear), shiftCut=1;
    if(shiftState){
      const p=clamp((now-shiftState.start)/shiftState.duration,0,1);
      if(shiftState.down){
        // Rev-match blip on downshift: brief torque cut followed by a controlled RPM flare.
        shiftCut=p<.22?lerp(1,.72,p/.22):p<.58?lerp(.72,.96,(p-.22)/.36):lerp(.96,1,(p-.58)/.42);
        const flare=p<.50?lerp(1,1.16,p/.50):lerp(1.16,1,(p-.50)/.50);
        rpmTarget*=flare;
      }else{
        shiftCut=p<.55?lerp(1,modes[driveMode].shiftCut,p/.55):lerp(modes[driveMode].shiftCut,1,(p-.55)/.45);
        rpmTarget*=p<.55?lerp(1,.67,p/.55):lerp(.67,1,(p-.55)/.45);
      }
      if(p>=1)shiftState=null;
    }
    rpm+= (rpmTarget-rpm)*Math.min(1,dt*12);

    const speedGap=Math.abs(targetSpeed-speed);
    throttle=clamp(accel*.24+speedGap/38,.03,1);
    const isDecel=accel<-.45;
    if(motionAssist && !demo && !isDecel && speed>1.5){
      // Add only a brief engine-load response; never alter measured speed or gear logic.
      throttle=Math.max(throttle,clamp(motionPeak*.62,.03,.72));
      motionPeak*=Math.pow(.30,dt);
    }else{motionPeak*=Math.pow(.12,dt);}
    if(isDecel)throttle=Math.max(.02,throttle*.25);
    if(speed<1){throttle=.04;rpm=lerp(rpm,modes[driveMode].idle,Math.min(1,dt*5));}
    const turboSelections=['phys_i6','phys_v8tt','amg_gt63','mclaren_720s','bmw_m3'];
    boost=turboSelections.includes(ui.engineType.value)?clamp((rpm-1800)/4300,0,1)*clamp(throttle*1.2,0,1):clamp((rpm-2500)/4500,0,.32)*throttle;

    audio.update(rpm,throttle,ui.engineType.value,isDecel,shiftCut,boost,speed,accel);
    const physState=audio.getState();
    if(physState){rpm=physState.rpm;gear=physState.gear||gear;boost=physState.boost??boost;}

    ui.speed.textContent=Math.round(speed);ui.rpm.textContent=Math.round(rpm);ui.gear.textContent=gear;ui.accel.textContent=accel.toFixed(2)+' m/s²';ui.throttle.textContent=Math.round(throttle*100)+'%';ui.boost.textContent=Math.round(boost*100)+'%';
    if(ui.visualSpeed){ui.visualSpeed.textContent=Math.round(speed);ui.visualRpm.textContent=Math.round(rpm).toLocaleString('en-US');ui.visualGear.childNodes[0].nodeValue=String(gear);ui.visualBoost.textContent=Math.round(boost*100)+'%';}
    document.documentElement.style.setProperty('--boost',Math.round(boost*100)+'%');
    const redline=physState?.redline||modes[driveMode].redline,prog=clamp(rpm/redline,0,1)*270;ui.gauge.style.setProperty('--p',prog+'deg');ui.gauge.classList.toggle('redline',rpm>redline*.91);
    if(ui.visualRpmFill)ui.visualRpmFill.style.width=Math.round(clamp(rpm/redline,0,1)*100)+'%';if(ui.visualBoostFill)ui.visualBoostFill.style.width=Math.round(clamp(boost,0,1)*100)+'%';
    ui.road.style.animationPlayState=speed>3?'running':'paused';document.documentElement.style.setProperty('--scene-speed',clamp(2.2-speed/135,.22,2.2)+'s');ui.speedGlow.style.opacity=String(clamp(speed/180,0,.9));
    roadViz.render(dt,speed,rpm,gear,boost,accel);
    if(ui.teslaCarStage){ui.teslaCarStage.classList.toggle('moving',speed>4);ui.teslaCarStage.classList.toggle('accel',accel>1.2);}
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
