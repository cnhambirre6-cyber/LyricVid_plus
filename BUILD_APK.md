# Como gerar o APK — LirycVid+

## Pré-requisitos na tua máquina

| Ferramenta | Versão mínima | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Android Studio | Flamingo+ | https://developer.android.com/studio |
| JDK | 17+ | incluído no Android Studio |

> O Android Studio instala automaticamente o Android SDK, Gradle e todas as dependências necessárias.

---

## 1 — Configurar as variáveis de ambiente

Copia `.env.local.example` para `.env.local` e preenche:

```env
NEXT_PUBLIC_CONVEX_URL=https://SEU-DEPLOYMENT.convex.cloud
```

**⚠️ Sem este valor real, o APK abre mas não conecta ao backend.**

Vai a https://dashboard.convex.dev → o teu projecto → Settings → copia o Deployment URL.

---

## 2 — Instalar dependências

```bash
npm install
```

---

## 3 — Build estático + sincronizar Android

```bash
npm run build          # gera a pasta out/
npx cap sync android   # copia out/ para o projecto Android
```

---

## 4A — Gerar APK de debug (teste rápido)

```bash
cd android
./gradlew assembleDebug
```

O APK fica em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4B — Gerar APK de release (distribuição)

```bash
cd android
./gradlew assembleRelease
```

O APK fica em:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

Para distribuir na Play Store precisas de assinar o APK.  
Tutorial: https://developer.android.com/studio/publish/app-signing

---

## 4C — Abrir no Android Studio (alternativa visual)

```bash
npx cap open android
```

Dentro do Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## Instalar directamente num Android (debug)

Com o telemóvel ligado por USB e depuração USB activada:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Ou copia o `.apk` para o telemóvel e instala manualmente (precisas de permitir "Instalar de fontes desconhecidas" nas definições).

---

## Personalizar o app

| O que alterar | Ficheiro |
|---|---|
| Bundle ID / nome da app | `capacitor.config.ts` |
| Ícones | `public/icons/icon-*.png` (regenerar com o script Python no projecto) |
| Cor de fundo no splash | `capacitor.config.ts` → `android.backgroundColor` |
| URL do Convex | `.env.local` → `NEXT_PUBLIC_CONVEX_URL` |

---

## Script tudo-em-um (Linux/Mac)

```bash
#!/bin/bash
set -e
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
echo "APK gerado em: android/app/build/outputs/apk/debug/app-debug.apk"
```
