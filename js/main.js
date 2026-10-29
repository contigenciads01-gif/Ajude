/* ===== SISTEMA BRL FIXO (Brasil) ===== */
var CURR={symbol:'R$\u00A0',rate:1,code:'BRL'};

function formatMajorAmountDigits(n){
    n=Math.round(Number(n));
    if(isNaN(n))n=0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}
function formatBRL(value){
    return CURR.symbol+formatMajorAmountDigits(Math.round(Number(value)));
}
var formatEuroInt=formatBRL;

function convertTextCurrency(txt){
    return txt.replace(/€\s*(\d[\d\s.,]*\d|\d)/g,function(m,n){
        var clean=n.replace(/[\s.]/g,'').replace(',','.');
        var num=parseFloat(clean);
        if(isNaN(num))return m;
        return CURR.symbol+formatMajorAmountDigits(num);
    });
}

function getUTMParams(){
    try{
        const urlParams=new URLSearchParams(window.location.search);
        const utmSource=urlParams.get('utm_source');
        const utmMedium=urlParams.get('utm_medium');
        const utmCampaign=urlParams.get('utm_campaign');
        const utmContent=urlParams.get('utm_content');
        const utmTerm=urlParams.get('utm_term');
        const fbclid=urlParams.get('fbclid');

        if(utmSource||utmMedium||utmCampaign||utmContent||fbclid){
            const utmData={utm_source:utmSource,utm_medium:utmMedium,utm_campaign:utmCampaign,utm_content:utmContent,utm_term:utmTerm,fbclid:fbclid,timestamp:Date.now()};
            if(typeof localStorage!=='undefined'){localStorage.setItem('utm_params',JSON.stringify(utmData));}
        }

        let storedUTM=null;
        try{
            if(typeof localStorage!=='undefined'){
                storedUTM=JSON.parse(localStorage.getItem('utm_params'));
                if(storedUTM&&storedUTM.timestamp){
                    const hoursOld=(Date.now()-storedUTM.timestamp)/(1000*60*60);
                    if(hoursOld>24)storedUTM=null;
                }
            }
        }catch(e){}

        const finalUTM={
            utm_source:utmSource||(storedUTM?storedUTM.utm_source:null),
            utm_medium:utmMedium||(storedUTM?storedUTM.utm_medium:null),
            utm_campaign:utmCampaign||(storedUTM?storedUTM.utm_campaign:null),
            utm_content:utmContent||(storedUTM?storedUTM.utm_content:null),
            utm_term:utmTerm||(storedUTM?storedUTM.utm_term:null),
            fbclid:fbclid||(storedUTM?storedUTM.fbclid:null)
        };

        let params=[];
        if(finalUTM.utm_source)params.push('utm_source='+encodeURIComponent(finalUTM.utm_source));
        if(finalUTM.utm_medium)params.push('utm_medium='+encodeURIComponent(finalUTM.utm_medium));
        if(finalUTM.utm_campaign)params.push('utm_campaign='+encodeURIComponent(finalUTM.utm_campaign));
        if(finalUTM.utm_content)params.push('utm_content='+encodeURIComponent(finalUTM.utm_content));
        if(finalUTM.utm_term)params.push('utm_term='+encodeURIComponent(finalUTM.utm_term));
        if(finalUTM.fbclid)params.push('fbclid='+encodeURIComponent(finalUTM.fbclid));
        if(params.length===0)return '';
        return params.join('&');
    }catch(error){return '';}
}

function updateDonationLinks(){
    try{
        const utmParams=getUTMParams();
        const donationLinks=document.querySelectorAll('a[href*="pagamentos-seguro.link"]');
        donationLinks.forEach((link)=>{
            try{
                const href=link.getAttribute('href');
                if(href){
                    let cleanUrl=href.split('?')[0];
                    let existingParams=href.split('?')[1];
                    if(existingParams){
                        const params=new URLSearchParams(existingParams);
                        params.delete('utm_source');params.delete('utm_medium');params.delete('utm_campaign');
                        params.delete('utm_content');params.delete('utm_term');params.delete('fbclid');
                        const remainingParams=params.toString();
                        if(utmParams){link.href=cleanUrl+'?'+utmParams+(remainingParams?'&'+remainingParams:'');}
                        else if(remainingParams){link.href=cleanUrl+'?'+remainingParams;}
                        else{link.href=cleanUrl;}
                    }else if(utmParams){link.href=cleanUrl+'?'+utmParams;}
                }
            }catch(linkError){}
        });
    }catch(error){}
}

function ensureMetaAdsTracking(){
    try{
        const urlParams=new URLSearchParams(window.location.search);
        const utmSource=urlParams.get('utm_source');
        const fbclid=urlParams.get('fbclid');
        const hasMetaAdsParams=fbclid||(utmSource&&(utmSource.toLowerCase()==='facebook'||utmSource.toLowerCase()==='instagram'||utmSource.toLowerCase()==='fb'||utmSource.toLowerCase()==='ig'))||urlParams.get('utm_medium')==='cpc'||urlParams.get('utm_medium')==='social'||urlParams.get('utm_medium')==='paid';
        if(hasMetaAdsParams)updateDonationLinks();
        document.addEventListener('click',function(e){
            const sel='a[href*="pagamentos-seguro.link"]';
            if(e.target.closest(sel)){
                const link=e.target.closest(sel);
                const href=link.href;
                const utmParams=getUTMParams();
                if(utmParams){
                    const cleanUrl=href.split('?')[0];
                    const existingParams=href.split('?')[1];
                    if(existingParams){
                        const params=new URLSearchParams(existingParams);
                        params.delete('utm_source');params.delete('utm_medium');params.delete('utm_campaign');
                        params.delete('utm_content');params.delete('utm_term');params.delete('fbclid');
                        const remaining=params.toString();
                        link.href=cleanUrl+'?'+utmParams+(remaining?'&'+remaining:'');
                    }else{link.href=cleanUrl+'?'+utmParams;}
                }
            }
        });
    }catch(error){}
}

function initPage(){
    try{
        updateDonationLinks();
        ensureMetaAdsTracking();
    }catch(error){}
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initPage);}else{initPage();}

function openDonateModal(){
    var m=document.getElementById('donateModal');
    if(!m)return;
    if(typeof window.resetDonateModalStep==='function')window.resetDonateModalStep();
    window._donateModalOpenedAt=Date.now();
    m.style.display='flex';
    m.style.pointerEvents='none';
    if(m._poTimer)clearTimeout(m._poTimer);
    m._poTimer=setTimeout(function(){m.style.pointerEvents='';m._poTimer=null;},500);
    var fb=document.getElementById('fixed-mobile');if(fb)fb.classList.add('is-hidden-by-modal');
}
function closeDonateModal(){
    if(typeof window.resetDonateModalStep==='function')window.resetDonateModalStep();
    document.getElementById('donateModal').style.display='none';
    var fb=document.getElementById('fixed-mobile');if(fb)fb.classList.remove('is-hidden-by-modal');
}

document.addEventListener("DOMContentLoaded",()=>{
const toastContainer=document.getElementById("toastContainer");
function showToast(msg){if(!toastContainer)return;const div=document.createElement("div");div.className="toast";div.textContent=msg;toastContainer.prepend(div);setTimeout(()=>div.classList.add("show"),100);setTimeout(()=>{div.classList.remove("show");setTimeout(()=>div.remove(),300);},3000);}

let metaVal=(function(){var g=document.getElementById("goalMobile");if(!g)return 7500;var n=parseInt((g.textContent||"").replace(/\D/g,""),10);return n>0?n:7500})();
const hoje=new Date();
const seed=hoje.getFullYear()*10000+(hoje.getMonth()+1)*100+hoje.getDate();
const porcentagemArrecadada=0.16+(seed%600)/10000;
const offset=((seed%95)-47);
let totalArrecadado=Math.round(metaVal*porcentagemArrecadada)+offset;
if(totalArrecadado%10===0||Math.abs(totalArrecadado)%10===5)totalArrecadado+=3;
let currentRaised=totalArrecadado;
const raisedAmount=document.getElementById("raisedAmount"),progressFill=document.getElementById("progressFill"),progressLabel=document.getElementById("progressLabel"),progressPercentLabel=document.getElementById("progressPercentLabel"),heartsCount=document.getElementById("coracoes"),raisedMobile=document.getElementById("valorMobile"),percentageLabel=document.getElementById("porcentagem"),progressBarMobile=document.getElementById("barraMobile");

const updateDate4=document.getElementById("updateDate4"),updateDate3=document.getElementById("updateDate3"),updateDate2=document.getElementById("updateDate2"),updateDate1=document.getElementById("updateDate1"),updateTag4=document.getElementById("updateTag4"),updateTag3=document.getElementById("updateTag3"),updateTag2=document.getElementById("updateTag2"),updateTag1=document.getElementById("updateTag1"),campaignCreatedDate=document.getElementById("campaignCreatedDate");

function formatCurrentUpdateDate(){return new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});}
function formatUpdateTagValue(value){return formatBRL(Math.max(Math.round(value),1))+" arrecadados";}
function updateLatestCardMeta(){var currentDate=formatCurrentUpdateDate();if(updateDate4)updateDate4.textContent=currentDate;if(updateDate3)updateDate3.textContent=currentDate;if(updateDate2)updateDate2.textContent=currentDate;if(updateDate1)updateDate1.textContent=currentDate;if(campaignCreatedDate)campaignCreatedDate.textContent=currentDate;if(updateTag4)updateTag4.textContent='Atualização';if(updateTag3)updateTag3.textContent='Atualização';if(updateTag2)updateTag2.textContent='Atualização';if(updateTag1)updateTag1.textContent='Atualização';}
function syncCampaignCopyAmounts(){var raisedText=formatBRL(currentRaised);var missingText=formatBRL(Math.max(metaVal-currentRaised,0));function replaceAmounts(html){return html.replace(/Já foram arrecadados R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'Já foram arrecadados '+raisedText).replace(/já foram arrecadados R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'já foram arrecadados '+raisedText).replace(/A campanha chegou a R\$(?:\s|&nbsp;|\u00a0)*[\d.]+,\s*mas ainda faltam R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'A campanha chegou a '+raisedText+', mas ainda faltam '+missingText).replace(/Ainda faltam R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'Ainda faltam '+missingText).replace(/ainda faltam R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'ainda faltam '+missingText).replace(/faltam R\$(?:\s|&nbsp;|\u00a0)*[\d.]+/g,'faltam '+missingText);}document.querySelectorAll('.campaign-subheadline,.campaign-update-body,#aboutSection p,.show-novidades p,.exit-popup-text').forEach(function(el){el.innerHTML=replaceAmounts(el.innerHTML);});document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(function(el){var content=el.getAttribute('content');if(content)el.setAttribute('content',replaceAmounts(content));});}
function updateProgress(){if(raisedAmount)raisedAmount.textContent=formatBRL(currentRaised);if(raisedMobile)raisedMobile.textContent=formatBRL(currentRaised);let pct=0;if(metaVal>0){pct=(currentRaised/metaVal)*100;if(pct>100)pct=100}const pctFormatted=pct.toFixed(1);if(progressFill)progressFill.style.width=pctFormatted+"%";if(progressLabel)progressLabel.textContent=pctFormatted+"%";if(progressPercentLabel)progressPercentLabel.textContent=Math.round(pct)+"%";if(progressBarMobile)progressBarMobile.style.width=pctFormatted+"%";if(percentageLabel)percentageLabel.textContent=Math.round(pct)+"%";if(heartsCount)heartsCount.textContent=Math.floor(currentRaised/25).toString();updateLatestCardMeta();syncCampaignCopyAmounts();}
updateProgress();

const donationList=document.getElementById("donationList");
function addDonationCard(name,amount){if(!donationList)return;const card=document.createElement("div");card.className="donation-card";card.innerHTML=`<span>${name}</span><span>${formatBRL(amount)}</span>`;donationList.prepend(card);if(donationList.children.length>20){donationList.removeChild(donationList.lastChild);}}
const donationQueue=[{name:"Anônimo",amount:30},{name:"Anônimo",amount:70},{name:"Anônimo",amount:100},{name:"Anônimo",amount:50},{name:"Anônimo",amount:150},{name:"Anônimo",amount:70},{name:"Anônimo",amount:50},{name:"Anônimo",amount:100},{name:"Anônimo",amount:70},{name:"Anônimo",amount:50}],donationInterval=()=>{let i=0;function fakeDonate(){if(i<donationQueue.length){let d=donationQueue[i];showToast(d.name+" doou "+formatBRL(d.amount));addDonationCard(d.name,d.amount);i++;setTimeout(fakeDonate,3e4);}else{i=0;setTimeout(fakeDonate,3e4);}}setTimeout(fakeDonate,5e3);}

const shareButton=document.getElementById("shareButton");if(shareButton){shareButton.addEventListener("click",()=>{const link=window.location.href;if(navigator.share){navigator.share({title:document.title,text:"",url:link}).catch(()=>{});}else{alert("Copie o link:\n"+link);}});}

const donateModal=document.getElementById("donateModal"),closeDonationModal=document.getElementById("closeDonationModal");

const showMoreDonationsBtn=document.getElementById("showMoreDonationsBtn");if(showMoreDonationsBtn){showMoreDonationsBtn.addEventListener("click",()=>{document.querySelectorAll(".more-donation-option").forEach(option=>{option.style.display="block";});showMoreDonationsBtn.style.display="none";});}

const tooltipDonationLinks=document.querySelectorAll('.donation-link[data-tooltip]');if(window.matchMedia&&window.matchMedia('(hover: none)').matches&&tooltipDonationLinks.length){tooltipDonationLinks.forEach(link=>{let hideTimer=null;link.addEventListener('click',e=>{if(!link.classList.contains('tooltip-visible')){e.preventDefault();tooltipDonationLinks.forEach(item=>item.classList.remove('tooltip-visible'));link.classList.add('tooltip-visible');if(hideTimer)clearTimeout(hideTimer);hideTimer=setTimeout(()=>link.classList.remove('tooltip-visible'),1800);}else{link.classList.remove('tooltip-visible');}});});document.addEventListener('click',e=>{if(!e.target.closest('.donation-link[data-tooltip]'))tooltipDonationLinks.forEach(link=>link.classList.remove('tooltip-visible'));});}

if(closeDonationModal&&donateModal){closeDonationModal.addEventListener("click",()=>{donateModal.style.display="none";var fb=document.getElementById('fixed-mobile');if(fb)fb.classList.remove('is-hidden-by-modal');if(typeof window.showExitIntentAfterDonateAbandon==='function')window.showExitIntentAfterDonateAbandon();});}

window.addEventListener("click",e=>{if(donateModal&&e.target===donateModal){donateModal.style.display="none";var fb=document.getElementById('fixed-mobile');if(fb)fb.classList.remove('is-hidden-by-modal');if(typeof window.showExitIntentAfterDonateAbandon==='function')window.showExitIntentAfterDonateAbandon();}});

    const tabAbout=document.getElementById('tabAbout');
    const tabUpdates=document.getElementById('tabUpdates');
    const sobreSection=document.getElementById('aboutSection')||document.querySelector('.show-sobre');
    const campaignUpdatesSection=document.getElementById('campaignUpdatesSection')||document.querySelector('.campaign-updates-section');
    const novidadesSection=document.querySelector('.show-novidades');

    function setCampaignTab(tabName){
        if(tabAbout)tabAbout.classList.remove('active');
        if(tabUpdates)tabUpdates.classList.remove('active');
        if(sobreSection)sobreSection.style.display='none';
        if(campaignUpdatesSection)campaignUpdatesSection.style.display='none';
        if(novidadesSection)novidadesSection.style.display='none';
        if(tabName==='about'){if(tabAbout)tabAbout.classList.add('active');if(sobreSection)sobreSection.style.display='block';}
        else if(tabName==='updates'){if(tabUpdates)tabUpdates.classList.add('active');if(campaignUpdatesSection)campaignUpdatesSection.style.display='block';}
    }
    if(tabAbout){tabAbout.addEventListener('click',function(){setCampaignTab('about');});}
    if(tabUpdates){tabUpdates.addEventListener('click',function(){setCampaignTab('updates');});}

/* ===== CONVERTE € RESTANTES PARA R$ NO CONTEÚDO ESTÁTICO ===== */
function convertStaticContent(){
    var goalEl=document.getElementById('goalMobile');
    if(goalEl) goalEl.textContent=formatBRL(metaVal);

    document.querySelectorAll('.impact-card h4').forEach(function(el){el.textContent=convertTextCurrency(el.textContent);});
    var impH=document.querySelector('.impact-header');
    if(impH) impH.textContent=convertTextCurrency(impH.textContent);

    document.querySelectorAll('.donation-link').forEach(function(el){el.textContent=convertTextCurrency(el.textContent);});
    document.querySelectorAll('.donation-badge').forEach(function(el){el.textContent=convertTextCurrency(el.textContent);});

    var modalDesc=document.querySelector('#donateModal .text-sm');
    if(modalDesc) modalDesc.innerHTML=convertTextCurrency(modalDesc.innerHTML);

    var emotEntry=document.querySelector('.emotional-closing-entry');
    if(emotEntry) emotEntry.textContent=convertTextCurrency(emotEntry.textContent);

    document.querySelectorAll('.campaign-update-body, .campaign-update-content p, .show-novidades p').forEach(function(el){
        if(el.textContent.indexOf('€')>=0) el.innerHTML=convertTextCurrency(el.innerHTML);
    });

    document.querySelectorAll('#aboutSection p, #aboutSection li, #aboutSection h1, #aboutSection h2, #aboutSection h3, #aboutSection h4, #aboutSection strong, .emotional-closing-card p, .exit-popup-panel p, .exit-popup-panel h2, .exit-popup-panel button, .future-hope').forEach(function(el){
        if(el.textContent.indexOf('€')>=0) el.innerHTML=convertTextCurrency(el.innerHTML);
    });

    updateProgress();
}
convertStaticContent();
document.body.classList.add('curr-ready');

function initPeopleCommentLikes(){
    document.querySelectorAll('.people-action-like').forEach(function(btn){
        if(btn.dataset.likeBound==='1')return;
        btn.dataset.likeBound='1';
        btn.addEventListener('click',function(){
            var liked=btn.classList.toggle('is-liked');
            btn.setAttribute('aria-pressed',liked?'true':'false');
            var countEl=btn.querySelector('.people-like-count');
            if(!countEl)return;
            var n=parseInt(countEl.textContent.replace(/\D/g,''),10)||0;
            countEl.textContent=String(liked?n+1:n-1);
        });
    });
}
initPeopleCommentLikes();

});

// SISTEMA UNIFICADO DE TRACKING
document.addEventListener('DOMContentLoaded',function(){
    const trackingConfig={clarityEnabled:typeof clarity!=='undefined',debugMode:false,impressionDelay:1000,clickDelay:50};
    function debugLog(message,data){if(trackingConfig.debugMode)console.log('[TRACKING] '+message,data);}
    function trackEvent(eventName,data){
        if(trackingConfig.clarityEnabled){
            clarity('event',eventName,Object.assign({},data,{timestamp:new Date().toISOString(),page_url:window.location.href,utm_params:getUTMParams()}));
        }
    }
    function trackLinkImpression(link){trackEvent('link_impression',{href:link.href,text:link.textContent.trim(),value:extractValueFromLink(link),currency:'BRL'});}
    function trackLinkClick(link){trackEvent('link_click',{href:link.href,text:link.textContent.trim(),value:extractValueFromLink(link),currency:'BRL'});trackEvent('conversion_attempt',{href:link.href,text:link.textContent.trim(),value:extractValueFromLink(link),currency:'BRL'});}
    function extractValueFromLink(link){var text=link.textContent.trim();var m=text.match(/R\$\s*([\d.,]+)/);if(m)return m[1].replace('.','').replace(',','.');return '0';}
    function interceptDonationClicks(){
        const selectors=['a[href*="pagamentos-seguro.link/checkout"]'];
        const donationLinks=document.querySelectorAll(selectors.join(', '));
        donationLinks.forEach((link,index)=>{
            setTimeout(()=>{trackLinkImpression(link);},trackingConfig.impressionDelay+(index*100));
            link.addEventListener('click',function(){trackLinkClick(this);});
        });
    }
    function trackPageImpression(){trackEvent('page_impression',{title:document.title,url:window.location.href,referrer:document.referrer,utm_params:getUTMParams()});}
    function trackModalInteractions(){
        document.querySelectorAll('[onclick*="openDonateModal"], .btn-ajudar').forEach(button=>{
            button.addEventListener('click',function(){trackEvent('modal_open',{button_text:this.textContent.trim(),button_type:this.className});});
        });
    }
    function trackEngagement(){
        let maxScroll=0,scrollEvents=0;
        window.addEventListener('scroll',function(){
            const scrollPercent=Math.round((window.scrollY/(document.body.scrollHeight-window.innerHeight))*100);
            if(scrollPercent>maxScroll){maxScroll=scrollPercent;scrollEvents++;if(scrollPercent%25===0&&scrollPercent>0)trackEvent('scroll_progress',{scroll_percent:scrollPercent,scroll_events:scrollEvents});}
        });
    }
    trackPageImpression();interceptDonationClicks();trackModalInteractions();trackEngagement();
    const observer=new MutationObserver(function(mutations){mutations.forEach(function(mutation){if(mutation.type==='childList'&&mutation.addedNodes.length>0){const newLinks=document.querySelectorAll('a[href*="pagamentos-seguro.link/checkout"]');if(newLinks.length>0)setTimeout(interceptDonationClicks,100);}});});
    observer.observe(document.body,{childList:true,subtree:true});
});

document.addEventListener('DOMContentLoaded',function(){
    const images=document.querySelectorAll('img[src*="depoiment"], img[src*="/depoimentos/"], img[src*="testimonial"]');
    images.forEach(img=>{if(!img.loading)img.loading='lazy';});
});

// ===== EXIT INTENT POPUP =====
(function(){
    var exitShown=false;
    var EXIT_AMOUNT=20;
    var popup=document.getElementById('exitIntentPopup');
    if(!popup)return;

    (function syncExitPopupHeroImage(){
        try{var hero=document.getElementById('campaignHeroImg');var exitImg=document.getElementById('exitPopupHeroImg');if(!hero||!exitImg)return;var src=hero.getAttribute('src');if(src)exitImg.src=src;var alt=hero.getAttribute('alt');if(alt)exitImg.setAttribute('alt',alt);}catch(e){}
    })();

    function updateExitTexts(){
        var cta=document.getElementById('exitPopupDonate');
        if(cta)cta.textContent='DOAR R$'+EXIT_AMOUNT+' AGORA \u{1F49B}';
        var txt=document.getElementById('exitPopupBody')||popup.querySelector('.exit-popup-text');
        if(txt){
            if(typeof window.CUSTOM_EXIT_POPUP_BODY==='string'&&window.CUSTOM_EXIT_POPUP_BODY.length){
                txt.textContent=window.CUSTOM_EXIT_POPUP_BODY.replace(/\{symbol\}/g,'R$').replace(/\{amount\}/g,String(EXIT_AMOUNT));
            }
        }
    }

    function isBlockingModalOpen(){
        var donateModal=document.getElementById('donateModal');
        if(donateModal&&donateModal.style.display==='flex')return true;
        return false;
    }

    function showExitPopup(){
        if(exitShown)return;
        if(popup.classList.contains('is-visible'))return;
        if(isBlockingModalOpen())return;
        exitShown=true;
        updateExitTexts();
        popup.classList.add('is-visible');
        document.body.style.overflow='hidden';
    }

    function hideExitPopup(){
        popup.classList.remove('is-visible');
        document.body.style.overflow='';
        exitShown=true;
        var fb=document.getElementById('fixed-mobile');
        if(fb){fb.classList.remove('checkout-modal-open');fb.classList.remove('is-hidden-by-modal');}
    }

    window.showExitIntentFromCheckoutClose=function(){
        if(popup.classList.contains('is-visible'))return;
        exitShown=true;updateExitTexts();
        popup.classList.add('is-visible');
        document.body.style.overflow='hidden';
        var fb=document.getElementById('fixed-mobile');
        if(fb)fb.classList.add('is-hidden-by-modal');
    };

    window.showExitIntentAfterDonateAbandon=function(){
        setTimeout(function(){
            if(popup.classList.contains('is-visible'))return;
            exitShown=true;updateExitTexts();
            popup.classList.add('is-visible');
            document.body.style.overflow='hidden';
            var fb=document.getElementById('fixed-mobile');
            if(fb){fb.classList.remove('checkout-modal-open');fb.classList.remove('is-hidden-by-modal');}
        },220);
    };

    function tryExitIntentFromMouse(e){
        if(exitShown||popup.classList.contains('is-visible'))return;
        if(isBlockingModalOpen())return;
        var y=typeof e.clientY==='number'?e.clientY:999;
        if(y>8)return;
        setTimeout(showExitPopup,80);
    }

    document.addEventListener('mouseout',function(e){if(!e.relatedTarget&&!e.toElement)tryExitIntentFromMouse(e);});
    document.documentElement.addEventListener('mouseleave',function(e){tryExitIntentFromMouse(e);});

    var isTouchDevice=('ontouchstart' in window)||(navigator.maxTouchPoints>0)||(window.matchMedia&&window.matchMedia('(hover:none) and (pointer:coarse)').matches);
    if(!isTouchDevice){
        var scrollTimer=null,lastScroll=0;
        window.addEventListener('scroll',function(){
            if(exitShown||popup.classList.contains('is-visible'))return;
            if(isBlockingModalOpen())return;
            var st=window.pageYOffset||document.documentElement.scrollTop;
            if(st<lastScroll&&(lastScroll-st)>500){if(!scrollTimer){scrollTimer=setTimeout(function(){showExitPopup();},400);}}
            else{if(scrollTimer){clearTimeout(scrollTimer);scrollTimer=null;}}
            lastScroll=st;
        });
    }

    var exitPopupDismiss=document.getElementById('exitPopupDismiss');
    if(exitPopupDismiss){
        exitPopupDismiss.addEventListener('click',function(){
            hideExitPopup();
            var donateModal=document.getElementById('donateModal');
            if(donateModal){
                window._donateModalOpenedAt=Date.now();
                donateModal.style.display='flex';
                donateModal.style.pointerEvents='none';
                if(donateModal._poTimer)clearTimeout(donateModal._poTimer);
                donateModal._poTimer=setTimeout(function(){donateModal.style.pointerEvents='';donateModal._poTimer=null;},500);
                if(typeof window.showDonateCustomAmountStep==='function'){
                    window.showDonateCustomAmountStep();
                }
            }
            var fb=document.getElementById('fixed-mobile');if(fb)fb.classList.add('is-hidden-by-modal');
        });
    }
    var exitPopupClose=document.getElementById('exitPopupClose');
    if(exitPopupClose)exitPopupClose.addEventListener('click',hideExitPopup);
    var exitPopupOverlay=document.getElementById('exitPopupOverlay');
    if(exitPopupOverlay)exitPopupOverlay.addEventListener('click',hideExitPopup);

    var exitPopupDonate=document.getElementById('exitPopupDonate');
    if(exitPopupDonate){
        exitPopupDonate.addEventListener('click',function(){
            hideExitPopup();
            if(typeof window.openCheckout==='function'){window.openCheckout(EXIT_AMOUNT);}
        });
    }
})();
