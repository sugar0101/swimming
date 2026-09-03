import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { APP_URL } from './src/config';

// App Android de Swimming is Cool: envuelve la web (app/) en un WebView.
// Misma sesión que la web (cookies + localStorage del WebView).
export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Botón atrás de Android navega dentro del WebView antes de cerrar la app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaProvider>
      {/* Iconos de la barra de estado en oscuro sobre fondo blanco. El
          SafeAreaView deja el WebView por debajo de la barra de estado y de
          la barra de navegación (Android 15 va edge-to-edge por defecto). */}
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <WebView
          ref={webviewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          // Android agranda el texto según el tamaño de fuente del sistema;
          // fijarlo en 100 hace que se vea igual que en el navegador.
          textZoom={100}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          onContentProcessDidTerminate={() => webviewRef.current?.reload()}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
