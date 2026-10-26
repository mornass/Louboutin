import numpy as np
from load import load
j,P,N,UV,F=load('r/ex0.glb')
key=np.round(P/1e-5).astype(np.int64); _,w=np.unique(key,axis=0,return_inverse=True); w=w.ravel()
v0,v1,v2=P[F[:,0]],P[F[:,1]],P[F[:,2]]
fn=np.cross(v1-v0,v2-v0).astype(np.float64)  # area weighted
fu=fn/(np.linalg.norm(fn,axis=1,keepdims=True)+1e-12)
cf=np.repeat(np.arange(len(F)),3); cw=w[F.ravel()]; cv=F.ravel()
order=np.argsort(cw,kind='stable'); cw_s=cw[order]; cf_s=cf[order]
bounds=np.flatnonzero(np.diff(cw_s))+1; starts=np.r_[0,bounds]; ends=np.r_[bounds,len(cw_s)]
cn=np.zeros((len(cf),3))
thr=np.cos(np.radians(55))
for s,e in zip(starts,ends):
    fs=cf_s[s:e]; U=fu[fs]; A=fn[fs]
    M=(U@U.T)>thr
    cn[order[s:e]]=M.astype(float)@A
vn=np.zeros((len(P),3)); np.add.at(vn,cv,cn)
vn/=np.linalg.norm(vn,axis=1,keepdims=True)+1e-12
# keep orientation consistent with stored normals
vn[(vn*N).sum(1)<0]*=-1
np.save('smooth_normals.npy',vn.astype(np.float32)); print('mean dot vs orig',(vn*N).sum(1).mean())
