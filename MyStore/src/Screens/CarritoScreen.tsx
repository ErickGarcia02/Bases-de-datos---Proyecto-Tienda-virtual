import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";

type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: any;
};

export default function CarritoScreen() {
  const { theme } = useTheme();

  const iconoDemo = require("../../assets/Actividad.png");

  // ✅ Luego esto viene de Supabase: carts + cart_items + products
  const items: CartItem[] = useMemo(
    () => [
      { id: "1", nombre: "Jugo Verde", precio: 65, cantidad: 1, imagen: iconoDemo },
      { id: "2", nombre: "Batido Fresa", precio: 55, cantidad: 2, imagen: iconoDemo },
      { id: "3", nombre: "Snack Saludable", precio: 35, cantidad: 1, imagen: iconoDemo },
    ],
    []
  );

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const envio = subtotal > 200 ? 0 : 25;
  const total = subtotal + envio;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>Carrito</Text>
        <Text style={[styles.subtitulo, { color: theme.text }]}>
          Revisa tus productos antes de pagar
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((i) => (
          <View
            key={i.id}
            style={[
              styles.itemCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Image source={i.imagen ?? iconoDemo} style={styles.itemImg} />

            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.text }]}>
                {i.nombre}
              </Text>
              <Text style={[styles.itemMeta, { color: theme.text }]}>
                L {i.precio.toFixed(2)} • Cant: {i.cantidad}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, { borderColor: theme.border }]}
                  onPress={() => console.log("Restar:", i.id)}
                >
                  <Text style={[styles.smallBtnText, { color: theme.text }]}>
                    −
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, { borderColor: theme.border }]}
                  onPress={() => console.log("Sumar:", i.id)}
                >
                  <Text style={[styles.smallBtnText, { color: theme.text }]}>
                    +
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn]}
                  onPress={() => console.log("Eliminar:", i.id)}
                >
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sumText, { color: theme.text }]}>Subtotal</Text>
          <Text style={[styles.sumText, { color: theme.text }]}>L {subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.sumText, { color: theme.text }]}>Envío</Text>
          <Text style={[styles.sumText, { color: theme.text }]}>
            {envio === 0 ? "Gratis" : `L ${envio.toFixed(2)}`}
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 8 }]}>
          <Text style={[styles.totalText, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalText, { color: theme.text }]}>L {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => console.log("Finalizar compra")}
          activeOpacity={0.9}
        >
          <Text style={styles.payBtnText}>Finalizar compra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.couponBtn, { borderColor: theme.border }]}
          onPress={() => console.log("Aplicar cupón")}
          activeOpacity={0.85}
        >
          <Text style={[styles.couponText, { color: theme.text }]}>
            Aplicar cupón
          </Text>
        </TouchableOpacity>
      </View>
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

  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  itemImg: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  smallBtn: {
    width: 38,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  deleteBtn: {
    marginLeft: "auto",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: "#e63946",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  summary: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  sumText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  totalText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },

  payBtn: {
    marginTop: 12,
    backgroundColor: "#2d4891ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  payBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  couponBtn: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  couponText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
});
