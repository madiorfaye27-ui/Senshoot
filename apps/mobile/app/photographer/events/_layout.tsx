import { Stack } from 'expo-router';

// Lets the "Événements" tab push its own screens (new / [eventId]) on top
// of the list without leaving the tab — without this, expo-router had no
// defined navigator for this nested segment, which triggered a layout
// resolution loop (see the "Maximum update depth exceeded" crash this
// fixed, thrown from the root Stack while it tried to resolve routes
// under photographer/events/*).
export default function EventsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
