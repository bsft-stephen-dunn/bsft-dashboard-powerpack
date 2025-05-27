
/**
 * Detect client side url change (SPA)
 * Pass message to underlying content script
 */
let url = location.href;
document.body.addEventListener('click', ()=>{
    requestAnimationFrame(()=>{
      if(url!==location.href){
        url = location.href
        document.dispatchEvent(new CustomEvent('bsft_dashboard_powerpack', {
            detail: {
                eventName:"onClientUrlChanged",
                url: url
            }
        }));
      }
    });
}, true);
 