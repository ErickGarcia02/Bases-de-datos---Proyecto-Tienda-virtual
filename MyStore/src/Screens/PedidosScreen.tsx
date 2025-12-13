import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";

type Pedido = {
  id: string;
  estado: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";
  fecha: string;
  total: number;
  items: number;
};

export default function PedidosScreen() {
  const { theme } = useTheme();

  // ✅ Luego esto viene de Supabase: orders + order_items
  const pedidos: Pedido[] = useMemo(
    () => [
      { id: "A1023", estado: "enviado", fecha: "12 Dic 2025", total: 189.5, items: 4 },
      { id: "A1011", estado: "entregado", fecha: "05 Dic 2025", total: 95.0, items: 2 },
      { id: "A0999", estado: "pendiente", fecha: "28 Nov 2025", total: 60.0, items: 1 },
    ],
    []
  );

  const badgeStyle = (estado: Pedido["estado"]) => {
    switch (estado) {
      case "pendiente":
        return { backgroundColor: "#ffd166" };
      case "pagado":
        return { backgroundColor: "#a4db8dff" };
      case "enviado":
        return { backgroundColor: "#2d4891ff" };
      case "entregado":
        return { backgroundColor: "#3cb371" };
      case "cancelado":
        return { backgroundColor: "#e63946" };
      default:
        return { backgroundColor: "#999" };
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>Pedidos</Text>
        <Text style={[styles.subtitulo, { color: theme.text }]}>
          Revisa el estado y el historial de tus compras
        </Text>
      </View>

      <View style={styles.list}>
        {pedidos.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            activeOpacity={0.85}
            onPress={() => console.log("Ver detalle pedido:", p.id)}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Pedido #{p.id}
              </Text>

              <View style={[styles.badge, badgeStyle(p.estado)]}>
                <Text style={styles.badgeText}>{p.estado.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={[styles.cardMeta, { color: theme.text }]}>
              {p.fecha} • {p.items} productos
            </Text>

            <View style={styles.rowBetween}>
              <Text style={[styles.total, { color: theme.text }]}>
                Total: L {p.total.toFixed(2)}
              </Text>

              <Text style={[styles.link, { color: "#2d4891ff" }]}>
                Ver detalles →
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: theme.border }]}
        onPress={() => console.log("Historial completo")}
        activeOpacity={0.85}
      >
        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
          Ver historial completo
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  titulo: {
    fontSize: 26,
    fontFamily: "Poppins_600SemiBold",
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  total: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  link: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
  },
  secondaryBtn: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
});
