/// <reference types="nativewind/types" />

// The reference above resolves react-native-css-interop's augmentation
// against whatever "react-native" its own (possibly differently-nested,
// in an npm-workspaces tree) node_modules resolves to, which isn't
// reliably the same physical "react-native" this app's own files import.
// Re-declaring the same className props here, in a file that resolves
// "react-native" from apps/mobile's own tree, guarantees the augmentation
// lands on the module instance actually used by app code.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
}
