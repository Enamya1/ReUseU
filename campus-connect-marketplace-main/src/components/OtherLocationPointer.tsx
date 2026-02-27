import React, { useMemo } from 'react';
import MapPointer from '@/components/MapPointer';

const pointerColors = ['#c1ff72', '#ffde59', '#ffbd59', '#5ce1e6', '#e2a9f1', '#ff5757'];

type OtherLocationPointerProps = Omit<React.ComponentProps<typeof MapPointer>, 'borderColor'>;

const OtherLocationPointer = ({ ...props }: OtherLocationPointerProps) => {
  const borderColor = useMemo(
    () => pointerColors[Math.floor(Math.random() * pointerColors.length)],
    [],
  );

  return <MapPointer borderColor={borderColor} {...props} />;
};

export default OtherLocationPointer;
