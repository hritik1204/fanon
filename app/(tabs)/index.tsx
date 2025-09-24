import { HomeScreen } from "@/src";
import { StatusBar } from "expo-status-bar";

export default function Home() {
  return (
    <>
      <HomeScreen />
      <StatusBar backgroundColor="red" />
    </>
  );
}
