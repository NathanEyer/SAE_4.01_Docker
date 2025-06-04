const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const status = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");

let mediaRecorder;
let audioChunks = [];

startBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block";

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    status.textContent = "Envoi en cours...";
    try {
      const res = await fetch("/index.php", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      status.textContent = data.status === "success" ? "Fichier envoyé avec succès." : "Erreur lors de l'envoi.";
    } catch {
      status.textContent = "Erreur de réseau.";
    }
  };

  mediaRecorder.start();
  status.textContent = "Enregistrement en cours...";
  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  status.textContent = "Arrêt de l'enregistrement...";
  startBtn.disabled = false;
  stopBtn.disabled = true;
};
