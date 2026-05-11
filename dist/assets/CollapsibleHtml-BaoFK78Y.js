import{i as l,r as n,j as e,K as p}from"./index-B-I8BLyB.js";import{C as b}from"./chevron-up-KD_UgVrd.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M17 14V2",key:"8ymqnk"}],["path",{d:"M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",key:"m61m77"}]],N=l("thumbs-down",g);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",key:"emmmcr"}]],k=l("thumbs-up",j);function y(s){try{const t=document.createElement("textarea");return t.innerHTML=s,t.value}catch{return s}}function C({html:s,collapsedHeight:t=340,contentClassName:d=""}){const[r,m]=n.useState(!1),[o,h]=n.useState(!1),[u,x]=n.useState(0),i=n.useRef(null),f=y(s);n.useEffect(()=>{const a=i.current;if(!a)return;const c=a.scrollHeight;x(c),h(c>t+48)},[s,t]);const v=o?r?u||99999:t:void 0;return e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"overflow-hidden",style:{maxHeight:v,transition:"max-height 0.4s ease"},children:e.jsx("div",{ref:i,className:d,dangerouslySetInnerHTML:{__html:f}})}),o&&!r&&e.jsx("div",{className:"pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent"}),o&&e.jsx("div",{className:"relative mt-4 flex justify-center",children:e.jsx("button",{onClick:()=>m(a=>!a),className:"flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 hover:shadow-md",children:r?e.jsxs(e.Fragment,{children:[e.jsx(b,{size:15})," Thu gọn"]}):e.jsxs(e.Fragment,{children:[e.jsx(p,{size:15})," Xem thêm"]})})})]})}export{C,k as T,N as a};
