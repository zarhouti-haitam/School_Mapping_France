    // mes variables globales
    let map = null;
    let marqueursCarte = null;
    let donneesTraitees = null; 
    let currentCity = ''; 


    function traiterDonnees() {
        if (donneesTraitees) return donneesTraitees;

        const mapEtab = new Map();

        if (window.data) {  
            window.data.forEach(item => {

                let nomEtab = (item.nom_etablissement || item.Nom_Etablissement || '').trim().toUpperCase();

                let lat = null;
                let lng = null;
                if (item.position) {
                    const parts = item.position.split(',');
                    if (parts.length === 2) {
                        const lattmp = parseFloat(parts[0].trim());
                        const lngtmp = parseFloat(parts[1].trim());
                        if (!isNaN(lattmp) && !isNaN(lngtmp) && lattmp >= 41 && lattmp <= 52 && lngtmp >= -5 && lngtmp <= 10) {
                            lat = lattmp;
                            lng = lngtmp;
                        }
                    }
                }

                let ville = (item.nom_ville || item.Nom_ville || '').trim().toUpperCase();

                if (nomEtab !== '' && lat !== null && lng !== null) {

                    if (mapEtab.has(nomEtab)) {  // pour organiser la datat meme si on fait pas de fusion
                        
                        mapEtab.set(nomEtab , {
                            ...mapEtab.get(nomEtab),
                            ...item, 
                            nom_etablissement: nomEtab,
                            nom_ville: ville,
                            latitude: lat,  // vaut mieux avoir deuxvar que une de ppsition 
                            longitude: lng
                        });
                    } else {
                        mapEtab.set(nomEtab, {
                            ...item,
                            nom_etablissement: nomEtab,
                            nom_ville: ville,
                            latitude: lat,
                            longitude: lng
                        });
                    }
                }
            });
        }

        donneesTraitees = Array.from(mapEtab.values());
        return donneesTraitees;
    }

    function initialiserCarte() {

        map = L.map('map', {
            minZoom: 5,
            maxZoom: 18
        }).setView([46.603354, 1.888334], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        marqueursCarte = L.markerClusterGroup({   // C4EST CE QYUI REGROUPE LES PINS OU LES MARQUEURS

            chunkedLoading: true,
            maxClusterRadius: 60,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 16,
            maxZoom: 18,
            animate: false
        });

        map.addLayer(marqueursCarte);
    }

    function initialiserFiltres() {
        const donnees = traiterDonnees();

        if (!donnees || donnees.length === 0) return;

        // Liste des filtres à gérer : id du select => nom de la propriété dans les données
        const filtres = {
            'region-filter': 'libelle_region',
            'departement-filter': 'libelle_departement',
            'type-filter': 'Type_d_etablissement',
            'ville-filter': 'nom_ville'
        };

        Object.entries(filtres).forEach(([idSelect, prop]) => {
            const select = document.getElementById(idSelect);
            if (!select) return;

            select.innerHTML = '';

            
            const optionTous = document.createElement('option');
            optionTous.value = '';
            optionTous.textContent = 'Tous';
            select.appendChild(optionTous);

          
            let valeurs = new Set();
            donnees.forEach(item => {
                let val = item[prop];
                if (val) {
                    if (prop === 'nom_ville') {
                        val = val.toUpperCase().trim();
                    }
                    valeurs.add(val);
                }
            });

            Array.from(valeurs).sort().forEach(valeur => {
                const option = document.createElement('option');
                option.value = valeur;
                option.textContent = valeur;
                select.appendChild(option);
            });
        });
    }

    function appliquerFiltres() {
        const donnees = traiterDonnees();
        if (!donnees || donnees.length === 0) return;

        const region = document.getElementById('region-filter').value.trim();
        const departement = document.getElementById('departement-filter').value.trim();
        const type = document.getElementById('type-filter').value.trim();
        let ville = document.getElementById('ville-filter').value.trim().toUpperCase();

        let donneesFiltrees = donnees;

        if (region !== '') {
            donneesFiltrees = donneesFiltrees.filter(item => item.libelle_region === region);
        }
        if (departement !== '') {
            donneesFiltrees = donneesFiltrees.filter(item => item.libelle_departement === departement);
        }
        if (type !== '') {
            donneesFiltrees = donneesFiltrees.filter(item => item.Type_d_etablissement === type);
        }
        if (ville !== '') {
            donneesFiltrees = donneesFiltrees.filter(item => item.nom_ville === ville);
        }

        mettreAJourMarqueurs(donneesFiltrees);

        if (ville !== '') {
            const ecolesVille = donneesFiltrees.filter(e => e.nom_ville === ville);
            if (ecolesVille.length > 0) {
                const limites = L.latLngBounds(ecolesVille.map(e => [e.latitude, e.longitude])); //la fonction  lat.. dessine un rectangle autour des cordonnéedonnée 
                if (limites.isValid()) {
                    map.fitBounds(limites, { padding: [50, 50], maxZoom: 14 }); // pour zoomer sur la selection  uand je selectionne une ville ou une region 
                }
            }
        }
    }

    function mettreAJourMarqueurs(donnees) {

        if (!marqueursCarte) return;
        marqueursCarte.clearLayers();

        const maxMarkers = 1000000000;
        const donneesAffichees = donnees.length > maxMarkers ? donnees.slice(0, maxMarkers) : donnees; // pour eviter trop de marquueur qauadn meme

        donneesAffichees.forEach(item => {
                if (!item.latitude || !item.longitude) return;

                const marker = L.marker([item.latitude, item.longitude]);  // la ligne qui fait la diff alors que c'est trop SIMPLE

                let anneeOuverture = 'Inconnue';
                if (item.date_ouverture){

                    const parts = item.date_ouverture.split('/'); //por le format 
                    if (parts.length > 0) {
                        anneeOuverture = parts[parts.length - 1];  // je veux juste l'anne donc je prend juste la derniere partie de la date 
                    }
                }

                const popupContent = 
                    `<strong>${item.nom_etablissement || item.Nom_Etablissement || ''}</strong><br>` +
                    `Type : ${item.Type_d_etablissement || ''}<br>` +
                    `Secteur : ${item.secteur_public_prive_libe || ''}<br>` +
                    `Année d'ouverture : ${anneeOuverture}`;

                marker.bindPopup(popupContent);
                marqueursCarte.addLayer(marker);
        });

        
        if (marqueursCarte.getLayers().length > 0) {
            const limites = marqueursCarte.getBounds();
            if (limites.isValid()) {
                map.fitBounds(limites, { padding: [50, 50], maxZoom: 12 });
            }
        }
    }


    


    document.addEventListener('DOMContentLoaded', () => {
        
        setTimeout(() => {
            initialiserCarte();
            traiterDonnees();
            initialiserFiltres();

            ['region-filter', 'departement-filter', 'type-filter', 'ville-filter'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.addEventListener('change', appliquerFiltres);
                }
            });

            appliquerFiltres(); 
        }, 100);
    });
