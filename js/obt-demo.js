/* Baia : données de démonstration pour le panneau de réservation OBT.
 *
 * Le panneau est le vrai script de l'application (obt-gestion.com/blocks/obt-booking.js), le même que
 * sur le site de T'Nature. Baia n'a pas encore de compte dans l'application : ce fichier répond à sa
 * place, dans le navigateur, pour une adresse factice (DEMO_API). Rien n'est lu dans l'application et
 * rien n'y est écrit ; la demande finale n'est envoyée nulle part.
 *
 * Tarifs et règles : ceux de la page « reservation » du site de Frédéric (relevé du 28/10/2026) :
 * 90 € la nuit en semaine hors vacances scolaires, 140 € la nuit du vendredi et du samedi, 140 € la nuit
 * pendant les vacances scolaires (zone C, calendrier officiel 2026-2027), ménage 50 € par séjour,
 * 2 nuits minimum, 6 personnes, animaux acceptés.
 * Dates prises : celles de son calendrier Airbnb publié sur son site (iCal relevé le 28/10/2026), sans
 * aucune autre information sur les voyageurs. À la mise en service, l'application lit ce calendrier elle-même.
 */
(function () {
  "use strict";
  var DEMO_API = "https://demo-baia.obt.invalid";
  var DEMO_ENVOI = "https://demo-baia.obt.invalid/envoi";

  var JOUR = 86400000;
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  var date = function (s) { return new Date(s + "T00:00:00Z"); };
  var auj = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  // Vacances scolaires de la zone C : nuits du premier samedi jusqu'à la veille de la reprise
  var VACANCES = [
    ["2026-10-17", "2026-11-02"], ["2026-12-19", "2027-01-04"], ["2027-02-06", "2027-02-22"],
    ["2027-04-03", "2027-04-19"], ["2027-07-03", "2027-09-01"],
  ];
  var PRIX_SEMAINE = 9000, PRIX_HAUT = 14000;
  var enVacances = function (s) { return VACANCES.some(function (v) { return s >= v[0] && s < v[1]; }); };
  var prixNuit = function (s) {
    var j = date(s).getUTCDay();
    return j === 5 || j === 6 || enVacances(s) ? PRIX_HAUT : PRIX_SEMAINE;
  };

  var LOGEMENTS = [
    { id: "baia", name: "Baia, la maison entière", kind: "maison", capacity: 6, minNights: 2, contains: [],
      note: "3 chambres, 5 lits et un canapé-lit, jardin de 500 m² avec ruisseau et lavoir", image: "images/maison/jardin-maison.jpg" },
  ];

  // Calendrier Airbnb de Frédéric (dates d'arrivée et de départ seulement)
  var OCCUPE = { baia: [
    ["2026-10-26", "2026-10-29"], ["2026-10-30", "2026-11-01"], ["2026-11-01", "2026-11-02"], ["2026-11-06", "2026-11-08"],
    ["2026-11-13", "2026-11-15"], ["2026-11-20", "2026-11-22"], ["2026-11-27", "2026-11-29"], ["2026-12-04", "2026-12-07"],
    ["2026-12-11", "2026-12-13"], ["2026-12-13", "2026-12-16"], ["2026-12-18", "2026-12-20"], ["2026-12-24", "2026-12-26"],
    ["2026-12-27", "2027-01-02"], ["2027-03-26", "2027-03-30"], ["2027-05-14", "2027-05-17"], ["2027-06-04", "2027-06-06"],
    ["2027-07-11", "2027-07-17"], ["2027-09-04", "2027-09-18"],
  ].map(function (r) { return { start: r[0], end: r[1] }; }) };

  var OPTIONS = [
    { id: "menage", name: "Ménage de fin de séjour", priceCents: 5000, unit: "sejour", mandatory: true },
    { id: "linge", name: "Linge de lit fourni", priceCents: 0, unit: "sejour", included: true },
    { id: "bois", name: "Bois pour le poêle", priceCents: 0, unit: "sejour", included: true },
    { id: "animal", name: "Je viens avec mon animal", priceCents: 0, unit: "sejour" },
    { id: "lit-bebe", name: "Lit parapluie pour bébé", priceCents: 0, unit: "sejour" },
  ].map(function (o) {
    return { id: o.id, name: o.name, priceCents: o.priceCents, unit: o.unit, logementIds: [], appliesTo: "all",
      minGuests: null, minNights: null, included: !!o.included, mandatory: !!o.mandatory, maxGuests: null, maxNights: null,
      periodStart: null, periodEnd: null, includedGuests: null, adultsOnly: false };
  });

  var CONDITIONS = [
    { id: "arrivee", title: "Arrivée et départ", body: "Arrivée autonome : Frédéric vous envoie les horaires et le mode d’emploi après votre réservation." },
    { id: "eau", title: "Le ruisseau et le lavoir", body: "Le ruisseau, le bassin et le lavoir sont en accès libre dans le jardin. Les enfants doivent rester sous la surveillance de leurs parents." },
    { id: "regles", title: "La maison", body: "6 personnes au plus. Les animaux sont acceptés. La maison est non-fumeur, les fêtes et les soirées ne sont pas autorisées." },
  ];
  var QUESTIONS = [
    { id: "heure", label: "À quelle heure pensez-vous arriver ?" },
    { id: "animal", label: "Venez-vous avec un animal ? Lequel ?" },
    { id: "train", label: "Venez-vous en train jusqu’à Montereau ?" },
  ];

  var nuits = function (a, b) { return Math.round((date(b) - date(a)) / JOUR); };
  var chevauche = function (a, b, r) { return a < r.end && r.start < b; };
  var byId = function (id) { return LOGEMENTS.filter(function (l) { return l.id === id; })[0]; };
  var libre = function (l, a, b) { return !OCCUPE[l.id].some(function (r) { return chevauche(a, b, r); }); };

  function prixNuits(l, a, b) {
    var t = [];
    for (var i = 0; i < nuits(a, b); i++) {
      var d = iso(new Date(date(a).getTime() + i * JOUR));
      t.push({ date: d, priceCents: prixNuit(d) });
    }
    return t;
  }
  var somme = function (t) { return t.reduce(function (s, x) { return s + x.priceCents; }, 0); };

  function planning() {
    return { hidden: false, today: iso(auj), privacyUrl: null, questions: QUESTIONS, conditions: CONDITIONS, options: OPTIONS,
      logements: LOGEMENTS.map(function (l) {
        return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
          minNights: l.minNights, minStays: [], contains: l.contains, occupied: OCCUPE[l.id] };
      }) };
  }

  function disponibilites(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, n = nuits(a, b);
    return { hidden: false, nights: n, guests: g, logements: LOGEMENTS.map(function (l) {
      var ok = libre(l, a, b), assez = n >= l.minNights;
      return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
        fits: g <= l.capacity, minNights: l.minNights, available: ok && assez,
        reason: !ok ? "occupe" : !assez ? "nuits_minimum" : g > l.capacity ? "places" : null,
        accommodationCents: ok && assez ? somme(prixNuits(l, a, b)) : null };
    }) };
  }

  function devis(p) {
    var ids = (p.get("logement") || "").split(",").filter(Boolean), a = p.get("start"), b = p.get("end");
    var g = +p.get("guests") || 1, enfants = +p.get("children") || 0, n = nuits(a, b);
    var choisis = ids.map(byId).filter(Boolean);
    var dispo = choisis.length > 0 && choisis.every(function (l) { return libre(l, a, b) && n >= l.minNights; });
    var places = choisis.reduce(function (s, l) { return s + l.capacity; }, 0);
    var lignes = [], nuitees = {};
    choisis.forEach(function (l) {
      var t = prixNuits(l, a, b);
      t.forEach(function (x) { nuitees[x.date] = (nuitees[x.date] || 0) + x.priceCents; });
      lignes.push({ id: l.id, name: l.name, accommodationCents: somme(t) });
    });
    var hebergement = lignes.reduce(function (s, x) { return s + x.accommodationCents; }, 0);
    var voulues = (p.get("options") || "").split(",").filter(Boolean);
    var extras = OPTIONS.filter(function (o) { return o.mandatory || o.included || voulues.indexOf(o.id) >= 0; }).map(function (o) {
      var q = o.unit === "sejour" ? 1 : o.unit === "personne" ? g : o.unit === "personne_nuit" ? g * n : n;
      var e = { id: o.id, name: o.name, unit: o.unit, quantity: q, unitPriceCents: o.priceCents, totalCents: o.priceCents * q };
      if (o.mandatory) e.mandatory = true;
      if (o.included) e.included = true;
      return e;
    });
    return { hidden: false, available: dispo && g <= places, nights: n, guests: g, children: enfants,
      minNights: Math.max.apply(null, choisis.map(function (l) { return l.minNights; }).concat(1)), capacity: places,
      nightly: Object.keys(nuitees).sort().map(function (d) { return { date: d, priceCents: nuitees[d] }; }),
      lines: lignes, accommodationCents: hebergement, extras: extras,
      totalCents: hebergement + extras.reduce(function (s, e) { return s + e.totalCents; }, 0) };
  }

  var repondre = function (corps) {
    return Promise.resolve(new Response(JSON.stringify(corps), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  var vraiFetch = window.fetch.bind(window);
  window.fetch = function (entree, init) {
    var url = typeof entree === "string" ? entree : entree && entree.url;
    if (!url || url.indexOf(DEMO_API) !== 0) return vraiFetch(entree, init);
    var u = new URL(url);
    // Démonstration : la demande et l'e-mail ne partent nulle part, le visiteur voit simplement « Merci »
    if (url.indexOf(DEMO_ENVOI) === 0 || /\/requests$/.test(u.pathname)) return repondre({ success: true, demo: true });
    if (/\/image\//.test(u.pathname)) return vraiFetch(entree, init);
    if (/\/planning$/.test(u.pathname)) return repondre(planning());
    if (/\/availability$/.test(u.pathname)) return repondre(disponibilites(u.searchParams));
    if (/\/quote$/.test(u.pathname)) return repondre(devis(u.searchParams));
    return Promise.resolve(new Response("{}", { status: 404 }));
  };
})();
