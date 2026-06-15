import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { supabase } from "../supabaseClient";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { TabsParamList } from "../Navigator/TabsNavigator";
import { useAuth } from "../Contexts/AuthContext";

type Nav = BottomTabNavigationProp<TabsParamList, "Home">;

type Category = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  orden: number | null;
  activo: boolean | null;
};

type Product = {
  id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  imagen_url: string | null;
  activo: boolean | null;
  created_at: string | null;
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const iconoDemo = useMemo(() => require("../../assets/Actividad.png"), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [recomendados, setRecomendados] = useState<Product[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agregandoId, setAgregandoId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("id,nombre,descripcion,imagen_url,orden,activo")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(10);

      if (catErr) {
        throw catErr;
      }

      const { data: prodData, error: prodErr } = await supabase
        .from("producto")
        .select(
          "id,categoria_id,nombre,descripcion,precio,stock,imagen_url,activo,created_at"
        )
        .eq("activo", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (prodErr) {
        throw prodErr;
      }

      setCategorias(catData ?? []);

      const productosFormateados: Product[] =
        prodData?.map((p: any) => ({
          id: p.id,
          categoria_id: p.categoria_id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: Number(p.precio),
          stock: p.stock === null ? null : Number(p.stock),
          imagen_url: p.imagen_url,
          activo: p.activo,
          created_at: p.created_at,
        })) ?? [];

      setRecomendados(productosFormateados);
    } catch (e: any) {
      console.log("Error cargando HomeScreen:", e);
      setErrorMsg(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, []);

  const goCategorias = () => navigation.navigate("Categorias");
  const goPedidos = () => navigation.navigate("Pedidos");
  const goSoporte = () => navigation.navigate("Perfil");

  const agregarAlCarrito = async (producto: Product) => {
    if (!user) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para agregar productos.");
      return;
    }

    if ((producto.stock ?? 0) <= 0) {
      Alert.alert("Sin stock", "Este producto no tiene unidades disponibles.");
      return;
    }

    try {
      setAgregandoId(producto.id);

      let carritoId: string | null = null;

      const { data: carritoExistente, error: carritoBuscarError } = await supabase
        .from("carrito")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      if (carritoBuscarError) {
        console.log("Error buscando carrito:", carritoBuscarError);
        Alert.alert("Error", "No se pudo buscar tu carrito.");
        return;
      }

      if (carritoExistente) {
        carritoId = carritoExistente.id;
      } else {
        const { data: nuevoCarrito, error: carritoCrearError } = await supabase
          .from("carrito")
          .insert({
            usuario_id: user.id,
            activo: true,
          })
          .select("id")
          .single();

        if (carritoCrearError || !nuevoCarrito) {
          console.log("Error creando carrito:", carritoCrearError);
          Alert.alert("Error", "No se pudo crear tu carrito.");
          return;
        }

        carritoId = nuevoCarrito.id;
      }

      const { data: itemExistente, error: itemBuscarError } = await supabase
        .from("carrito_items")
        .select("id,cantidad")
        .eq("carrito_id", carritoId)
        .eq("producto_id", producto.id)
        .maybeSingle();

      if (itemBuscarError) {
        console.log("Error buscando item:", itemBuscarError);
        Alert.alert("Error", "No se pudo revisar el producto en tu carrito.");
        return;
      }

      if (itemExistente) {
        const nuevaCantidad = Number(itemExistente.cantidad) + 1;

        if (nuevaCantidad > (producto.stock ?? 0)) {
          Alert.alert("Stock insuficiente", "No hay más unidades disponibles.");
          return;
        }

        const { error: updateError } = await supabase
          .from("carrito_items")
          .update({
            cantidad: nuevaCantidad,
          })
          .eq("id", itemExistente.id);

        if (updateError) {
          console.log("Error actualizando item:", updateError);
          Alert.alert("Error", "No se pudo actualizar el carrito.");
          return;
        }
      } else {
        const { error: insertError } = await supabase.from("carrito_items").insert({
          carrito_id: carritoId,
          producto_id: producto.id,
          cantidad: 1,
        });

        if (insertError) {
          console.log("Error insertando item:", insertError);
          Alert.alert("Error", "No se pudo agregar el producto al carrito.");
          return;
        }
      }

      Alert.alert("Producto agregado", `${producto.nombre} fue agregado al carrito.`);
    } catch (error) {
      console.log("Error agregando al carrito:", error);
      Alert.alert("Error", "Ocurrió un problema al agregar el producto.");
    } finally {
      setAgregandoId(null);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.saludo, { color: theme.text }]}>Hola 👋</Text>
        <Text style={[styles.subtitulo, { color: theme.text }]}>
          ¿Qué te gustaría ordenar hoy?
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.heroCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={goCategorias}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Explorar menú
          </Text>

          <Text style={[styles.heroDesc, { color: theme.text }]}>
            Frutas, verduras, bebidas, lácteos, snacks y más.
          </Text>

          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Ver categorías</Text>
          </View>
        </View>

        <Image source={iconoDemo} resizeMode="contain" style={styles.heroImage} />
      </TouchableOpacity>

      {loading && (
        <View style={styles.centerBlock}>
          <ActivityIndicator />
          <Text style={[styles.helperText, { color: theme.text }]}>
            Cargando contenido...
          </Text>
        </View>
      )}

      {!!errorMsg && !loading && (
        <View
          style={[
            styles.errorCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={styles.errorText}>{errorMsg}</Text>

          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: theme.border }]}
            onPress={cargarDatos}
          >
            <Text style={[styles.retryText, { color: theme.text }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !errorMsg && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Categorías
            </Text>

            <TouchableOpacity onPress={goCategorias}>
              <Text style={[styles.link, { color: "#2d4891ff" }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          {categorias.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No hay categorías disponibles.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                {categorias.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    activeOpacity={0.85}
                    onPress={goCategorias}
                  >
                    <Image
                      source={c.imagen_url ? { uri: c.imagen_url } : iconoDemo}
                      style={styles.chipIcon}
                      resizeMode="cover"
                    />

                    <Text style={[styles.chipText, { color: theme.text }]}>
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={[styles.sectionRow, { marginTop: 18 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recomendados
            </Text>
          </View>

          {recomendados.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No hay productos recomendados disponibles.
              </Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {recomendados.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.productCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Image
                    source={p.imagen_url ? { uri: p.imagen_url } : iconoDemo}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  <Text
                    style={[styles.productName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {p.nombre}
                  </Text>

                  <Text
                    style={[styles.productDesc, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {p.descripcion || "Producto disponible"}
                  </Text>

                  <Text style={[styles.productPrice, { color: theme.text }]}>
                    L. {Number(p.precio).toFixed(2)}
                  </Text>

                  <Text style={[styles.stockText, { color: theme.text }]}>
                    Stock: {p.stock ?? 0}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      ((p.stock ?? 0) <= 0 || agregandoId === p.id) &&
                        styles.addBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    disabled={(p.stock ?? 0) <= 0 || agregandoId === p.id}
                    onPress={() => agregarAlCarrito(p)}
                  >
                    <Text style={styles.addBtnText}>
                      {agregandoId === p.id ? "Agregando..." : "Agregar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.sectionRow, { marginTop: 10 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Accesos rápidos
            </Text>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={[
                styles.quickBig,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={goPedidos}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickBigTitle, { color: theme.text }]}>
                Mis pedidos
              </Text>

              <Text style={[styles.quickBigDesc, { color: theme.text }]}>
                Revisa tu historial y estados.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickBig,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={goSoporte}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickBigTitle, { color: theme.text }]}>
                Soporte
              </Text>

              <Text style={[styles.quickBigDesc, { color: theme.text }]}>
                Preguntas frecuentes y ayuda.
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 14,
  },
  saludo: {
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },

  heroCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  heroDesc: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  heroPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#2d4891ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  heroPillText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  heroImage: {
    width: 80,
    height: 80,
    marginLeft: 12,
    opacity: 0.95,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  link: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  chipsRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  productImage: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  productDesc: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    opacity: 0.75,
    minHeight: 32,
  },
  productPrice: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    opacity: 0.9,
  },
  stockText: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    opacity: 0.75,
  },
  addBtn: {
    marginTop: 8,
    backgroundColor: "#2d4891ff",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  addBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },

  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickBig: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  quickBigTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  quickBigDesc: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },

  centerBlock: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    color: "#9b0c0cff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
    textAlign: "center",
  },
});