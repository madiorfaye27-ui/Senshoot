import { ActivityIndicator, Pressable, Text } from 'react-native';

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'solid',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center rounded-lg px-4 py-3 ${
        variant === 'solid' ? 'bg-sn-orange' : 'border border-sn-orange bg-transparent'
      } ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? '#fff' : '#ff8e00'} />
      ) : (
        <Text className={`text-base font-semibold ${variant === 'solid' ? 'text-sn-white' : 'text-sn-orange'}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
