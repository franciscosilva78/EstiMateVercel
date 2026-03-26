# 🧪 Guia de Testes - EstiMate

Este guia detalha como testar todas as otimizações de performance e acessibilidade implementadas.

## 🚀 Setup Inicial

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar Aplicação
```bash
npm run dev
```

## ⚡ Testes de Performance

### 1. **Bundle Analysis**
```bash
# Build da aplicação
npm run build

# Análise do bundle
npx vite-bundle-analyzer dist/

# Verificar:
# ✅ Code splitting funcionando
# ✅ Lazy loading dos componentes
# ✅ Tamanho total < 500KB
```

### 2. **React DevTools Profiler**
```bash
# 1. Abrir React DevTools
# 2. Ir para aba Profiler
# 3. Start recording
# 4. Interagir com a aplicação (criar sala, votar, revelar)
# 5. Stop recording

# Verificar:
# ✅ Poucos re-renders em ações simples
# ✅ Memoization funcionando
# ✅ Performance commits rápidos
```

### 3. **Lighthouse Performance**
```bash
# 1. Abrir Chrome DevTools
# 2. Ir para aba Lighthouse
# 3. Selecionar Performance
# 4. Generate report

# Targets:
# ✅ Performance Score: > 90
# ✅ FCP (First Contentful Paint): < 2s
# ✅ LCP (Largest Contentful Paint): < 3s
# ✅ CLS (Cumulative Layout Shift): < 0.1
```

### 4. **Network Performance**
```bash
# No Chrome DevTools -> Network tab:
# 1. Refresh com cache empty
# 2. Verificar waterfall de requests
# 3. Simular slow 3G

# Verificar:
# ✅ Critical resources carregam primeiro
# ✅ Lazy loading funciona
# ✅ Assets são comprimidos (gzip/brotli)
```

## ♿ Testes de Acessibilidade

### 1. **Testes Automáticos**
```bash
# Executar todos os testes de acessibilidade
npm run test:a11y

# Coverage completo
npm run test:coverage

# Verificar:
# ✅ Todos os testes passando
# ✅ 0 violations de axe-core
# ✅ Coverage > 90%
```

### 2. **Lighthouse Accessibility**
```bash
# 1. Chrome DevTools -> Lighthouse
# 2. Selecionar Accessibility
# 3. Generate report

# Target:
# ✅ Accessibility Score: 100/100
```

### 3. **Navegação por Teclado**

#### Teste Completo de Keyboard Navigation
```
📝 Checklist de Navegação:

1. Página Inicial (Criar Sala)
   ✅ Tab -> foco no input "Nome da Sala"
   ✅ Digite nome da sala
   ✅ Tab -> foco no botão "Iniciar Sala"
   ✅ Enter -> cria sala

2. Página de Join
   ✅ Tab -> foco no input "Seu Nome"
   ✅ Tab -> foco no radio "DEV"
   ✅ Arrow Left/Right -> navega entre funções
   ✅ Tab -> foco no botão "Entrar"
   ✅ Enter -> entra na sala

3. Página da Sala (Participant)
   ✅ Tab -> navega pelos voting buttons
   ✅ Arrow keys -> navega no grid de votos
   ✅ Enter/Space -> seleciona voto
   ✅ Tab -> foco no botão compartilhar

4. Página da Sala (Scrum Master)
   ✅ Tab -> navega pelos botões de controle
   ✅ Enter -> revela/reseta votos
   ✅ Arrow keys -> navega entre métodos de cálculo
   ✅ Tab -> navega entre temas
```

### 4. **Screen Reader Testing**

#### Com NVDA (Windows)
```bash
# 1. Instalar NVDA: https://www.nvaccess.org/
# 2. Iniciar NVDA
# 3. Navegar pela aplicação apenas com teclado

📝 Checklist Screen Reader:

Navegação Geral:
✅ Headings anunciados corretamente (H1, H2, H3)
✅ Landmarks identificados (main, navigation, etc.)
✅ Skip links funcionam (Tab -> "Pular para conteúdo")

Formulários:
✅ Labels associados aos inputs
✅ Estados de erro anunciados
✅ Help text lido automaticamente
✅ Required fields identificados

Interações:
✅ Button states anunciados (pressed/not pressed)
✅ Loading states anunciados
✅ Success/error messages lidos automaticamente
✅ Vote selection confirmada por áudio
```

#### Com VoiceOver (Mac)
```bash
# 1. System Preferences -> Accessibility -> VoiceOver
# 2. Enable VoiceOver
# 3. Use Cmd+F5 para toggle

# Mesmo checklist acima
```

### 5. **High Contrast Mode**
```bash
# Windows:
# 1. Settings -> Ease of Access -> High Contrast
# 2. Turn on High Contrast
# 3. Navegar pela aplicação

# Mac:
# 1. System Preferences -> Accessibility -> Display
# 2. Increase Contrast
# 3. Navegar pela aplicação

📝 Verificar:
✅ Borders mais visíveis
✅ Text contrast adequado
✅ Focus rings mais prominentes
✅ Elementos importantes destacados
```

### 6. **Reduced Motion**
```bash
# Windows:
# Settings -> Ease of Access -> Display -> Show animations

# Mac:
# System Preferences -> Accessibility -> Display -> Reduce Motion

# Chrome:
# DevTools -> Rendering -> Emulate CSS prefers-reduced-motion: reduce

📝 Verificar:
✅ Animations desabilitadas
✅ Transitions reduzidas
✅ Matrix rain effect removido
✅ Scanning effects desabilitados
✅ Funcionalidade preservada
```

### 7. **Color Blindness Testing**
```bash
# Chrome Extension: Colorblinding
# 1. Instalar extensão
# 2. Simular diferentes tipos de daltonismo
# 3. Verificar usabilidade

📝 Verificar:
✅ Information não depende apenas de cor
✅ Error states visíveis sem cor
✅ Vote states distinguíveis
✅ Theme colors acessíveis
```

## 📱 Testes Mobile

### 1. **Responsive Design**
```bash
# Chrome DevTools:
# 1. Toggle device toolbar (Ctrl+Shift+M)
# 2. Testar diferentes viewports
# 3. Testar orientação portrait/landscape

📝 Verificar:
✅ Layout responsivo
✅ Touch targets > 44px
✅ Text readable em small screens
✅ Navegação funcional em mobile
```

### 2. **Touch Accessibility**
```bash
📝 Checklist Touch:
✅ Buttons facilmente clicáveis
✅ Swipe gestures não interferem com navegação
✅ Double-tap zoom funcional
✅ Voice control compatível
```

## 🎯 Test Reports

### 1. **Gerar Reports**
```bash
# Coverage report
npm run test:coverage

# Reports gerados em:
# - coverage/index.html (cobertura visual)
# - coverage/lcov.info (dados para CI)
```

### 2. **CI/CD Integration**
```bash
# Exemplo de pipeline (GitHub Actions):

name: Quality Assurance
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - run: npm run build
      # Upload coverage to Codecov
```

## 🚦 Critérios de Aceitação

### Performance
- [ ] Lighthouse Performance > 90
- [ ] Bundle size < 500KB gzipped
- [ ] FCP < 2 segundos
- [ ] Zero memory leaks
- [ ] < 100ms para interactions

### Accessibility
- [ ] Lighthouse Accessibility = 100
- [ ] Zero violations axe-core
- [ ] 100% keyboard navigable
- [ ] Screen reader compatível
- [ ] WCAG 2.1 AA compliant

### Testing
- [ ] > 90% test coverage
- [ ] All a11y tests passing
- [ ] E2E tests passing
- [ ] Visual regression tests passing

## 🐛 Common Issues & Solutions

### Performance Issues
```bash
# Problem: Slow initial load
# Solution: Check bundle analysis, implement code splitting

# Problem: High memory usage
# Solution: Check for memory leaks, remove event listeners

# Problem: Slow Firestore updates
# Solution: Verify debounce is working, check subscription cleanup
```

### Accessibility Issues
```bash
# Problem: Screen reader não lê content
# Solution: Verificar aria-live regions, labels corretos

# Problem: Keyboard navigation quebrada
# Solution: Verificar focus management, tab order

# Problem: High contrast mode ilegível
# Solution: Verificar CSS custom properties, border colors
```

---

## 🎉 Conclusão

Seguindo este guia, você pode verificar que todas as otimizações foram implementadas corretamente e a aplicação atende aos mais altos padrões de performance e acessibilidade.

**Next Steps**: Configure estes testes em sua pipeline de CI/CD para monitoramento contínuo da qualidade.