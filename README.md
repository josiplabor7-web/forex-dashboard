# Forex Macro Intelligence Dashboard

## 🚀 Deploy na Vercel (BESPLATNO, 5 minuta)

### Korak 1 — GitHub
1. Idi na github.com → "New repository"
2. Ime: `forex-dashboard`
3. Klikni "Create repository"
4. Upload sve fileove iz ove mape (drag & drop)

### Korak 2 — Vercel
1. Idi na vercel.com → "Sign up" (besplatno, prijavi se s GitHub računom)
2. Klikni "New Project"
3. Odaberi tvoj `forex-dashboard` repo
4. Klikni "Deploy" — gotovo!

Vercel automatski detektira React i builda projekt.
Dobiješ URL npr: `https://forex-dashboard-xyz.vercel.app`

---

## ⚙️ Lokalno pokretanje (opcionalno)

```bash
npm install
npm start
```
Otvori: http://localhost:3000

---

## 🔑 Anthropic API Key

Dashboard koristi Claude AI za analize. API key je ugrađen u kod.
Ako trebaš vlastiti key: https://console.anthropic.com

---

## 📁 Struktura

```
forex-app/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   └── App.jsx          ← glavni dashboard
├── package.json
└── vercel.json
```
