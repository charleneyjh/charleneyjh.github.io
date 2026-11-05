// Fixed circular glass pointer.
(() => {
 if (!matchMedia('(any-pointer:fine)').matches) return;
 const droplet=document.createElement('div');
 droplet.className='glass-cursor';droplet.setAttribute('aria-hidden','true');document.body.append(droplet);
 const hide=()=>{document.documentElement.classList.remove('glass-cursor-active');droplet.classList.remove('is-visible');};
 document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||event.target.closest('dialog,input,textarea,select,[contenteditable="true"],#annotate-root,iframe,#secret-garden')){hide();return;}
  droplet.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;
  document.documentElement.classList.add('glass-cursor-active');droplet.classList.add('is-visible');
 },{passive:true});
 // Pointer movement inside an iframe belongs to its document, so the parent
 // must clear its last painted cursor before handing control to the garden.
 document.addEventListener('pointerover',event=>{if(event.target.closest?.('iframe,#secret-garden'))hide();},{passive:true});
 document.addEventListener('pointerout',event=>{if(!event.relatedTarget||event.relatedTarget.closest?.('iframe,#secret-garden'))hide();},{passive:true});
 window.addEventListener('scroll',hide,{passive:true,capture:true});
 window.addEventListener('message',event=>{
  const frame=document.querySelector('#secret-garden iframe');
  if(event.origin===location.origin&&event.source===frame?.contentWindow&&event.data?.type==='garden-pointer-enter')hide();
 });
 document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);
})();
