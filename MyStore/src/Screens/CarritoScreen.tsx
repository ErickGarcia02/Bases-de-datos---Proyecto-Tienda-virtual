import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { useAuth } from "../Contexts/AuthContext";
import { supabase } from "../supabaseClient";

type CartItem = {
  id: string;
  carrito_item_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_url: string | null;
  stock: number;
};

export default function CarritoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  const iconoDemo = require("../../assets/Actividad.png");

  useEffect(() => {
    if (user) {
      cargarCarrito();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const cargarCarrito = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: carrito, error: carritoError } = await supabase
        .from("carrito")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      if (carritoError) {
        console.log("Error buscando carrito:", carritoError);
        Alert.alert("Error", "No se pudo cargar tu carrito.");
        setItems([]);
        return;
      }

      if (!carrito) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("carrito_items")
        .select(
          `
          id,
          cantidad,
          producto:producto_id (
            id,
            nombre,
            precio,
            stock,
            imagen_url
          )
        `
        )
        .eq("carrito_id", carrito.id);

      if (error) {
        console.log("Error cargando productos del carrito:", error);
        Alert.alert("Error", "No se pudieron cargar los productos del carrito.");
        setItems([]);
        return;
      }

      const productos: CartItem[] =
        data?.map((item: any) => ({
          carrito_item_id: item.id,
          id: item.producto.id,
          nombre: item.producto.nombre,
          precio: Number(item.producto.precio),
          cantidad: Number(item.cantidad),
          imagen_url: item.producto.imagen_url,
          stock: Number(item.producto.stock),
        })) ?? [];

      setItems(productos);
    } catch (error) {
      console.log("Error general cargando carrito:", error);
      Alert.alert("Error", "Ocurrió un problema al cargar tu carrito.");
    } finally {
      setLoading(false);
    }
  };

  const aumentarCantidad = async (item: CartItem) => {
    if (item.cantidad >= item.stock) {
      Alert.alert("Stock insuficiente", "No hay más unidades disponibles.");
      return;
    }

    const { error } = await supabase
      .from("carrito_items")
      .update({
        cantidad: item.cantidad + 1,
      })
      .eq("id", item.carrito_item_id);

    if (error) {
      console.log("Error aumentando cantidad:", error);
      Alert.alert("Error", "No se pudo aumentar la cantidad.");
      return;
    }

    cargarCarrito();
  };

  const disminuirCantidad = async (item: CartItem) => {
    if (item.cantidad <= 1) {
      eliminarItem(item);
      return;
    }

    const { error } = await supabase
      .from("carrito_items")
      .update({
        cantidad: item.cantidad - 1,
      })
      .eq("id", item.carrito_item_id);

    if (error) {
      console.log("Error disminuyendo cantidad:", error);
      Alert.alert("Error", "No se pudo disminuir la cantidad.");
      return;
    }

    cargarCarrito();
  };

  const eliminarItem = async (item: CartItem) => {
    const { error } = await supabase
      .from("carrito_items")
      .delete()
      .eq("id", item.carrito_item_id);

    if (error) {
      console.log("Error eliminando item:", error);
      Alert.alert("Error", "No se pudo eliminar el producto.");
      return;
    }

    cargarCarrito();
  };

  const finalizarCompra = async () => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Carrito vacío", "Agrega productos antes de finalizar la compra.");
      return;
    }

    const productoSinStock = items.find((item) => item.cantidad > item.stock);

    if (productoSinStock) {
      Alert.alert(
        "Stock insuficiente",
        `No hay suficiente stock para ${productoSinStock.nombre}.`
      );
      return;
    }

    try {
      setProcesandoCompra(true);

      const { data: carrito, error: carritoError } = await supabase
        .from("carrito")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      if (carritoError || !carrito) {
        console.log("Error obteniendo carrito:", carritoError);
        Alert.alert("Error", "No se pudo encontrar tu carrito.");
        return;
      }

      const subtotal = calcularSubtotal();
      const envio = subtotal > 200 ? 0 : 25;
      const total = subtotal + envio;

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedido")
        .insert({
          usuario_id: user.id,
          total: total,
          estado: "pendiente",
          direccion_entrega: "Pendiente de confirmar",
        })
        .select("id")
        .single();

      if (pedidoError || !pedido) {
        console.log("Error creando pedido:", pedidoError);
        Alert.alert("Error", "No se pudo crear el pedido.");
        return;
      }

      for (const item of items) {
        const { error: pedidoItemError } = await supabase
          .from("pedido_items")
          .insert({
            pedido_id: pedido.id,
            producto_id: item.id,
            cantidad: item.cantidad,
            precio: item.precio,
          });

        if (pedidoItemError) {
          console.log("Error creando pedido item:", pedidoItemError);
          Alert.alert("Error", "No se pudieron guardar los productos del pedido.");
          return;
        }

        const nuevoStock = item.stock - item.cantidad;

        const { error: stockError } = await supabase
          .from("producto")
          .update({
            stock: nuevoStock,
          })
          .eq("id", item.id);

        if (stockError) {
          console.log("Error actualizando stock:", stockError);
          Alert.alert("Error", "No se pudo actualizar el stock.");
          return;
        }
      }

      const { error: vaciarError } = await supabase
        .from("carrito_items")
        .delete()
        .eq("carrito_id", carrito.id);

      if (vaciarError) {
        console.log("Error vaciando carrito:", vaciarError);
        Alert.alert("Pedido creado", "El pedido fue creado, pero no se pudo vaciar el carrito.");
        return;
      }

      Alert.alert("Compra realizada", "Tu pedido fue creado correctamente.");
      cargarCarrito();
    } catch (error) {
      console.log("Error finalizando compra:", error);
      Alert.alert("Error", "Ocurrió un problema al finalizar la compra.");
    } finally {
      setProcesandoCompra(false);
    }
  };

  const calcularSubtotal = () => {
    return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  };

  const subtotal = calcularSubtotal();
  const envio = subtotal > 200 || subtotal === 0 ? 0 : 25;
  const total = subtotal + envio;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Cargando carrito...
        </Text>
      </View>
    );
  }

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

      {items.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Tu carrito está vacío
          </Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Agrega productos desde la sección de categorías.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((i) => (
            <View
              key={i.carrito_item_id}
              style={[
                styles.itemCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Image
                source={i.imagen_url ? { uri: i.imagen_url } : iconoDemo}
                style={styles.itemImg}
              />

              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>
                  {i.nombre}
                </Text>

                <Text style={[styles.itemMeta, { color: theme.text }]}>
                  L {i.precio.toFixed(2)} • Cant: {i.cantidad}
                </Text>

                <Text style={[styles.itemMeta, { color: theme.text }]}>
                  Stock disponible: {i.stock}
                </Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { borderColor: theme.border }]}
                    onPress={() => disminuirCantidad(i)}
                  >
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallBtn, { borderColor: theme.border }]}
                    onPress={() => aumentarCantidad(i)}
                  >
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>
                      +
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => eliminarItem(i)}
                  >
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.summary,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.sumText, { color: theme.text }]}>Subtotal</Text>
          <Text style={[styles.sumText, { color: theme.text }]}>
            L {subtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.sumText, { color: theme.text }]}>Envío</Text>
          <Text style={[styles.sumText, { color: theme.text }]}>
            {envio === 0 ? "Gratis" : `L ${envio.toFixed(2)}`}
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 8 }]}>
          <Text style={[styles.totalText, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalText, { color: theme.text }]}>
            L {total.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.payBtn,
            (items.length === 0 || procesandoCompra) && styles.payBtnDisabled,
          ]}
          onPress={finalizarCompra}
          activeOpacity={0.9}
          disabled={items.length === 0 || procesandoCompra}
        >
          <Text style={styles.payBtnText}>
            {procesandoCompra ? "Procesando..." : "Finalizar compra"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.couponBtn, { borderColor: theme.border }]}
          onPress={() => Alert.alert("Cupón", "Esta función se puede agregar después.")}
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
  payBtnDisabled: {
    backgroundColor: "#9ca3af",
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

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});