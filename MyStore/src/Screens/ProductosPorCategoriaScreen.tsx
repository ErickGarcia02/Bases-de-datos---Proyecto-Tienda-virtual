import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../supabaseClient";
import { useTheme } from "../Contexts/ThemeContext";
import { useAuth } from "../Contexts/AuthContext";

type Producto = {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
};

type CantidadesSeleccionadas = {
  [productoId: string]: number;
};

export default function ProductosPorCategoriaScreen({ route }: any) {
  const { categoryId, categoryName } = route.params;

  const { theme } = useTheme();
  const { user } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<CantidadesSeleccionadas>({});
  const [loading, setLoading] = useState(true);
  const [agregandoId, setAgregandoId] = useState<string | null>(null);

  const imagenDemo = require("../../assets/Actividad.png");

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("categoria_id", categoryId)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error cargando productos:", error);

      Alert.alert("Error", "No fue posible cargar los productos.");

      setProductos([]);
      setLoading(false);
      return;
    }

    const productosFormateados: Producto[] =
      data?.map((producto: any) => ({
        id: producto.id,
        categoria_id: producto.categoria_id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        stock: Number(producto.stock),
        imagen_url: producto.imagen_url,
        activo: Boolean(producto.activo),
      })) ?? [];

    setProductos(productosFormateados);

    const cantidadesIniciales: CantidadesSeleccionadas = {};

    productosFormateados.forEach((producto) => {
      cantidadesIniciales[producto.id] = producto.stock > 0 ? 1 : 0;
    });

    setCantidades(cantidadesIniciales);
    setLoading(false);
  };

  const obtenerCantidad = (productoId: string) => {
    return cantidades[productoId] ?? 1;
  };

  const aumentarCantidad = (producto: Producto) => {
    const cantidadActual = obtenerCantidad(producto.id);

    if (cantidadActual >= producto.stock) {
      Alert.alert("Stock insuficiente", "No hay más unidades disponibles.");
      return;
    }

    setCantidades((prev) => ({
      ...prev,
      [producto.id]: cantidadActual + 1,
    }));
  };

  const disminuirCantidad = (producto: Producto) => {
    const cantidadActual = obtenerCantidad(producto.id);

    if (cantidadActual <= 1) {
      return;
    }

    setCantidades((prev) => ({
      ...prev,
      [producto.id]: cantidadActual - 1,
    }));
  };

  const agregarAlCarrito = async (producto: Producto) => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión.");
      return;
    }

    if (producto.stock <= 0) {
      Alert.alert("Sin stock", "Este producto no tiene unidades disponibles.");
      return;
    }

    const cantidadSeleccionada = obtenerCantidad(producto.id);

    if (cantidadSeleccionada <= 0) {
      Alert.alert("Cantidad inválida", "Selecciona al menos una unidad.");
      return;
    }

    if (cantidadSeleccionada > producto.stock) {
      Alert.alert("Stock insuficiente", "No hay suficiente stock disponible.");
      return;
    }

    try {
      setAgregandoId(producto.id);

      let carritoId: string;

      const { data: carritoExistente, error: errorBuscarCarrito } =
        await supabase
          .from("carrito")
          .select("id")
          .eq("usuario_id", user.id)
          .eq("activo", true)
          .maybeSingle();

      if (errorBuscarCarrito) {
        throw errorBuscarCarrito;
      }

      if (!carritoExistente) {
        const { data: nuevoCarrito, error: errorNuevoCarrito } = await supabase
          .from("carrito")
          .insert({
            usuario_id: user.id,
            activo: true,
          })
          .select("id")
          .single();

        if (errorNuevoCarrito || !nuevoCarrito) {
          throw errorNuevoCarrito;
        }

        carritoId = nuevoCarrito.id;
      } else {
        carritoId = carritoExistente.id;
      }

      const { data: itemExistente, error: errorItem } = await supabase
        .from("carrito_items")
        .select("id,cantidad")
        .eq("carrito_id", carritoId)
        .eq("producto_id", producto.id)
        .maybeSingle();

      if (errorItem) {
        throw errorItem;
      }

      if (itemExistente) {
        const nuevaCantidad =
          Number(itemExistente.cantidad) + cantidadSeleccionada;

        if (nuevaCantidad > producto.stock) {
          Alert.alert(
            "Stock insuficiente",
            `Ya tienes ${itemExistente.cantidad} en el carrito. No puedes agregar más de ${producto.stock} unidades.`
          );
          return;
        }

        const { error } = await supabase
          .from("carrito_items")
          .update({
            cantidad: nuevaCantidad,
          })
          .eq("id", itemExistente.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("carrito_items").insert({
          carrito_id: carritoId,
          producto_id: producto.id,
          cantidad: cantidadSeleccionada,
        });

        if (error) {
          throw error;
        }
      }

      Alert.alert(
        "Producto agregado",
        `${cantidadSeleccionada} x ${producto.nombre} fue agregado al carrito.`
      );

      setCantidades((prev) => ({
        ...prev,
        [producto.id]: 1,
      }));
    } catch (error) {
      console.log("Error agregando al carrito:", error);

      Alert.alert("Error", "No fue posible agregar el producto al carrito.");
    } finally {
      setAgregandoId(null);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          {categoryName}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        ) : productos.length === 0 ? (
          <Text style={[styles.textoVacio, { color: theme.text }]}>
            No hay productos disponibles en esta categoría.
          </Text>
        ) : (
          productos.map((producto) => {
            const cantidadSeleccionada = obtenerCantidad(producto.id);
            const sinStock = producto.stock <= 0;
            const agregando = agregandoId === producto.id;

            return (
              <View
                key={producto.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Image
                  source={
                    producto.imagen_url
                      ? { uri: producto.imagen_url }
                      : imagenDemo
                  }
                  resizeMode="contain"
                  style={styles.imagen}
                />

                <Text style={[styles.nombre, { color: theme.text }]}>
                  {producto.nombre}
                </Text>

                {producto.descripcion ? (
                  <Text style={[styles.descripcion, { color: theme.text }]}>
                    {producto.descripcion}
                  </Text>
                ) : null}

                <Text style={[styles.precio, { color: theme.text }]}>
                  L. {Number(producto.precio).toFixed(2)}
                </Text>

                <Text style={[styles.stock, { color: theme.text }]}>
                  Stock: {producto.stock}
                </Text>

                {!sinStock && (
                  <View style={styles.contadorContainer}>
                    <TouchableOpacity
                      style={[
                        styles.botonCantidad,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                        },
                        cantidadSeleccionada <= 1 && styles.botonCantidadDisabled,
                      ]}
                      onPress={() => disminuirCantidad(producto)}
                      disabled={cantidadSeleccionada <= 1 || agregando}
                    >
                      <Text
                        style={[
                          styles.textoCantidadBoton,
                          { color: theme.text },
                        ]}
                      >
                        −
                      </Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.cantidadBox,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                        },
                      ]}
                    >
                      <Text style={[styles.cantidadTexto, { color: theme.text }]}>
                        {cantidadSeleccionada}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.botonCantidad,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                        },
                        cantidadSeleccionada >= producto.stock &&
                          styles.botonCantidadDisabled,
                      ]}
                      onPress={() => aumentarCantidad(producto)}
                      disabled={cantidadSeleccionada >= producto.stock || agregando}
                    >
                      <Text
                        style={[
                          styles.textoCantidadBoton,
                          { color: theme.text },
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.boton,
                    (sinStock || agregando) && styles.botonDesactivado,
                  ]}
                  onPress={() => agregarAlCarrito(producto)}
                  disabled={sinStock || agregando}
                >
                  <Text style={styles.textoBoton}>
                    {sinStock
                      ? "Sin stock"
                      : agregando
                      ? "Agregando..."
                      : `Agregar ${cantidadSeleccionada} al carrito`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },

  titulo: {
    fontSize: 26,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },

  card: {
    width: "95%",
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    alignItems: "center",
  },

  imagen: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },

  nombre: {
    fontSize: 18,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },

  descripcion: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 5,
    opacity: 0.8,
    fontFamily: "Poppins_400Regular",
  },

  precio: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    fontFamily: "Poppins_600SemiBold",
  },

  stock: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },

  contadorContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  botonCantidad: {
    width: 38,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  botonCantidadDisabled: {
    opacity: 0.4,
  },

  textoCantidadBoton: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
  },

  cantidadBox: {
    minWidth: 46,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  cantidadTexto: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },

  boton: {
    marginTop: 12,
    backgroundColor: "#a4db8dff",
    borderColor: "#0a4914ff",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },

  botonDesactivado: {
    backgroundColor: "#ccc",
    borderColor: "#999",
  },

  textoBoton: {
    color: "#000",
    fontWeight: "bold",
    fontFamily: "Poppins_400Regular",
  },

  textoVacio: {
    marginTop: 30,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});