import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CategoriasScreen from "../Screens/CategoriasScreen";
import ProductosPorCategoriaScreen from "../Screens/ProductosPorCategoriaScreen";

export type RootStackParamListCategorias = {
  CategoriasHome: undefined;

  ProductosPorCategoria: {
    categoryId: string;
    categoryName: string;
  };
};

const Stack =
  createNativeStackNavigator<RootStackParamListCategorias>();

export default function CategoriasStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
name="CategoriasHome"
        component={CategoriasScreen}
        options={{
          title: "Categorías",
        }}
      />

      <Stack.Screen
        name="ProductosPorCategoria"
        component={ProductosPorCategoriaScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
        })}
      />
    </Stack.Navigator>
  );
}