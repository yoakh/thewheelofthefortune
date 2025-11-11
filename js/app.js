/**
 * ROUE DE LA FORTUNE - Application principale
 * ==========================================
 */

// Configuration globale
const CONFIG = {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    voyelles: 'AEIOUY',
    consonnes: 'BCDFGHJKLMNPQRSTVWXZ',
    secteurs: [], // Chargé depuis JSON
    phrases: {}, // Chargé depuis JSON
    phrasesConfig: {} // Config des phrases
};
// État du jeu
const gameState = {
    scoreTotal: 0,
    scoreManche: 0,
    lettresUtilisees: new Set(),
    lettresTrouvees: new Set(),
    phraseActuelle: null,
    categorieActuelle: 'expressions',
    joueurActuel: 1,
    modeJeu: 'normal', // normal, achat-voyelle, proposition
    grillePhrase: [],
    dernierResultatRoue: null, // Pour calculer les points
    historiqueScores: [] // Pour garder l'historique
};
// Éléments DOM
const elements = {
    scoreTotal: null,
    scoreManche: null,
    lettresTrouvees: null,
    categorie: null,
    spinBtn: null,
    roueResultat: null,
    clavier: null,
    nouvellePartieBtn: null,
    acheterVoyelleBtn: null,
    proposerMotBtn: null,
    roueContainer: null
};


// Lancer au chargement de la page
document.addEventListener('DOMContentLoaded', prechargerImages);
/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Initialisation de la Roue de la Fortune...');
    
    initElements();

    // Charger la config AVANT d'initialiser le reste
    await chargerConfigRoue();
    await chargerPhrases();

    initClavier();
    initEventListeners();
    nouvellePartie();

    
    
    console.log('✅ Jeu initialisé avec succès !');
});

/**
 * Initialisation des références DOM
 */
function initElements() {
    elements.scoreTotal = document.getElementById('score-total');
    elements.scoreManche = document.getElementById('score-manche');
    elements.lettresTrouvees = document.getElementById('lettres-trouvees');
    elements.categorie = document.getElementById('categorie');
    elements.spinBtn = document.getElementById('spin-btn');
    elements.roueResultat = document.getElementById('roue-resultat');
    elements.clavier = document.getElementById('clavier');
    elements.nouvellePartieBtn = document.getElementById('nouvelle-partie-btn');
    elements.acheterVoyelleBtn = document.getElementById('acheter-voyelle-btn');
    elements.proposerMotBtn = document.getElementById('proposer-mot-btn');
    elements.roueContainer = document.querySelector('.roue-container');
    elements.categorieSelect = document.getElementById('categorie-select');
    elements.tricheBtn = document.getElementById('triche-btn');
}

/**
 * Charger la configuration de la roue depuis JSON externe
 */
async function chargerConfigRoue() {
    try {
        console.log('📥 Chargement de la configuration depuis JSON...');
        
        const response = await fetch('data/roue-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mettre à jour la config
        CONFIG.secteurs = data.secteurs;
        CONFIG.roueConfig = data.config;
        
        // Générer le CSS de la roue dynamiquement
        genererCSSRoue();
        
        // Ajouter les labels
        ajouterLabelsRoue();

        // Ajouter le centre vert
        ajouterCentreRoue();
        
        console.log('✅ Configuration chargée depuis JSON:', CONFIG.secteurs.length, 'secteurs');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la config:', error);
        
        // Fallback vers la config par défaut
        console.log('🔄 Utilisation de la config de secours...');
        CONFIG.secteurs = [
            { id: 1, valeur: 100, label: '100 F', couleur: '#ff6b6b' },
            { id: 2, valeur: 200, label: '200 F', couleur: '#4ecdc4' },
            { id: 3, valeur: 500, label: '500 F', couleur: '#4CAF50' },
            { id: 4, valeur: 0, label: '💥 Banqueroute', couleur: '#FFC107' },
            { id: 5, valeur: 1000, label: '1000 F', couleur: '#98d8c8' }
        ];
                
        genererCSSRoue();
        ajouterLabelsRoue();
        return false;
    }
}

/**
 * Charger les phrases depuis JSON externe
 */
async function chargerPhrases() {
    try {
        console.log('📝 Chargement des phrases depuis JSON...');
        
        const response = await fetch('data/phrases.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mettre à jour la config
        CONFIG.phrases = data.categories;
        CONFIG.phrasesConfig = data.config;
        
        console.log('✅ Phrases chargées:', Object.keys(CONFIG.phrases).length, 'catégories');
        
        // Populer la dropdown
        populerDropdownCategories();
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des phrases:', error);
        
        // Fallback vers des phrases par défaut
        console.log('🔄 Utilisation des phrases de secours...');
        CONFIG.phrases = {
            "expressions": {
                "nom": "Expressions",
                "phrases": [
                    {
                        "id": 1,
                        "phrase": "AVOIR LE COEUR SUR LA MAIN",
                        "indice": "Qualité d'une personne généreuse",
                        "difficulte": "facile"
                    },
                    {
                        "id": 2,
                        "phrase": "TOMBER DES NUES",
                        "indice": "Être très surpris",
                        "difficulte": "facile"
                    }
                ]
            }
        };
        CONFIG.phrasesConfig = {
            "lettres_devoilees_debut": ["R", "S", "T", "L", "N", "E"],
            "prix_voyelle": 250
        };
        populerDropdownCategories();
        return false;
    }
}

function chargerNouvellePhrase(categorie = null) {
    // Choisir une phrase
    gameState.phraseActuelle = choisirPhraseAleatoire(categorie);
    
    if (!gameState.phraseActuelle) {
        console.error('❌ Impossible de charger une phrase');
        return;
    }
    
    // Reset des lettres
    gameState.lettresUtilisees.clear();
    gameState.lettresTrouvees.clear();
    
    // Nettoyer l'interface
    nettoyerInterface();
    gameState.categorieActuelle = gameState.phraseActuelle.categorie;
    
    // Reset COMPLET des lettres pour la nouvelle phrase
    gameState.lettresUtilisees.clear();
    gameState.lettresTrouvees.clear();
    
    // NETTOYER COMPLÈTEMENT le clavier (classes ET styles)
    document.querySelectorAll('.clavier-lettre').forEach(lettre => {
        // Supprimer toutes les classes d'état
        lettre.classList.remove('used', 'found', 'lettre-donnee', 'disabled', 'voyelle-achetable', 'voyelle-normale');
        
        // Reset TOUS les styles forcés
        lettre.style.background = '';
        lettre.style.color = '';
        lettre.style.border = '';
        lettre.style.cursor = '';
        lettre.style.pointerEvents = '';
        lettre.style.opacity = '';
        lettre.style.transform = '';
        
        console.log(`🧹 Lettre ${lettre.dataset.lettre} nettoyée`);
    });
    
    // Nettoyer aussi les cases de phrase
    document.querySelectorAll('.phrase-case').forEach(caseEl => {
        caseEl.classList.remove('revealed', 'donnee', 'revealing');
        caseEl.textContent = '';
    });
    
    // Générer la grille de la phrase
    genererGrillePhrase();
    
    // Révéler les lettres configurées pour cette phrase
    setTimeout(() => {
        revelerLettresPhrase();
    }, 500);
    
    console.log(`📝 Nouvelle phrase: "${gameState.phraseActuelle.phrase}"`);
    console.log(`🧹 Clavier complètement nettoyé`);
    
    updateEtatClavier();
    updateUI();
}
/**
 * Populer la dropdown des catégories
 */
function populerDropdownCategories() {
    if (!elements.categorieSelect) return;
    
    // Vider la dropdown
    elements.categorieSelect.innerHTML = '';
    
    // Ajouter une option par défaut
    const optionDefaut = document.createElement('option');
    optionDefaut.value = '';
    optionDefaut.textContent = '🎲 Catégorie aléatoire';
    elements.categorieSelect.appendChild(optionDefaut);
    
    // Ajouter les catégories
    Object.keys(CONFIG.phrases).forEach(cle => {
        const categorie = CONFIG.phrases[cle];
        const option = document.createElement('option');
        option.value = cle;
        option.textContent = `${categorie.nom} (${categorie.phrases.length})`;
        elements.categorieSelect.appendChild(option);
    });
    
    console.log('📋 Dropdown des catégories populée');
}
/**
 * Choisir une phrase aléatoire dans une catégorie
 */
function choisirPhraseAleatoire(categorie = null) {
    // Si pas de catégorie spécifiée, en choisir une au hasard
    if (!categorie) {
        const categories = Object.keys(CONFIG.phrases);
        categorie = categories[Math.floor(Math.random() * categories.length)];
    }
    
    // Vérifier que la catégorie existe
    if (!CONFIG.phrases[categorie]) {
        console.error(`❌ Catégorie ${categorie} inexistante`);
        return null;
    }
    
    const phrasesDeLaCategorie = CONFIG.phrases[categorie].phrases;
    const phraseChoisie = phrasesDeLaCategorie[Math.floor(Math.random() * phrasesDeLaCategorie.length)];
    
    console.log(`🎯 Phrase choisie: "${phraseChoisie.phrase}" (${categorie})`);
    return {
        ...phraseChoisie,
        categorie: categorie,
        nomCategorie: CONFIG.phrases[categorie].nom
    };
}

/**
 * Générer le CSS de la roue avec secteurs égaux
 */
function genererCSSRoue() {
    const secteurs = CONFIG.secteurs;
    const angleParSecteur = 360 / secteurs.length;
    
    // Construire le gradient conique avec angles égaux
    let gradientStops = [];
    
    secteurs.forEach((secteur, index) => {
        const angleDebut = index * angleParSecteur;
        const angleFin = (index + 1) * angleParSecteur;
        
        // Stocker les infos pour les labels et la détection
        secteur.angleDebut = angleDebut;
        secteur.angleFin = angleFin;
        secteur.angleCentre = angleDebut + (angleParSecteur / 2);
        
        gradientStops.push(`${secteur.couleur} ${angleDebut}deg ${angleFin}deg`);
        
        console.log(`📐 Secteur ${secteur.label}: ${angleDebut.toFixed(1)}° → ${angleFin.toFixed(1)}° (${angleParSecteur.toFixed(1)}°)`);
    });
    
    const gradientCSS = `conic-gradient(${gradientStops.join(', ')})`;
    
    // Appliquer le style
    if (elements.roueContainer) {
        elements.roueContainer.style.background = gradientCSS;
    }
    
    console.log('🎨 CSS de la roue généré avec secteurs égaux');
}

/**
 * Générer la grille de phrase dynamiquement
 */
function genererGrillePhrase() {
    if (!gameState.phraseActuelle) {
        console.error('❌ Pas de phrase actuelle pour générer la grille');
        return;
    }
    
    const phrase = gameState.phraseActuelle.phrase;
    console.log(`📝 Génération de la grille pour: "${phrase}"`);
    
    // Nettoyer les anciennes grilles
    document.querySelectorAll('.phrase-grid').forEach(grid => {
        grid.innerHTML = '';
    });
    
    // Calculer la disposition optimale
    const mots = phrase.split(' ');
    const disposition = calculerDisposition(mots);
    
    // Générer les lignes
    disposition.forEach((ligne, indexLigne) => {
        const gridElement = document.getElementById(`phrase-line-${indexLigne + 1}`);
        if (!gridElement) {
            console.warn(`⚠️ Ligne ${indexLigne + 1} introuvable dans le HTML`);
            return;
        }
        
        genererLignePhrase(gridElement, ligne, indexLigne);
    });
    
    // Stocker la grille dans l'état du jeu
    gameState.grillePhrase = disposition;
    
    console.log('✅ Grille générée:', disposition.length, 'lignes');
}

/**
 * Calculer la disposition optimale des mots sur les lignes
 */
function calculerDisposition(mots) {
    const maxColonnes = 15; // Nombre max de cases par ligne
    const lignes = [];
    let ligneActuelle = [];
    let longueurLigne = 0;
    
    mots.forEach((mot, index) => {
        const longueurMotAvecEspace = mot.length + (ligneActuelle.length > 0 ? 1 : 0); // +1 pour l'espace
        
        // Si le mot ne rentre pas sur la ligne actuelle
        if (longueurLigne + longueurMotAvecEspace > maxColonnes && ligneActuelle.length > 0) {
            // Finir la ligne actuelle
            lignes.push([...ligneActuelle]);
            ligneActuelle = [mot];
            longueurLigne = mot.length;
        } else {
            // Ajouter le mot à la ligne actuelle
            ligneActuelle.push(mot);
            longueurLigne += longueurMotAvecEspace;
        }
    });
    
    // Ajouter la dernière ligne
    if (ligneActuelle.length > 0) {
        lignes.push(ligneActuelle);
    }
    
    console.log('📐 Disposition calculée:', lignes);
    return lignes;
}

/**
 * Générer une ligne de phrase avec gestion de la ponctuation
 */
function genererLignePhrase(gridElement, mots, indexLigne) {
    const cases = [];
    
    mots.forEach((mot, indexMot) => {
        // Ajouter un espace avant le mot (sauf pour le premier)
        if (indexMot > 0) {
            const espaceCase = document.createElement('div');
            espaceCase.className = 'phrase-case space';
            gridElement.appendChild(espaceCase);
            cases.push({ type: 'space', lettre: ' ' });
        }
        
        // Traiter chaque caractère du mot
        for (let i = 0; i < mot.length; i++) {
            const caractere = mot[i];
            const caseElement = document.createElement('div');
            
            // Vérifier si c'est de la ponctuation
            const estPonctuation = /[.,;:!?'"()«»""''-]/.test(caractere);
            
            if (estPonctuation) {
                // Case de ponctuation : toujours visible
                caseElement.className = 'phrase-case ponctuation';
                caseElement.textContent = caractere; // Afficher directement
                caseElement.dataset.caractere = caractere;
                caseElement.dataset.type = 'ponctuation';
                
                console.log(`📝 Ponctuation ajoutée: "${caractere}"`);
            } else {
                // Case de lettre : à deviner
                caseElement.className = 'phrase-case';
                caseElement.dataset.lettre = caractere;
                caseElement.dataset.type = 'lettre';
                
                // Ajouter un événement de clic pour debug
                caseElement.addEventListener('click', function() {
                    console.log(`🔤 Case cliquée: "${caractere}" (ligne ${indexLigne}, pos ${cases.length})`);
                });
            }
            
            caseElement.dataset.ligne = indexLigne;
            caseElement.dataset.position = cases.length;
            
            gridElement.appendChild(caseElement);
            cases.push({ 
                type: estPonctuation ? 'ponctuation' : 'lettre', 
                caractere: caractere, 
                element: caseElement,
                revelee: estPonctuation // La ponctuation est toujours "révélée"
            });
        }
    });
    
    console.log(`📋 Ligne ${indexLigne + 1}:`, mots.join(' '), `(${cases.length} cases)`);
    return cases;
}
function ajouterLabelsRoue() {
    const secteurs = CONFIG.secteurs;
    
    // Supprimer les anciens labels
    document.querySelectorAll('.secteur-label').forEach(el => el.remove());
    
    secteurs.forEach((secteur, index) => {
        const label = document.createElement('div');
        label.className = 'secteur-label';
        
        // Texte vertical : chaque caractère sur une ligne
        const texte = secteur.label;
        const texteVertical = texte.split('').join('\n');
        label.textContent = texteVertical;
        
        // Calculer la position radiale
        const angleRad = (secteur.angleCentre * Math.PI) / 180;
        const rayon = (600 / 2) * 0.70; // Distance du centre
        const x = Math.cos(angleRad - Math.PI/2) * rayon;
        const y = Math.sin(angleRad - Math.PI/2) * rayon;
        
        // Calculer l'angle de rotation pour orientation radiale
        let rotationAngle = secteur.angleCentre;
        
        // Éviter le texte à l'envers (côté gauche)
        if (rotationAngle > 90 && rotationAngle < 270) {
            rotationAngle += 180;
        }
        
        // Styles du label - VERTICAL + RADIAL
        label.style.position = 'absolute';
        label.style.left = `calc(50% + ${x}px)`;
        label.style.top = `calc(50% + ${y}px)`;
        label.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
        label.style.color = 'white';
        label.style.fontWeight = 'bold';
        label.style.fontSize = '18px';
        label.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        label.style.pointerEvents = 'none';
        label.style.zIndex = '5';
        label.style.textAlign = 'center';
        label.style.whiteSpace = 'pre-line'; // Respecter les \n
        label.style.lineHeight = '1.0'; // Espacement entre les lettres
        label.style.letterSpacing = '1px';
        
        // Ajouter au container de la roue
        if (elements.roueContainer) {
            elements.roueContainer.appendChild(label);
        }
        
        console.log(`🏷️ Label vertical-radial ajouté: ${secteur.label} à ${secteur.angleCentre}°`);
    });
    
    console.log('✅ Tous les labels verticaux-radiaux ajoutés');
}

/**
 * Ajouter le centre vert de la roue
 */
function ajouterCentreRoue() {
    // Supprimer l'ancien centre s'il existe
    document.querySelectorAll('.roue-centre').forEach(el => el.remove());
    
    // Créer le centre
    const centre = document.createElement('div');
    centre.className = 'roue-centre';
    
    // Optionnel : Ajouter du texte
    // centre.textContent = 'RF';
    
    // Ajouter au container de la roue
    if (elements.roueContainer) {
        elements.roueContainer.appendChild(centre);
        console.log('🟢 Centre vert ajouté à la roue');
    }
}

/**
 * Génération du clavier dynamique
 */
/**
 * Initialiser le clavier BÉPO avec 2 blocs (main gauche/droite)
 */
function initClavier() {
    const clavierContainer = document.getElementById('clavier');
    if (!clavierContainer) {
        console.error('❌ Container clavier non trouvé');
        return;
    }
    
    // Layout BÉPO - Séparé main gauche / main droite
    const layoutBEPO = [
        {
            gauche: ['B', 'P', 'O'],
            droite: ['V', 'D', 'L', 'J', 'Z', 'W']
        },
        {
            gauche: ['A', 'U', 'I', 'E'],
            droite: ['C', 'T', 'S', 'R', 'N', 'M']
        },
        {
            gauche: ['Y', 'X'],
            droite: ['K', 'Q', 'G', 'H', 'F']
        }
    ];
    
    // Vider le clavier existant
    clavierContainer.innerHTML = '';
    
    // Créer les rangées
    layoutBEPO.forEach((rangee, indexRangee) => {
        // Créer le conteneur de rangée
        const rangeeEl = document.createElement('div');
        rangeeEl.className = 'clavier-rangee';
        
        // Bloc main gauche
        const blocGauche = document.createElement('div');
        blocGauche.className = 'clavier-bloc clavier-bloc-gauche';
        
        rangee.gauche.forEach((lettre) => {
            const lettreEl = creerLettreElement(lettre);
            blocGauche.appendChild(lettreEl);
        });
        
        // Espace entre les blocs
        const espaceur = document.createElement('div');
        espaceur.className = 'clavier-espaceur';
        
        // Bloc main droite
        const blocDroite = document.createElement('div');
        blocDroite.className = 'clavier-bloc clavier-bloc-droite';
        
        rangee.droite.forEach((lettre) => {
            const lettreEl = creerLettreElement(lettre);
            blocDroite.appendChild(lettreEl);
        });
        
        // Assembler la rangée
        rangeeEl.appendChild(blocGauche);
        rangeeEl.appendChild(espaceur);
        rangeeEl.appendChild(blocDroite);
        
        clavierContainer.appendChild(rangeeEl);
    });
    
    console.log('⌨️ Clavier BÉPO 2 blocs initialisé');
}

/**
 * Créer un élément lettre
 */
function creerLettreElement(lettre) {
    const lettreEl = document.createElement('div');
    lettreEl.className = 'clavier-lettre';
    lettreEl.dataset.lettre = lettre;
    lettreEl.textContent = lettre;
    
    // Déterminer si c'est une voyelle
    if (CONFIG.voyelles.includes(lettre)) {
        lettreEl.classList.add('voyelle-normale');
    }
    
    // Event listener
    lettreEl.addEventListener('click', function() {
        handleLettreClick(lettre);
    });
    
    return lettreEl;
}
/**
 * Initialisation des gestionnaires d'événements
 */
function initEventListeners() {
    // Bouton rotation roue
    if (elements.spinBtn) {
        elements.spinBtn.addEventListener('click', faireTournerRoue);
    }
    
    // Boutons d'action
    if (elements.nouvellePartieBtn) {
        elements.nouvellePartieBtn.addEventListener('click', nouvellePartie);
    }
    
    if (elements.acheterVoyelleBtn) {
        elements.acheterVoyelleBtn.addEventListener('click', function() {
            if (gameState.modeJeu === 'achat-voyelle') {
                // Annuler le mode achat
                annulerAchatVoyelle();
            } else {
                // Activer le mode achat
                acheterVoyelle();
            }
        });
    }   
    if (elements.proposerMotBtn) {
        elements.proposerMotBtn.addEventListener('click', proposerSolution);
    }
    if (elements.categorieSelect) {
        elements.categorieSelect.addEventListener('change', function() {
            const categorieChoisie = this.value;
            console.log('📂 Catégorie sélectionnée:', categorieChoisie || 'aléatoire');
            
            // Charger une nouvelle phrase de cette catégorie
            chargerNouvellePhrase(categorieChoisie || null);
        });
    }
    // Support clavier physique
    document.addEventListener('keypress', function(e) {
        const lettre = e.key.toUpperCase();
        if (CONFIG.alphabet.includes(lettre)) {
            handleLettreClick(lettre);
        }
    });
    
    // Clic sur la roue pour la faire tourner
    if (elements.roueContainer) {
        elements.roueContainer.addEventListener('click', faireTournerRoue);
    }

    // Bouton triche
    if (elements.tricheBtn) {
        elements.tricheBtn.addEventListener('click', activerTriche);
    }

}

/**
 * Gestion des clics sur les lettres avec calcul des points
 */
function handleLettreClick(lettre) {
    console.log(`🔤 Lettre sélectionnée: ${lettre}`);
    
    // Vérifier si la lettre n'a pas déjà été utilisée
    if (gameState.lettresUtilisees.has(lettre)) {
        console.log('⚠️ Lettre déjà utilisée');
        return;
    }
    
    // Vérifier si on peut jouer (pas après banqueroute/passe ton tour)
    if (!gameState.dernierResultatRoue && gameState.modeJeu === 'normal') {
        alert('🎡 Vous devez d\'abord faire tourner la roue !');
        return;
    }
    
    // Gestion du mode achat voyelle
    let coutVoyelle = 0;
    if (gameState.modeJeu === 'achat-voyelle') {
        if (!CONFIG.voyelles.includes(lettre)) {
            alert('Vous devez choisir une voyelle !');
            return;
        }
        coutVoyelle = CONFIG.phrasesConfig?.prix_voyelle || 250;
        if (gameState.scoreManche < coutVoyelle) {
            alert(`Score insuffisant ! Il faut au moins ${coutVoyelle}F pour acheter une voyelle.`);
            return;
        }
        gameState.scoreManche -= coutVoyelle;
        gameState.modeJeu = 'normal';
        console.log(`💳 Voyelle achetée pour ${coutVoyelle}F`);
    }
    
    // Marquer la lettre comme utilisée
    gameState.lettresUtilisees.add(lettre);
    
    // Mettre à jour l'affichage de la lettre dans le clavier
    const lettreEl = document.querySelector(`[data-lettre="${lettre}"]`);
    if (lettreEl) {
        lettreEl.classList.add('used');
    }
    
    // Vérifier si la lettre est dans la phrase
    const casesTouvees = revelerLettresDansGrille(lettre);
    
    if (casesTouvees.length > 0) {
        // Lettre trouvée !
        gameState.lettresTrouvees.add(lettre);
        
        if (lettreEl) {
            lettreEl.classList.remove('used');
            lettreEl.classList.add('found');
        }
        
        // Calculer les points
        let pointsGagnes = 0;
        if (coutVoyelle > 0) {
            // Voyelle achetée : pas de points supplémentaires
            console.log(`✅ Voyelle trouvée: ${lettre} (${casesTouvees.length} occurrences) - Payée ${coutVoyelle}F`);
        } else if (gameState.dernierResultatRoue && gameState.dernierResultatRoue.valeur > 0) {
            // Points selon la roue
            pointsGagnes = casesTouvees.length * gameState.dernierResultatRoue.valeur;
            gameState.scoreManche += pointsGagnes;
            console.log(`✅ Lettre trouvée: ${lettre} (${casesTouvees.length} × ${gameState.dernierResultatRoue.valeur}F = +${pointsGagnes}F)`);
        } else {
            console.log(`✅ Lettre trouvée: ${lettre} (${casesTouvees.length} occurrences) - Aucun point (pas de roue active)`);
        }
        
        // Afficher les points gagnés
        if (pointsGagnes > 0) {
            afficherPointsGagnes(pointsGagnes);
        }
        
        // Reset du résultat de roue (il faut retourner pour la prochaine lettre)
        gameState.dernierResultatRoue = null;
        
    } else {
        console.log(`❌ Lettre non trouvée: ${lettre}`);
        
        // Reset du résultat de roue même si pas trouvée
        gameState.dernierResultatRoue = null;
        
        // TODO: Changer de joueur en mode multijoueur
    }
    
    // Vérifier si la phrase est complète
    verifierPhraseComplete();
    
    updateUI();
}

/**
 * Afficher les points gagnés avec une animation
 */
function afficherPointsGagnes(points) {
    // Créer un élément temporaire pour l'animation
    const pointsEl = document.createElement('div');
    pointsEl.textContent = `+${points}F`;
    pointsEl.style.position = 'fixed';
    pointsEl.style.top = '50%';
    pointsEl.style.left = '50%';
    pointsEl.style.transform = 'translate(-50%, -50%)';
    pointsEl.style.fontSize = '24px';
    pointsEl.style.fontWeight = 'bold';
    pointsEl.style.color = '#4CAF50';
    pointsEl.style.zIndex = '1000';
    pointsEl.style.pointerEvents = 'none';
    pointsEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    pointsEl.style.animation = 'fadeInUp 2s ease-out forwards';
    
    document.body.appendChild(pointsEl);
    
    // Supprimer après l'animation
    setTimeout(() => {
        if (pointsEl.parentNode) {
            pointsEl.parentNode.removeChild(pointsEl);
        }
    }, 2000);
}
/**
 * Gestion des clics sur les lettres avec vérifications strictes
 */
function handleLettreClick(lettre) {
    console.log(`🔤 Lettre sélectionnée: ${lettre}`);
    
    // Vérifier si la lettre n'a pas déjà été utilisée OU trouvée
    if (gameState.lettresUtilisees.has(lettre)) {
        console.log('⚠️ Lettre déjà utilisée');
        showMessage('Cette lettre a déjà été utilisée !', 'warning');
        return;
    }
    
    if (gameState.lettresTrouvees.has(lettre)) {
        console.log('⚠️ Lettre déjà révélée');
        showMessage('Cette lettre est déjà révélée !', 'info');
        return;
    }
  
    // Vérifications selon le mode de jeu
    if (gameState.modeJeu === 'achat-voyelle') {
        // Mode achat voyelle
        if (!CONFIG.voyelles.includes(lettre)) {
            showMessage('Vous devez choisir une voyelle (A, E, I, O, U, Y) !', 'error');
            return;
        }
        
        const coutVoyelle = CONFIG.phrasesConfig?.prix_voyelle || 250;
        if (gameState.scoreManche < coutVoyelle) {
            showMessage(`Argent insuffisant ! Il vous faut ${coutVoyelle}F (vous avez ${gameState.scoreManche}F)`, 'error');
            gameState.modeJeu = 'normal'; // Sortir du mode achat
            updateBoutonVoyelle();
            return;
        }
        
        // Acheter la voyelle
        gameState.scoreManche -= coutVoyelle;
        gameState.modeJeu = 'normal';
        console.log(`💳 Voyelle achetée pour ${coutVoyelle}F`);
        
    } else {
        // Mode normal : il faut avoir tourné la roue
        if (!gameState.dernierResultatRoue) {
            showMessage('🎡 Vous devez d\'abord faire tourner la roue !', 'info');
            return;
        }
        
        // Vérifier si c'est une voyelle (interdite en mode normal)
        if (CONFIG.voyelles.includes(lettre)) {
            showMessage('Les voyelles doivent être achetées ! Utilisez le bouton "Acheter Voyelle".', 'warning');
            return;
        }
    }
    
    // Le reste du code reste pareil...
    processLettre(lettre);
}

/**
 * Traiter la lettre une fois toutes les vérifications passées
 */
function processLettre(lettre) {
    // Marquer la lettre comme utilisée
    gameState.lettresUtilisees.add(lettre);
    
    // Mettre à jour l'affichage de la lettre dans le clavier
    const lettreEl = document.querySelector(`[data-lettre="${lettre}"]`);
    if (lettreEl) {
        lettreEl.classList.add('used');
    }
    
    // Vérifier si la lettre est dans la phrase
    const casesTouvees = revelerLettresDansGrille(lettre);
    
    if (casesTouvees.length > 0) {
        // Lettre trouvée !
        gameState.lettresTrouvees.add(lettre);

         // Mettre à jour le CLAVIER
        const lettreClavier = document.querySelector(`#clavier [data-lettre="${lettre}"]`);
        if (lettreClavier) {
            lettreClavier.classList.remove('used');
            lettreClavier.classList.add('found');
            
            // Style bleu pour lettre trouvée dans le CLAVIER
            lettreClavier.style.background = '#2196F3';
            lettreClavier.style.color = 'white';
            lettreClavier.style.border = '3px solid #1976D2';
            lettreClavier.style.cursor = 'not-allowed';
            lettreClavier.style.pointerEvents = 'none';
        }
        
        if (lettreEl) {
            lettreEl.classList.remove('used');
            lettreEl.classList.add('found');
        }
        
        // Calculer les points
        let pointsGagnes = 0;
        const estVoyelleAchetee = CONFIG.voyelles.includes(lettre);
        
        if (!estVoyelleAchetee && gameState.dernierResultatRoue && gameState.dernierResultatRoue.valeur > 0) {
            // Consonne : points selon la roue
            pointsGagnes = casesTouvees.length * gameState.dernierResultatRoue.valeur;
            gameState.scoreManche += pointsGagnes;
            showMessage(`✅ ${lettre} trouvée ! +${pointsGagnes}F (${casesTouvees.length} × ${gameState.dernierResultatRoue.valeur}F)`, 'success');
            afficherPointsGagnes(pointsGagnes);
        } else if (estVoyelleAchetee) {
            showMessage(`✅ Voyelle ${lettre} trouvée ! (${casesTouvees.length} occurrences)`, 'success');
        }
        
        // Reset du résultat de roue
        gameState.dernierResultatRoue = null;
        
    } else {
        showMessage(`❌ La lettre ${lettre} n'est pas dans la phrase.`, 'error');
        gameState.dernierResultatRoue = null;
    }
    
    // Vérifier si la phrase est complète
    // Sortir du mode achat si une voyelle a été achetée
    if (gameState.modeJeu === 'achat-voyelle') {
        gameState.modeJeu = 'normal';
    }
    
    updateEtatClavier(); // Nouveau
    verifierPhraseComplete();
    updateUI();
}

/**
 * Afficher un message à l'utilisateur
 */
function showMessage(message, type = 'info') {
    // Créer un toast message
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Styles
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '5px';
    toast.style.color = 'white';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '1000';
    toast.style.maxWidth = '300px';
    toast.style.animation = 'slideIn 0.3s ease-out';
    
    // Couleurs selon le type
    switch(type) {
        case 'success': toast.style.background = '#4CAF50'; break;
        case 'error': toast.style.background = '#f44336'; break;
        case 'warning': toast.style.background = '#FF9800'; break;
        default: toast.style.background = '#2196F3'; break;
    }
    
    document.body.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
}
/**
 * Révéler toutes les occurrences d'une lettre dans la grille (ignore la ponctuation)
 */
function revelerLettresDansGrille(lettre, estDonnee = false) {
    const casesTouvees = [];
    
    // Parcourir seulement les cases de lettres (pas la ponctuation)
    document.querySelectorAll('.phrase-case[data-lettre]').forEach(caseElement => {
        const lettreDeLaCase = caseElement.dataset.lettre;
        
        if (lettreDeLaCase === lettre) {
            // Révéler cette case
            caseElement.textContent = lettre;
            
            if (estDonnee) {
                // Lettre donnée : style vert avec bordure dorée
                caseElement.classList.add('donnee');
                caseElement.classList.add('revealed');
                console.log(`🎁 Case dorée: ${lettre}`);
            } else {
                // Lettre trouvée : style vert normal
                caseElement.classList.add('revealed');
                caseElement.classList.add('revealing'); // Animation
                console.log(`✅ Case verte: ${lettre}`);
                
                // Retirer l'animation après un délai
                setTimeout(() => {
                    caseElement.classList.remove('revealing');
                }, 500);
            }
            
            casesTouvees.push(caseElement);
        }
    });
    
    return casesTouvees;
}
/**
 * Vérifier si toutes les LETTRES sont révélées (ignore la ponctuation)
 */
function verifierPhraseComplete() {
    const totalLettres = document.querySelectorAll('.phrase-case[data-lettre]').length;
    const lettresRevelees = document.querySelectorAll('.phrase-case[data-lettre].revealed').length;
    
    console.log(`📊 Progression: ${lettresRevelees}/${totalLettres} lettres révélées`);
    
    if (lettresRevelees === totalLettres) {
        console.log('🎉 PHRASE COMPLÈTE !');
        
        // Bonus pour phrase complète
        const bonus = CONFIG.phrasesConfig?.bonus_solution_complete || 1000;
        gameState.scoreManche += bonus;
        gameState.scoreTotal += gameState.scoreManche;
        
        // Sauvegarder dans l'historique
        gameState.historiqueScores.push({
            phrase: gameState.phraseActuelle.phrase,
            categorie: gameState.phraseActuelle.nomCategorie,
            score: gameState.scoreManche,
            date: new Date().toLocaleString()
        });
        
        setTimeout(() => {
            alert(`🎉 BRAVO ! Phrase complète !
            
Phrase: "${gameState.phraseActuelle.phrase}"
Score de la manche: ${gameState.scoreManche}F
Bonus phrase complète: +${bonus}F
Score total: ${gameState.scoreTotal}F`);
            
            if (confirm('Voulez-vous jouer une nouvelle phrase ?')) {
                nouvellePartie();
            }
        }, 1000);
    }
}

/**
 * Activer la triche - Révéler une lettre aléatoire valide
 */
function activerTriche() {
    if (!gameState.phraseActuelle) {
        showMessage('Il faut d\'abord charger une phrase !', 'warning');
        return;
    }
    
    // Trouver les lettres disponibles dans la phrase
    const lettresDisponibles = [];
    const phraseNettoyee = gameState.phraseActuelle.phrase.replace(/[^A-Z]/g, '');
    
    for (let lettre of phraseNettoyee) {
        if (!gameState.lettresTrouvees.has(lettre) && 
            !gameState.lettresUtilisees.has(lettre) && 
            !lettresDisponibles.includes(lettre)) {
            lettresDisponibles.push(lettre);
        }
    }
    
    if (lettresDisponibles.length === 0) {
        afficherMessageTriche("Tu as déjà tout trouvé ! Pas besoin de tricher... 🤨");
        return;
    }
    
    // Choisir une lettre aléatoire
    const lettreTriche = lettresDisponibles[Math.floor(Math.random() * lettresDisponibles.length)];
    
/*     // Messages sarcastiques aléatoires
    const messages = [
        "Tu pues !",
        "T'es Naze !",
        "Tricheur va !",
        "Même pas honte ?",
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    */
    // Afficher le message de triche
    // afficherMessageTriche(message);
    
    // Révéler la lettre après un petit délai
    setTimeout(() => {
        console.log(`🔮 TRICHE: Révélation de la lettre ${lettreTriche}`);
        
        // Simuler un clic normal sur la lettre
        gameState.dernierResultatRoue = { valeur: 0, label: "Triche" }; // Pas de points pour la triche
        processLettre(lettreTriche);
        
        // Marquer comme utilisée mais pas de points
        showMessage(`🔮 Lettre trichée: ${lettreTriche} (0 points, évidemment !)`, 'info');
        
    }, 2000); 
    afficherMessageModal('triche' ,`🔮 Lettre trichée: ${lettreTriche} (0 points, évidemment !)`);
}

/**
 * Afficher un message de triche stylé
 */
/**
 * Afficher un message de triche avec GIF animé
 */
function afficherMessageTriche(message) {
    // Créer le message
    const messageEl = document.createElement('div');
    messageEl.className = 'message-triche';
    
    // URLs de GIFs pour la triche (exemples)
// URLs de GIFs locaux
const gifsTriche = [
    'assets/triche/gif01.gif',
    'assets/triche/gif02.gif'
];
    
    const gifAleatoire = gifsTriche[Math.floor(Math.random() * gifsTriche.length)];
    
    messageEl.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 15px;">🔮 TRICHE ACTIVÉE 🔮</div>
        
        <div style="margin: 15px 0;">
            <img src="${gifAleatoire}" 
                 alt="Triche GIF" 
                 style="width: 200px; height: 150px; border-radius: 10px; object-fit: cover;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; font-size: 48px;">😈</div>
        </div>
        
        <div style="font-size: 16px; margin-bottom: 10px;">${message}</div>
        
        <div style="font-size: 14px; margin-top: 15px; opacity: 0.8;">
            (Une lettre va être révélée dans 2 secondes...)
        </div>
    `;
    
    document.body.appendChild(messageEl);
    
    // Supprimer après 4 secondes avec animation
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'tricheDisappear 0.5s ease-out forwards';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 500);
        }
    }, 4000);
}

/**
 * Faire tourner la roue avec rotation aléatoire puis lecture de la position CSS réelle
 */
function faireTournerRoue() {
    console.log('🎡 Rotation de la roue...');
    
    // Désactiver le bouton pendant la rotation
    if (elements.spinBtn) {
        elements.spinBtn.disabled = true;
        elements.spinBtn.textContent = 'Rotation...';
    }
    
    // RESET : Remettre la roue à 0°
    if (elements.roueContainer) {
        elements.roueContainer.style.transition = 'none';
        elements.roueContainer.style.transform = 'rotate(0deg)';
    }
    
    // Petit délai pour que le reset soit appliqué
    setTimeout(() => {
        // Paramètres simples
        const dureeRotation = Math.random() * 5000 + 5000; // Entre 5 et 10 secondes
        const tours = Math.random() * 7 + 8; // Entre 8 et 15 tours
        const positionFinale = Math.random() * 360; // Position finale entre 0° et 360°
        
        const rotationTotale = (tours * 360) + positionFinale;
        
        console.log(`🔄 ${tours.toFixed(1)} tours → Position finale théorique: ${positionFinale.toFixed(1)}°`);
        console.log(`⏱️ Durée: ${(dureeRotation/1000).toFixed(1)}s`);
        
        // Animation
        if (elements.roueContainer) {
            elements.roueContainer.style.transition = `transform ${dureeRotation}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
            elements.roueContainer.style.transform = `rotate(${rotationTotale}deg)`;
        }
        
        // Fin d'animation
        setTimeout(() => {
            // 🔧 CORRECTION : Lire la position CSS réelle
            const positionReelle = lirePositionCSS();
            console.log(`🎯 Position CSS réelle: ${positionReelle.toFixed(1)}°`);
            
            const secteurGagnant = trouverSecteurAPosition(positionReelle);
            
            if (elements.roueResultat) {
                elements.roueResultat.textContent = secteurGagnant.label;
            }
            
            traiterResultatRoue(secteurGagnant);
            
            if (elements.spinBtn) {
                elements.spinBtn.disabled = false;
                elements.spinBtn.textContent = 'Faire tourner la roue';
            }
            
            console.log(`🎯 Secteur gagnant: ${secteurGagnant.label} (${secteurGagnant.valeur}F)`);
        }, dureeRotation);
        
    }, 50);
}

/**
 * Lire la position réelle de la roue depuis le CSS transform
 */
function lirePositionCSS() {
    const roue = document.querySelector('.roue-container');
    const transform = window.getComputedStyle(roue).transform;
    
    if (transform === 'none') {
        return 0;
    }
    
    try {
        // Extraire l'angle de la matrice de transformation
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            const a = parseFloat(values[0]);
            const b = parseFloat(values[1]);
            const angleRadians = Math.atan2(b, a);
            const angleDegres = angleRadians * (180 / Math.PI);
            
            // Normaliser entre 0 et 360
            return ((angleDegres % 360) + 360) % 360;
        }
    } catch (error) {
        console.error('❌ Erreur lecture position CSS:', error);
    }
    
    return 0;
}

/**
 * Trouver le secteur correspondant à un angle donné
 */
function trouverSecteurAPosition(angle) {
    // Normaliser l'angle
    let angleNormalise = ((angle % 360) + 360) % 360;
    
    console.log(`🔍 Recherche secteur pour angle: ${angleNormalise.toFixed(1)}°`);
    
    // Le pointeur est en haut (0°), donc on doit ajuster selon la direction de rotation
    // Si la roue tourne dans le sens horaire, inverser l'angle
    let anglePointeur = (360 - angleNormalise) % 360;
    
    console.log(`👆 Le pointeur pointe sur: ${anglePointeur.toFixed(1)}°`);
    
    // Trouver le secteur correspondant
    for (let secteur of CONFIG.secteurs) {
        if (anglePointeur >= secteur.angleDebut && anglePointeur < secteur.angleFin) {
            console.log(`✅ Secteur trouvé: ${secteur.label} (${secteur.angleDebut}° - ${secteur.angleFin}°)`);
            return secteur;
        }
    }
    
    // Fallback pour les angles limites (360° = 0°)
    console.log(`⚠️ Aucun secteur trouvé, utiliser le premier secteur`);
    return CONFIG.secteurs[0];
}


/**
 * Afficher un message modal stylé et animé avec messages aléatoires (sans emojis)
 * @param {string} type - Type de message: 'triche', 'banqueroute', 'passe', 'jackpot', 'success', 'error'
 * @param {string} message - Message personnalisé (optionnel, sinon message aléatoire)
 * @param {number} duree - Durée d'affichage en ms (défaut: 4000)
 */
function afficherMessageModal(type, message = null, duree = 4000) {
    // Configuration par type avec messages aléatoires
    const configs = {
        triche: {
            titre: 'TRICHE ACTIVÉE',
            couleurs: ['#9C27B0', '#673AB7'],
            gifs: [
                './assets/triche/gif01.gif',
                './assets/triche/gif02.gif'
            ],
            messagesAleatoires: [
                "Tu pues !",
                "T'es Naze !"
            ]
        },
        banqueroute: {
            titre: 'BANQUEROUTE !',
            couleurs: ['#f44336', '#d32f2f'],
            gifs: [
                './assets/banqueroute/not-stonks-meme.jpg'
            ],
            messagesAleatoires: [
                "My heart will go on... mais pas votre argent !"
            ]
        },
        passe: {
            titre: 'PASSE TON TOUR',
            couleurs: ['#FF9800', '#F57C00'],
            gifs: [
                './assets/passe/missed.gif'
            ],
            messagesAleatoires: [
                "Cheh !"
            ]
        },
        relance: {
            titre: 'RELANCEZ LA ROULETTE',
            couleurs: ['#00ff15ff', '#00d0f5ff'],
            gifs: [
                './assets/relance/cat.jpg'
            ],
            messagesAleatoires: [
                "As-tu déjà vu ce chat ?"
            ]
        },
        success: {
            titre: 'VIENS ICI VILAIN GARCON !',
            couleurs: ['#4CAF50', '#388E3C'],
            gifs: [
                './assets/success/christophe.gif'
            ],
            messagesAleatoires: [
                "Excellent travail ! Vous maîtrisez !"
            ]
        },
        error: {
            titre: 'ERREUR',
            couleurs: ['#f44336', '#d32f2f'],
            gifs: [],
            messagesAleatoires: [
                "Oups ! Quelque chose a mal tourné !",
                "Erreur dans la matrice !",
                "Bug détecté ! Veuillez réessayer !",
                "Houston, nous avons un problème !",
                "Erreur 404 : Chance non trouvée !",
                "Système en panne ! Maintenance requise !",
                "Plantage critique ! Redémarrage nécessaire !",
                "Quelque chose cloche dans le royaume !"
            ]
        }
    };
     const config = configs[type] || configs.error;
    const messageFinal = message || config.messagesAleatoires[Math.floor(Math.random() * config.messagesAleatoires.length)];
    
    // Choisir le média
    const mediaTypes = config.gifs.length > 0 ? ['gif', 'texte'] : ['texte'];
    const typeMedia = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    
    if (typeMedia === 'gif' && config.gifs.length > 0) {
        const gif = config.gifs[Math.floor(Math.random() * config.gifs.length)];
        
        // ✨ PRÉCHARGER L'IMAGE AVANT D'AFFICHER LE MODAL
        const img = new Image();
        
        img.onload = () => {
            // Image chargée ✅ → Afficher le modal
            creerEtAfficherModal(config, messageFinal, type, duree, img.src);
        };
        
        img.onerror = () => {
            // Image pas chargée ❌ → Afficher modal avec texte
            creerEtAfficherModal(config, messageFinal, type, duree, null);
        };
        
        // Timeout si l'image met trop de temps
        setTimeout(() => {
            if (!img.complete) {
                console.log('⏰ Image timeout, affichage sans image');
                creerEtAfficherModal(config, messageFinal, type, duree, null);
            }
        }, 3000); // 3 secondes max pour charger
        
        img.src = gif;
    } else {
        // Pas de gif → Afficher directement
        creerEtAfficherModal(config, messageFinal, type, duree, null);
    }
}

function creerEtAfficherModal(config, messageFinal, type, duree, imageSrc) {
    const messageEl = document.createElement('div');
    messageEl.className = `message-modal message-${type}`;
    
    let contenuMedia = '';
    if (imageSrc) {
        // Image préchargée ✅
        contenuMedia = `
            <img src="${imageSrc}" 
                 alt="${type} GIF" 
                 style="width: 320px; height: 240px; border-radius: 10px; object-fit: cover;">
        `;
    } else {
        // Texte de fallback
        const textesStyles = {
            triche: 'CHEAT MODE',
            banqueroute: 'BANKRUPT',
            passe: 'SKIP TURN',
            relance: 'SPIN AGAIN',
            success: 'SUCCESS',
            error: 'ERROR'
        };
        
        contenuMedia = `
            <div style="font-size: 50px; font-weight: bold; color: rgba(255,255,255,0.9); 
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5); animation: bounce 1s infinite;">
                ${textesStyles[type] || type.toUpperCase()}
            </div>
        `;
    }
    
    // Le reste de ton code pour construire le modal...
    messageEl.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 15px; animation: glow 1s infinite alternate; 
                    font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
            ${config.titre}
        </div>
        <div style="margin: 15px 0;">
            ${contenuMedia}
        </div>
        <div style="font-size: 18px; margin: 15px 0; line-height: 1.4;">
            ${messageFinal}
        </div>
    `;
    
    messageEl.style.background = `linear-gradient(135deg, ${config.couleurs[0]}, ${config.couleurs[1]})`;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'modalDisappear 0.5s ease-out forwards';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 500);
        }
    }, duree);
}

javascript/**
 * Précharger les images pour éviter les échecs de chargement
 */
function prechargerImages() {
    const imagesAPrecharger = [
        './assets/triche/evil.gif',
        './assets/triche/sneaky.gif',
        './assets/banqueroute/boom.gif',
        './assets/banqueroute/explosion.gif',
        './assets/passe/skip.gif',
        './assets/jackpot/celebration.gif',
        './assets/success/win.gif'
        // Ajoute tes autres GIFs ici
    ];
    
    imagesAPrecharger.forEach(url => {
        const img = new Image();
        img.src = url;
        console.log(`📥 Préchargement: ${url}`);
    });
    
    console.log('🖼️ Préchargement des images lancé');
}


/**
 * Traiter le résultat de la roue
 */
/**
 * Traiter le résultat de la roue
 */
function traiterResultatRoue(secteur) {
    // Stocker le résultat pour le calcul des points
    gameState.dernierResultatRoue = secteur;
    
    switch (secteur.valeur) {
        case 0: // Banqueroute
            gameState.scoreManche = 0;
            gameState.dernierResultatRoue = null; // Pas de points possibles
            afficherMessageModal('banqueroute');
            break;
            
        case -1: // Passe ton tour
            gameState.dernierResultatRoue = null; // Pas de points possibles
            afficherMessageModal('passe');
            break;
        
            case -2: // Relancer la roue
            gameState.dernierResultatRoue = null; // Pas de points possibles
            afficherMessageModal('relance');
            break;
            
        default: // Points normaux
            console.log(`💰 Multiplicateur actif: ${secteur.valeur}F par lettre trouvée`);
            // Les points seront calculés quand une lettre sera trouvée
            break;
    }
    
    updateUI();
}
/**
 * Acheter une voyelle - Mode achat activé
 */
function acheterVoyelle() {
    const prixVoyelle = CONFIG.phrasesConfig?.prix_voyelle || 250;
    
    if (gameState.scoreManche < prixVoyelle) {
        showMessage(`Argent insuffisant ! Il vous faut ${prixVoyelle}F (vous avez ${gameState.scoreManche}F)`, 'error');
        return;
    }
    
    // Activer le mode achat voyelle
    gameState.modeJeu = 'achat-voyelle';
    
    // Mettre à jour le clavier visuellement
    updateEtatClavier();
    
    // Changer le texte du bouton
    if (elements.acheterVoyelleBtn) {
        elements.acheterVoyelleBtn.textContent = 'Annuler achat voyelle';
        elements.acheterVoyelleBtn.style.background = '#FF9800';
    }
    
    showMessage(`✨ Mode achat voyelle activé ! Choisissez une voyelle dorée (${prixVoyelle}F)`, 'info');
    console.log('💳 Mode achat de voyelle activé - voyelles bling bling !');
}

/**
 * Annuler le mode achat voyelle
 */
function annulerAchatVoyelle() {
    gameState.modeJeu = 'normal';
    updateEtatClavier();
    updateBoutonVoyelle();
    showMessage('❌ Achat de voyelle annulé', 'warning');
    console.log('🚫 Mode achat voyelle annulé');
}

/**
 * Révéler toute la phrase d'un coup
 */
function revelerTouteLaPhrase() {
    document.querySelectorAll('.phrase-case[data-lettre]').forEach(caseEl => {
        if (!caseEl.classList.contains('space') && !caseEl.classList.contains('ponctuation')) {
            const lettre = caseEl.dataset.lettre;
            caseEl.textContent = lettre;
            caseEl.classList.add('revealed');
            caseEl.classList.add('revealing');
            
            // Animation décalée pour un effet cascade
            setTimeout(() => {
                caseEl.classList.remove('revealing');
            }, Math.random() * 1000);
        }
    });
}


/**
 * Normaliser une chaîne pour la comparaison flexible
 */
function normaliserTexte(texte) {
    return texte
        .toUpperCase()
        .normalize('NFD') // Décomposer les accents
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^A-Z0-9\s]/g, '') // Garder lettres, chiffres et espaces
        .replace(/\s+/g, ' ') // Normaliser les espaces multiples
        .trim();
}

/**
 * Validation ultra-flexible avec scoring
 */
function validerSolutionFlexible(proposition, solution) {
    const propositionNormalisee = normaliserTexte(proposition);
    const solutionNormalisee = normaliserTexte(solution);
    
    console.log(`🔧 Proposition: "${proposition}" → "${propositionNormalisee}"`);
    console.log(`🎯 Solution: "${solution}" → "${solutionNormalisee}"`);
    
    // Validation exacte d'abord
    if (propositionNormalisee === solutionNormalisee) {
        return { valide: true, score: 100, raison: 'Parfait !' };
    }
    
    // Validation par mots principaux
    const motsSolution = solutionNormalisee.split(' ').filter(mot => mot.length > 2);
    const motsProposition = propositionNormalisee.split(' ').filter(mot => mot.length > 2);
    
    if (motsSolution.length > 0) {
        let motsCorrects = 0;
        
        motsSolution.forEach(motSol => {
            const trouve = motsProposition.some(motProp => {
                // Correspondance exacte
                if (motProp === motSol) return true;
                // Correspondance partielle (min 80% du mot)
                if (motProp.length >= 3 && motSol.length >= 3) {
                    const seuil = Math.min(motProp.length, motSol.length) * 0.8;
                    let correspondances = 0;
                    for (let i = 0; i < Math.min(motProp.length, motSol.length); i++) {
                        if (motProp[i] === motSol[i]) correspondances++;
                    }
                    return correspondances >= seuil;
                }
                return false;
            });
            
            if (trouve) motsCorrects++;
        });
        
        const pourcentage = Math.round((motsCorrects / motsSolution.length) * 100);
        
        console.log(`📊 Mots corrects: ${motsCorrects}/${motsSolution.length} = ${pourcentage}%`);
        
        // Accepter si 75% des mots principaux sont corrects
        if (pourcentage >= 75) {
            return { 
                valide: true, 
                score: pourcentage, 
                raison: `${motsCorrects}/${motsSolution.length} mots corrects` 
            };
        }
    }
    
    // Validation par similarité globale (fallback)
    const similarite = calculerSimilariteAvancee(propositionNormalisee, solutionNormalisee);
    
    return { 
        valide: false, 
        score: similarite, 
        raison: `Seulement ${similarite}% de similarité` 
    };
}

/**
 * Calcul de similarité avancé (Levenshtein simplifié)
 */
function calculerSimilariteAvancee(str1, str2) {
    if (str1 === str2) return 100;
    
    const longueurMax = Math.max(str1.length, str2.length);
    if (longueurMax === 0) return 100;
    
    // Calcul simple de distance
    let distance = 0;
    const longueurMin = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < longueurMin; i++) {
        if (str1[i] !== str2[i]) distance++;
    }
    
    distance += Math.abs(str1.length - str2.length);
    
    const similarite = Math.max(0, 100 - (distance / longueurMax * 100));
    return Math.round(similarite);
}

/**
 * Proposer solution avec validation ultra-flexible
 */
function proposerSolution() {
    if (!gameState.phraseActuelle) {
        console.log('❌ Aucune phrase active');
        return;
    }
    
    const phraseComplete = gameState.phraseActuelle.phrase;
    
    const proposition = prompt(`🎯 PROPOSER LA SOLUTION\n\nCatégorie: ${gameState.phraseActuelle.categorie}\nIndice: ${gameState.phraseActuelle.indice}\n\n⚡ VALIDATION FLEXIBLE ⚡\n✅ Ponctuation ignorée\n✅ Accents ignorés\n✅ Fautes mineures acceptées\n✅ Mots partiels OK\n\nQuelle est votre solution ?`);
    
    if (!proposition) {
        console.log('🚫 Proposition annulée');
        return;
    }
    
    const resultat = validerSolutionFlexible(proposition, phraseComplete);
    
    console.log(`📊 Résultat validation:`, resultat);
    
    if (resultat.valide) {
        // SOLUTION ACCEPTÉE !
        let bonus = 1000;
        
        // Bonus ajusté selon le score
        if (resultat.score < 100) {
            bonus = Math.round(bonus * Math.max(0.7, resultat.score / 100));
        }
        
        gameState.scoreManche += bonus;
        gameState.scoreTotal += gameState.scoreManche;
        
        // Révéler toute la phrase avec animation
        revelerTouteLaPhrase();
        
        afficherMessageModal('success', 
            `SOLUTION ACCEPTÉE !\n${resultat.raison}\n\n"${phraseComplete}"\n\nVotre réponse:\n"${proposition}"\n\nScore manche: ${gameState.scoreManche} F\nBonus solution: +${bonus} F\nScore total: ${gameState.scoreTotal} F`
        , 6000);
        
        // Nouvelle manche
        setTimeout(() => {
            nouvelleManche();
        }, 6500);
        
    } else {
        // SOLUTION REFUSÉE
        const penalite = Math.min(500, gameState.scoreManche);
        gameState.scoreManche = Math.max(0, gameState.scoreManche - penalite);
        
        let encouragement = '';
        if (resultat.score > 60) {
            encouragement = 'Vous y étiez presque ! Continuez !';
        } else if (resultat.score > 30) {
            encouragement = 'Pas mal, mais pas assez proche !';
        } else {
            encouragement = 'Complètement à côté de la plaque !';
        }
        
        afficherMessageModal('error', 
            `SOLUTION REFUSÉE !\n${resultat.raison}\n\n${encouragement}\n\nVotre réponse:\n"${proposition}"\n\nSolution:\n"${phraseComplete}"\n\nPénalité: -${penalite} F\nScore restant: ${gameState.scoreManche} F`
        , 5000);
    }
    
    updateUI();
}



function revelerLettresPhrase() {
    if (!gameState.phraseActuelle) {
        console.log('⚠️ Pas de phrase actuelle pour révéler les lettres');
        return;
    }
    
    const lettresAReveler = gameState.phraseActuelle.lettres_devoilees || 
                           CONFIG.phrasesConfig?.lettres_devoilees_debut || 
                           ['R', 'S', 'T', 'L', 'N', 'E'];
    
    console.log(`🔤 Révélation des lettres:`, lettresAReveler);
    
    let lettresRevelees = 0;
    
    lettresAReveler.forEach(lettre => {
        // 1. Révéler dans la GRILLE avec style doré (estDonnee = true)
        const casesTouvees = revelerLettresDansGrille(lettre, true);
        
        if (casesTouvees.length > 0) {
            gameState.lettresTrouvees.add(lettre);
            lettresRevelees++;
            
            // 2. Styliser dans le CLAVIER (style vert)
            const lettreClavier = document.querySelector(`#clavier [data-lettre="${lettre}"]`);
            if (lettreClavier) {
                lettreClavier.classList.remove('used', 'found', 'voyelle-normale', 'disabled');
                lettreClavier.classList.add('lettre-donnee');
                
                lettreClavier.style.background = '#4CAF50';
                lettreClavier.style.color = 'white';
                lettreClavier.style.border = '3px solid #2E7D32';
                lettreClavier.style.cursor = 'not-allowed';
                lettreClavier.style.pointerEvents = 'none';
                
                console.log(`🎁 Lettre donnée: ${lettre} (clavier vert, phrase dorée)`);
            }
        }
    });
    
    if (lettresRevelees > 0) {
        showMessage(`🎁 ${lettresRevelees} lettres révélées gratuitement !`, 'success');
    }
    
    updateUI();
}

function nouvellePartie() {
    console.log('🆕 Nouvelle partie');
    
    // Reset de l'état du jeu
    gameState.scoreManche = 0;
    gameState.modeJeu = 'normal';
    gameState.dernierResultatRoue = null;
    
    // Charger une phrase selon la catégorie sélectionnée
    const categorieSelectionnee = elements.categorieSelect ? elements.categorieSelect.value : null;
    chargerNouvellePhrase(categorieSelectionnee || null);
    
    // Reset de la roue
    if (elements.roueResultat) {
        elements.roueResultat.textContent = '-';
    }
    
    console.log('🧹 Nouvelle partie - tout nettoyé');
    updateUI();
}

/**
 * Nettoyer complètement le clavier et la grille
 */
function nettoyerInterface() {
    console.log('🧹 Nettoyage complet de l\'interface...');
    
    // Nettoyer le clavier
    document.querySelectorAll('.clavier-lettre').forEach(lettre => {
        // Classes
        lettre.classList.remove('used', 'found', 'lettre-donnee', 'disabled', 'voyelle-achetable', 'voyelle-normale');
        
        // Styles forcés
        lettre.style.cssText = ''; // Reset tous les styles inline d'un coup
    });
    
    // Nettoyer les cases de phrase
    document.querySelectorAll('.phrase-case').forEach(caseEl => {
        caseEl.classList.remove('revealed', 'donnee', 'revealing');
        caseEl.textContent = '';
    });
    
    console.log('✅ Interface nettoyée');
}
/**
 * Mettre à jour l'état visuel du clavier selon le mode de jeu
 */
function updateEtatClavier() {
    document.querySelectorAll('.clavier-lettre').forEach(lettreEl => {
        const lettre = lettreEl.dataset.lettre;
        const estVoyelle = CONFIG.voyelles.includes(lettre);
        const estUtilisee = gameState.lettresUtilisees.has(lettre);
        const estTrouvee = gameState.lettresTrouvees.has(lettre);
        
        // Reset toutes les classes d'état (pas les classes de résultat)
        lettreEl.classList.remove('disabled', 'voyelle-achetable', 'voyelle-normale');
        
        // Si la lettre est déjà utilisée ou trouvée, elle garde son état final
        if (estUtilisee || estTrouvee) {
            // Les lettres utilisées/trouvées ne sont plus cliquables
            lettreEl.style.pointerEvents = 'none';
            return;
        } else {
            // Réactiver les clics pour les lettres disponibles
            lettreEl.style.pointerEvents = 'auto';
        }
        
        if (gameState.modeJeu === 'achat-voyelle') {
            // Mode achat voyelle
            if (estVoyelle) {
                // Voyelles disponibles : BLING BLING !
                lettreEl.classList.add('voyelle-achetable');
            } else {
                // Consonnes : désactivées
                lettreEl.classList.add('disabled');
            }
        } else {
            // Mode normal
            if (estVoyelle) {
                // Voyelles : non cliquables, doivent être achetées
                lettreEl.classList.add('voyelle-normale');
            }
            // Consonnes : normales (pas de classe spéciale)
        }
    });
    
    console.log(`🎨 Clavier mis à jour pour le mode: ${gameState.modeJeu}`);
}

/**
 * Mettre à jour l'interface utilisateur
 */
function updateUI() {
    // Scores avec le symbole F
    if (elements.scoreTotal) {
        elements.scoreTotal.textContent = `${gameState.scoreTotal}F`;
    }
    
    if (elements.scoreManche) {
        elements.scoreManche.textContent = `${gameState.scoreManche}F`;
    }
    
    // Lettres trouvées
    if (elements.lettresTrouvees) {
        elements.lettresTrouvees.textContent = `${gameState.lettresTrouvees.size} / 26`;
    }
    
    // Infos de phrase
    if (gameState.phraseActuelle) {
        const categorieEl = document.getElementById('phrase-categorie');
        const difficulteEl = document.getElementById('phrase-difficulte');
        const indiceEl = document.getElementById('phrase-indice');
        
        if (categorieEl) {
            categorieEl.textContent = gameState.phraseActuelle.nomCategorie || gameState.phraseActuelle.categorie;
        }
        
        if (difficulteEl) {
            difficulteEl.textContent = gameState.phraseActuelle.difficulte || 'normale';
        }
        
        if (indiceEl) {
            indiceEl.textContent = `💡 Indice: ${gameState.phraseActuelle.indice}`;
        }
    }
    
    // Mettre à jour le bouton voyelle selon l'argent disponible
    updateBoutonVoyelle();
}

function updateBoutonVoyelle() {
    const boutonVoyelle = elements.acheterVoyelleBtn;
    if (!boutonVoyelle) return;
    
    const prixVoyelle = CONFIG.phrasesConfig?.prix_voyelle || 250;
    
    if (gameState.modeJeu === 'achat-voyelle') {
        // Mode achat actif
        boutonVoyelle.disabled = false;
        boutonVoyelle.textContent = 'Annuler achat voyelle';
        boutonVoyelle.style.background = '#FF9800';
        boutonVoyelle.classList.remove('disabled');
    } else {
        // Mode normal
        const peutAcheter = gameState.scoreManche >= prixVoyelle;
        
        if (peutAcheter) {
            boutonVoyelle.disabled = false;
            boutonVoyelle.textContent = `Acheter Voyelle (${prixVoyelle}F)`;
            boutonVoyelle.style.background = ''; // Reset style
            boutonVoyelle.classList.remove('disabled');
        } else {
            boutonVoyelle.disabled = true;
            boutonVoyelle.textContent = `Acheter Voyelle (${prixVoyelle}F) - Insuffisant`;
            boutonVoyelle.classList.add('disabled');
        }
    }
}
/**
 * Utilitaires de debug
 */
window.gameDebug = {
    getState: () => gameState,
    getConfig: () => CONFIG,
    resetGame: nouvellePartie,
    addPoints: (points) => {
        gameState.scoreManche += points;
        updateUI();
    }
};

console.log('🔧 Debug disponible via window.gameDebug');