/**
 * App Root Component
 *
 * Main entry point for the Lifestyle App.
 * Deep link handling is managed by NavigationContainer linking configuration.
 */

import React from "react";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return <AppNavigator />;
}
