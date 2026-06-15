import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../Screens/HomeScreen";
import CarritoScreen from "../Screens/CarritoScreen";
import PedidosScreen from "../Screens/PedidosScreen";
import PerfilStackNavigator from "./PerfilStackNavigator";
import CategoriasStackNavigator from "./CategoriasStackNavigator";

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../Contexts/ThemeContext";

export type TabsParamList = {
  Home: undefined;
  Categorias: undefined;
  Carrito: undefined;
  Pedidos: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function TabsNavigator() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.card,
        },
        tabBarActiveTintColor: isDarkMode ? "#ffd166" : "#000000",
        tabBarInactiveTintColor: isDarkMode ? "#bbbbbb" : "#999999",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

<Tab.Screen
  name="Categorias"
  component={CategoriasStackNavigator}
        options={{
          headerShown: false,
          title: "Categorías",
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{
          title: "Carrito",
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="cart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{
          title: "Pedidos",
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="receipt-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={PerfilStackNavigator}
        options={{
          title: "Perfil",
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="person-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}