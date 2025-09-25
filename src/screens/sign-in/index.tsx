import { signInAnonAndCreateDoc, signInEmail, signUpEmail } from "@/src/auth";
import { Colors } from "@/src/constants/theme";
import { horizontalScaleConversion } from "@/src/utils";
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSignIn() {
    try {
      await signInEmail(email, password);
    } catch (e: any) {
      Alert.alert("Sign in failed", e.message || String(e));
    }
  }
  async function onSignUp() {
    try {
      await signUpEmail(email, password);
    } catch (e: any) {
      Alert.alert("Sign up failed", e.message || String(e));
    }
  }
  async function onAnon() {
    try {
      await signInAnonAndCreateDoc();
    } catch (e: any) {
      Alert.alert("Anonymous sign-in failed", e.message || String(e));
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FANON </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={'gray'}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        placeholderTextColor={'gray'}
      />
      <TouchableOpacity style={styles.button} onPress={onSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.button} onPress={onSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.button} onPress={onAnon}>
        <Text style={styles.buttonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: horizontalScaleConversion(16),
    justifyContent: "center",
    backgroundColor: Colors.main.p1,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.main.p2,
    padding: horizontalScaleConversion(10),
    marginVertical: horizontalScaleConversion(8),
    borderRadius: 6,
    color: Colors.main.p2,
  },
  title: {
    fontSize: horizontalScaleConversion(28),
    textAlign: "center",
    marginBottom: horizontalScaleConversion(12),
    color: Colors.main.p2,
    fontWeight: '900',
  },
  button: {
    backgroundColor: Colors.main.p2,
    padding: horizontalScaleConversion(12),
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.main.p1,
    fontSize: horizontalScaleConversion(16),
    fontWeight: '600',
  },
});
