import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamListCategorias } from "../Navigator/CategoriasStackNavigator";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { supabase } from "../supabaseClient";

type Category = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  activo: boolean;
  orden: number | null;
};

type Props = NativeStackScreenProps<
  RootStackParamListCategorias,
  "Categorias"
>;

export default function CategoriasScreen({
  navigation,
}: Props) {
  const { theme } = useTheme();

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  const iconoDemo = require("../../assets/Actividad.png");

  const cargarCategorias = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, nombre, descripcion, imagen_url, activo, orden")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error cargando categorías:", error);
      setCategorias([]);
      setCategoriasFiltradas([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setCategorias(data ?? []);
    setCategoriasFiltradas(data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      setCategoriasFiltradas(categorias);
      return;
    }

    const filtradas = categorias.filter((cat) =>
      cat.nombre.toLowerCase().includes(texto)
    );

    setCategoriasFiltradas(filtradas);
  }, [busqueda, categorias]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarCategorias();
  }, []);

const handleCategoria = (cat: Category) => {
  navigation.navigate("ProductosPorCategoria", {
    categoryId: cat.id,
    categoryName: cat.nombre,
  });
};

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.titulo, { color: theme.text }]}>Categorías</Text>

        <TextInput
          style={[
            styles.inputBusqueda,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.card,
            },
          ]}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar categoría..."
          placeholderTextColor="#777"
        />

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        ) : categoriasFiltradas.length === 0 ? (
          <Text style={[styles.textoVacio, { color: theme.text }]}>
            No se encontraron categorías.
          </Text>
        ) : (
          categoriasFiltradas.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.caja,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => handleCategoria(cat)}
              activeOpacity={0.85}
            >
              <Image
                source={cat.imagen_url ? { uri: cat.imagen_url } : iconoDemo}
                resizeMode="contain"
                style={styles.imagen}
              />

              <Text style={[styles.texto, { color: theme.text }]}>
                {cat.nombre}
              </Text>

              {cat.descripcion ? (
                <Text style={[styles.descripcion, { color: theme.text }]}>
                  {cat.descripcion}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    paddingTop: 20,
  },
  titulo: {
    width: "100%",
    fontSize: 26,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  inputBusqueda: {
    width: "95%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  caja: {
    borderRadius: 15,
    borderWidth: 0.7,
    padding: 15,
    width: 155,
    minHeight: 185,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    elevation: 3,
  },
  imagen: {
    height: 70,
    width: 70,
    marginBottom: 10,
  },
  texto: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  descripcion: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    opacity: 0.8,
    fontFamily: "Poppins_400Regular",
  },
  textoVacio: {
    marginTop: 30,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});