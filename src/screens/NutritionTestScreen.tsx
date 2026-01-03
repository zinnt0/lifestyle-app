/**
 * Test Screen für Nutrition Edge Functions
 * Zum Testen der deployed Edge Functions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  searchFood,
  scanBarcode,
  getDailySummary,
  prefetchPopularFoods,
} from '@/services/nutritionApi';

export default function NutritionTestScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Test Food Search
  const handleSearchFood = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchFood(searchQuery, 10);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Test Barcode Scan
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await scanBarcode(barcodeInput);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  // Test Daily Summary
  const handleGetDailySummary = async () => {
    setLoading(true);
    setError(null);
    try {
      // Verwenden Sie hier eine echte User ID aus Ihrer Auth
      const userId = 'test-user-id'; // TODO: Replace with real user ID
      const today = new Date().toISOString().split('T')[0];
      const data = await getDailySummary(userId, today);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get summary');
    } finally {
      setLoading(false);
    }
  };

  // Test Prefetch Popular Foods
  const handlePrefetchFoods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prefetchPopularFoods(20);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prefetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Nutrition API Test</Text>

      {/* Food Search Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Food Search</Text>
        <TextInput
          style={styles.input}
          placeholder="Lebensmittel suchen (z.B. Müsli)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSearchFood}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Suchen</Text>
        </TouchableOpacity>
      </View>

      {/* Barcode Scan Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Barcode Scan</Text>
        <TextInput
          style={styles.input}
          placeholder="Barcode eingeben (z.B. 4008167103905)"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleBarcodeScan}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Scannen</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Summary Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Daily Summary</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetDailySummary}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Heute's Summary laden</Text>
        </TouchableOpacity>
      </View>

      {/* Prefetch Popular Foods Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Popular Foods</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePrefetchFoods}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Top 20 Foods laden</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Result Display */}
      {result && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>✅ Result:</Text>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📝 Test-Beispiele:</Text>
        <Text style={styles.infoText}>
          • Food Search: "Müsli", "Apfel", "Milch"
        </Text>
        <Text style={styles.infoText}>
          • Barcode: 4008167103905 (Weihenstephan)
        </Text>
        <Text style={styles.infoText}>
          • Barcode: 3017620422003 (Nutella)
        </Text>
        <Text style={styles.infoText}>
          • Barcode: 5449000000996 (Coca Cola)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c00',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#900',
  },
  resultContainer: {
    backgroundColor: '#efe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cfc',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#060',
    marginBottom: 8,
  },
  resultScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#040',
  },
  infoContainer: {
    backgroundColor: '#fff9e6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    marginTop: 4,
  },
});
