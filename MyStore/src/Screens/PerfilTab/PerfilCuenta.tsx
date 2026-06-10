import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "../../Contexts/ThemeContext";
import { supabase } from "../../supabaseClient";

type Pantalla = "DatosPersonales" | "Direcciones" | "MetodosDePago";

type Usuario = {
  id: string;
  nombre_completo: string;
  nombre_usuario: string;
  correo_electronico: string;
  direccion_domicilio: string | null;
  telefono: string | null;
  fecha_de_nacimiento: string | null;
  avatar: string | null;
};

type Direccion = {
  id: string;
  usuario_id: string;
  direccion: string;
  ciudad: string | null;
  referencia: string | null;
  predeterminada: boolean;
};

type MetodoPago = {
  id: string;
  usuario_id: string;
  tipo: string;
  nombre_titular: string | null;
  ultimos_digitos: string | null;
  predeterminado: boolean;
};

export default function PerfilCuenta() {
  const [pantalla, setPantalla] = useState<Pantalla>("DatosPersonales");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [telefono, setTelefono] = useState("");

  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const [nuevaReferencia, setNuevaReferencia] = useState("");

  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [tipoPago, setTipoPago] = useState("");
  const [nombreTitular, setNombreTitular] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");

  const { theme } = useTheme();

  useEffect(() => {
    obtenerPerfil();
    obtenerDirecciones();
    obtenerMetodosPago();
  }, []);

  const obtenerUserId = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.user.id ?? null;
  };

  const obtenerPerfil = async () => {
    try {
      setCargando(true);

      const userId = await obtenerUserId();

      if (!userId) {
        setCargando(false);
        return;
      }

      const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("Error obteniendo perfil:", error);
        Alert.alert("Error", "No se pudo cargar tu perfil.");
        return;
      }

      setUsuario(data);
      setNombreCompleto(data.nombre_completo || "");
      setNombreUsuario(data.nombre_usuario || "");
      setTelefono(data.telefono || "");
    } catch (error) {
      console.log("Error general obteniendo perfil:", error);
      Alert.alert("Error", "Ocurrió un problema al cargar tu perfil.");
    } finally {
      setCargando(false);
    }
  };

  const obtenerDirecciones = async () => {
    const userId = await obtenerUserId();

    if (!userId) return;

    const { data, error } = await supabase
      .from("direccion_usuario")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error obteniendo direcciones:", error);
      return;
    }

    setDirecciones(data || []);
  };

  const obtenerMetodosPago = async () => {
    const userId = await obtenerUserId();

    if (!userId) return;

    const { data, error } = await supabase
      .from("metodo_pago_usuario")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error obteniendo métodos de pago:", error);
      return;
    }

    setMetodosPago(data || []);
  };

  const guardarCambios = async () => {
    if (!usuario) return;

    if (!nombreCompleto.trim()) {
      Alert.alert("Campo requerido", "El nombre completo no puede estar vacío.");
      return;
    }

    if (!nombreUsuario.trim()) {
      Alert.alert("Campo requerido", "El nombre de usuario no puede estar vacío.");
      return;
    }

    const { error } = await supabase
      .from("usuario")
      .update({
        nombre_completo: nombreCompleto.trim(),
        nombre_usuario: nombreUsuario.trim(),
        telefono: telefono.trim() || null,
      })
      .eq("id", usuario.id);

    if (error) {
      console.log("Error actualizando perfil:", error);

      if (error.code === "23505") {
        Alert.alert("Error", "Ese nombre de usuario ya está en uso.");
        return;
      }

      Alert.alert("Error", "No se pudieron guardar los cambios.");
      return;
    }

    Alert.alert("Éxito", "Tus datos fueron actualizados correctamente.");
    setEditando(false);
    obtenerPerfil();
  };

  const cancelarEdicion = () => {
    if (!usuario) return;

    setNombreCompleto(usuario.nombre_completo || "");
    setNombreUsuario(usuario.nombre_usuario || "");
    setTelefono(usuario.telefono || "");
    setEditando(false);
  };

  const resetearContrasena = async () => {
    if (!usuario?.correo_electronico) {
      Alert.alert("Error", "No se encontró el correo del usuario.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      usuario.correo_electronico
    );

    if (error) {
      console.log("Error enviando recuperación:", error);
      Alert.alert("Error", "No se pudo enviar el correo de recuperación.");
      return;
    }

    Alert.alert(
      "Correo enviado",
      "Te enviamos un enlace para restablecer tu contraseña."
    );
  };

  const agregarDireccion = async () => {
    const userId = await obtenerUserId();

    if (!userId) return;

    if (!nuevaDireccion.trim()) {
      Alert.alert("Campo requerido", "Debes ingresar una dirección.");
      return;
    }

    const { error } = await supabase.from("direccion_usuario").insert({
      usuario_id: userId,
      direccion: nuevaDireccion.trim(),
      ciudad: nuevaCiudad.trim() || null,
      referencia: nuevaReferencia.trim() || null,
    });

    if (error) {
      console.log("Error guardando dirección:", error);
      Alert.alert("Error", "No se pudo guardar la dirección.");
      return;
    }

    setNuevaDireccion("");
    setNuevaCiudad("");
    setNuevaReferencia("");

    Alert.alert("Éxito", "Dirección guardada correctamente.");
    obtenerDirecciones();
  };

  const eliminarDireccion = async (id: string) => {
    const { error } = await supabase
      .from("direccion_usuario")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Error eliminando dirección:", error);
      Alert.alert("Error", "No se pudo eliminar la dirección.");
      return;
    }

    obtenerDirecciones();
  };

  const agregarMetodoPago = async () => {
    const userId = await obtenerUserId();

    if (!userId) return;

    if (!tipoPago.trim()) {
      Alert.alert("Campo requerido", "Debes ingresar el tipo de pago.");
      return;
    }

    if (!nombreTitular.trim()) {
      Alert.alert("Campo requerido", "Debes ingresar el nombre del titular.");
      return;
    }

    if (numeroTarjeta.trim().length < 4) {
      Alert.alert("Campo inválido", "Ingresa al menos los últimos 4 dígitos.");
      return;
    }

    const ultimosDigitos = numeroTarjeta.trim().slice(-4);

    const { error } = await supabase.from("metodo_pago_usuario").insert({
      usuario_id: userId,
      tipo: tipoPago.trim(),
      nombre_titular: nombreTitular.trim(),
      ultimos_digitos: ultimosDigitos,
    });

    if (error) {
      console.log("Error guardando método de pago:", error);
      Alert.alert("Error", "No se pudo guardar el método de pago.");
      return;
    }

    setTipoPago("");
    setNombreTitular("");
    setNumeroTarjeta("");

    Alert.alert("Éxito", "Método de pago guardado correctamente.");
    obtenerMetodosPago();
  };

  const eliminarMetodoPago = async (id: string) => {
    const { error } = await supabase
      .from("metodo_pago_usuario")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Error eliminando método de pago:", error);
      Alert.alert("Error", "No se pudo eliminar el método de pago.");
      return;
    }

    obtenerMetodosPago();
  };

  const renderDatosPersonales = () => {
    if (cargando) return <ActivityIndicator size="large" />;

    if (!usuario) {
      return (
        <Text style={{ color: theme.textinner }}>
          No se pudo cargar la información del usuario.
        </Text>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {usuario.avatar && (
          <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
        )}

        <Text style={[styles.label, { color: theme.textinner }]}>
          Nombre completo
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.textinner,
              backgroundColor: editando ? "#ffffff" : "#eeeeee",
            },
          ]}
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
          editable={editando}
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Nombre de usuario
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.textinner,
              backgroundColor: editando ? "#ffffff" : "#eeeeee",
            },
          ]}
          value={nombreUsuario}
          onChangeText={setNombreUsuario}
          editable={editando}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>Teléfono</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.textinner,
              backgroundColor: editando ? "#ffffff" : "#eeeeee",
            },
          ]}
          value={telefono}
          onChangeText={setTelefono}
          editable={editando}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Correo electrónico
        </Text>
        <TextInput
          style={[
            styles.inputBloqueado,
            { borderColor: theme.border, color: "#555" },
          ]}
          value={usuario.correo_electronico}
          editable={false}
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Fecha de nacimiento
        </Text>
        <TextInput
          style={[
            styles.inputBloqueado,
            { borderColor: theme.border, color: "#555" },
          ]}
          value={usuario.fecha_de_nacimiento || "No agregada"}
          editable={false}
        />

        <View style={styles.contenedorBotones}>
          {!editando ? (
            <TouchableOpacity
              style={[styles.boton, { borderColor: theme.border }]}
              onPress={() => setEditando(true)}
            >
              <Text style={styles.textoBoton}>Editar datos</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.botonGuardar, { borderColor: theme.border }]}
                onPress={guardarCambios}
              >
                <Text style={styles.textoBoton}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonCancelar, { borderColor: theme.border }]}
                onPress={cancelarEdicion}
              >
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.botonReset, { borderColor: theme.border }]}
            onPress={resetearContrasena}
          >
            <Text style={styles.textoBoton}>Resetear contraseña</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderDirecciones = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: theme.textinner }]}>Dirección</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={nuevaDireccion}
          onChangeText={setNuevaDireccion}
          placeholder="Colonia, calle, casa..."
          placeholderTextColor="#777"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>Ciudad</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={nuevaCiudad}
          onChangeText={setNuevaCiudad}
          placeholder="Tegucigalpa"
          placeholderTextColor="#777"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Referencia
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={nuevaReferencia}
          onChangeText={setNuevaReferencia}
          placeholder="Cerca de..."
          placeholderTextColor="#777"
        />

        <TouchableOpacity
          style={[styles.botonGuardar, { borderColor: theme.border }]}
          onPress={agregarDireccion}
        >
          <Text style={styles.textoBoton}>Agregar dirección</Text>
        </TouchableOpacity>

        <Text style={[styles.subtitulo, { color: theme.textinner }]}>
          Mis direcciones
        </Text>

        {direcciones.length === 0 ? (
          <Text style={{ color: theme.textinner }}>
            No tienes direcciones guardadas.
          </Text>
        ) : (
          direcciones.map((item) => (
            <View
              key={item.id}
              style={[styles.tarjeta, { borderColor: theme.border }]}
            >
              <Text style={styles.textoTarjeta}>
                Dirección: {item.direccion}
              </Text>

              <Text style={styles.textoTarjeta}>
                Ciudad: {item.ciudad || "No agregada"}
              </Text>

              <Text style={styles.textoTarjeta}>
                Referencia: {item.referencia || "No agregada"}
              </Text>

              <TouchableOpacity
                style={styles.botonEliminar}
                onPress={() => eliminarDireccion(item.id)}
              >
                <Text style={styles.textoBoton}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderMetodosPago = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: theme.textinner }]}>
          Tipo de pago
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={tipoPago}
          onChangeText={setTipoPago}
          placeholder="Visa, Mastercard, PayPal, Efectivo..."
          placeholderTextColor="#777"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Nombre del titular
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={nombreTitular}
          onChangeText={setNombreTitular}
          placeholder="Nombre del titular"
          placeholderTextColor="#777"
        />

        <Text style={[styles.label, { color: theme.textinner }]}>
          Número de tarjeta simulado
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border }]}
          value={numeroTarjeta}
          onChangeText={setNumeroTarjeta}
          placeholder="4242 4242 4242 4242"
          placeholderTextColor="#777"
          keyboardType="number-pad"
        />


        <TouchableOpacity
          style={[styles.botonGuardar, { borderColor: theme.border }]}
          onPress={agregarMetodoPago}
        >
          <Text style={styles.textoBoton}>Agregar método</Text>
        </TouchableOpacity>

        <Text style={[styles.subtitulo, { color: theme.textinner }]}>
          Mis métodos de pago
        </Text>

        {metodosPago.length === 0 ? (
          <Text style={{ color: theme.textinner }}>
            No tienes métodos de pago guardados.
          </Text>
        ) : (
          metodosPago.map((item) => (
            <View
              key={item.id}
              style={[styles.tarjeta, { borderColor: theme.border }]}
            >
              <Text style={styles.textoTarjeta}>Tipo: {item.tipo}</Text>

              <Text style={styles.textoTarjeta}>
                Titular: {item.nombre_titular || "No agregado"}
              </Text>

              <Text style={styles.textoTarjeta}>
                Tarjeta: **** **** **** {item.ultimos_digitos || "----"}
              </Text>

              <TouchableOpacity
                style={styles.botonEliminar}
                onPress={() => eliminarMetodoPago(item.id)}
              >
                <Text style={styles.textoBoton}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const pantallaActual = () => {
    if (pantalla === "DatosPersonales") return renderDatosPersonales();
    if (pantalla === "Direcciones") return renderDirecciones();
    if (pantalla === "MetodosDePago") return renderMetodosPago();

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.container2, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[
            styles.botonesOpciones,
            {
              backgroundColor:
                pantalla === "DatosPersonales"
                  ? theme.botonuppercolor
                  : theme.bontonuppercolorpresionado,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setPantalla("DatosPersonales")}
        >
          <Text style={[styles.textUpper, { color: theme.textbottonuppercolor }]}>
            Datos personales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonesOpciones,
            {
              backgroundColor:
                pantalla === "Direcciones"
                  ? theme.botonuppercolor
                  : theme.bontonuppercolorpresionado,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setPantalla("Direcciones")}
        >
          <Text style={[styles.textUpper, { color: theme.textbottonuppercolor }]}>
            Direcciones
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonesOpciones,
            {
              backgroundColor:
                pantalla === "MetodosDePago"
                  ? theme.botonuppercolor
                  : theme.bontonuppercolorpresionado,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setPantalla("MetodosDePago")}
        >
          <Text style={[styles.textUpper, { color: theme.textbottonuppercolor }]}>
            Métodos de pago
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.container3,
          { backgroundColor: theme.backgroundinner, borderColor: theme.border },
        ]}
      >
        {pantallaActual()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container2: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  botonesOpciones: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 5,
  },
  textUpper: {
    fontSize: 14,
    fontWeight: "bold",
  },
  container3: {
    padding: 20,
    flex: 1,
    maxWidth: "100%",
    minWidth: "100%",
    borderWidth: 1,
    borderRadius: 20,
    margin: 20,
  },
  avatar: {
    width: 95,
    height: 95,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    fontFamily: "Poppins_400Regular",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#000",
    fontFamily: "Poppins_400Regular",
  },
  inputBloqueado: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#dddddd",
    fontFamily: "Poppins_400Regular",
  },
  contenedorBotones: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
  },
  boton: {
    borderWidth: 0.7,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
    backgroundColor: "#dae4ffff",
  },
  botonGuardar: {
    borderWidth: 0.7,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
    backgroundColor: "#a4db8dff",
    alignSelf: "center",
  },
  botonCancelar: {
    borderWidth: 0.7,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
    backgroundColor: "#ffd6d6",
  },
  botonReset: {
    borderWidth: 0.7,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
    backgroundColor: "#fcfa82ff",
  },
  textoBoton: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
    fontFamily: "Poppins_400Regular",
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#ffffff",
  },
  textoTarjeta: {
    fontSize: 14,
    marginBottom: 5,
    color: "#000",
    fontFamily: "Poppins_400Regular",
  },
  botonEliminar: {
    borderWidth: 0.7,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 8,
    backgroundColor: "#ffd6d6",
    alignSelf: "flex-start",
  },
  notaPago: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
  },
});