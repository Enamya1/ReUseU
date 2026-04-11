import React, { useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated, Modal, Image } from 'react-native';
import { router } from 'expo-router';

interface SellDropdownProps {
  visible: boolean;
  onClose: () => void;
  tabBarHeight: number;
}

const icons = {
  sell: require('../../assets/images/icons/sell copy.png'),
  exchange: require('../../assets/images/icons/exchange.png'),
};

export function SellDropdown({ visible, onClose, tabBarHeight }: SellDropdownProps) {
  const riseAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(riseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      riseAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleSelect = (type: 'sell' | 'exchange') => {
    onClose();
    setTimeout(() => {
      if (type === 'sell') {
        router.push('/(tabs)/create?type=sell');
      } else {
        router.push('/(tabs)/create?type=exchange');
      }
    }, 100);
  };

  if (!visible) return null;

  // Both buttons rise from trigger center (65px down) to their final position
  const translateY = riseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [65, 0],
  });

  const scale = riseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 1],
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.circularMenu,
            {
              bottom: tabBarHeight + 12,
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top button - Sell */}
          <Animated.View
            style={{
              transform: [
                { translateY },
                { scale },
              ],
            }}
          >
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => handleSelect('sell')}
              activeOpacity={0.8}
            >
              <Image 
                source={icons.sell}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom button - Exchange */}
          <Animated.View
            style={{
              transform: [
                { translateY },
                { scale },
              ],
            }}
          >
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => handleSelect('exchange')}
              activeOpacity={0.8}
            >
              <Image 
                source={icons.exchange}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  circularMenu: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -22 }],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '60%',
    height: '60%',
    tintColor: '#FFF',
  },
});
