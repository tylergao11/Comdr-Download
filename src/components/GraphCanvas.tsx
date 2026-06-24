// ============================================================
// GraphCanvas — 星图渲染
// Overlay 预渲染星芒贴图 · 呼吸 · 光刺 · 响应式填满容器
// 支持拖拽平移
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';

// ── 数据 ─────────────────────────────────────────────────────

interface StarNode { id:string; kind:'document'|'script'|'node'|'method'|'asset'; label:string; x:number; y:number }
interface Link { from:string; to:string; kind:'belongsTo'|'calls'|'triggers'|'refs'|'imports' }

// 射击游戏项目数据 — 与 FramePlayer 叙事一致
const NODES: StarNode[]=[
  // documents — 场景/Prefab
  {id:'d1',kind:'document',label:'Level_01',     x:.48,y:.10},{id:'d2',kind:'document',label:'Player',       x:.18,y:.16},
  {id:'d3',kind:'document',label:'Enemy',        x:.80,y:.16},
  // scripts
  {id:'s1',kind:'script',  label:'GameManager',  x:.48,y:.28},{id:'s2',kind:'script',  label:'PlayerCtrl',   x:.16,y:.30},
  {id:'s3',kind:'script',  label:'EnemyAI',      x:.82,y:.30},{id:'s4',kind:'script',  label:'BulletPhys',   x:.34,y:.40},
  {id:'s5',kind:'script',  label:'BossCtrl',     x:.72,y:.38},
  // methods
  {id:'m1',kind:'method',  label:'startGame',    x:.44,y:.44},{id:'m2',kind:'method',  label:'spawnWave',    x:.56,y:.46},
  {id:'m3',kind:'method',  label:'fireBullet',   x:.12,y:.48},{id:'m4',kind:'method',  label:'onHit',        x:.82,y:.50},
  {id:'m5',kind:'method',  label:'onBossPhase',  x:.68,y:.54},
  // nodes — 场景内实例
  {id:'n1',kind:'node',    label:'Player_Sprite',x:.20,y:.64},{id:'n2',kind:'node',    label:'SpawnPoint_01',x:.48,y:.62},
  {id:'n3',kind:'node',    label:'Boss_Entrance',x:.78,y:.66},{id:'n4',kind:'node',    label:'HP_Bar',       x:.60,y:.70},
  // assets
  {id:'a1',kind:'asset',   label:'fighter.png',  x:.22,y:.80},{id:'a2',kind:'asset',   label:'enemy.png',    x:.80,y:.78},
  {id:'a3',kind:'asset',   label:'bullet.png',   x:.38,y:.84},{id:'a4',kind:'asset',   label:'boss_sheet.png',x:.74,y:.84},
];

const EDGES: Link[]=[
  // belongsTo — 脚本/方法/节点 → 所属文档/脚本
  {from:'s1',to:'d1',kind:'belongsTo'},{from:'s2',to:'d2',kind:'belongsTo'},{from:'s3',to:'d3',kind:'belongsTo'},
  {from:'s4',to:'d2',kind:'belongsTo'},{from:'s5',to:'d1',kind:'belongsTo'},
  {from:'m1',to:'s1',kind:'belongsTo'},{from:'m2',to:'s1',kind:'belongsTo'},{from:'m3',to:'s2',kind:'belongsTo'},
  {from:'m4',to:'s3',kind:'belongsTo'},{from:'m5',to:'s5',kind:'belongsTo'},
  {from:'n1',to:'d2',kind:'belongsTo'},{from:'n2',to:'d1',kind:'belongsTo'},{from:'n3',to:'d1',kind:'belongsTo'},{from:'n4',to:'d1',kind:'belongsTo'},
  // calls — 方法间调用
  {from:'m1',to:'m2',kind:'calls'},{from:'m2',to:'m3',kind:'calls'},{from:'m3',to:'m4',kind:'calls'},
  {from:'m2',to:'m5',kind:'calls'},{from:'m5',to:'m2',kind:'calls'},
  // triggers — 事件触发
  {from:'m4',to:'m2',kind:'triggers'},{from:'m5',to:'m1',kind:'triggers'},
  // refs — 方法/脚本引用节点或资源
  {from:'m3',to:'n1',kind:'refs'},{from:'m2',to:'n2',kind:'refs'},{from:'m5',to:'n3',kind:'refs'},{from:'m4',to:'n4',kind:'refs'},
  {from:'m3',to:'a1',kind:'refs'},{from:'m4',to:'a2',kind:'refs'},{from:'m3',to:'a3',kind:'refs'},{from:'m5',to:'a4',kind:'refs'},
  {from:'s3',to:'a2',kind:'refs'},{from:'s2',to:'a3',kind:'refs'},
  // imports — 脚本间导入
  {from:'s1',to:'s2',kind:'imports'},{from:'s1',to:'s3',kind:'imports'},{from:'s1',to:'s5',kind:'imports'},
  {from:'s2',to:'s4',kind:'imports'},{from:'s3',to:'s4',kind:'imports'},
];

// ── Overlay 精确常量 ─────────────────────────────────────────

const NODE_COLORS: Record<string,string> = {
  document:'#F5E0C0', script:'#F0C060', node:'#8BA4FF', method:'#A0B0C8', asset:'#8B9AB0',
};
const NODE_SIZES: Record<string,number> = {
  document:52, script:38, node:28, method:18, asset:16,
};
const SPOKE_COUNTS: Record<string,number> = { document:8, script:6 };
const SPOKE_LENGTH: Record<string,number> = { document:2.2, script:1.8 };
const SPOKE_LW: Record<string,number> = { document:1.0, script:0.8 };

const BREATH_PERIOD: Record<string,number> = { document:5600, script:3600, node:2200, method:900, asset:2200 };
const BREATH_AMP: Record<string,number> = { document:0.025, script:0.045, node:0.06, method:0.08, asset:0.08 };

const FLARE_RATIO: Record<string,number> = { document:3.5, script:3.0, node:2.5, method:2.0, asset:2.0 };
const FLARE_ALPHA: Record<string,number> = { document:0.40, script:0.35, node:0.30, method:0.25, asset:0.25 };

const EDGE_COLORS: Record<string,string> = {
  calls:'#F0C060', triggers:'#FBBF24', refs:'#7B6FA0', imports:'#6B7B8B', belongsTo:'#5a5a78',
};
const EDGE_ALPHA: Record<string,number> = {
  calls:0.65, triggers:0.60, refs:0.35, imports:0.35, belongsTo:0.28,
};
const EDGE_LW: Record<string,number> = {
  calls:1.8, triggers:1.5, refs:0.8, imports:0.8, belongsTo:0.8,
};

const IW=720, IH=420; // 内部坐标空间（比之前略矮）
const ASPECT=IW/IH;

interface Particle { edgeIdx:number; t:number; speed:number }

function alphaHex(a:number):string {
  return Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
}

// ── 预渲染星芒贴图 ──────────────────────────────────────────

function buildTemplates(dpr:number):Map<string,HTMLCanvasElement>{
  const map=new Map<string,HTMLCanvasElement>();
  for(const[kind,color]of Object.entries(NODE_COLORS)){
    const size=NODE_SIZES[kind]||26;const r=size/2;const tplSz=Math.ceil(r*3.5);
    const tpl=document.createElement('canvas');tpl.width=tplSz*2*dpr;tpl.height=tplSz*2*dpr;
    const c=tpl.getContext('2d')!;c.setTransform(dpr,0,0,dpr,0,0);const cx=tplSz,cy=tplSz;
    const g1=c.createRadialGradient(cx,cy,r*.5,cx,cy,r*2.5);
    g1.addColorStop(0,color+'30');g1.addColorStop(.5,color+'10');g1.addColorStop(1,'transparent');
    c.fillStyle=g1;c.beginPath();c.arc(cx,cy,r*2.5,0,Math.PI*2);c.fill();
    const g2=c.createRadialGradient(cx,cy,0,cx,cy,r*1.3);
    g2.addColorStop(0,color+'80');g2.addColorStop(.4,color+'40');g2.addColorStop(1,'transparent');
    c.fillStyle=g2;c.beginPath();c.arc(cx,cy,r*1.3,0,Math.PI*2);c.fill();
    const g3=c.createRadialGradient(cx,cy,0,cx,cy,r*.5);
    g3.addColorStop(0,'rgba(255,255,255,1)');g3.addColorStop(.3,'rgba(255,255,255,0.7)');g3.addColorStop(1,'transparent');
    c.fillStyle=g3;c.beginPath();c.arc(cx,cy,r*.5,0,Math.PI*2);c.fill();
    const sc=SPOKE_COUNTS[kind]||0;
    if(sc>0){const sl=r*(SPOKE_LENGTH[kind]||2);c.strokeStyle=color+'59';c.lineWidth=(SPOKE_LW[kind]||.8)*dpr;
      c.shadowColor=color;c.shadowBlur=4*dpr;
      for(let s=0;s<sc;s++){const a=(Math.PI*2/sc)*s;
        c.beginPath();c.moveTo(cx+Math.cos(a)*r*.6,cy+Math.sin(a)*r*.6);
        c.lineTo(cx+Math.cos(a)*sl,cy+Math.sin(a)*sl);c.stroke();}c.shadowBlur=0;}
    map.set(kind,tpl);
  }
  return map;
}

function calcBreath(kind:string,t:number):number{
  const period=BREATH_PERIOD[kind]||2200;const amp=BREATH_AMP[kind]||.06;const p=((t%period)/period);
  if(kind==='document'){if(p<.3){const r=p/.3;return amp*(r<.5?2*r*r:-1+(4-2*r)*r);}else if(p<.6)return amp;else{const r=(p-.6)/.4;return amp*(1-r*r);}}
  else{if(p<.4){const r=p/.4;return amp*(r<.5?2*r*r:-1+(4-2*r)*r);}else{const r=(p-.4)/.6;return amp*((1-r*r));}}
}

// ── 组件 ─────────────────────────────────────────────────────

export function GraphCanvas(){
  const containerRef=useRef<HTMLDivElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const tplRef=useRef<Map<string,HTMLCanvasElement>|null>(null);
  const [selId,setSelId]=useState<string|null>(null);
  const [hovId,setHovId]=useState<string|null>(null);
  const [tip,setTip]=useState<{node:StarNode;x:number;y:number}|null>(null);
  const animRef=useRef(0);
  const tRef=useRef(0);
  const particlesRef=useRef<Particle[]>([]);
  const sizeRef=useRef({w:IW,h:IH,scale:1}); // 画布显示尺寸 + 缩放比
  // 拖拽状态
  const dragRef=useRef({active:false,dx:0,dy:0,panX:0,panY:0,startX:0,startY:0});
  const dragDistRef=useRef(0);

  useEffect(()=>{
    tplRef.current=buildTemplates(window.devicePixelRatio||1);
    particlesRef.current=EDGES.flatMap((e,i)=>{
      const n=(e.kind==='calls'||e.kind==='triggers')?((e.kind==='calls')?2:3):0;
      return Array.from({length:n},(_,j)=>({edgeIdx:i,t:j/n+Math.random()*.05,speed:.004+Math.random()*.005}));
    });
  },[]);

  // 响应式尺寸
  useEffect(()=>{
    const cont=containerRef.current;if(!cont)return;
    const ro=new ResizeObserver(()=>{
      const rw=cont.clientWidth;
      const rh=Math.round(rw/ASPECT);
      sizeRef.current={w:rw,h:rh,scale:rw/IW};
    });
    ro.observe(cont);
    // 初始
    const rw=cont.clientWidth||IW;
    sizeRef.current={w:rw,h:Math.round(rw/ASPECT),scale:rw/IW};
    return ()=>ro.disconnect();
  },[]);

  const findNode=useCallback((mx:number,my:number):StarNode|null=>{
    const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return null;
    const {scale}=sizeRef.current;
    const {panX,panY}=dragRef.current;
    // 屏幕坐标 → 内部坐标（反向平移+缩放）
    const sx=(mx-rect.left-panX)/scale, sy=(my-rect.top-panY)/scale;
    for(const n of NODES){const nx=n.x*IW,ny=n.y*IH;const r=(NODE_SIZES[n.kind]||26)/2*1.5;
      if((sx-nx)**2+(sy-ny)**2<r*r)return n;}return null;
  },[],);

  const getHL=useCallback((id:string|null)=>{
    if(!id)return{edges:new Set<number>(),nodes:new Set<string>()};
    const es=new Set<number>(),ns=new Set<string>();ns.add(id);
    EDGES.forEach((e,i)=>{if(e.from===id||e.to===id){es.add(i);ns.add(e.from);ns.add(e.to);}});
    return{edges:es,nodes:ns};
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let running=true;let lastT=0;

    const render=(ts:number)=>{
      if(!running)return;
      if(!lastT)lastT=ts;tRef.current+=ts-lastT;lastT=ts;const t=tRef.current;
      const hl=getHL(selId);
      const hvNode=hovId?NODES.find(n=>n.id===hovId):null;
      const tpls=tplRef.current;if(!tpls)return;
      const {w,h,scale}=sizeRef.current;
      const {panX,panY}=dragRef.current;

      const dpr=window.devicePixelRatio||1;
      canvas.width=w*dpr;canvas.height=h*dpr;
      canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);

      // 背景
      ctx.fillStyle='#090706';ctx.fillRect(0,0,w,h);
      // 静态微星——散布在显示区域
      for(let i=0;i<40;i++){
        const sx=(i*173+89)%w,sy=(i*251+47)%h;
        const tw=.4+.6*Math.sin(t/3000+i*1.7);
        ctx.fillStyle='#B0A090';ctx.globalAlpha=.06+.08*tw;
        ctx.fillRect(sx,sy,1.5,1.5);ctx.globalAlpha=1;
      }

      ctx.save();
      ctx.translate(panX,panY);
      ctx.scale(scale,scale);

      // ── 边 ────────────────────────────────────────────
      const isDE=(i:number)=>selId!==null&&!hl.edges.has(i);
      for(let i=0;i<EDGES.length;i++){
        const e=EDGES[i];const f=NODES.find(n=>n.id===e.from),to=NODES.find(n=>n.id===e.to);
        if(!f||!to)continue;
        const x1=f.x*IW,y1=f.y*IH,x2=to.x*IW,y2=to.y*IH;
        const isHl=hl.edges.has(i),isHv=hvNode&&(e.from===hvNode.id||e.to===hvNode.id);
        const active=isHl||isHv;
        const baseAlpha=EDGE_ALPHA[e.kind]??.15;
        let alpha=active?Math.min(baseAlpha*2.5,.75):selId?.03:baseAlpha;
        if(isDE(i)&&!active)alpha=0;
        const color=EDGE_COLORS[e.kind]??'#666';
        const lw=(active?(EDGE_LW[e.kind]??1)+.5:EDGE_LW[e.kind]??1)/scale;

        ctx.strokeStyle=color+alphaHex(alpha);ctx.lineWidth=lw;
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();

        if(active){const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
          const fl=Math.min(len*.25,40);const g=ctx.createLinearGradient(x1,y1,x2,y2);
          g.addColorStop(0,'transparent');g.addColorStop(fl/len,color+alphaHex(alpha));
          g.addColorStop(1-fl/len,color+alphaHex(alpha));g.addColorStop(1,'transparent');
          ctx.strokeStyle=g;ctx.lineWidth=lw+.5/scale;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}

        for(const p of particlesRef.current){if(p.edgeIdx!==i)continue;if(alpha<.003)continue;
          const px=x1+(x2-x1)*p.t,py=y1+(y2-y1)*p.t;
          ctx.fillStyle=color+(e.kind==='calls'?'33':'44');
          ctx.beginPath();ctx.arc(px,py,1.2/scale,0,Math.PI*2);ctx.fill();
          if(active){ctx.fillStyle=color+'cc';ctx.shadowColor=color;ctx.shadowBlur=4/scale;
            ctx.beginPath();ctx.arc(px,py,1.8/scale,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
        }
      }

      // ── 节点 ──────────────────────────────────────────
      const isDN=(n:StarNode)=>selId!==null&&!hl.nodes.has(n.id);
      for(const node of NODES){
        const defColor=NODE_COLORS[node.kind]||'#8BA4FF';
        const baseR=(NODE_SIZES[node.kind]||26)/2;
        const nx=node.x*IW,ny=node.y*IH;
        const dimmed=isDN(node);
        const isH=hovId===node.id,isS=selId===node.id;
        const breath=1+calcBreath(node.kind,t)*(isS?1.4:.6);
        const r=baseR*breath;

        if(dimmed&&!isS)continue;

        const isNeighbor=selId!==null&&hl.nodes.has(node.id)&&!isS;
        if(isNeighbor){
          ctx.strokeStyle='#A78BFA';ctx.lineWidth=2/scale;ctx.shadowColor='#A78BFA';ctx.shadowBlur=8/scale;
          ctx.beginPath();ctx.arc(nx,ny,r*1.6,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
        }

        const tpl=tpls.get(node.kind);if(tpl){
          const tplSz=tpl.width/dpr/2;
          const drawR=isH?baseR*1.12:baseR;
          const tplScale=(drawR*2.5)/tplSz;
          ctx.save();ctx.translate(nx,ny);ctx.scale(breath,breath);
          ctx.globalAlpha=dimmed?.25:1;
          ctx.drawImage(tpl,-tplSz*tplScale,-tplSz*tplScale,tplSz*2*tplScale,tplSz*2*tplScale);
          if(isH&&!isS){ctx.globalAlpha=Math.min(.2,dimmed?.25:1);ctx.drawImage(tpl,-tplSz*tplScale,-tplSz*tplScale,tplSz*2*tplScale,tplSz*2*tplScale);}
          ctx.globalAlpha=1;ctx.restore();
        }else{
          ctx.beginPath();ctx.arc(nx,ny,r,0,Math.PI*2);ctx.fillStyle=defColor+'33';ctx.fill();
          ctx.strokeStyle=defColor;ctx.lineWidth=1.5/scale;ctx.stroke();
        }

        if(isS){
          const fl=r*(FLARE_RATIO[node.kind]||3)/breath;const fa=FLARE_ALPHA[node.kind]||.35;
          for(const ang of[0,Math.PI/2,Math.PI/4,-Math.PI/4]){
            const cl=ang===0||ang===Math.PI/2?fl:fl*.5;const ca=ang===0||ang===Math.PI/2?fa:fa*.5;
            const cos=Math.cos(ang),sin=Math.sin(ang);
            const g2=ctx.createLinearGradient(nx-cl*cos,ny-cl*sin,nx+cl*cos,ny+cl*sin);
            g2.addColorStop(0,'transparent');g2.addColorStop(.2,defColor+alphaHex(ca));
            g2.addColorStop(.5,defColor+alphaHex(ca*1.8));g2.addColorStop(.8,defColor+alphaHex(ca));
            g2.addColorStop(1,'transparent');
            ctx.strokeStyle=g2;ctx.lineWidth=(ang===0||ang===Math.PI/2?1.2:.6)/scale;
            ctx.beginPath();ctx.moveTo(nx-cl*cos,ny-cl*sin);ctx.lineTo(nx+cl*cos,ny+cl*sin);ctx.stroke();
          }
        }

        if((isS||isH||isNeighbor)&&!dimmed){
          const fs=isS?11:10;
          ctx.fillStyle=isS?'rgba(255,255,255,.9)':'rgba(200,205,230,.9)';
          ctx.font=`${fs}px "Inter",-apple-system,"PingFang SC","Microsoft YaHei UI",sans-serif`;
          ctx.textAlign='center';ctx.textBaseline='top';
          if(isS){ctx.shadowColor=defColor;ctx.shadowBlur=6/scale;}
          ctx.fillText(node.label,nx,ny+r*breath+(isS?14:10));
          ctx.shadowBlur=0;
        }
      }

      ctx.restore(); // pop translate+scale

      canvas.style.cursor=hovId?'pointer':dragRef.current.active?'grabbing':'grab';
      animRef.current=requestAnimationFrame(render);
    };
    animRef.current=requestAnimationFrame(render);
    return()=>{running=false;cancelAnimationFrame(animRef.current);};
  },[selId,hovId,getHL]);

  // 粒子
  useEffect(()=>{let r=true;const tick=()=>{if(!r)return;
    for(const p of particlesRef.current){p.t+=p.speed;if(p.t>1)p.t-=1;}requestAnimationFrame(tick);};tick();return()=>{r=false;};},[]);

  // ── 交互 ──
  const hm=useCallback((e:React.MouseEvent)=>{
    const dr=dragRef.current;
    if(dr.active){
      dr.panX=dr.dx+(e.clientX-dr.startX);
      dr.panY=dr.dy+(e.clientY-dr.startY);
      dragDistRef.current+=Math.abs(e.movementX)+Math.abs(e.movementY);
      return;
    }
    setHovId(findNode(e.clientX,e.clientY)?.id??null);
  },[findNode]);

  const hd=useCallback((e:React.MouseEvent)=>{
    dragRef.current.active=true;
    dragRef.current.startX=e.clientX;dragRef.current.startY=e.clientY;
    dragRef.current.dx=dragRef.current.panX;dragRef.current.dy=dragRef.current.panY;
    dragDistRef.current=0;
  },[]);

  const hu=useCallback((e:React.MouseEvent)=>{
    const dr=dragRef.current;
    dr.active=false;
    // 如果拖拽距离小，视为点击
    if(dragDistRef.current<4){
      const n=findNode(e.clientX,e.clientY);
      if(n){setSelId(p=>p===n.id?null:n.id);
        const rect=canvasRef.current?.getBoundingClientRect();
        if(rect){const rx=e.clientX-rect.left,ry=e.clientY-rect.top;
          setTip({node:n,x:rx>sizeRef.current.w/2?rx-260:rx+14,y:Math.max(4,Math.min(ry-6,sizeRef.current.h-150))});}
      }else{setSelId(null);setTip(null);}
    }
  },[findNode]);

  const linked=selId?EDGES.filter(e=>e.from===selId||e.to===selId):[];

  return(
    <div className="graph-canvas-wrap" ref={containerRef}>
      <canvas ref={canvasRef} className="graph-canvas"
        onMouseMove={hm} onMouseDown={hd} onMouseUp={hu} onMouseLeave={hu}/>
      {tip&&selId&&(
        <div className="graph-tooltip" style={{left:tip.x,top:tip.y}}>
          <span className="tooltip-kind" style={{color:NODE_COLORS[tip.node.kind]}}>{tip.node.kind}</span>
          <span className="tooltip-label">{tip.node.label}</span>
          {linked.length>0&&(
            <div className="tooltip-edges">
              {linked.map((e,i)=>{const other=e.from===selId?e.to:e.from;const on=NODES.find(n=>n.id===other);
                return(<div key={i} className="tooltip-edge">
                  <span className="tooltip-edge-kind" style={{color:EDGE_COLORS[e.kind]||'#888'}}>{e.kind}</span>
                  <span className="tooltip-edge-arrow">→</span><span>{on?.label??other}</span>
                </div>);})}
            </div>)}
        </div>)}
    </div>);
}
