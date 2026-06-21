/**
 * Script auxiliar — instruções para gerar os ícones do app.
 *
 * O Expo requer:
 *   assets/icons/icon.png          → 1024×1024 px
 *   assets/icons/adaptive-icon.png → 1024×1024 px (foreground do ícone adaptativo Android)
 *   assets/icons/notification-icon.png → 96×96 px (branco sobre fundo transparente)
 *
 * Como gerar sem Photoshop:
 *   1. Acesse https://icon.kitchen ou https://appicon.co
 *   2. Faça upload do SVG abaixo convertido para PNG
 *   3. Baixe o pacote Android e renomeie os arquivos
 *
 * Ícone SVG do Família+:
 * (cole em qualquer editor SVG ou conversor online para PNG)
 */

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <!-- Fundo degradê roxo -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#6C63FF"/>
      <stop offset="100%" stop-color="#43C6AC"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>

  <!-- Família: pai + mãe + filho(a) -->
  <!-- Pai -->
  <circle cx="340" cy="320" r="80" fill="white" opacity="0.95"/>
  <ellipse cx="340" cy="520" rx="100" ry="110" fill="white" opacity="0.95"/>

  <!-- Mãe -->
  <circle cx="684" cy="320" r="80" fill="white" opacity="0.95"/>
  <ellipse cx="684" cy="520" rx="100" ry="110" fill="white" opacity="0.95"/>

  <!-- Filho(a) -->
  <circle cx="512" cy="580" r="60" fill="white" opacity="0.95"/>
  <ellipse cx="512" cy="730" rx="75" ry="85" fill="white" opacity="0.95"/>

  <!-- Coração central acima -->
  <path d="M512 230 C512 230 440 170 400 190 C350 215 355 280 400 310 L512 410 L624 310 C669 280 674 215 624 190 C584 170 512 230 512 230Z"
        fill="#FF6584" opacity="0.9"/>

  <!-- Texto "F+" no coração -->
  <text x="512" y="310" text-anchor="middle" font-family="Arial Black" font-size="90" fill="white" font-weight="900">F+</text>
</svg>
`;

console.log('SVG do ícone pronto. Converta para PNG em: https://svgtopng.com');
console.log('Tamanhos necessários: 1024×1024 e 96×96');
