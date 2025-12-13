import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import Input from "../components/Input";
import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { RootStackParamList } from "../Navigator/StackNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import validarLogIn from "../components/Login";
import { useTheme } from "../Contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LogInScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  const { login } = useAuth();
  const { theme } = useTheme();

  const handleLogIn = async () => {
    const { valido, errores } = validarLogIn({ email, contraseña });

    if (!valido) {
      setErrores(errores);
      return;
    }

    const ok = await login(email.trim(), contraseña);

    if (!ok) {
      Alert.alert("Error", "Correo o contraseña incorrectos.");
      return;
    }

    setEmail("");
    setContraseña("");
  };

  const handleNavigateToRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image
        source={require("../../assets/logo.png")}
        resizeMode="contain"
        style={styles.logo}
      />

      <Text style={[styles.textIniciarSesion, { color: theme.text }]}>
        Iniciar sesión
      </Text>

      <Text style={[styles.textlabel, { color: theme.text }]}>
        Ingresa tu correo electrónico
      </Text>
      <Input
        value={email}
        type="email"
        placeholder={"Correo"}
        onChange={setEmail}
      />
      {errores.email && <Text style={styles.errorText}>{errores.email}</Text>}

      <Text style={[styles.textlabel, { color: theme.text }]}>
        Ingresa tu contraseña
      </Text>
      <Input
        value={contraseña}
        type="password"
        placeholder={"Ingresa tu contraseña"}
        onChange={setContraseña}
      />
      {errores.contraseña && (
        <Text style={styles.errorText}>{errores.contraseña}</Text>
      )}

      <TouchableOpacity style={styles.botonIniciarSesion} onPress={handleLogIn}>
        <Text style={styles.textIniciarSesionlabel}>Ingresar</Text>
      </TouchableOpacity>

      <Text style={[styles.textRegistro, { color: theme.text }]}>
        ¿Eres un cliente nuevo?
      </Text>
      <Text style={[styles.textRegistro, { color: theme.text }]}>
        ¡Crea tu cuenta para disfrutar de nuestra app!
      </Text>

      <TouchableOpacity
        style={styles.botonRegistro}
        onPress={handleNavigateToRegister}
      >
        <Text style={styles.textRegistroLabel}>Registrarme</Text>
      </TouchableOpacity>
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
  textIniciarSesion: {
    fontSize: 30,
    padding: 10,
    fontFamily: "Poppins_400Regular",
  },
  textlabel: { fontSize: 20, padding: 10, fontFamily: "Poppins_400Regular" },
  botonIniciarSesion: {
    borderRadius: 10,
    borderColor: "#050044ff",
    borderWidth: 1,
    padding: 10,
    margin: 15,
    backgroundColor: "#2d4891ff",
    elevation: 2,
  },
  textIniciarSesionlabel: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 17,
    fontFamily: "Poppins_400Regular",
  },
  botonRegistro: {
    borderRadius: 10,
    borderColor: "#cc7a00ff",
    borderWidth: 1,
    padding: 10,
    margin: 15,
    backgroundColor: "#fcfa82ff",
    elevation: 2,
  },
  textRegistro: { fontWeight: "bold", fontFamily: "Poppins_400Regular" },
  textRegistroLabel: {
    fontWeight: "bold",
    fontSize: 17,
    fontFamily: "Poppins_400Regular",
  },
  logo: { height: 250, width: 200, padding: 0 },
  errorText: {
    color: "#9b0c0cff",
    fontWeight: "bold",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});
