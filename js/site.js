/* Au Domaine de Chasse : interactions du site */
(function(){
  // Écran d'entrée : une photo et le logo, glisse vers le haut après 2 s, à chaque chargement de l'accueil
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  var loader=document.querySelector('.loader');
  if(loader){
    document.documentElement.style.overflow='hidden';
    setTimeout(function(){
      loader.classList.add('fini');
      document.documentElement.style.overflow='';
      setTimeout(function(){loader.remove();},950);
    },2200);
  }

  // En-tête : transparent sur la photo, plein au défilement
  var entete=document.querySelector('.entete');
  var majEntete=function(){ if(entete) entete.classList.toggle('plein',window.scrollY>40); };
  majEntete(); window.addEventListener('scroll',majEntete,{passive:true});
  var burger=document.querySelector('.burger');
  if(burger){burger.addEventListener('click',function(){
    var o=entete.classList.toggle('menu-ouvert');
    burger.setAttribute('aria-expanded',o?'true':'false');
    document.documentElement.style.overflow=o?'hidden':'';
  });}

  // Hero : trois photos en fondu, une par une
  var diapos=[].slice.call(document.querySelectorAll('.hero .diapos img'));
  if(diapos.length>1){var d=0;setInterval(function(){diapos[d].classList.remove('actif');d=(d+1)%diapos.length;diapos[d].classList.add('actif');},6000);}

  // Rail des hébergements : flèches qui font défiler d'une carte
  document.querySelectorAll('.rail').forEach(function(r){
    var piste=r.querySelector('.rail-piste');
    var pas=function(){var c=piste.firstElementChild;return c?c.getBoundingClientRect().width+20:300;};
    r.querySelector('.prec').addEventListener('click',function(){piste.scrollBy({left:-pas(),behavior:'smooth'});});
    r.querySelector('.suiv').addEventListener('click',function(){
      var fin=piste.scrollLeft+piste.clientWidth>=piste.scrollWidth-4;
      piste.scrollTo({left:fin?0:piste.scrollLeft+pas(),behavior:'smooth'});
    });
  });

  // Apparition au défilement
  var els=document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vu');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el);});
  } else els.forEach(function(el){el.classList.add('vu');});

  // Visionneuse : photo entière, jamais recadrée
  var boutons=[].slice.call(document.querySelectorAll('[data-galerie]'));
  if(boutons.length){
    var v=document.createElement('div');
    v.className='visionneuse';
    v.innerHTML='<button class="fermer" aria-label="Fermer">&times;</button><button class="prec" aria-label="Photo précédente">&#8249;</button><img alt=""><div class="legende"></div><button class="suiv" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(v);
    var img=v.querySelector('img'),leg=v.querySelector('.legende'),i=0;
    var montre=function(n){i=(n+boutons.length)%boutons.length;var b=boutons[i];img.src=b.getAttribute('data-galerie');img.alt=b.getAttribute('data-legende')||'';leg.textContent=(b.getAttribute('data-legende')||'')+'  ·  '+(i+1)+' / '+boutons.length;};
    boutons.forEach(function(b,n){b.addEventListener('click',function(){montre(n);v.classList.add('ouverte');});});
    v.querySelector('.fermer').onclick=function(){v.classList.remove('ouverte');};
    v.querySelector('.prec').onclick=function(e){e.stopPropagation();montre(i-1);};
    v.querySelector('.suiv').onclick=function(e){e.stopPropagation();montre(i+1);};
    v.addEventListener('click',function(e){if(e.target===v)v.classList.remove('ouverte');});
    document.addEventListener('keydown',function(e){if(!v.classList.contains('ouverte'))return;if(e.key==='Escape')v.classList.remove('ouverte');if(e.key==='ArrowLeft')montre(i-1);if(e.key==='ArrowRight')montre(i+1);});
  }

  // Formulaire (maquette : rien n'est envoyé)
  document.querySelectorAll('form.formulaire').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();f.classList.add('envoye');f.querySelector('.merci').scrollIntoView({block:'nearest',behavior:'smooth'});});
  });
})();

/* V2 : fenêtres de détail (cartes cliquables, comme les fiches de T'Nature) et menu à ancres */
(function(){
  document.querySelectorAll('[data-modale]').forEach(function(b){
    b.addEventListener('click',function(){
      var d=document.getElementById(b.getAttribute('data-modale'));
      if(!d||!d.showModal)return;
      d.querySelectorAll('img[loading=lazy]').forEach(function(i){i.loading='eager';});
      d.showModal();document.body.classList.add('modale-ouverte');
    });
  });
  document.querySelectorAll('dialog.modale').forEach(function(d){
    var fermer=function(){if(d.open)d.close();};
    d.querySelector('.modale-fermer').addEventListener('click',fermer);
    d.addEventListener('click',function(e){if(e.target===d)fermer();});
    d.addEventListener('close',function(){document.body.classList.remove('modale-ouverte');});
    // un bouton Réserver dans la fiche ferme la fiche avant d'ouvrir le panneau
    d.querySelectorAll('[data-obt-reserve]').forEach(function(a){a.addEventListener('click',fermer);});
  });
  // menu mobile : un lien d'ancre referme le menu
  var entete=document.querySelector('.entete'),burger=document.querySelector('.burger');
  document.querySelectorAll('.menu a[href*="#"]').forEach(function(a){
    a.addEventListener('click',function(){
      if(entete&&entete.classList.contains('menu-ouvert')){entete.classList.remove('menu-ouvert');burger.setAttribute('aria-expanded','false');document.documentElement.style.overflow='';}
    });
  });
  // lien actif selon la section affichée
  var liens=[].slice.call(document.querySelectorAll('.menu a[href^="#"]'));
  if('IntersectionObserver' in window&&liens.length){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){liens.forEach(function(l){l.classList.toggle('actif',l.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-45% 0px -50% 0px'});
    liens.forEach(function(l){var s=document.querySelector(l.getAttribute('href'));if(s)io.observe(s);});
  }
})();
