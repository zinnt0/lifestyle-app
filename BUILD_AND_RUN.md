# 🚀 Build & Run Anleitung - Barcode Scanner

## ⚠️ WICHTIG: Warum dieser Fehler auftritt

```
ERROR: Cannot find native module 'ExpoBarCodeScanner'
```

**Problem**: Der Barcode-Scanner ist ein natives Modul und funktioniert NICHT in Expo Go.

**Lösung**: Du musst einen Development Build erstellen.

---

## 🔧 Einmalige Einrichtung (schon erledigt!)

✅ `expo-dev-client` wurde installiert
✅ `expo-barcode-scanner` ist bereits in package.json
✅ Kamera-Berechtigungen in app.json konfiguriert
✅ Scripts wurden aktualisiert

---

## 📱 Erste Schritte: Development Build erstellen

### Option 1: iOS (Mac mit Xcode erforderlich)

```bash
cd /Users/tristanzinn/Desktop/App-Entwicklung/lifestyle-app

# 1. Alte Build-Artefakte löschen (optional, aber empfohlen)
rm -rf ios/build

# 2. iOS Development Build erstellen und starten
npm run ios

# ODER falls das nicht funktioniert:
npx expo run:ios

# Warte bis die App auf dem Simulator/Gerät startet
```

### Option 2: Android (Android Studio erforderlich)

```bash
cd /Users/tristanzinn/Desktop/App-Entwicklung/lifestyle-app

# 1. Alte Build-Artefakte löschen (optional)
rm -rf android/build

# 2. Android Development Build erstellen und starten
npm run android

# ODER:
npx expo run:android

# Warte bis die App auf dem Emulator/Gerät startet
```

---

## 🎯 Nach dem ersten Build

Nach dem ersten erfolgreichen Build kannst du die App wie gewohnt starten:

### Methode 1: Metro Bundler starten (schneller für Entwicklung)

```bash
# Terminal 1: Metro starten
npm start

# Das öffnet den Expo Dev Client
# Drücke dann:
# - 'i' für iOS Simulator
# - 'a' für Android Emulator
```

### Methode 2: Direkter Build (langsamer, aber vollständig)

```bash
# Für iOS
npm run ios

# Für Android
npm run android
```

---

## ✅ Was sollte jetzt funktionieren

1. **App startet ohne Fehler** ✅
2. **Navigation funktioniert** ✅
3. **Barcode-Scanner öffnet sich** ✅
4. **Kamera-Berechtigung wird abgefragt** ✅
5. **Scanner erkennt Barcodes** ✅

---

## 🧪 Scanner testen

1. App starten
2. Zur **Nutrition** Tab navigieren
3. **Food Search** öffnen (+ Button bei einer Mahlzeit)
4. **Barcode-Scanner Button** (Barcode-Icon) tippen
5. Kamera-Berechtigung erlauben
6. Barcode eines Produkts scannen (z.B. Coca Cola, Milch, etc.)
7. Produkt wird automatisch gesucht und angezeigt

---

## 🐛 Troubleshooting

### Problem 1: "Command failed: ios/build/Build..."

```bash
# Lösung: Xcode Cache löschen
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
npm run ios
```

### Problem 2: "Could not find the following native modules"

```bash
# Lösung: Alle Dependencies neu installieren
rm -rf node_modules
npm install
npx expo prebuild --clean
npm run ios  # oder android
```

### Problem 3: Metro Bundler läuft noch von vorher

```bash
# Lösung: Metro beenden und neu starten
# Drücke Ctrl+C im Terminal wo Metro läuft
# Dann:
npm start
```

### Problem 4: App startet, aber Scanner funktioniert nicht

```bash
# Lösung: Vollständigen Rebuild
rm -rf ios/build android/build
npx expo prebuild --clean
npm run ios  # oder android
```

### Problem 5: "Camera permission denied"

**Lösung**:
1. App deinstallieren vom Gerät/Simulator
2. Neu installieren mit `npm run ios` oder `npm run android`
3. Bei erster Nutzung "Erlauben" wählen

---

## 📊 Build-Zeiten (ungefähr)

- **Erster Build**: 5-15 Minuten (je nach Hardware)
- **Folgende Builds**: 1-3 Minuten
- **Hot Reload nach Build**: <1 Sekunde ⚡

---

## 💡 Tipps für schnellere Entwicklung

### 1. Metro Bundler laufen lassen
```bash
# Terminal 1: Metro dauerhaft laufen lassen
npm start

# Terminal 2: Code ändern und Hot Reload nutzen
# Änderungen werden automatisch in der App aktualisiert
```

### 2. Nur bei nativen Änderungen neu builden
**Rebuild NÖTIG bei**:
- Neue native Dependencies
- Änderungen an app.json (Permissions, etc.)
- Native Code-Änderungen

**Rebuild NICHT nötig bei**:
- JavaScript/TypeScript-Änderungen
- React Component-Änderungen
- Style-Änderungen
→ Hot Reload reicht!

### 3. Development Build einmal installieren
Nach dem ersten `npm run ios/android` kannst du die App auf dem Gerät behalten und nur noch `npm start` nutzen!

---

## 🎉 Erfolgreicher Start

Du weißt, dass alles funktioniert, wenn:

```
✅ App startet ohne "Cannot find native module" Fehler
✅ Barcode-Scanner öffnet sich
✅ Kamera-View ist sichtbar
✅ Scanner reagiert auf Barcodes
✅ Produktsuche funktioniert nach Scan
```

---

## 🔄 Zusammenfassung: Was jetzt anders ist

**VORHER (Expo Go)**:
```bash
npm start
# → Öffnet in Expo Go App
# → Barcode Scanner funktioniert NICHT ❌
```

**JETZT (Development Build)**:
```bash
# Einmalig:
npm run ios  # Erstellt Development Build

# Danach:
npm start    # Öffnet in deinem Development Build
# → Barcode Scanner funktioniert ✅
```

---

## 📞 Bei Problemen

Falls weiterhin Fehler auftreten:

1. **Alle Caches löschen**:
   ```bash
   rm -rf node_modules .expo ios/build android/build
   npm install
   npx expo prebuild --clean
   npm run ios
   ```

2. **Simulator/Emulator neu starten**

3. **macOS/Computer neu starten** (manchmal hilft's 🤷‍♂️)

---

Viel Erfolg! 🚀
