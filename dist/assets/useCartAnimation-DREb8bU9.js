function r(i){const t=i.getBoundingClientRect(),n=document.querySelector("[data-cart-icon]");if(!n)return;const o=n.getBoundingClientRect(),e=document.createElement("div");e.style.cssText=`
    position: fixed;
    left: ${t.left+t.width/2-16}px;
    top: ${t.top+t.height/2-16}px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #2563EB;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    z-index: 9999;
    pointer-events: none;
    transition: none;
  `,e.innerHTML="🛒",document.body.appendChild(e);const c=o.left+o.width/2-(t.left+t.width/2),s=o.top+o.height/2-(t.top+t.height/2);e.style.setProperty("--fly-x",`${c}px`),e.style.setProperty("--fly-y",`${s}px`),e.classList.add("fly-to-cart"),e.addEventListener("animationend",()=>{e.remove(),n.classList.add("cart-bounce"),setTimeout(()=>n.classList.remove("cart-bounce"),300)})}export{r as t};
