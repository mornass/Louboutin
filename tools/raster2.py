import numpy as np, trimesh
from load import load
j,P,N,UV,F=load('r/ex0.glb')
N=np.load('smooth_normals.npy').astype(np.float64)
R=2048
tid=-np.ones((R,R),np.int32); bary=np.zeros((R,R,3),np.float32); dist=np.full((R,R),1e9,np.float32)
uv=UV.astype(np.float64)*R
PAD=2.0
for t,(a,b,c) in enumerate(F):
    A,B,C=uv[a],uv[b],uv[c]
    x0=max(int(np.floor(min(A[0],B[0],C[0])-PAD)),0); x1=min(int(np.ceil(max(A[0],B[0],C[0])+PAD)),R-1)
    y0=max(int(np.floor(min(A[1],B[1],C[1])-PAD)),0); y1=min(int(np.ceil(max(A[1],B[1],C[1])+PAD)),R-1)
    xs,ys=np.meshgrid(np.arange(x0,x1+1)+0.5,np.arange(y0,y1+1)+0.5)
    d=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1])
    if abs(d)<1e-12: continue
    l0=((B[1]-C[1])*(xs-C[0])+(C[0]-B[0])*(ys-C[1]))/d
    l1=((C[1]-A[1])*(xs-C[0])+(A[0]-C[0])*(ys-C[1]))/d
    l2=1-l0-l1
    # signed pixel distance outside each edge (barycentric * height)
    e=[np.linalg.norm(B-C),np.linalg.norm(C-A),np.linalg.norm(A-B)]
    h=[abs(d)/max(x,1e-9) for x in e]
    out=np.maximum.reduce([-l0*h[0],-l1*h[1],-l2*h[2],np.zeros_like(l0)])
    yy=(ys-0.5).astype(int); xx=(xs-0.5).astype(int)
    m=(out<=PAD)&(out<dist[yy,xx])
    if not m.any(): continue
    L=np.stack([l0,l1,l2],-1).clip(0,None); L/=L.sum(-1,keepdims=True)
    tid[yy[m],xx[m]]=t; bary[yy[m],xx[m]]=L[m]; dist[yy[m],xx[m]]=out[m]
print('covered',(tid>=0).mean(),'inside',(dist==0).mean())
# inner/outer: narrow-cone rays along normal against the SAME shoe only
cent=P[F].mean(1); side_f=cent[:,0]>0; side_v=P[:,0]>0
inner=np.zeros(len(P))
rng=np.random.default_rng(1); K=32
for sd in (False,True):
    fs=F[side_f==sd]; m=trimesh.Trimesh(P,fs,process=False)
    vi=np.flatnonzero(side_v==sd); o=P[vi]+N[vi]*0.04; best=np.zeros(len(vi))
    for ycap in (0.05,-0.35):
        hits=np.zeros(len(vi))
        for k in range(K):
            d=N[vi]+rng.normal(size=(len(vi),3))*0.25; d[:,1]=np.minimum(d[:,1],ycap); d/=np.linalg.norm(d,axis=1,keepdims=True)
            _,ri=m.ray.intersects_id(o,d,multiple_hits=False); h=np.zeros(len(vi),bool); h[ri]=True; hits+=h
        best=np.maximum(best,hits/K)
    inner[vi]=best
# smooth over welded mesh graph
key=np.round(P/1e-5).astype(np.int64); _,w=np.unique(key,axis=0,return_inverse=True); w=w.ravel(); nw=w.max()+1
e=np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]); e=w[e]
import scipy.sparse as sp
A=sp.coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(nw,nw)).tocsr(); A=A+A.T; A.data[:]=1
deg=np.asarray(A.sum(1)).ravel()+1
iw=np.zeros(nw); np.add.at(iw,w,inner); cnt=np.bincount(w,minlength=nw); iw/=np.maximum(cnt,1)
for _ in range(4): iw=(A@iw+iw)/deg
inner=iw[w]
np.savez_compressed('raster.npz',tid=tid,bary=bary,out=1-inner,dist=dist)
print(np.percentile(inner,[10,50,75,90]))
