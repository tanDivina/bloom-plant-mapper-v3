import { Redirect } from "expo-router";

// Immediately redirect to the Discover tab to avoid getting stuck on the welcome screen
export default function Index() {
  return <Redirect href="/(tabs)/discover" />;
}