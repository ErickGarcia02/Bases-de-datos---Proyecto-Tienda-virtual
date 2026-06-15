import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { useAuth } from "../Contexts/AuthContext";
import { supabase } from "../supabaseClient";

type EstadoPedido =
  | "pendiente"
  | "pagado"
  | "enviado"
  | "entregado"
  | "cancelado";

type ProductoPedido = {
  id: string;
  nombre: string;
};

type PedidoItem = {
  id: string;
  cantidad: number;
  precio: number;
  producto: ProductoPedido | null;
};

type Pedido = {
  id: string;
  usuario_id: string;
  total: number;
  estado: EstadoPedido;
  direccion_entrega: string | null;
  created_at: string;
  pedido_items: PedidoItem[];
};

export default function PedidosScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, [user]);

  const cargarPedidos = async () => {
    if (!user) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pedido")
        .select(
          `
          id,
          usuario_id,
          total,
          estado,
          direccion_entrega,
          created_at,
          pedido_items (
            id,
            cantidad,
            precio,
            producto:producto_id (
              id,
              nombre
            )
          )
        `
        )
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error cargando pedidos:", error);
        Alert.alert("Error", "No se pudieron cargar tus pedidos.");
        setPedidos([]);
        return;
      }

      const pedidosFormateados: Pedido[] =
        data?.map((pedido: any) => ({
          id: pedido.id,
          usuario_id: pedido.usuario_id,
          total: Number(pedido.total),
          estado: normalizarEstado(pedido.estado),
          direccion_entrega: pedido.direccion_entrega,
          created_at: pedido.created_at,
          pedido_items:
            pedido.pedido_items?.map((item: any) => ({
              id: item.id,
              cantidad: Number(item.cantidad),
              precio: Number(item.precio),
              producto: item.producto
                ? {
                    id: item.producto.id,
                    nombre: item.producto.nombre,
                  }
                : null,
            })) ?? [],
        })) ?? [];

      setPedidos(pedidosFormateados);
    } catch (error) {
      console.log("Error general cargando pedidos:", error);
      Alert.alert("Error", "Ocurrió un problema al cargar tus pedidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPedidos();
  }, [user]);

  const normalizarEstado = (estado: string): EstadoPedido => {
    const estadoLower = (estado || "pendiente").toLowerCase();

    if (
      estadoLower === "pendiente" ||
      estadoLower === "pagado" ||
      estadoLower === "enviado" ||
      estadoLower === "entregado" ||
      estadoLower === "cancelado"
    ) {
      return estadoLower;
    }

    return "pendiente";
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);

    return date.toLocaleDateString("es-HN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const contarProductos = (pedido: Pedido) => {
    return pedido.pedido_items.reduce(
      (acc, item) => acc + item.cantidad,
      0
    );
  };

  const verDetalles = (pedido: Pedido) => {
    const detalle =
      pedido.pedido_items
        .map((item) => {
          const nombre = item.producto?.nombre || "Producto";
          return `${nombre} x${item.cantidad} - L ${(
            item.precio * item.cantidad
          ).toFixed(2)}`;
        })
        .join("\n") || "Este pedido no tiene productos registrados.";

    Alert.alert(
      `Pedido #${pedido.id.slice(0, 8)}`,
      `${detalle}\n\nTotal: L ${pedido.total.toFixed(2)}`
    );
  };

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

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>Pedidos</Text>
        <Text style={[styles.subtitulo, { color: theme.text }]}>
          Revisa el estado y el historial de tus compras
        </Text>
      </View>

      {pedidos.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No tienes pedidos todavía
          </Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Cuando finalices una compra, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pedidos.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.85}
              onPress={() => verDetalles(p)}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Pedido #{p.id.slice(0, 8)}
                </Text>

                <View style={[styles.badge, badgeStyle(p.estado)]}>
                  <Text style={styles.badgeText}>
                    {p.estado.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cardMeta, { color: theme.text }]}>
                {formatearFecha(p.created_at)} • {contarProductos(p)} productos
              </Text>

              <Text style={[styles.cardMeta, { color: theme.text }]}>
                Dirección: {p.direccion_entrega || "No especificada"}
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
      )}

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: theme.border }]}
        onPress={cargarPedidos}
        activeOpacity={0.85}
      >
        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
          Actualizar pedidos
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