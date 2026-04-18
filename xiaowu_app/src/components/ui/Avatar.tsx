/**
 * Avatar Component
 * User avatar component matching web platform's minimalist design
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  style,
  imageStyle,
}) => {
  const { colors } = useTheme();

  const getSize = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 40;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return 10;
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      case 'xl':
        return 28;
      default:
        return 16;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const dimension = getSize();
  const fontSize = getFontSize();

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (source) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={source}
          style={[
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
            imageStyle,
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {name ? (
        <Text
          style={[
            styles.initials,
            {
              color: colors.textSecondary,
              fontSize,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: colors.textSecondary,
              fontSize,
            },
          ]}
        >
          ?
        </Text>
      )}
    </View>
  );
};

interface AvatarGroupProps {
  avatars: { source?: { uri: string }; name?: string }[];
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  style,
}) => {
  const { colors } = useTheme();
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const getSize = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 40;
    }
  };

  const dimension = getSize();
  const overlap = dimension * 0.3;

  return (
    <View style={[styles.group, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: visibleAvatars.length - index,
          }}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={{
            marginLeft: -overlap,
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 2,
            borderColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: dimension * 0.35,
              fontWeight: '600',
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initials: {
    fontWeight: '600',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Avatar;
