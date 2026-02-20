import { useState, useEffect } from "react";
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
import * as ScreenOrientation from "expo-screen-orientation";

const CAM_IP = "192.168.1.13";
const CAM_URL = `http://${CAM_IP}`;

const INJECTED_JS = `
  (function() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = 'none';
    var logo = document.getElementById('logo');
    if (logo) logo.style.display = 'none';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#000';
    var content = document.getElementById('content');
    if (content) { content.style.display = 'block'; content.style.width = '100vw'; content.style.height = '100vh'; }
    var figure = document.querySelector('figure');
    if (figure) { figure.style.width = '100vw'; figure.style.height = '100vh'; }
    var closeBtn = document.getElementById('close-stream');
    if (closeBtn) closeBtn.style.display = 'none';
    var saveBtn = document.getElementById('save-still');
    if (saveBtn) saveBtn.style.display = 'none';
    var streamBtn = document.getElementById('toggle-stream');
    if (streamBtn) streamBtn.click();
    var streamImg = document.getElementById('stream');
    if (streamImg) { streamImg.style.width = '100vw'; streamImg.style.height = '100vh'; streamImg.style.objectFit = 'contain'; streamImg.style.marginTop = '0'; }
    var streamContainer = document.getElementById('stream-container');
    if (streamContainer) { streamContainer.style.width = '100vw'; streamContainer.style.height = '100vh'; }
    window.ReactNativeWebView.postMessage('loaded');
  })();
  true;
`;

export default function CameraScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  // Forzar modo horizontal al entrar
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    };
  }, []);

  const reload = () => {
    setLoading(true);
    setError(false);
    setKey((k) => k + 1);
  };

  return (
    <View style={styles.safe}>
      <StatusBar hidden />

      {/* Visor a pantalla completa */}
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

        {/* Badge IP esquina superior izquierda */}
        {!loading && !error && (
          <View style={styles.badge}>
            <View style={styles.liveDot} />
            <Text style={styles.badgeText}>EN VIVO  {CAM_IP}</Text>
          </View>
        )}

        {/* Botón reload esquina superior derecha */}
        {!loading && !error && (
          <TouchableOpacity style={styles.reloadBtn} onPress={reload}>
            <Text style={styles.reloadText}>↺</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewer: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  overlayText: {
    color: "#666",
    fontSize: 14,
    letterSpacing: 1,
  },
  errorEmoji: { fontSize: 40 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#00e5ff15",
    borderWidth: 1,
    borderColor: "#00e5ff",
  },
  retryText: {
    color: "#00e5ff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00000088",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#ffffff15",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ff2222",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  reloadBtn: {
    position: "absolute",
    top: 10,
    right: 14,
    backgroundColor: "#00000088",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff15",
  },
  reloadText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 24,
  },
});