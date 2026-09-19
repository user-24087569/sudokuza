import React from 'react';
import { StyleSheet, BackHandler, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { gameHtml } from './gameHtml';

// Bundled as a real native asset (not inlined as base64 in gameHtml.js) so the
// WebView loads it as a normal file:// resource instead of choking on a
// multi-megabyte data URI embedded in the page's own HTML string.
const musicAsset = Asset.fromModule(require('./assets/audio/theme.mp3'));

function Game() {
  const webViewRef = React.useRef(null);
  const canGoBackRef = React.useRef(false);
  const [musicUri, setMusicUri] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    musicAsset.downloadAsync().then(() => {
      if (mounted) setMusicUri(musicAsset.localUri || musicAsset.uri);
    });
    return () => {
      mounted = false;
    };
  }, []);

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

  if (!musicUri) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#182642" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: gameHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        injectedJavaScriptBeforeContentLoaded={`window.__BG_MUSIC_URI__=${JSON.stringify(musicUri)};true;`}
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack;
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#182642',
  },
  webview: {
    flex: 1,
    backgroundColor: '#182642',
  },
});
