// app.js
/* ---------- Certifications toggle (single binding) ---------- */
(() => {
  const group = document.querySelector('.cert-group');
  const btn = group?.querySelector('.cert-toggle');
  if (!group || !btn) return;

  if (!group.hasAttribute('data-collapsed')) group.setAttribute('data-collapsed','false');
  btn.setAttribute('aria-expanded', String(group.getAttribute('data-collapsed') === 'false'));

  if (!btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const open = group.getAttribute('data-collapsed') === 'false';
      group.setAttribute('data-collapsed', String(!open));
      btn.setAttribute('aria-expanded', String(!open));
    });
  }
})();

/* -------- Settings / Quality -------- */
const qsParam=new URLSearchParams(location.search).get('q');
const isMobileUA=/Mobi|Android/i.test(navigator.userAgent||'');
const devMem=navigator.deviceMemory||4, dpr=window.devicePixelRatio||1;
const wantUltra=qsParam==='ultra'||(!isMobileUA&&devMem>=8&&dpr>=1.5);
let quality=qsParam||(wantUltra?'ultra':(isMobileUA||devMem<=4?'med':'high'));
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clampRatio=()=> (quality==='high'||quality==='ultra')?Math.min(dpr,2):1;
const qSel=document.getElementById('quality'); if(qsParam && qSel) qSel.value=qsParam;

/* -------- Layout -------- */
let VW=0,VH=0;
const gl=document.getElementById('gl'), field=document.getElementById('field'), grid=document.getElementById('grid');
const fctx=field.getContext('2d'), gctx=grid.getContext('2d');
function cacheSize(){const r=gl.getBoundingClientRect(); VW=r.width|0; VH=r.height|0;}
cacheSize(); addEventListener('resize', cacheSize, {passive:true});

/* -------- Card expand -------- */
function toggleCard(el){
  const open=el.classList.toggle('open');
  el.setAttribute('aria-expanded', String(open));
}
document.querySelectorAll('.card[data-expand]').forEach(c=>{
  c.addEventListener('click', e=>{
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.card-body a, button, input, select, textarea')) return;
    toggleCard(c);
  });
  c.addEventListener('keydown', e=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleCard(c); }
  });
});

/* -------- Panel + Clouds -------- */
const panel=document.getElementById('panel');
document.getElementById('panelToggle').addEventListener('click', ()=>panel.classList.toggle('open'));
const cloudsToggle=document.getElementById('cloudsToggle');
function setClouds(on){document.body.classList.toggle('clouds-off',!on);document.body.classList.toggle('clouds-on',on);}
setClouds(true); cloudsToggle.addEventListener('change',e=>setClouds(e.target.checked));
if(qSel){ qSel.addEventListener('change',()=>{quality=qSel.value==='auto'?(wantUltra?'ultra':(isMobileUA||devMem<=4?'med':'high')):qSel.value; hardReset();}); }

/* -------- Three.js field -------- */
import * as THREE from "https://unpkg.com/three@0.155.0/build/three.module.js";
let renderer, scene, camera, overlay, cam2, objects=[];
function initGL(){
  renderer=new THREE.WebGLRenderer({canvas:gl,antialias:false,alpha:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0); renderer.setPixelRatio(clampRatio());
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(60,1,0.1,400); camera.position.set(0,0,8);
  overlay=new THREE.Scene(); cam2=new THREE.OrthographicCamera(-1,1,1,-1,0,1); resizeGL();
}
function resizeGL(){renderer.setPixelRatio(clampRatio()); renderer.setSize(VW,VH,true); camera.aspect=(VW||1)/(VH||1); camera.updateProjectionMatrix();}
new ResizeObserver(()=>{cacheSize(); size2D(); resizeGL();}).observe(gl);

/* Nebula */
function makeNebulaMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uExposure:{value:0.62}},
    vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`precision mediump float; varying vec2 vUv; uniform float uTime,uExposure;
    float n(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
    float sm(vec2 p){vec2 i=floor(p),f=fract(p);float a=n(i),b=n(i+vec2(1,0)),c=n(i+vec2(0,1)),d=n(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
    float fbm(vec2 p){float v=0.,a=.5; for(int i=0;i<6;i++){v+=a*sm(p);p*=2.03;a*=.56;} return v;}
    void main(){
      vec2 uv=vUv*2.; float t=uTime*.03;
      float f=fbm(uv*3.+vec2(t,-t*.7));
      float g=fbm(uv*1.2-vec2(t*.4,t*.2));
      float m=smoothstep(.62,.92,f)*.55+smoothstep(.68,.94,g)*.45;
      vec3 base=vec3(.015,.06,.12);
      vec3 tint1=vec3(.12,.75,.62);
      vec3 tint2=vec3(.62,.52,.95);
      vec3 col=mix(base, mix(tint1,tint2,.35), m);
      gl_FragColor=vec4(col*uExposure*.7, m*.32);
    }`
  });
}

/* Starfield */
function buildStarfield(count){
  const g=new THREE.BufferGeometry();
  const pos=new Float32Array(count*3), spd=new Float32Array(count), phi=new Float32Array(count);
  for(let i=0;i<count;i++){
    const r=38+Math.random()*44; const t=Math.acos(2*Math.random()-1),p=Math.random()*Math.PI*2;
    pos[i*3]=r*Math.sin(t)*Math.cos(p); pos[i*3+1]=r*Math.sin(t)*Math.sin(p); pos[i*3+2]=r*Math.cos(t);
    spd[i]=.02+Math.random()*.06; phi[i]=Math.random()*Math.PI*2;
  }
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aSpeed',new THREE.BufferAttribute(spd,1));
  g.setAttribute('aPhi',new THREE.BufferAttribute(phi,1));
  const uni={uTime:{value:0},uMouse:{value:new THREE.Vector3(0,0,0)}};
  const mat=new THREE.ShaderMaterial({uniforms:uni,transparent:true,depthWrite:false,
    vertexShader:`attribute float aSpeed,aPhi; uniform float uTime; uniform vec3 uMouse; varying float vTw;
      void main(){vec3 p=position; float ang=aSpeed*uTime*.15; float cs=cos(ang),sn=sin(ang); p.xy=mat2(cs,-sn,sn,cs)*p.xy;
      p.x+=uMouse.x*.06; p.y+=uMouse.y*.06; vTw=sin(uTime*.8+aPhi)*.5+.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); gl_PointSize=1.+1.6*vTw;}`,
    fragmentShader:`precision mediump float; varying float vTw; void main(){vec2 uv=gl_PointCoord*2.-1.;
      float d=dot(uv,uv); float a=smoothstep(1.,0.,d)*(.16+.2*vTw); vec3 c=mix(vec3(.72,.82,1.), vec3(.78,.86,1.), vTw);
      gl_FragColor=vec4(c,a);} `
  });
  const pts=new THREE.Points(g,mat); pts.userData={uni}; return pts;
}

/* Galaxy */
function buildGalaxy(count){
  const geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
  geo.instanceCount=count;
  const rad=new Float32Array(count),th0=new Float32Array(count),dir=new Float32Array(count),nz=new Float32Array(count),typ=new Float32Array(count);
  for(let i=0;i<count;i++){rad[i]=THREE.MathUtils.lerp(.15,6.,Math.pow(Math.random(),.55)); th0[i]=Math.random()*Math.PI*2; dir[i]=(Math.random()<.88)?1:-1; nz[i]=(Math.random()*2-1); typ[i]=(Math.random()<.16)?1:0;}
  geo.setAttribute('i_radius',new THREE.InstancedBufferAttribute(rad,1));
  geo.setAttribute('i_theta0',new THREE.InstancedBufferAttribute(th0,1));
  geo.setAttribute('i_dir',new THREE.InstancedBufferAttribute(dir,1));
  geo.setAttribute('i_noise',new THREE.InstancedBufferAttribute(nz,1));
  geo.setAttribute('i_type',new THREE.InstancedBufferAttribute(typ,1));
  const uni={uTime:{value:0},uMouse:{value:new THREE.Vector3(0,0,0)},uExposure:{value:.58},uSpeed:{value:.58},
             uColors:{value:new THREE.Vector3(.45,.86,1.)},
             uColors2:{value:new THREE.Vector3(.92,.52,1.)},
             uColors3:{value:new THREE.Vector3(.20,1.,.78)},uHue:{value:0}};
  const vsh=`attribute float i_radius,i_theta0,i_dir,i_noise,i_type; uniform float uTime,uSpeed; uniform vec3 uMouse; varying float vR,vType,vTw;
  vec2 grav(vec2 p, vec2 q, float m){vec2 d=p-q; float r2=max(dot(d,d),.03); float inv=m/r2; vec2 tang=vec2(-d.y,d.x); return normalize(tang)*inv*.30 + normalize(-d)*inv*.09;}
  void main(){float r=i_radius; float omega=uSpeed*.58*inversesqrt(max(r,.0001)); omega*=mix(1.,.55,step(.5,i_type));
    float th=i_theta0 + i_dir*uTime*omega; vec2 p=vec2(cos(th),sin(th))*r; p+=(.05+.04*i_noise)*vec2(cos(2.1*th+i_noise*5.0),sin(1.9*th-i_noise*4.0));
    vec2 l=grav(p,uMouse.xy,uMouse.z); p+=l*1.5; float z=(i_type>.5?.40:.16)*(fract(sin(i_noise*43758.5453)*1e4)*2.-1.);
    vR=r; vType=i_type; vTw=length(l); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,z,1.); float base=mix(.55,1.05,1./(1.+r*.22)); gl_PointSize=base*(1.+3.6*vTw)*(1.+.28*float(i_type<.5));}`;
  const fsh=`precision mediump float; uniform vec3 uColors,uColors2,uColors3; uniform float uExposure,uHue; varying float vR,vType,vTw;
  vec3 hsv2rgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.), clamp(p-1.,0.,1.), c.y);}
  void main(){vec2 uv=gl_PointCoord*2.-1.; float d=dot(uv,uv); float core=smoothstep(1.,0.,d)*.54; float t=clamp(vR/6.,0.,1.);
    vec3 c=mix(uColors,uColors2,smoothstep(0.,.6,t)); c=mix(c,uColors3,smoothstep(.35,1.,t)); c=mix(c,vec3(1.,.86,.62),step(.5,vType));
    float h=fract(uHue+t*.10+vTw*.06); vec3 wash=hsv2rgb(vec3(h,.55,1.)); c=mix(c,wash,.28);
    c*=uExposure; float g=clamp(vTw*3.6,0.,1.); c+=g*.3; gl_FragColor=vec4(c,core*(.58+.22*g));}`;
  const mat=new THREE.ShaderMaterial({vertexShader:vsh,fragmentShader:fsh,uniforms:uni,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(geo,mat); pts.userData={uni}; return pts;
}

/* Cursor halo */
function buildHalo(count){
  const g=new THREE.BufferGeometry();
  const hPos=new Float32Array(count*2), hPhase=new Float32Array(count), hRad=new Float32Array(count);
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2; hPos[i*2]=Math.cos(a); hPos[i*2+1]=Math.sin(a); hPhase[i]=Math.random()*Math.PI*2; hRad[i]=.006+Math.random()*.05;}
  g.setAttribute('aPos',new THREE.BufferAttribute(hPos,2));
  g.setAttribute('aPhase',new THREE.BufferAttribute(hPhase,1));
  g.setAttribute('aRad',new THREE.BufferAttribute(hRad,1));
  const uni={uTime:{value:0},uCursor:{value:new THREE.Vector2(0,0)},uScale:{value:1},uAspect:{value:1},
             uColorA:{value:new THREE.Vector3(.12,.82,1.)},
             uColorB:{value:new THREE.Vector3(.84,.46,1.)},
             uColorC:{value:new THREE.Vector3(.18,1.,.74)}};
  const mat=new THREE.ShaderMaterial({uniforms:uni,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec2 aPos; attribute float aPhase,aRad; uniform vec2 uCursor; uniform float uScale,uAspect,uTime; varying float vA;
      void main(){float tw=sin(uTime*4.+aPhase)*.5+.5; vec2 base=normalize(aPos)*(0.07+aRad*.9); base.x*=uAspect; vec2 ndc=uCursor+base*uScale; gl_Position=vec4(ndc,0.,1.); gl_PointSize=1.6+2.8*tw; vA=tw; }`,
    fragmentShader:`precision mediump float; varying float vA; uniform vec3 uColorA,uColorB,uColorC;
      void main(){vec2 q=gl_PointCoord*2.-1.; float d=dot(q,q); float a=smoothstep(1.,0.,d)*mix(.25,.6,vA);
      vec3 col=mix(mix(uColorA,uColorB,.35),uColorC,.25*vA); gl_FragColor=vec4(col,a);} `});
  const pts=new THREE.Points(g,mat); pts.userData={uni}; return pts;
}

/* Build */
let nebula,starfield,galaxy,halo; const starCountEl=document.getElementById('starCount');
function buildScene(){
  objects.length=0; scene.clear(); overlay.clear();
  nebula=new THREE.Mesh(new THREE.PlaneGeometry(40,22,1,1), makeNebulaMaterial()); nebula.position.z=-6; scene.add(nebula); objects.push({type:'neb',mat:nebula.material});
  const BG=(prefersReduced?2800:(quality==='ultra'?24000:quality==='high'?16000:6000));
  starfield=buildStarfield(BG); scene.add(starfield); objects.push({type:'sf',mat:starfield.material,uni:starfield.userData.uni});
  const CNT=(prefersReduced?5400:(quality==='ultra'?50000:quality==='high'?32000:13000));
  if(starCountEl) starCountEl.textContent=CNT.toLocaleString();
  galaxy=buildGalaxy(CNT); scene.add(galaxy); objects.push({type:'gal',mat:galaxy.material,uni:galaxy.userData.uni});
  const HALO=(prefersReduced?110:(quality==='ultra'?520:quality==='high'?320:160));
  halo=buildHalo(HALO); overlay.add(halo); objects.push({type:'halo',mat:halo.material,uni:halo.userData.uni});
}
function size2D(){const pr=clampRatio(); field.width=VW*pr; field.height=VH*pr; fctx.setTransform(pr,0,0,pr,0,0); grid.width=VW*pr; grid.height=VH*pr; gctx.setTransform(pr,0,0,pr,0,0); if(halo) halo.userData.uni.uAspect.value=(VW||1)/(VH||1);}

/* Cursor + scroll */
const worldMouse=new THREE.Vector2(0,0); let baseMass=.7,mass=.7,spike=0;
function screenToWorldOnPlane(sx,sy,planeZ=0){const nx=(sx/VW)*2-1, ny=-(sy/VH)*2+1; const o=camera.position.clone(); const v=new THREE.Vector3(nx,ny,.5).unproject(camera); const d=v.sub(o).normalize(); const t=(planeZ-o.z)/d.z; return new THREE.Vector2(o.x+d.x*t,o.y+d.y*t);}
addEventListener('pointermove',e=>{const r=gl.getBoundingClientRect(); const nx=((e.clientX-r.left)/r.width)*2-1, ny=-(((e.clientY-r.top)/r.height)*2-1); if(halo) halo.userData.uni.uCursor.value.set(nx,ny); worldMouse.copy(screenToWorldOnPlane(e.clientX-r.left,e.clientY-r.top,0));},{passive:true});
addEventListener('click',()=>{spike=1;});
function onScroll(){if(!halo) return; const p=Math.max(0,Math.min(1,scrollY/(document.documentElement.scrollHeight-innerHeight)));
  const a=halo.userData.uni.uColorA.value,b=halo.userData.uni.uColorB.value,c=halo.userData.uni.uColorC.value;
  a.set(.12+.35*p,.82-.2*p,1.-.18*p); b.set(.84-.28*p,.46+.22*p,1.-.05*p); c.set(.18+.14*p,1.-.18*p,.74+.06*p);
} addEventListener('scroll',onScroll,{passive:true});

/* 2D field + grid */
let seeds=[];
function seedFlow(){seeds.length=0; const n=prefersReduced?30:(quality==='ultra'?100:quality==='high'?80:54); for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=1+(i%2)*.22; seeds.push({x:Math.cos(a)*r,y:Math.sin(a)*r});}}
function fVec(x,y){const r2=Math.max(x*x+y*y,.0004),inv=1./Math.pow(r2,.75); let vx=-y*inv,vy=x*inv; const dx=x-worldMouse.x,dy=y-worldMouse.y,q2=dx*dx+dy*dy+.02; const bend=(quality==='high'||quality==='ultra')?.32:.26, pull=(quality==='high'||quality==='ultra')?.11:.08, grav=mass/q2; vx+=(-dy)*grav*bend + (-dx)*grav*pull; vy+=(dx)*grav*bend + (-dy)*grav*pull; return [vx,vy];}
function toScreen(x,y){const v=new THREE.Vector3(x,y,0).project(camera); return [(v.x*.5+.5)*VW,(-v.y*.5+.5)*VH];}
function drawField(){if(prefersReduced||document.visibilityState!=='visible') return; fctx.clearRect(0,0,VW,VH); fctx.globalCompositeOperation='lighter';
  const cols=['rgba(31,211,191,0.14)','rgba(120,180,255,0.12)','rgba(229,101,255,0.10)','rgba(255,210,96,0.07)'];
  const steps=(quality==='ultra'?80:quality==='high'?64:44);
  for(let k=0;k<seeds.length;k++){let x=seeds[k].x*(3.0+1.9*Math.sin((k*13.1)%6)), y=seeds[k].y*(1.9+1.3*Math.cos((k*7.7)%6)); let [sx,sy]=toScreen(x,y); fctx.beginPath(); fctx.moveTo(sx,sy);
    for(let i=0;i<steps;i++){const [vx,vy]=fVec(x,y); const [vx2,vy2]=fVec(x+vx*.01,y+vy*.01); x+=vx2*.02; y+=vy2*.02; [sx,sy]=toScreen(x,y); fctx.lineTo(sx,sy);} fctx.strokeStyle=cols[k%cols.length]; fctx.lineWidth=1; fctx.stroke();}
  fctx.globalCompositeOperation='source-over';}
function drawGrid(){if(document.visibilityState!=='visible') return; gctx.clearRect(0,0,VW,VH); gctx.strokeStyle='rgba(255,255,255,0.055)'; gctx.lineWidth=1; const step=(quality==='ultra'?36:quality==='high'?40:50), cols=Math.ceil(VW/step)+2, rows=Math.ceil(VH/step)+2;
  for(let j=-1;j<=rows;j++){gctx.beginPath(); for(let i=-1;i<=cols;i++){const sx=i*step,sy=j*step; let p=screenToWorldOnPlane(sx,sy,0); const dx=p.x-worldMouse.x,dy=p.y-worldMouse.y,r2=dx*dx+dy*dy+.08; const k=((quality==='high'||quality==='ultra')?.22:.17)*mass/r2; p.x+=dx*k; p.y+=dy*k; const q=new THREE.Vector3(p.x,p.y,0).project(camera); const px=(q.x*.5+.5)*VW, py=(-q.y*.5+.5)*VH; if(i===-1) gctx.moveTo(px,py); else gctx.lineTo(px,py);} gctx.stroke();}
  for(let i=-1;i<=cols;i++){gctx.beginPath(); for(let j=-1;j<=rows;j++){const sx=i*step,sy=j*step; let p=screenToWorldOnPlane(sx,sy,0); const dx=p.x-worldMouse.x,dy=p.y-worldMouse.y,r2=dx*dx+dy*dy+.08; const k=((quality==='high'||quality==='ultra')?.22:.17)*mass/r2; p.x+=dx*k; p.y+=dy*k; const q=new THREE.Vector3(p.x,p.y,0).project(camera); const px=(q.x*.5+.5)*VW, py=(-q.y*.5+.5)*VH; if(j===-1) gctx.moveTo(px,py); else gctx.lineTo(px,py);} gctx.stroke();}}

/* Controls */
const exposureEl=document.getElementById('exposure'), massEl=document.getElementById('mass'), speedEl=document.getElementById('speed');
exposureEl.addEventListener('input',()=>{const nb=objects.find(o=>o.type==='neb'); if(nb) nb.mat.uniforms.uExposure.value=parseFloat(exposureEl.value);});
massEl.addEventListener('input',()=>baseMass=parseFloat(massEl.value));
speedEl.addEventListener('input',()=>{const g=objects.find(o=>o.type==='gal'); if(g) g.uni.uSpeed.value=parseFloat(speedEl.value);});

/* Loop */
let running=true; document.addEventListener('visibilitychange',()=>running=(document.visibilityState==='visible'));
let t0=performance.now(), last2D=0; function target2D(){return (quality==='ultra'||quality==='high')?1/60:1/30;}
function tick(){if(!running){requestAnimationFrame(tick);return;} const t=performance.now(), dt=(t-t0)/1000; t0=t;
  const massBias=(quality==='high'||quality==='ultra')?.22:0; mass+=(baseMass+massBias-mass)*.06; if(spike>0){mass+=.5*spike; spike*=.88;}
  const wm=new THREE.Vector3(worldMouse.x,worldMouse.y,mass);
  const sf=objects.find(o=>o.type==='sf'); if(sf) sf.uni.uMouse.value.copy(wm);
  const g=objects.find(o=>o.type==='gal'); if(g){g.uni.uMouse.value.copy(wm); const timeScale=(prefersReduced?.35:(quality==='ultra'?.68:quality==='high'?.58:.48)); g.uni.uTime.value+=dt*timeScale; g.uni.uHue.value=(g.uni.uHue.value+dt*.025)%1.;}
  const nb=objects.find(o=>o.type==='neb'); if(nb) nb.mat.uniforms.uTime.value+=dt; const h=objects.find(o=>o.type==='halo'); if(h) h.uni.uTime.value+=dt;
  renderer.render(scene,camera); renderer.autoClear=false; renderer.clearDepth(); renderer.render(overlay,cam2); renderer.autoClear=true;
  const now=t/1000; if(now-last2D>=target2D()){drawField(); drawGrid(); last2D=now;} requestAnimationFrame(tick);
}

/* Boot */
function buildAll(){objects.length=0; scene.clear(); overlay.clear(); buildScene(); size2D(); seedFlow();}
function hardReset(){initGL(); buildAll();}
function initAll(){initGL(); buildAll(); requestAnimationFrame(tick);}
initAll();

/* Smoke check */
setTimeout(()=>{ console.assert(scene.children.length>=3,'scene ok'); },300);
