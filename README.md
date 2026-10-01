# Genius (Simon) — Clássico dos Anos 80 🔴🟢🟡🔵

<p align="center">
  <a href="https://4u.ia.br/app/genius/"><img src="https://img.shields.io/badge/Jogar_Online-4u.ia.br%2Fapp%2Fgenius-ffff00?style=for-the-badge&logo=google-chrome&logoColor=black" alt="Jogar Genius Online" /></a>
  <a href="https://github.com/4u-Labs/genius"><img src="https://img.shields.io/badge/GitHub-4u--Labs%2Fgenius-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <img src="https://img.shields.io/badge/Áudio-Web_Audio_API-00ff66?style=for-the-badge" alt="Web Audio API" />
</p>

Recriação autêntica e altamente tátil do lendário brinquedo eletrônico de memória **Genius** (conhecido internacionalmente como **Simon**, criado em 1978 por Ralph Baer e Howard J. Morrison). Desenvolvido nativamente com **HTML5**, **CSS3 3D**, **Web Audio API** analógica e **Haptic Feedback** para smartphones.

Disponível para jogar online no PC ou Celular em: [https://4u.ia.br/app/genius/](https://4u.ia.br/app/genius/)

---

## ✨ Funcionalidades e Modos do Brinquedo Original

- **🎛️ Gabinete 3D Hiper-Realista:** Textura de plástico áspero, parafusos chanfrados metálicos, reflexo de lente nos botões translúcidos e display LED de 7 segmentos.
- **🎵 Síntese Analógica Fiel (Web Audio API):**
  - Verde (E4): 329.63 Hz
  - Vermelho (C4): 261.63 Hz
  - Amarelo (A3): 220.00 Hz
  - Azul (E3): 164.81 Hz
  - Som de Erro: Ruído + oscilador dente de serra descendente com distorção harmônica analógica.
- **📱 Vibração Tátil no Smartphone (`navigator.vibrate`):** Sinta o clique de cada botão diretamente no polegar através de pulsos hápticos leves e vibração dupla ao errar.
- **🎮 3 Modos de Jogo Clássicos:**
  - **Modo 1 (Clássico):** O Genius adiciona 1 cor a cada rodada sucessiva.
  - **Modo 2 (Strict / Desafio):** Qualquer erro encerra a partida e zera o contador para 01 sem segundas chances.
  - **Modo 3 (Inverso / Reverse):** O Genius toca a sequência direta e você deve reproduzi-la de trás para frente!
- **⚡ 4 Níveis de Habilidade (Skill Level 1 a 4):** Da cadência suave para iniciantes ao modo Blitz frenético.
- **🏆 Placar de Recordes & Compartilhamento:** Salva seu Top 5 no `localStorage` com botão de copiar resultado com 1 clique para redes sociais e WhatsApp.
- **⌨️ Atalhos de Teclado no PC:**
  - `W` ou `⬆️` ou `1`: Verde
  - `D` ou `➡️` ou `2`: Vermelho
  - `A` ou `⬅️` ou `3`: Amarelo
  - `S` ou `⬇️` ou `4`: Azul
  - `Espaço` ou `Enter`: Start
  - `P`: Ligar / Desligar
  - `M`: Alternar Modo de Jogo
  - `H`: Instruções / Ajuda

---

## 🚀 Como Executar Localmente

Não requer instalação de dependências ou compilação:

```bash
# Clone o repositório
git clone git@github.com:4u-Labs/genius.git

# Acesse o diretório
cd genius

# Inicie um servidor HTTP local
python3 -m http.server 8080
```

Abra no navegador em `http://localhost:8080`.

---

## 🛠️ Stack Tecnológica

- **HTML5:** Marcação semântica e acessibilidade WAI-ARIA.
- **CSS3:** Efeitos 3D com transformações de perspectiva, iluminação volumétrica, scanlines e viewport `100dvh` para celulares.
- **JavaScript Vanilla (ES6+):** Síntese procedural de frequências sonoras, roteamento preciso de toques e controle de estado de memória.

---

© 2026 [4U.IA.BR](https://4u.ia.br) // [4u-Labs](https://github.com/4u-Labs) — Todos os direitos reservados.
