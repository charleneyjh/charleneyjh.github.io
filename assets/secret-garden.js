(() => {
  const section=document.getElementById('secret-garden'),frame=section?.querySelector('iframe');
  if(!frame)return;
  let visible=false, scrolling=false, scrollTimer;
  const notify=()=>frame.contentWindow?.postMessage({type:'garden-visibility',visible:visible&&!scrolling&&!document.hidden},location.origin);
  const loader=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){frame.src=frame.dataset.src;loader.disconnect();}},{rootMargin:'600px'});
  loader.observe(section);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;notify();},{threshold:0}).observe(section);
  frame.addEventListener('load',notify);
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='garden-ready')notify();});
  window.addEventListener('scroll',()=>{if(!scrolling){scrolling=true;notify();}clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrolling=false;notify();},160);},{passive:true});
  document.addEventListener('visibilitychange',notify);
  section.querySelectorAll('[data-garden-action]').forEach(button=>button.addEventListener('click',()=>frame.contentWindow?.postMessage({type:'garden-action',action:button.dataset.gardenAction},location.origin))); 
})();
