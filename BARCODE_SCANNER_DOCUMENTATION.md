# Barcode Scanner Dokumentation

## Übersicht

Der Barcode-Scanner ermöglicht es Nutzern, Lebensmittel durch Scannen des Barcodes mit der Kamera schnell hinzuzufügen. Die Integration nutzt die 3-Layer-Cache-Architektur für optimale Performance.

## Features

### 1. **Vollständige Kamera-Integration**
- Nutzt `expo-barcode-scanner` für native Barcode-Erkennung
- Unterstützt alle gängigen Barcode-Formate:
  - EAN-13 (häufigster in Europa)
  - EAN-8
  - UPC-A (USA)
  - UPC-E
  - Code-128
  - Code-39

### 2. **Intelligente Produktsuche**
- **3-Layer-Cache**: Nutzt Local → Cloud → External API
- **Schnell**: Gecachte Produkte werden in <100ms gefunden
- **Offline-fähig**: Lokaler Cache funktioniert auch ohne Internet

### 3. **Benutzerfreundliches UI**
- **Scan-Rahmen**: Visueller Rahmen zeigt Scan-Bereich
- **Scan-Linie**: Animierte Linie für visuelles Feedback
- **Flash/Taschenlampe**: Für schlechte Lichtverhältnisse
- **Haptisches Feedback**: Vibration bei erfolgreichem Scan
- **Loading-States**: Klare Rückmeldung während des Ladens

### 4. **Fehlerbehandlung**
- **Produkt nicht gefunden**: Option zur manuellen Suche
- **Kamera-Berechtigung**: Klare Anleitung bei fehlendem Zugriff
- **Netzwerkfehler**: Automatische Wiederholung möglich

## Berechtigungen

### iOS (app.json)
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Diese App benötigt Zugriff auf die Kamera, um Barcodes von Lebensmitteln zu scannen."
  }
}
```

### Android (app.json)
```json
"android": {
  "permissions": [
    "CAMERA"
  ]
}
```

## Verwendung

### Vom Food Search Screen

1. Nutzer tippt auf **Barcode-Scanner-Button** in der Suchleiste
2. Kamera öffnet sich im Vollbild-Modus
3. Nutzer hält Kamera auf Barcode
4. App scannt automatisch und sucht Produkt
5. Bei Erfolg: Weiterleitung zu Food Detail Screen
6. Bei Fehler: Option zur manuellen Suche

### Navigation Flow

```
NutritionDashboard
  → FoodSearch (mealType: "breakfast")
    → BarcodeScanner (mealType: "breakfast")
      → FoodDetail (food, mealType: "breakfast")
```

### Code-Beispiel

```typescript
// In FoodSearchScreen.tsx
const handleOpenScanner = () => {
  navigation.navigate('BarcodeScanner', { mealType });
};

// In BarcodeScannerScreen.tsx
const handleBarCodeScanned = async ({ data }: BarCodeScannerResult) => {
  const food = await foodService.getFoodByBarcode(data);

  if (food) {
    navigation.replace('FoodDetail', { food, mealType });
  } else {
    Alert.alert('Produkt nicht gefunden');
  }
};
```

## Technische Details

### Barcode-Erkennung

```typescript
// Unterstützte Barcode-Typen
barCodeTypes={[
  BarCodeScanner.Constants.BarCodeType.ean13,    // Europa
  BarCodeScanner.Constants.BarCodeType.ean8,     // Europa (klein)
  BarCodeScanner.Constants.BarCodeType.upc_a,    // USA
  BarCodeScanner.Constants.BarCodeType.upc_e,    // USA (klein)
  BarCodeScanner.Constants.BarCodeType.code128,  // Universal
  BarCodeScanner.Constants.BarCodeType.code39,   // Universal
]}
```

### Performance-Optimierung

#### 1. **Scan-Throttling**
```typescript
// Verhindert mehrfaches Scannen
if (scanned || loading) return;
setScanned(true);
```

#### 2. **3-Layer-Cache-Nutzung**
```typescript
// Schnellster Zugriff dank Multi-Layer-Cache
const food = await foodService.getFoodByBarcode(barcode);

// Intern:
// 1. Local SQLite (instant)
// 2. Cloud Supabase (fast)
// 3. Open Food Facts API (slower, aber vollständig)
```

#### 3. **Haptisches Feedback**
```typescript
// Sofortiges Feedback für Nutzer
await Haptics.notificationAsync(
  Haptics.NotificationFeedbackType.Success
);
```

### UI-Komponenten

#### Scan-Rahmen
```typescript
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;
const height = SCAN_AREA_SIZE * 0.6; // Rechteck für Barcodes
```

#### Corner Brackets
```typescript
// Visuelle Ecken für bessere UX
<View style={[styles.corner, styles.cornerTopLeft]} />
<View style={[styles.corner, styles.cornerTopRight]} />
<View style={[styles.corner, styles.cornerBottomLeft]} />
<View style={[styles.corner, styles.cornerBottomRight]} />
```

#### Flash/Taschenlampe
```typescript
flashMode={
  flashEnabled
    ? BarCodeScanner.Constants.FlashMode.torch
    : BarCodeScanner.Constants.FlashMode.off
}
```

## Fehlerbehandlung

### 1. Kamera-Berechtigung nicht erteilt
```typescript
if (hasPermission === false) {
  return (
    <View>
      <Text>Kamera-Zugriff erforderlich</Text>
      <Text>Bitte erlaube den Zugriff in den Einstellungen</Text>
    </View>
  );
}
```

### 2. Produkt nicht gefunden
```typescript
Alert.alert(
  'Produkt nicht gefunden',
  `Der Barcode "${data}" wurde nicht in der Datenbank gefunden.`,
  [
    { text: 'Abbrechen', onPress: () => resetScanner() },
    { text: 'Suchen', onPress: () => navigateToSearch() },
  ]
);
```

### 3. Netzwerkfehler
```typescript
catch (error) {
  Alert.alert(
    'Fehler',
    'Es gab ein Problem beim Laden des Produkts.',
    [{ text: 'OK', onPress: () => resetScanner() }]
  );
}
```

## Beispiele

### Beispiel 1: Coca Cola scannen

```
1. Nutzer öffnet Scanner vom Breakfast-Screen
2. Nutzer scannt Barcode: 5449000000996
3. FoodService prüft:
   - Local Cache ❌ (nicht gefunden)
   - Cloud Cache ✅ (gefunden!)
4. Zeit: ~150ms
5. Navigation zu FoodDetail mit "Coca Cola Zero"
```

### Beispiel 2: Neues Produkt scannen

```
1. Nutzer scannt Barcode: 4260414150043
2. FoodService prüft:
   - Local Cache ❌
   - Cloud Cache ❌
   - External API ✅ (Open Food Facts)
3. Zeit: ~2000ms
4. Produkt wird in beide Caches gespeichert
5. Navigation zu FoodDetail
6. Nächstes Mal: Aus Cache in <100ms
```

### Beispiel 3: Produkt nicht in Datenbank

```
1. Nutzer scannt unbekannten Barcode
2. FoodService findet nichts in allen 3 Layern
3. Alert: "Produkt nicht gefunden"
4. Option 1: Abbrechen → zurück zum Scanner
5. Option 2: Suchen → zur manuellen Suche
```

## Best Practices

### 1. **Gute Lichtverhältnisse**
- Nutze natürliches Licht wenn möglich
- Flash-Button für dunkle Umgebungen

### 2. **Barcode-Positionierung**
- Halte Barcode innerhalb des Rahmens
- Ausreichend Abstand (10-20 cm)
- Stabiles Halten für klare Erkennung

### 3. **Performance**
- Scanner öffnet sich schnell (<1s)
- Erkennung erfolgt automatisch
- Keine manuelle Auslösung nötig

## Debugging

### Console Logs
```typescript
console.log(`Barcode scanned: ${data} (Type: ${type})`);
console.log(`Found food: ${food.name}`);
```

### Häufige Probleme

#### Problem: Scanner erkennt Barcode nicht
- **Lösung**: Bessere Beleuchtung, Flash aktivieren
- **Lösung**: Barcode gerade halten
- **Lösung**: Abstand anpassen

#### Problem: Kamera startet nicht
- **Lösung**: Berechtigungen prüfen in Einstellungen
- **Lösung**: App neu starten
- **Lösung**: Gerät neu starten

#### Problem: Produkt nicht gefunden
- **Lösung**: Manuelle Suche nutzen
- **Lösung**: Barcode-Nummer manuell eingeben

## Zukünftige Verbesserungen

### 1. **Offline-Modus**
- Mehr Produkte im lokalen Cache
- Sync im Hintergrund

### 2. **Barcode-History**
- Zeige zuletzt gescannte Produkte
- Schneller Zugriff auf häufige Artikel

### 3. **Multi-Scan**
- Mehrere Produkte hintereinander scannen
- Bulk-Add zum Ernährungstagebuch

### 4. **Scan-Statistiken**
- Anzahl gescannter Produkte
- Scan-Erfolgsrate
- Durchschnittliche Scan-Zeit

## Zusammenfassung

✅ **Schnell**: <100ms für gecachte Produkte
✅ **Zuverlässig**: 3-Layer-Cache + Open Food Facts
✅ **Benutzerfreundlich**: Klares UI, haptisches Feedback
✅ **Offline-fähig**: Lokaler Cache funktioniert ohne Internet
✅ **Umfassend**: Unterstützt alle gängigen Barcode-Formate

Der Barcode-Scanner macht das Hinzufügen von Lebensmitteln zum Ernährungstagebuch zum Kinderspiel! 🎉
