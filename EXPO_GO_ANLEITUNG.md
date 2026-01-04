# 📱 Expo Go Anleitung - Barcode Scanner

## ✅ Jetzt mit Expo Go kompatibel!

Die App funktioniert jetzt wieder mit Expo Go auf eurem Handy! Der Barcode-Scanner wurde angepasst.

---

## 🎯 Zwei Modi verfügbar

### 1. **Expo Go Modus** (Handy)
- ✅ Funktioniert in der Expo Go App
- 📝 Manuelle Barcode-Eingabe
- ⚡ Sofort nutzbar, kein Build nötig

### 2. **Development Build Modus** (optional)
- 📷 Echte Kamera mit Barcode-Scanner
- 🎯 Automatische Erkennung
- 🔧 Benötigt nativen Build

---

## 🚀 So startet ihr die App mit Expo Go:

### Schritt 1: Metro Bundler starten

```bash
cd /Users/tristanzinn/Desktop/App-Entwicklung/lifestyle-app

# App starten
npm start
```

### Schritt 2: QR-Code scannen

1. **Expo Go App** auf dem Handy öffnen
2. **QR-Code scannen** der im Terminal angezeigt wird
3. App lädt automatisch

### Schritt 3: Barcode-Scanner nutzen

1. **Nutrition Tab** öffnen
2. **+ Button** bei Mahlzeit tippen
3. **Barcode-Scanner Button** tippen
4. **Barcode manuell eingeben**:
   - Tippe Barcode-Nummer ein (z.B. `5449000000996`)
   - Tippe "Suchen"
   - Produkt wird gefunden!

---

## 📝 Wie funktioniert die manuelle Eingabe?

### Beispiel: Coca Cola Zero

1. Barcode-Scanner öffnen
2. Du siehst: **"Barcode eingeben"** Screen
3. Eingabefeld: `5449000000996` eintippen
4. "Suchen" Button tippen
5. ✅ Coca Cola Zero wird gefunden und angezeigt

### Barcode finden:

Der Barcode steht **unter** dem Strichcode auf der Verpackung:
```
║ ║ ║  ║ ║║ ║ ║║  ← Strichcode (Striche)
5449000000996      ← Barcode (Zahlen)
```

---

## 🎨 Features im Expo Go Modus

### Manuelle Eingabe Screen:

```
┌─────────────────────────┐
│   [X]  Barcode eingeben │ ← Header
├─────────────────────────┤
│                         │
│    [Barcode Icon]       │ ← 100px Icon
│                         │
│   Barcode-Scanner       │ ← Titel
│                         │
│  Kamera-Scanner ist     │
│  nur im Development     │ ← Info
│  Build verfügbar        │
│                         │
│ ┌─────────────────────┐ │
│ │ Barcode eingeben:   │ │
│ │ ┌─────────────────┐ │ │
│ │ │ 5449000000996   │ │ │ ← Input Field
│ │ └─────────────────┘ │ │
│ │  [ 🔍 Suchen ]     │ │ │ ← Button
│ └─────────────────────┘ │
│                         │
│ ℹ️  Der Barcode befin-  │
│ det sich meist unter    │ ← Tipp
│ dem Strichcode...       │
│                         │
│  Oder manuell suchen    │ ← Alternative
│                         │
└─────────────────────────┘
```

### Features:
- ✅ Großes Barcode-Icon
- ✅ Klare Anweisungen
- ✅ Nummerntastatur automatisch
- ✅ Enter-Taste zum Suchen
- ✅ Loading-Indikator
- ✅ Alternative zur manuellen Suche

---

## 🔄 Automatische Erkennung (Expo Go vs Dev Build)

Der Code erkennt automatisch, in welchem Modus die App läuft:

```typescript
// Automatische Erkennung:
const IS_EXPO_GO = !CameraView; // Camera nicht verfügbar = Expo Go

if (IS_EXPO_GO) {
  // Zeige manuelle Eingabe
} else {
  // Zeige Kamera-Scanner
}
```

---

## 📱 Unterschiede zwischen Modi

### Expo Go Modus:
```
✅ Sofort nutzbar
✅ Kein Build nötig
✅ Auf jedem Handy
⚠️ Manuelle Eingabe
⚠️ Keine Kamera
```

### Development Build:
```
✅ Echte Kamera
✅ Automatisches Scannen
✅ Flash/Taschenlampe
⚠️ Build erforderlich (~10 Min)
⚠️ Nur auf entwickeltem Gerät
```

---

## 🎯 Beispiel-Barcodes zum Testen

Zum Testen könnt ihr diese bekannten Barcodes verwenden:

```
Coca Cola Zero:    5449000000996
Nutella 400g:      3017620422003
Milka Schokolade:  7622210449283
Red Bull:          9002490100056
Haribo Goldbären:  4001686304129
```

Einfach einen davon eingeben und "Suchen" tippen!

---

## 🔧 Optional: Development Build erstellen

Falls ihr die echte Kamera nutzen wollt:

```bash
# 1. iOS Development Build
npm run ios

# 2. Android Development Build
npm run android

# Dann startet die App mit Kamera-Scanner
```

Nach dem Build:
```bash
# Development Build starten
npm run start:dev-client
```

---

## 🐛 Troubleshooting

### Problem: "expo-camera not available"
**Lösung**: Das ist normal in Expo Go! Nutze die manuelle Eingabe.

### Problem: Barcode nicht gefunden
**Lösung**:
1. Überprüfe die Barcode-Nummer (13 Ziffern für EAN-13)
2. Versuche manuelle Suche als Alternative

### Problem: App lädt nicht in Expo Go
**Lösung**:
```bash
# Cache löschen und neu starten
rm -rf .expo
npm start --clear
```

---

## ✅ Zusammenfassung

**Für normale Nutzung (empfohlen):**
1. `npm start`
2. Expo Go öffnen
3. QR-Code scannen
4. Barcode manuell eingeben

**Für Kamera-Scanner (optional):**
1. `npm run ios` ODER `npm run android`
2. Warten (~10 Min)
3. App nutzt echte Kamera

---

## 📊 Welcher Modus ist besser?

### Expo Go - Perfekt für:
- ✅ Schnelles Testen
- ✅ Entwicklung ohne Build
- ✅ Mehrere Geräte gleichzeitig
- ✅ Instant Updates

### Development Build - Perfekt für:
- ✅ Production-nahe Erfahrung
- ✅ Volle Kamera-Nutzung
- ✅ Schnelleres Scannen
- ✅ Bessere UX

---

Viel Spaß mit der App! 🎉

**Tipp**: Startet mit Expo Go für schnelles Testen. Wenn ihr die Kamera braucht, macht später einen Development Build.
