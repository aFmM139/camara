import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";

const CAM_IP = "192.168.1.13";
const CAM_URL = `http://${CAM_IP}`;

// JavaScript que se inyecta después de que carga la página:
// 1. Oculta el sidebar y el logo
// 2. Arranca el stream automáticamente
// 3. Oculta el botón de cerrar y el de guardar
const INJECTED_JS = `
  (function() {
    // Ocultar panel lateral y logo
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = 'none';

    var logo = document.getElementById('logo');
    if (logo) logo.style.display = 'none';

    // Quitar margen y hacer el stream pantalla completa
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#000';

    var content = document.getElementById('content');
    if (content) {
      content.style.display = 'block';
      content.style.width = '100vw';
      content.style.height = '100vh';
    }

    var figure = document.querySelector('figure');
    if (figure) {
      figure.style.width = '100vw';
      figure.style.height = '100vh';
    }

    // Ocultar botones de cerrar y guardar
    var closeBtn = document.getElementById('close-stream');
    if (closeBtn) closeBtn.style.display = 'none';

    var saveBtn = document.getElementById('save-still');
    if (saveBtn) saveBtn.style.display = 'none';

    // Arrancar el stream automáticamente
    var streamBtn = document.getElementById('toggle-stream');
    if (streamBtn) streamBtn.click();

    // Hacer la imagen del stream pantalla completa
    var streamImg = document.getElementById('stream');
    if (streamImg) {
      streamImg.style.width = '100vw';
      streamImg.style.height = '100vh';
      streamImg.style.objectFit = 'contain';
      streamImg.style.marginTop = '0';
    }

    var streamContainer = document.getElementById('stream-container');
    if (streamContainer) {
      streamContainer.style.width = '100vw';
      streamContainer.style.height = '100vh';
    }

    window.ReactNativeWebView.postMessage('loaded');
  })();
  true;
`;

export default function CameraScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const reload = () => {
    setLoading(true);
    setError(false);
    setKey((k) => k + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <View style={styles.header}>
        <Text style={styles.title}>ESP32-CAM</Text>
        <Text style={styles.subtitle}>{CAM_IP}</Text>
      </View>

      <View style={styles.viewer}>
        {loading && !error && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#00e5ff" />
            <Text style={styles.overlayText}>Conectando…</Text>
          </View>
        )}
        {error && (
          <View style={styles.overlay}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.overlayText}>Sin conexión con la cámara</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reload}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        <WebView
          key={key}
          style={styles.webview}
          source={{ uri: CAM_URL }}
          injectedJavaScript={INJECTED_JS}
          onMessage={(e) => {
            if (e.nativeEvent.data === "loaded") setLoading(false);
          }}
          onError={() => { setLoading(false); setError(true); }}
          onHttpError={() => { setLoading(false); setError(true); }}
          originWhitelist={["*"]}
          mixedContentMode="always"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 2 },
  subtitle: { color: "#555", fontSize: 11, letterSpacing: 1 },
  viewer: {
    flex: 1,
    margin: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  webview: { flex: 1, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "#000000dd",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  overlayText: { color: "#888", fontSize: 14 },
  errorEmoji: { fontSize: 40 },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#00e5ff15",
    borderWidth: 1,
    borderColor: "#00e5ff",
  },
  retryText: { color: "#00e5ff", fontWeight: "700", letterSpacing: 1 },
});