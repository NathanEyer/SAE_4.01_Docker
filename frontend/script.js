// Variables globales
let currentStep = 1;
let sessionId = null;
let sentences = [];
let currentSentenceIndex = 0;
let totalSentences = 10;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let currentAudioBlob = null;
let recordedSentences = 0;

// Éléments DOM
const steps = document.querySelectorAll('.step');
const demographicsForm = document.getElementById('demographicsForm');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const playBtn = document.getElementById('playBtn');
const rerecordBtn = document.getElementById('rerecordBtn');
const saveBtn = document.getElementById('saveBtn');
const skipBtn = document.getElementById('skipBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const audioPlayer = document.getElementById('audioPlayer');
const sentenceDisplay = document.getElementById('sentenceDisplay');
const recordingStatus = document.getElementById('recordingStatus');
const currentSentenceSpan = document.getElementById('currentSentence');
const totalSentencesSpan = document.getElementById('totalSentences');
const progressFill = document.getElementById('progressFill');
const sessionSummary = document.getElementById('sessionSummary');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSentences();
});

function setupEventListeners() {
    // Formulaire démographique
    demographicsForm.addEventListener('submit', handleDemographicsSubmit);
    
    // Boutons d'enregistrement
    recordBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    playBtn.addEventListener('click', playRecording);
    rerecordBtn.addEventListener('click', rerecordAudio);
    saveBtn.addEventListener('click', saveAndNext);
    skipBtn.addEventListener('click', skipSentence);
    endSessionBtn.addEventListener('click', endSession);
}

// Navigation entre les étapes
function nextStep() {
    if (currentStep < 4) {
        steps[currentStep - 1].classList.remove('active');
        currentStep++;
        steps[currentStep - 1].classList.add('active');
    }
}

function previousStep() {
    if (currentStep > 1) {
        steps[currentStep - 1].classList.remove('active');
        currentStep--;
        steps[currentStep - 1].classList.add('active');
    }
}

function showStep(stepNumber) {
    steps.forEach(step => step.classList.remove('active'));
    steps[stepNumber - 1].classList.add('active');
    currentStep = stepNumber;
}

// Chargement des phrases
async function loadSentences() {
    try {
        const response = await fetch('/index.php?action=sentences');
        console.log(await response.text);
        const data = await response.json();
        
        if (data.status === 'success') {
            sentences = data.sentences;
            console.log(`${sentences.length} phrases chargées`);
        } else {
            showStatus('Erreur lors du chargement des phrases', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

// Gestion du formulaire démographique
async function handleDemographicsSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(demographicsForm);
    const age = formData.get('age');
    const gender = formData.get('gender');
    const consent = formData.get('consent');
    const sentenceCount = formData.get('sentenceCount');
    
    if (!age || !gender || !consent) {
        showStatus('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    try {
        const response = await fetch('/index.php', {
            method: 'POST',
            body: new URLSearchParams({
                action: 'create_session',
                age: age,
                gender: gender,
                consent: 'true',
                sentenceCount: sentenceCount
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            sessionId = data.sessionId;
            totalSentences = parseInt(sentenceCount);
            totalSentencesSpan.textContent = totalSentences;
            
            // Mélanger les phrases et prendre le nombre demandé
            const shuffledSentences = [...sentences].sort(() => 0.5 - Math.random());
            sentences = shuffledSentences.slice(0, totalSentences);
            
            initializeRecordingSession();
            nextStep();
        } else {
            showStatus(data.message || 'Erreur lors de la création de la session', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

// Initialisation de la session d'enregistrement
function initializeRecordingSession() {
    currentSentenceIndex = 0;
    recordedSentences = 0;
    updateSentenceDisplay();
    updateProgress();
    resetRecordingState();
}

function updateSentenceDisplay() {
    if (currentSentenceIndex < sentences.length) {
        sentenceDisplay.textContent = sentences[currentSentenceIndex];
        currentSentenceSpan.textContent = currentSentenceIndex + 1;
    }
}

function updateProgress() {
    const progress = (currentSentenceIndex / totalSentences) * 100;
    progressFill.style.width = `${progress}%`;
}

// Gestion des enregistrements
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            currentAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(currentAudioBlob);
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';
            
            // Activer les boutons appropriés
            playBtn.disabled = false;
            rerecordBtn.disabled = false;
            saveBtn.disabled = false;
            
            showStatus('Enregistrement terminé. Vous pouvez l\'écouter avant de valider.', 'success');
            
            // Arrêter le stream
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Mise à jour de l'interface
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        playBtn.disabled = true;
        rerecordBtn.disabled = true;
        saveBtn.disabled = true;
        
        showStatus('Enregistrement en cours...', 'info');
        recordBtn.innerHTML = '<span class="recording-indicator"><span class="recording-dot"></span> Enregistrement...</span>';
        
    } catch (error) {
        console.error('Erreur d\'accès au microphone:', error);
        showStatus('Impossible d\'accéder au microphone. Vérifiez vos autorisations.', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Réinitialiser l'interface
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        recordBtn.innerHTML = '🎤 Enregistrer';
    }
}

function playRecording() {
    if (audioPlayer.src) {
        audioPlayer.play();
    }
}

function rerecordAudio() {
    resetRecordingState();
    showStatus('Prêt pour un nouvel enregistrement', 'info');
}

function resetRecordingState() {
    currentAudioBlob = null;
    audioPlayer.style.display = 'none';
    audioPlayer.src = '';
    
    recordBtn.disabled = false;
    stopBtn.disabled = true;
    playBtn.disabled = true;
    rerecordBtn.disabled = true;
    saveBtn.disabled = true;
    
    recordBtn.innerHTML = '🎤 Enregistrer';
}

// Sauvegarde et passage à la phrase suivante
async function saveAndNext() {
    if (!currentAudioBlob) {
        showStatus('Aucun enregistrement à sauvegarder', 'error');
        return;
    }
    
    showStatus('Sauvegarde en cours...', 'info');
    
    try {
        const formData = new FormData();
        formData.append('audio', currentAudioBlob, `recording_${currentSentenceIndex}.webm`);
        formData.append('sessionId', sessionId);
        formData.append('sentenceIndex', currentSentenceIndex.toString());
        formData.append('sentence', sentences[currentSentenceIndex]);
        
        const response = await fetch('/index.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            recordedSentences++;
            showStatus(`Enregistrement ${recordedSentences} sauvegardé avec succès`, 'success');
            
            // Passer à la phrase suivante ou terminer
            if (currentSentenceIndex < totalSentences - 1) {
                currentSentenceIndex++;
                updateSentenceDisplay();
                updateProgress();
                resetRecordingState();
                showStatus('Prêt pour la phrase suivante', 'info');
            } else {
                // Toutes les phrases ont été enregistrées
                await finalizeSession();
            }
        } else {
            showStatus(data.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur de connexion lors de la sauvegarde', 'error');
    }
}

// Passer une phrase
function skipSentence() {
    if (currentSentenceIndex < totalSentences - 1) {
        currentSentenceIndex++;
        updateSentenceDisplay();
        updateProgress();
        resetRecordingState();
        showStatus('Phrase passée', 'warning');
    } else {
        endSession();
    }
}

// Terminer la session
async function endSession() {
    const confirmed = confirm('Êtes-vous sûr de vouloir terminer la session ? Tous les enregistrements effectués seront sauvegardés.');
    
    if (confirmed) {
        await finalizeSession();
    }
}

// Finaliser la session
async function finalizeSession() {
    try {
        showStatus('Finalisation de la session...', 'info');
        
        const response = await fetch('/index.php', {
            method: 'POST',
            body: new URLSearchParams({
                action: 'finalize_session',
                sessionId: sessionId
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Afficher le résumé
            sessionSummary.innerHTML = `
                <strong>Résumé de votre session :</strong><br>  
                • Session ID: ${sessionId}<br>
                • Phrases enregistrées: ${recordedSentences} sur ${totalSentences}<br>
                • Taux de completion: ${Math.round((recordedSentences / totalSentences) * 100)}%
            `;
            
            showStep(4);
        } else {
            showStatus('Erreur lors de la finalisation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Erreur de connexion', 'error');
        // Aller quand même à l'étape finale
        showStep(4);
    }
}

// Réinitialiser l'application
function resetApp() {
    currentStep = 1;
    sessionId = null;
    currentSentenceIndex = 0;
    recordedSentences = 0;
    currentAudioBlob = null;
    
    // Réinitialiser le formulaire
    demographicsForm.reset();
    
    // Réinitialiser l'interface d'enregistrement
    resetRecordingState();
    
    // Revenir à la première étape
    showStep(1);
    
    // Recharger les phrases
    loadSentences();
}

// Fonction utilitaire pour afficher les statuts
function showStatus(message, type = 'info') {
    recordingStatus.textContent = message;
    recordingStatus.className = `status ${type}`;
    
    // Auto-masquer les messages de succès après 3 secondes
    if (type === 'success') {
        setTimeout(() => {
            if (recordingStatus.textContent === message) {
                showStatus('Prêt pour l\'enregistrement', 'info');
            }
        }, 3000);
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showStatus('Une erreur inattendue s\'est produite', 'error');
});

// Gestion de la fermeture de la page (sauvegarde d'urgence)
window.addEventListener('beforeunload', function(e) {
    if (sessionId && recordedSentences > 0) {
        // Tenter une sauvegarde rapide
        navigator.sendBeacon('/index.php', new URLSearchParams({
            action: 'finalize_session',
            sessionId: sessionId
        }));
    }
});