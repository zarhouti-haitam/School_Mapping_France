// mes variables globale

let currentPage = 1;
const itemsPerPage = 50;
let donneesFusionnees = null;
let marqueursCarte = null;
let searchTerm = ''; 





function fusionnerDonnees() {
    if (donneesFusionnees) return donneesFusionnees;

   
    const etablissementsMap = new Map(); //mon dictionaire sui va suivre la logique des deux data

    // tout ce qui concerne le Effectif.js avec le nombre d'eleves dans un etab
    if (window.dataEffectifs ) {
        
        window.dataEffectifs.forEach(etab => {

            if (etab && etab.nom_etablissement) {
                etablissementsMap.set(etab.nom_etablissement, {...etab}); // la ligne qui fait la diff  ,, object.assign attribue 
                // ici , ma clé c'est carrément le nom de l'etablissemnt mais j'ai aussi une valeur nom : nomdeletab

            }
        });
    }

    
    if (window.dataPositions ) {
        window.dataPositions.forEach(position => {
            const nomEtablissement = position.nom_etablissement || position.Nom_Etablissement;  // pour enlever le doute sur l'appelation faite dans la datz
            if (position && nomEtablissement) {

                const existant = etablissementsMap.get(nomEtablissement); // je verifie si la clé existe ,, parceque ma clé c'est le nom de mon etab
                if (existant) {
                    etablissementsMap.set(nomEtablissement, {
                        ...existant,                            // c'est ici que la fusion se fait 
                        ...position
                    });
                } else {
                    etablissementsMap.set(nomEtablissement, position);  // si la clé n'existe pas (le nom de l'ecole n'exite pas ) => j'integre lecole normalement => c'est juste un ajout grace à map.set et pas une fusion
                }
            }
        });
    }

    donneesFusionnees = Array.from(etablissementsMap.values());  /// ici je prend juste les valeurs etnom la clé pour ne pas avoir un doublon de nom
    return donneesFusionnees;
}



function genererPagination(totalItems) {    // pour eviter que le site charge lentemeent  j'affiche 50 etab par 50 

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Précédent';
     if (currentPage === 1){

        prevButton.disabled = 1    // bien sur si on est à la page 1 on va pas pouvoir reculer d'une page
    }else{

        prevButton.disabled = 0 ; 
    }

    prevButton.onclick = () => {

        if (currentPage > 1) { 
            currentPage--;
            genererTableau(donneesFusionnees);
        }
    };

    paginationContainer.appendChild(prevButton);


    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;

    paginationContainer.appendChild(pageInfo);

    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Suivant';

    if (currentPage === totalPages){

        nextButton.disabled = 1 ;
    }else{

        nextButton.disabled = 0 ; 
    }
    nextButton.onclick = () => {

        if (currentPage < totalPages) {
            currentPage++;
            genererTableau(donneesFusionnees);
        }
    };
    paginationContainer.appendChild(nextButton);

    return paginationContainer;
}





function genererTableau(donnees) {

    const table = document.getElementById('tableauDonnees');
    if (!table) return;


    const mesheader = {

        libelle_region: "Région",
        libelle_departement: "Département",
        localite_acheminement: "Ville",
        Type_d_etablissement: "Type",
        Secteur_d_enseignement: "Secteur",
        Annee_scolaire: "Année",
        code_postal : "Code Postal" , 
        Code_departement:"Numéro Dp",
        adresse : "Adresse" , 
        Nombre_d_eleves : "Nombre d'élève" , 
        Academie : "Académie" ,
        nom_etablissement : "Nom"
    };

    
    table.innerHTML = '';

    const debut = (currentPage - 1) * itemsPerPage;
    const fin = Math.min(debut + itemsPerPage, donnees.length);

    const pageDonnees = donnees.slice(debut, fin);

    if (pageDonnees.length === 0) return;

    const colonnes = Object.keys(pageDonnees[0]);

    const ligneEntete = document.createElement('tr');

    colonnes.forEach(nomColonne => {
        const th = document.createElement('th');
            th.textContent = mesheader[nomColonne] ; 
        ligneEntete.appendChild(th);
    });
    table.appendChild(ligneEntete);

    pageDonnees.forEach(objet => {
        const ligne = document.createElement('tr');

        colonnes.forEach(nomColonne => {  

            const td = document.createElement('td');
            const valeur = objet[nomColonne];
            td.textContent = valeur ? (valeur.toString()) : ''; // c'est le ternaire  comme en C => la sysntaxe c'est if 1 then do ? else do  :
            ligne.appendChild(td);
        });
        table.appendChild(ligne);
    });

    const container = table.parentElement;
    const anciennePagination = container.querySelector('.pagination');  

    if (anciennePagination) {
        anciennePagination.remove();
    }
    container.appendChild(genererPagination(donnees.length));
}


function initialiserFiltres() {

    const donnees = fusionnerDonnees();
    const filtres = {
        'libelle_region': 'Région',
        'libelle_departement': 'Département',
        'localite_acheminement': 'Ville',
        'Type_d_etablissement': "Type d'établissement",
        'Secteur_d_enseignement': 'Secteur',
        'Annee_scolaire': 'Année scolaire'
    };

    const contfiltres = document.getElementById('filtres');
    if (!contfiltres) return;

    Object.entries(filtres).forEach(([colonne, label]) => {

                const div = document.createElement('div');
                div.className = 'filtre';

                const labelElement = document.createElement('label');
                labelElement.textContent = (label);

                const select = document.createElement('select');
                select.id = `filtre-${colonne}`;  

                const optionTous = document.createElement('option');
                optionTous.value = '';
                optionTous.textContent = 'Tous';
                select.appendChild(optionTous);

                const valeurs = new Set(donnees.map(item => item[colonne]).filter(Boolean));     // le filter(bool) rejette les undeef et les NUll et les vides dpnc il me reste que les valeurs reel
                
                Array.from(valeurs).sort().forEach(valeur => {

                    const option = document.createElement('option');
                    option.value = valeur;
                    option.textContent = (valeur);
                    select.appendChild(option);

                });

                select.addEventListener('change', appliquerFiltres);

                div.appendChild(labelElement);
                div.appendChild(select);
                contfiltres.appendChild(div);
    });
}

function initialiserRecherche() {

    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase(); //pour eviter tout les probleme de majuscule et de minus
            currentPage = 1; // Réinitialiser à la première page 
            appliquerFiltres(); // puisque j'ai fait une var globale searchTerm ,, je n'ai pas besoin de le donner comme parametre parceque toutes les fonvtions le reconnaisent 
        });
    }
}

function appliquerFiltres() {
    const donnees = fusionnerDonnees();
    let donneesFiltrees = donnees;

    const region = document.getElementById('filtre-libelle_region');
    const departement = document.getElementById('filtre-libelle_departement');
    const ville = document.getElementById('filtre-localite_acheminement');
    const typeEtab = document.getElementById('filtre-Type_d_etablissement');
    const secteur = document.getElementById('filtre-Secteur_d_enseignement');
    const annee = document.getElementById('filtre-Annee_scolaire');

    if (region && region.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.libelle_region === region.value);
    }

    if (departement && departement.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.libelle_departement === departement.value);
    }

    if (ville && ville.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.localite_acheminement === ville.value);
    }

    if (typeEtab && typeEtab.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.Type_d_etablissement === typeEtab.value);
    }

    if (secteur && secteur.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.Secteur_d_enseignement === secteur.value);
    }

    if (annee && annee.value !== "") {
        donneesFiltrees = donneesFiltrees.filter(item => item.Annee_scolaire === annee.value);
    }

    //partie ou je gere la recherche

    if (searchTerm && searchTerm !== "") {
        donneesFiltrees = donneesFiltrees.filter(item =>
                {
                    return Object.values(item).some(value =>
                        value && value.toString().toLowerCase().includes(searchTerm)); /// elle cherche dans les values (et non pas les keys ) tout ce qui include le searchTerm
                } );
        }

    
    currentPage = 1;  

    genererTableau(donneesFiltrees); // j'affiche avec la base mise à jour ou filtré 
}


function addcredit(){  //juste pour le plaisir 

        const name = document.createElement("p"); 
        const credit = document.createElement("p");
        const link = document.createElement("a");


        name.textContent = " By Zarhouti Haitam" ;
        name.style.fontSize = "Larger" ; 
        name.style.color = "light purple" ;  

        credit.textContent = "data from : " ; 
        link.textContent = "data.gouv.fr" ; 
        link.href = "https://www.data.gouv.fr"
        name.style.textAlign= "center" ; 
        link.style.textDecoration ="none" ;
        link.style.color = "grey" ; 
        credit.style.color = " grey" ; 
        credit.style.opacity = " 40%" ;
        credit.style.fontSize = "large" ; 
        
        credit.style.marginBottom ="15px " ;




        
        credit.appendChild(link);
        name.appendChild(credit);
        document.getElementById("credit").appendChild(name); 



    }





document.addEventListener('DOMContentLoaded', () => {
    
    setTimeout(() => {      
            
            initialiserFiltres();
            initialiserRecherche();
            genererTableau(fusionnerDonnees());
            addcredit();
       
    }, 100);
});
