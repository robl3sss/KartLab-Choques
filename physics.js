export function solve(m1,m2,u1,u2,e){
 if(![m1,m2,u1,u2,e].every(Number.isFinite)||m1<=0||m2<=0||e<0||e>1)throw Error('Parámetros inválidos');
 const p=m1*u1+m2*u2,v1=(p-m2*e*(u1-u2))/(m1+m2),v2=(p+m1*e*(u1-u2))/(m1+m2);
 const ki=.5*m1*u1*u1+.5*m2*u2*u2,kf=.5*m1*v1*v1+.5*m2*v2*v2,pf=m1*v1+m2*v2;
 return {v1,v2,pi:p,pf,ki,kf,diff:Math.abs(p)>1e-10?Math.abs(pf-p)/Math.abs(p)*100:null,loss:ki>0?(ki-kf)/ki*100:0};
}
