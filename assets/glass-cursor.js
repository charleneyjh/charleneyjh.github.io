// Fixed circular glass pointer.
(() => {
 if (!matchMedia('(any-pointer:fine)').matches) return;
 const droplet=document.createElement('div');
 droplet.className='glass-cursor';droplet.setAttribute('aria-hidden','true');document.body.append(droplet);
 const hide=()=>{document.documentElement.classList.remove('glass-cursor-active');droplet.classList.remove('is-visible');};
 document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||event.target.closest('dialog,input,textarea,select,[contenteditable="true"],#annotate-root')){hide();return;}
  droplet.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;
  document.documentElement.classList.add('glass-cursor-active');droplet.classList.add('is-visible');
 },{passive:true});
 document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);
})();
