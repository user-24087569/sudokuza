import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { gameHtml } from './gameHtml';

export default function App() {
  const webViewRef = React.useRef(null);
  const canGoBackRef = React.useRef(false);

  // Let the Android hardware back button step back inside the game (e.g. close a
  // modal) instead of immediately exiting the app, where that's possible.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const onBackPress = () => {
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e5940" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: gameHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowFileAccess
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e5940',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1e5940',
  },
});
