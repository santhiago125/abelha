document.addEventListener('DOMContentLoaded', () => {
    const ecossistema = document.getElementById('ecossistema');
    const colmeia1 = document.getElementById('colmeia1');
    const colmeia2 = document.getElementById('colmeia2');
    const iniciarBtn = document.getElementById('iniciarSimulacao');
    const adicionarFlorBtn = document.getElementById('adicionarFlor');
    const adicionarAbelhaBtn = document.getElementById('adicionarAbelha');

    let flores = [];
    let abelhas = [];
    let melColmeia1 = 0;
    let melColmeia2 = 0;
    let abelhaId = 0;
    let florId = 0;
    let simulacaoAtiva = false;

    // --- NOVIDADE: Timer de Renovação ---
    const TEMPO_RENOVACAO = 6000; // 6 segundos

    function iniciarTimerRemocao(florObj) {
        // As abelhas não podem mais mirar nesta flor (a lógica de simular já faz isso),
        // mas o timer garante a remoção física e do array.

        console.log(`Flor ${florObj.element.dataset.id} esgotada. Timer de remoção de ${TEMPO_RENOVACAO / 1000}s iniciado.`);

        setTimeout(() => {
            // 1. Remoção do DOM (visual)
            florObj.element.remove();

            // 2. Remoção do array 'flores' (lógica)
            const idParaRemover = florObj.element.dataset.id;
            const index = flores.findIndex(f => f.element.dataset.id === idParaRemover);
            
            if (index > -1) {
                flores.splice(index, 1);
                console.log(`Flor ${idParaRemover} removida após o ciclo de renovação.`);
            }

        }, TEMPO_RENOVACAO);
    }
    // --- FIM NOVIDADE ---

    // Função para obter posição aleatória dentro do ecossistema
    function getRandomPosition() {
        const x = Math.random() * (ecossistema.clientWidth - 40) + 20; // Margem para não ficar na borda
        const y = Math.random() * (ecossistema.clientHeight - 40) + 20;
        return { x, y };
    }

    // Cria uma nova flor
    function criarFlor() {
        const pos = getRandomPosition();
        const florDiv = document.createElement('div');
        florDiv.className = 'flor';
        florDiv.style.left = `${pos.x}px`;
        florDiv.style.top = `${pos.y}px`;
        florDiv.dataset.nectar = 100; // Néctar inicial
        florDiv.dataset.id = florId++;
        florDiv.innerHTML = `<span>${florDiv.dataset.nectar}</span>`;
        ecossistema.appendChild(florDiv);
        flores.push({ element: florDiv, x: pos.x, y: pos.y, nectar: parseInt(florDiv.dataset.nectar) });

        // Adiciona um listener para mostrar a quantidade de néctar
        florDiv.addEventListener('mouseover', () => {
            florDiv.innerHTML = `<span>Néctar: ${florDiv.dataset.nectar}</span>`;
        });
        florDiv.addEventListener('mouseout', () => {
            florDiv.innerHTML = `<span>${florDiv.dataset.nectar}</span>`;
        });

        console.log(`Flor ${florDiv.dataset.id} criada em (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
    }

    // Cria uma nova abelha
    function criarAbelha() {
        const pos = getRandomPosition();
        const abelhaDiv = document.createElement('div');
        abelhaDiv.className = 'abelha';
        abelhaDiv.style.left = `${pos.x}px`;
        abelhaDiv.style.top = `${pos.y}px`;
        abelhaDiv.dataset.id = abelhaId++;
        abelhaDiv.dataset.colmeiaTarget = abelhaDiv.dataset.id % 2 === 0 ? 'colmeia1' : 'colmeia2'; // Abelhas se associam a uma colmeia
        abelhaDiv.dataset.hasNectar = 'false';
        ecossistema.appendChild(abelhaDiv);
        abelhas.push({
            element: abelhaDiv,
            x: pos.x,
            y: pos.y,
            targetFlor: null,
            targetColmeia: null,
            hasNectar: false,
            speed: Math.random() * 2 + 1, // Velocidade aleatória
            state: 'searching' // searching, collecting, returning
        });
        console.log(`Abelha ${abelhaDiv.dataset.id} criada, associada à ${abelhaDiv.dataset.colmeiaTarget}`);
    }

    // Função para mover uma abelha em direção a um alvo
    function moverAbelha(abelha, targetX, targetY) {
        const dx = targetX - abelha.x;
        const dy = targetY - abelha.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > abelha.speed) {
            abelha.x += (dx / distance) * abelha.speed;
            abelha.y += (dy / distance) * abelha.speed;
        } else {
            abelha.x = targetX;
            abelha.y = targetY;
            return true; // Chegou ao destino
        }

        abelha.element.style.left = `${abelha.x}px`;
        abelha.element.style.top = `${abelha.y}px`;
        return false; // Ainda não chegou
    }

    // Lógica principal da simulação
    function simular() {
        if (!simulacaoAtiva) return;

        abelhas.forEach(abelha => {
            // Se a abelha tem néctar, ela retorna para sua colmeia
            if (abelha.hasNectar) {
                const targetColmeiaElement = document.getElementById(abelha.element.dataset.colmeiaTarget);
                const colmeiaRect = targetColmeiaElement.getBoundingClientRect();
                const ecoRect = ecossistema.getBoundingClientRect();

                // Calcula o centro da colmeia em relação ao ecossistema
                const colmeiaX = colmeiaRect.left + colmeiaRect.width / 2 - ecoRect.left;
                const colmeiaY = colmeiaRect.top + colmeiaRect.height / 2 - ecoRect.top;

                if (moverAbelha(abelha, colmeiaX, colmeiaY)) {
                    // Chegou à colmeia, entrega o néctar
                    abelha.hasNectar = false;
                    abelha.element.classList.remove('com-nectar');
                    abelha.state = 'searching';
                    if (abelha.element.dataset.colmeiaTarget === 'colmeia1') {
                        melColmeia1 += 10; // Cada coleta = 10 de mel
                        colmeia1.querySelector('.mel-produzido').textContent = `Mel: ${melColmeia1}`;
                    } else {
                        melColmeia2 += 10;
                        colmeia2.querySelector('.mel-produzido').textContent = `Mel: ${melColmeia2}`;
                    }
                    abelha.targetFlor = null; // Reseta o alvo da flor
                    console.log(`Abelha ${abelha.element.dataset.id} entregou néctar na ${abelha.element.dataset.colmeiaTarget}. Mel: ${melColmeia1}/${melColmeia2}`);
                }
            } else { // Se a abelha não tem néctar, ela procura flores
                if (!abelha.targetFlor || abelha.targetFlor.nectar <= 0) {
                    // Encontrar a flor mais próxima com néctar (simulando auto-organização/otimização)
                    let closestFlor = null;
                    let minDistance = Infinity;

                    flores.forEach(flor => {
                        // Importante: Checar se o néctar é maior que 0 e se a flor não está em processo de remoção
                        if (flor.nectar > 0) { 
                            const dx = flor.x - abelha.x;
                            const dy = flor.y - abelha.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestFlor = flor;
                            }
                        }
                    });

                    if (closestFlor) {
                        abelha.targetFlor = closestFlor;
                        abelha.state = 'collecting';
                        console.log(`Abelha ${abelha.element.dataset.id} mira na flor ${closestFlor.element.dataset.id}`);
                    } else {
                        // Nenhuma flor com néctar, abelha "descansa" ou vagueia aleatoriamente
                        abelha.state = 'searching';
                        const randomPos = getRandomPosition();
                        moverAbelha(abelha, randomPos.x, randomPos.y); // Vagueia aleatoriamente
                        return; // Pula para a próxima abelha se não há flores para coletar
                    }
                }

                if (abelha.targetFlor) {
                    if (moverAbelha(abelha, abelha.targetFlor.x, abelha.targetFlor.y)) {
                        // Chegou à flor, coleta néctar
                        if (abelha.targetFlor.nectar > 0) {
                            abelha.targetFlor.nectar -= 10; // Reduz o néctar da flor
                            abelha.targetFlor.element.dataset.nectar = abelha.targetFlor.nectar;
                            abelha.targetFlor.element.querySelector('span').textContent = abelha.targetFlor.nectar;
                            abelha.hasNectar = true;
                            abelha.element.classList.add('com-nectar');
                            abelha.state = 'returning';
                            console.log(`Abelha ${abelha.element.dataset.id} coletou néctar da flor ${abelha.targetFlor.element.dataset.id}. Néctar restante: ${abelha.targetFlor.nectar}`);

                            if (abelha.targetFlor.nectar <= 0) {
                                abelha.targetFlor.element.classList.add('sem-nectar');
                                console.log(`Flor ${abelha.targetFlor.element.dataset.id} sem néctar.`);
                                
                                // >>> NOVIDADE: Chama a função para iniciar o timer de remoção
                                iniciarTimerRemocao(abelha.targetFlor);
                            }
                        } else {
                            abelha.targetFlor = null; // Flor esgotada, procurar outra
                            abelha.state = 'searching';
                        }
                    }
                }
            }
        });

        requestAnimationFrame(simular); // Loop de animação
    }

    iniciarBtn.addEventListener('click', () => {
        simulacaoAtiva = !simulacaoAtiva;
        iniciarBtn.textContent = simulacaoAtiva ? 'Pausar Simulação' : 'Iniciar Simulação';
        if (simulacaoAtiva) {
            requestAnimationFrame(simular);
            console.log('Simulação iniciada.');
        } else {
            console.log('Simulação pausada.');
        }
    });

    adicionarFlorBtn.addEventListener('click', criarFlor);
    adicionarAbelhaBtn.addEventListener('click', criarAbelha);

    // Cria algumas flores e abelhas iniciais
    for (let i = 0; i < 5; i++) {
        criarFlor();
    }
    for (let i = 0; i < 3; i++) {
        criarAbelha();
    }
});