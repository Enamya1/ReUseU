/**
 * Slider Component
 * Range slider component matching web platform's minimalist design
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  ViewStyle,
  Text,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  style?: ViewStyle;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  showValue = false,
  style,
}) => {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbRef = useRef(new Animated.Value(0)).current;

  const getValueFromPosition = (position: number): number => {
    const ratio = position / containerWidth;
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const getPositionFromValue = (val: number): number => {
    return ((val - minimumValue) / (maximumValue - minimumValue)) * containerWidth;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (_, gestureState) => {
        const position = gestureState.x0;
        const newValue = getValueFromPosition(position);
        onValueChange(newValue);
      },
      onPanResponderMove: (_, gestureState) => {
        const position = gestureState.moveX;
        const newValue = getValueFromPosition(position);
        onValueChange(newValue);
      },
    })
  ).current;

  const thumbPosition = containerWidth > 0 ? getPositionFromValue(value) : 0;
  const fillWidth = containerWidth > 0 ? getPositionFromValue(value) : 0;

  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text style={[styles.valueText, { color: colors.text }]}>
          {value}
        </Text>
      )}
      <View
        style={styles.trackContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View
          style={[
            styles.track,
            { backgroundColor: colors.muted },
          ]}
        />
        {/* Fill */}
        <View
          style={[
            styles.fill,
            {
              backgroundColor: disabled ? colors.muted : colors.primary,
              width: fillWidth,
            },
          ]}
        />
        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: disabled ? colors.muted : colors.primary,
              left: thumbPosition - 10,
            },
          ]}
        />
      </View>
    </View>
  );
};

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  onValuesChange: (min: number, max: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  showValues?: boolean;
  style?: ViewStyle;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  minValue,
  maxValue,
  onValuesChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  showValues = false,
  style,
}) => {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const getValueFromPosition = (position: number): number => {
    const ratio = position / containerWidth;
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const getPositionFromValue = (val: number): number => {
    return ((val - minimumValue) / (maximumValue - minimumValue)) * containerWidth;
  };

  const handleTouch = (x: number, thumb: 'min' | 'max') => {
    const newValue = getValueFromPosition(x);
    if (thumb === 'min') {
      onValuesChange(Math.min(newValue, maxValue - step), maxValue);
    } else {
      onValuesChange(minValue, Math.max(newValue, minValue + step));
    }
  };

  const minPosition = containerWidth > 0 ? getPositionFromValue(minValue) : 0;
  const maxPosition = containerWidth > 0 ? getPositionFromValue(maxValue) : 0;

  return (
    <View style={[styles.container, style]}>
      {showValues && (
        <View style={styles.valuesRow}>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {minValue}
          </Text>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {maxValue}
          </Text>
        </View>
      )}
      <View
        style={styles.trackContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {/* Track */}
        <View
          style={[
            styles.track,
            { backgroundColor: colors.muted },
          ]}
        />
        {/* Fill between thumbs */}
        <View
          style={[
            styles.rangeFill,
            {
              backgroundColor: disabled ? colors.muted : colors.primary,
              left: minPosition,
              width: maxPosition - minPosition,
            },
          ]}
        />
        {/* Min Thumb */}
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: disabled ? colors.muted : colors.primary,
              left: minPosition - 10,
            },
          ]}
          onTouchStart={(e) => {
            setActiveThumb('min');
            handleTouch(e.nativeEvent.locationX, 'min');
          }}
          onTouchMove={(e) => handleTouch(e.nativeEvent.locationX, 'min')}
          onTouchEnd={() => setActiveThumb(null)}
        />
        {/* Max Thumb */}
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: disabled ? colors.muted : colors.primary,
              left: maxPosition - 10,
            },
          ]}
          onTouchStart={(e) => {
            setActiveThumb('max');
            handleTouch(e.nativeEvent.locationX, 'max');
          }}
          onTouchMove={(e) => handleTouch(e.nativeEvent.locationX, 'max')}
          onTouchEnd={() => setActiveThumb(null)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  rangeFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default Slider;
