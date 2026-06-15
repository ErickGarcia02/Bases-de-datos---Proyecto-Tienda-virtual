import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PerfilConfiguracion from "../Screens/PerfilTab/perfilConfiguracion";
import PerfilCuenta from "../Screens/PerfilTab/PerfilCuenta";
import PerfilSoporte from "../Screens/PerfilTab/PerfilSoporte";
import PerfilActividad from "../Screens/PerfilTab/PerfilActividad";
import PerfilScreen from "../Screens/PerfilTab/PerfilScreen";
import SoporteStackNavigator from "./SoporteStackNavigator";

export type RootStackParamListPerfil = {
  Perfil: undefined;
  Configuracion: undefined;
  Cuenta: undefined;
  Soporte: undefined;
  Actividad: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamListPerfil>();

export default function PerfilStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Perfil"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="PerfilHome" component={PerfilScreen}  />
      <Stack.Screen name="Configuracion" component={PerfilConfiguracion} />
      <Stack.Screen name="Cuenta" component={PerfilCuenta} />
      <Stack.Screen name="Soporte" component={SoporteStackNavigator} />
      <Stack.Screen name="Actividad" component={PerfilActividad} />
    </Stack.Navigator>
  );
}
