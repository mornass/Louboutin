import numpy as np, struct, json, io, sys
from PIL import Image
from scipy import ndimage
from load import load
R=2048
j,P,N,UV,F=load('r/ex0.glb')
N=np.load('smooth_normals.npy')
z=np.load('raster.npz'); tid=z['tid']; bary=z['bary']; vout=z['out']
cov=tid>=0; T=np.where(cov,tid,0)
def interp(A):
    v=(A[F[T]]*bary[...,None]).sum(2); return v
pos=interp(P.astype(np.float32)); nrm=interp(N.astype(np.float32)); nrm/=np.linalg.norm(nrm,axis=-1,keepdims=True)+1e-9
outer=(vout[F[T]]*bary).sum(-1)
def img(i): 
    bv=j['bufferViews'][j['images'][i]['bufferView']]; b=open('r/ex0.glb','rb').read(); l=struct.unpack('<I',b[12:16])[0]; o=20+l+8+bv.get('byteOffset',0)
    return np.asarray(Image.open(io.BytesIO(b[o:o+bv['byteLength']])).convert('RGB')).astype(np.float32)
base=img(2); norm0=img(1); mr0=img(3)
r,g,b_=base[...,0],base[...,1],base[...,2]
mx=base.max(-1); mn=base.min(-1); sat=(mx-mn)/(mx+1e-3)
red=(r>110)&(sat>0.55)&(g<0.6*r)
red=ndimage.binary_opening(red,iterations=2)
lab,nl=ndimage.label(red); sz=np.bincount(lab.ravel()); red=red&(sz[lab]>=400)
beige=(~red)&(r-b_>28)&(r>150)&(sat>0.12)
inside=z['dist']==0
_ix=ndimage.distance_transform_edt(~inside,return_distances=False,return_indices=True)
red=red[_ix[0],_ix[1]]; beige=beige[_ix[0],_ix[1]]
# smooth classification to remove speckle

y=pos[...,1]; ymin=P[:,1].min()
tip=cov&(y<ymin+0.035)&(pos[...,2]<-0.45)  # heel tips (heel at -z)
insole=beige&(nrm[...,1]>=0.12)
upper=cov&~red&~insole&~tip
inner=upper&(outer<0.5)

outerU=upper&~inner
beige=insole
np.save('classes.npy',np.stack([red,beige,tip,inner,outerU]))
print({k:float(v.mean()) for k,v in dict(red=red,beige=beige,tip=tip,inner=inner,outer=outerU).items()})

def vnoise(p,seed):
    # 3D value noise, p (...,3)
    rng=np.random.default_rng(seed); tab=rng.random(1<<16).astype(np.float32)
    pi=np.floor(p).astype(np.int64); f=p-pi; f=f*f*(3-2*f)
    def h(ix,iy,iz): return tab[((ix*73856093)^(iy*19349663)^(iz*83492791))&0xFFFF]
    out=0
    for dx in (0,1):
        for dy in (0,1):
            for dz in (0,1):
                w=(f[...,0] if dx else 1-f[...,0])*(f[...,1] if dy else 1-f[...,1])*(f[...,2] if dz else 1-f[...,2])
                out=out+w*h(pi[...,0]+dx,pi[...,1]+dy,pi[...,2]+dz)
    return out
def fbm(p,seed,oct=4):
    s=0;a=0.5;t=0
    for o in range(oct): s=s+a*vnoise(p*(2**o),seed+o); t+=a; a*=0.5
    return s/t

def srgb(c): return np.array(c,np.float32)
def build(kind):
    col=base.copy(); rough=np.full((R,R),0.5,np.float32); nm=norm0.copy()
    flat=np.array([128,128,255],np.float32)
    # Louboutin red sole: unify, glossy lacquer
    col[red]=col[red]*0.35+srgb([205,22,30])*0.65; rough[red]=0.28
    col[beige]=col[beige]*0.5+srgb([214,178,138])*0.5; rough[beige]=0.65
    if kind=='black':
        col[outerU]=srgb([9,9,11]); rough[outerU]=0.06; nm[outerU]=flat
        col[inner]=srgb([22,20,20]); rough[inner]=0.55; nm[inner]=flat
        col[tip]=srgb([15,15,15]); rough[tip]=0.4
    elif kind=='burgundy':
        # subtle tonal variation so the patent doesn't look flat
        v=fbm(pos*3.0,7)[outerU,None]
        col[outerU]=srgb([92,10,18])*(0.92+0.16*v); rough[outerU]=0.07; nm[outerU]=flat
        col[inner]=srgb([74,14,18]); rough[inner]=0.55; nm[inner]=flat
        col[tip]=srgb([150,120,90]); rough[tip]=0.6
    elif kind=='classes':
        col[:]=128; col[red]=[220,0,0]; col[beige]=[230,200,150]; col[inner]=[0,0,220]; col[outerU]=[240,240,240]; col[tip]=[0,200,0]; nm[:]=flat
    elif kind=='zebra':
        p=pos.copy(); p[...,0]=np.abs(p[...,0])  # mirror so both shoes match
        warp=fbm(p*2.2,11)-0.5
        warp2=fbm(p*5.0,13)-0.5
        u=p[...,2]*0.85-p[...,1]*0.6+0.30*warp+0.06*warp2   # stripes tilted like the photo
        width=0.5+0.45*(fbm(p*2.4,23)-0.5)
        s=np.sin(2*np.pi*u/0.27)
        # pony hair: fine anisotropic streaks along the shoe length
        hp=np.stack([p[...,0]*260,p[...,1]*260,p[...,2]*45],-1)
        hair=vnoise(hp,31); hair2=vnoise(hp*2.1,37)
        edge=s+0.10*(hair-0.5)+0.10*(fbm(p*6,41)-0.5)
        t=np.clip((edge-(width-0.5)*1.2)/0.09+0.5,0,1)  # 1 = black stripe
        white=srgb([232,228,218]); black=srgb([14,13,13])
        c=white[None,None]*(1-t[...,None])+black[None,None]*t[...,None]
        c=c*(0.88+0.2*(0.6*hair+0.4*hair2))[...,None]
        col[outerU]=c[outerU]; rough[outerU]=0.78
        # hair normal: derivative-ish of hair noise
        hx=vnoise(hp+np.array([0.5,0,0]),31)-hair; hy=vnoise(hp+np.array([0,0.5,0]),31)-hair
        hn=np.stack([128+90*hx,128+90*hy,np.full_like(hx,240)],-1)
        nm[outerU]=hn[outerU]
        col[inner]=srgb([16,15,15]); rough[inner]=0.55; nm[inner]=flat
        col[tip]=srgb([12,12,12]); rough[tip]=0.4
    # dilate into empty texels to avoid seams
    idx=ndimage.distance_transform_edt(~cov,return_distances=False,return_indices=True)
    col=col[idx[0],idx[1]]; rough=rough[idx[0],idx[1]]; nm=nm[idx[0],idx[1]]
    mr=np.stack([np.full((R,R),255),np.clip(rough*255,0,255),np.zeros((R,R))],-1)
    return [np.clip(a,0,255).astype(np.uint8) for a in (col,nm,mr)]

def enc(a,fmt):
    b=io.BytesIO(); Image.fromarray(a).save(b,fmt,**({'quality':92} if fmt=='JPEG' else {'optimize':True})); return b.getvalue()

def write(name,col,nm,mr):
    raw=open('r/ex0.glb','rb').read(); l=struct.unpack('<I',raw[12:16])[0]; off=20+l+8
    jj=json.loads(raw[20:20+l]); bin_=bytearray(); bvs=[]
    imgbv={im['bufferView'] for im in jj['images']}
    remap={}
    for i,bv in enumerate(jj['bufferViews']):
        if i in imgbv: continue
        d=raw[off+bv.get('byteOffset',0):off+bv.get('byteOffset',0)+bv['byteLength']]
        na=jj['accessors'][jj['meshes'][0]['primitives'][0]['attributes']['NORMAL']]
        if i==na['bufferView']:
            assert bv['byteLength']==N.nbytes and na.get('byteOffset',0)==0; d=N.astype(np.float32).tobytes()
        while len(bin_)%4: bin_+=b'\0'
        nb=dict(bv); nb['byteOffset']=len(bin_); remap[i]=len(bvs); bvs.append(nb); bin_+=d
    for a in jj['accessors']: a['bufferView']=remap[a['bufferView']]
    imgs=[]
    for data,mime in ((enc(col,'JPEG'),'image/jpeg'),(enc(nm,'PNG'),'image/png'),(enc(mr,'JPEG'),'image/jpeg')):
        while len(bin_)%4: bin_+=b'\0'
        bvs.append({'buffer':0,'byteOffset':len(bin_),'byteLength':len(data)}); bin_+=data
        imgs.append({'bufferView':len(bvs)-1,'mimeType':mime})
    while len(bin_)%4: bin_+=b'\0'
    jj['bufferViews']=bvs; jj['images']=imgs; jj['buffers']=[{'byteLength':len(bin_)}]
    jj['textures']=[{'sampler':0,'source':i} for i in range(3)]
    jj['materials']=[{'name':name,'doubleSided':True,'normalTexture':{'index':1},
        'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicRoughnessTexture':{'index':2},'metallicFactor':0.0,'roughnessFactor':1.0}}]
    if name!='zebra': jj['materials'][0]['extensions']={'KHR_materials_clearcoat':{'clearcoatFactor':1.0,'clearcoatRoughnessFactor':0.04}}; jj['extensionsUsed']=['KHR_materials_clearcoat']
    jj['nodes'][0]['name']=jj['meshes'][0]['name']=f'Louboutin_{name}'
    js=json.dumps(jj,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
    out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(bin_))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(bin_),0x004E4942)+bytes(bin_)
    open(f'out/{name}.glb','wb').write(out); print(name,len(out)/1e6,'MB')

import os; os.makedirs('out',exist_ok=True)
for k in sys.argv[1:]:
    col,nm,mr=build(k); Image.fromarray(col).resize((512,512)).save(f'out/{k}_tex.jpg'); write(k,col,nm,mr)
