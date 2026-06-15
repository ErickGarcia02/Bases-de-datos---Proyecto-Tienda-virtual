import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LogInScreen from "../Screens/LoginScreen";
import RegisterScreen from "../Screens/RegisterScreen";
import TabsNavigator from "./TabsNavigator";

import { useAuth } from "../Contexts/AuthContext";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen
            name="Tabs"
            component={TabsNavigator}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LogInScreen}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}