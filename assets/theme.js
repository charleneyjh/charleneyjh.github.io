(() => {
 const button=document.querySelector('.theme-toggle');
 if(!button)return;
 const sync=()=>{const dark=document.documentElement.dataset.theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);};
 sync();
 button.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('portfolio-theme',theme)}catch(e){}sync();});
})();
