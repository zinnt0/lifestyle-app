# Barcode Scanner Setup-Anleitung

## Problem
```
ERROR: Cannot find native module 'ExpoBarCodeScanner'
```

Dieser Fehler tritt auf, weil native Module einen vollständigen Rebuild der App erfordern.

## Lösung

### Schritt 1: Entwicklungs-Server stoppen
```bash
# Drücke Ctrl+C im Terminal wo Metro läuft
```

### Schritt 2: Node Modules und Cache löschen
```bash
cd /Users/tristanzinn/Desktop/App-Entwicklung/lifestyle-app

# Cache löschen
rm -rf node_modules
rm -rf .expo
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build

# Neu installieren
npm install
```

### Schritt 3: Native Build erstellen

#### Für iOS:
```bash
# Expo Prebuild (erstellt native iOS/Android Ordner)
npx expo prebuild --clean

# iOS Build
npx expo run:ios
```

#### Für Android:
```bash
# Expo Prebuild
npx expo prebuild --clean

# Android Build
npx expo run:android
```

### Schritt 4: App neu starten

Die App sollte jetzt mit vollem Kamera-Zugriff starten!

---

## Alternative: Expo Go (nur für Testing, NICHT für Barcode Scanner)

⚠️ **WICHTIG**: Der Barcode Scanner funktioniert NICHT in Expo Go!

Expo Go unterstützt keine Custom-Native-Module vollständig. Du **MUSST** einen Development Build erstellen:

```bash
# Development Build erstellen
npx expo install expo-dev-client
npx expo prebuild --clean
npx expo run:ios  # oder run:android
```

---

## Troubleshooting

### Problem: "Command not found: expo"
```bash
# Expo CLI global installieren
npm install -g expo-cli
```

### Problem: iOS Build schlägt fehl
```bash
# CocoaPods neu installieren
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

### Problem: Android Build schlägt fehl
```bash
# Gradle Cache löschen
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Problem: "Camera permission denied"
1. App deinstallieren
2. Neu installieren mit `npx expo run:ios` oder `npx expo run:android`
3. Bei erster Nutzung "Erlauben" wählen

---

## Verifizierung

Nach erfolgreichem Build:

1. ✅ App startet ohne Fehler
2. ✅ Navigation zur Food Search funktioniert
3. ✅ Barcode-Scanner Button ist sichtbar
4. ✅ Kamera öffnet sich beim Klick
5. ✅ Kamera-Berechtigung wird abgefragt
6. ✅ Scanner kann Barcodes erkennen

---

## Was wurde geändert?

### 1. app.json - Kamera-Berechtigungen
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Diese App benötigt Zugriff auf die Kamera, um Barcodes von Lebensmitteln zu scannen."
    }
  },
  "android": {
    "permissions": ["CAMERA"]
  }
}
```

### 2. package.json - Dependencies
```json
{
  "expo-barcode-scanner": "^13.0.1",
  "expo-haptics": "~15.0.8"
}
```

### 3. Neue Komponente
- `src/screens/Nutrition/BarcodeScannerScreen.tsx` - Vollständiger Scanner

### 4. Navigation aktualisiert
- `NutritionStackParamList` um `BarcodeScanner` erweitert
- `mealType` Parameter wird weitergegeben

---

## Schnellstart (Zusammenfassung)

```bash
# 1. Cache löschen
rm -rf node_modules .expo

# 2. Neu installieren
npm install

# 3. Prebuild
npx expo prebuild --clean

# 4. Build & Run
npx expo run:ios    # für iOS
# ODER
npx expo run:android  # für Android

# 5. Warten bis App startet

# 6. Scanner testen:
#    - Zur Nutrition Tab navigieren
#    - Food Search öffnen
#    - Barcode-Button tippen
#    - Produkt scannen
```

---

## Nach dem Build

Die App sollte jetzt vollständig funktionieren mit:
- ✅ Kamera-Zugriff
- ✅ Barcode-Scanning
- ✅ Automatische Produktsuche
- ✅ Integration mit Food Service (3-Layer-Cache)

Viel Erfolg! 🎉
