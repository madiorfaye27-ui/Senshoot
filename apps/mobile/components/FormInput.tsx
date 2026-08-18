import { Text, TextInput, View, type TextInputProps } from 'react-native';

export function FormInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-sn-slate">{label}</Text>
      <TextInput
        className="rounded-lg border border-gray-300 px-4 py-3 text-base text-sn-slate"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}
