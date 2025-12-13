import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { supabase } from "../supabaseClient";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { TabsParamList } from "../Navigator/TabsNavigator";

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
  category_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number | null;
  imagen_url: string | null;
  activo: boolean | null;
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const iconoDemo = useMemo(() => require("../../assets/Actividad.png"), []);

  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [recomendados, setRecomendados] = useState<Product[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1) Categorías
        const { data: catData, error: catErr } = await supabase
          .from("categories")
          .select("id,nombre,descripcion,imagen_url,orden,activo")
          .eq("activo", true)
          .order("orden", { ascending: true })
          .limit(10);

        if (catErr) throw catErr;

        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .select("id,category_id,nombre,descripcion,precio,stock,imagen_url,activo")
          .eq("activo", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (prodErr) throw prodErr;

        if (!isMounted) return;
        setCategorias(catData ?? []);
        setRecomendados(prodData ?? []);
      } catch (e: any) {
        if (!isMounted) return;
        setErrorMsg(e?.message ?? "Error cargando datos");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const goCategorias = () => navigation.navigate("Categorias");
  const goPedidos = () => navigation.navigate("Pedidos");

  const goSoporte = () => navigation.navigate("Perfil");

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
            Jugos, batidos, snacks y más.
          </Text>

          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Ver categorías</Text>
          </View>
        </View>

        <Image source={iconoDemo} resizeMode="contain" style={styles.heroImage} />
      </TouchableOpacity>

      {/* Loading / Error */}
      {loading && (
        <View style={styles.centerBlock}>
          <ActivityIndicator />
          <Text style={[styles.helperText, { color: theme.text }]}>
            Cargando contenido...
          </Text>
        </View>
      )}

      {!!errorMsg && (
        <View style={styles.centerBlock}>
          <Text style={[styles.errorText, { color: "#9b0c0cff" }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: theme.border }]}
            onPress={() => {
              // simple reload
              setLoading(true);
              setTimeout(() => setLoading(false), 50);
            }}
          >
            <Text style={[styles.retryText, { color: theme.text }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categorías (horizontal) */}
      {!loading && !errorMsg && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Categorías
            </Text>
            <TouchableOpacity onPress={goCategorias}>
              <Text style={[styles.link, { color: "#2d4891ff" }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>

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

          {/* Recomendados (grid) */}
          <View style={[styles.sectionRow, { marginTop: 18 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recomendados
            </Text>
          </View>

          <View style={styles.productsGrid}>
            {recomendados.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.productCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                activeOpacity={0.85}
                onPress={() => console.log("Producto:", p.id)}
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
                <Text style={[styles.productPrice, { color: theme.text }]}>
                  L. {Number(p.precio).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Accesos rápidos (solo 2, ya no 6) */}
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
  productPrice: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    opacity: 0.85,
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
  errorText: {
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
});
