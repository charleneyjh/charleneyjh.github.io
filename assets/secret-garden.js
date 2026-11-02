(() => {
  const section=document.getElementById('secret-garden'),frame=section?.querySelector('iframe');
  if(!frame)return;
  let visible=false;
  const notify=()=>frame.contentWindow?.postMessage({type:'garden-visibility',visible},location.origin);
  const loader=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){frame.src=frame.dataset.src;loader.disconnect();}},{rootMargin:'400px'});
  loader.observe(section);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;notify();},{threshold:0}).observe(section);
  frame.addEventListener('load',notify);
})();
