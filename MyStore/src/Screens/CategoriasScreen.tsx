import React, { useEffect, useState } from "react";
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

type Category = {
  id: string;
  nombre: string;
  imagen_url: string | null;
  activo: boolean;
  orden: number | null;
};

export default function CategoriasScreen() {
  const { theme } = useTheme();
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const iconoDemo = require("../../assets/Actividad.png");

  const cargarCategorias = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, nombre, imagen_url, activo, orden")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error cargando categorías:", error);
      setCategorias([]);
      setLoading(false);
      return;
    }

    setCategorias(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleCategoria = (cat: Category) => {
    console.log("Categoria seleccionada:", cat.nombre, cat.id);

    // ✅ En el siguiente paso aquí navegas a ProductsByCategory
    // navigation.navigate("ProductsByCategory", { categoryId: cat.id, categoryName: cat.nombre });
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.titulo, { color: theme.text }]}>Categorías</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.caja,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => handleCategoria(cat)}
              activeOpacity={0.85}
            >
              <Text style={[styles.texto, { color: theme.text }]}>
                {cat.nombre}
              </Text>

              <Image
                source={cat.imagen_url ? { uri: cat.imagen_url } : iconoDemo}
                resizeMode="contain"
                style={styles.imagen}
              />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titulo: {
    width: "100%",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    paddingTop: 20,
  },
  caja: {
    borderRadius: 15,
    borderWidth: 0.7,
    padding: 15,
    minWidth: 150,
    maxWidth: 150,
    maxHeight: 170,
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    elevation: 3,
  },
  imagen: {
    height: 65,
    width: 65,
    marginTop: 10,
  },
  texto: {
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});
