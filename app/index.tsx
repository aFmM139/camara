import { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from "react-native";

// Solo importa WebView en móvil
let WebView: any = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const CAM_IP = "192.168.1.13";
const STREAM_URL = `http://${CAM_IP}/stream`;
const CAPTURE_URL = `http://${CAM_IP}/capture`;

type Mode = "stream" | "snapshot";

export default function CameraScreen() {
  const [mode, setMode] = useState<Mode>("stream");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [snapKey, setSnapKey] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setLoading(true);
    setError(false);
    if (next === "snapshot") setSnapKey((k) => k + 1);
  };

  const refresh = () => {
    setLoading(true);
    setError(false);
    setSnapKey((k) => k + 1);
  };

  const makeHtml = (src: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          * { margin:0; padding:0; background:#000; box-sizing:border-box; }
          body { width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; overflow:hidden; }
          img { width:100%; height:100%; object-fit:contain; }
        </style>
      </head>
      <body>
        <img
          src="${src}"
          onload="window.ReactNativeWebView.postMessage('loaded')"
          onerror="window.ReactNativeWebView.postMessage('error')"
        />
      </body>
    </html>
  `;

  const currentSrc = mode === "stream" ? STREAM_URL : `${CAPTURE_URL}?t=${snapKey}`;

  // ── Visor: iframe en web, WebView en móvil ──────────────
  const Viewer = () => {
    if (Platform.OS === "web") {
      return (
        <iframe
          src={currentSrc}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "#000",
          }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      );
    }

    return (
      <WebView
        key={`${mode}-${snapKey}`}
        style={styles.webview}
        source={{ html: makeHtml(currentSrc) }}
        onMessage={(e: any) => {
          if (e.nativeEvent.data === "loaded") setLoading(false);
          if (e.nativeEvent.data === "error") { setLoading(false); setError(true); }
        }}
        onError={() => { setLoading(false); setError(true); }}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={["*"]}
        mixedContentMode="always"
        javaScriptEnabled={true}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ESP32-CAM</Text>
          <Text style={styles.subtitle}>{CAM_IP}</Text>
        </View>
        {mode === "stream" && (
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}
      </View>

      {/* Visor */}
      <View style={styles.viewer}>
        {(loading || error) && (
          <View style={styles.overlay}>
            {error ? (
              <>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.overlayText}>Sin conexión con la cámara</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#00e5ff" />
                <Text style={styles.overlayText}>Conectando…</Text>
              </>
            )}
          </View>
        )}
        <Viewer />
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, mode === "stream" && styles.btnActive]}
          onPress={() => switchMode("stream")}
          activeOpacity={0.75}
        >
          <Text style={styles.btnIcon}>▶</Text>
          <Text style={[styles.btnLabel, mode === "stream" && styles.btnLabelActive]}>Stream</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, mode === "snapshot" && styles.btnActive]}
          onPress={() => switchMode("snapshot")}
          activeOpacity={0.75}
        >
          <Text style={styles.btnIcon}>📸</Text>
          <Text style={[styles.btnLabel, mode === "snapshot" && styles.btnLabelActive]}>Captura</Text>
        </TouchableOpacity>

        {mode === "snapshot" && (
          <TouchableOpacity style={styles.btn} onPress={refresh} activeOpacity={0.75}>
            <Text style={styles.btnIcon}>🔄</Text>
            <Text style={styles.btnLabel}>Actualizar</Text>
          </TouchableOpacity>
        )}
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
  subtitle: { color: "#555", fontSize: 11, marginTop: 2, letterSpacing: 1 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a0000",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#ff000044",
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ff2222" },
  liveText: { color: "#ff4444", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
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
  overlayText: { color: "#888", fontSize: 14, letterSpacing: 0.5 },
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
  controls: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
  },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 4,
  },
  btnActive: { backgroundColor: "#00e5ff15", borderColor: "#00e5ff66" },
  btnIcon: { fontSize: 18 },
  btnLabel: { color: "#555", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  btnLabelActive: { color: "#00e5ff" },
});